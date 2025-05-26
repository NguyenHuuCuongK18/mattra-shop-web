const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Voucher = require("../models/voucher.model");
const User = require("../models/user.model");
const { sendMail } = require("./mail.controller");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { paymentMethod, shippingAddress, voucherId, selectedItems } =
      req.body;
    if (!paymentMethod || !shippingAddress) {
      return res
        .status(400)
        .json({ message: "Payment method and shipping address are required" });
    }

    // Validate selected items & compute subtotal
    let totalAmount = 0;
    const items = [];
    for (const item of selectedItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.productId} not found` });
      }
      if (product.countInStock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product ${product.name}` });
      }
      product.countInStock -= item.quantity;
      await product.save();

      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;
      items.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Apply voucher if provided
    let discountApplied = 0;
    let appliedVoucherId = null;
    if (voucherId) {
      // 1) Load user + their vouchers
      const user = await User.findById(req.user.id).populate(
        "vouchers.voucherId"
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 2) Find the specific voucher entry
      const userVoucher = user.vouchers.find(
        (v) =>
          v.voucherId._id.toString() === voucherId && v.status === "available"
      );
      if (!userVoucher) {
        return res
          .status(400)
          .json({ message: "Voucher not available for this user" });
      }
      const voucher = userVoucher.voucherId;

      // 3) Check expiration & subscriber-only
      if (voucher.expires_at < new Date()) {
        userVoucher.status = "expired";
        await user.save();
        return res.status(400).json({ message: "Voucher has expired" });
      }
      if (voucher.subscriberOnly && user.role !== "subscriber") {
        return res
          .status(403)
          .json({ message: "This voucher is exclusive to subscribers" });
      }

      // 4) Apply discount & mark _only_ the user’s voucher as used
      discountApplied = Math.min(
        (voucher.discount_percentage / 100) * totalAmount,
        voucher.max_discount || Infinity
      );
      totalAmount -= discountApplied;
      userVoucher.status = "used";
      appliedVoucherId = voucher._id;
      await user.save();
    }

    // Create the order
    const order = new Order({
      userId: req.user.id,
      items,
      paymentMethod,
      shippingAddress,
      totalAmount,
      discountApplied,
      voucherId: appliedVoucherId,
      status: "unverified",
      createdAt: new Date(),
    });
    await order.save();

    // Clear the user's cart
    await Cart.findOneAndDelete({ userId: req.user.id });

    // Send confirmation email
    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email")
      .populate("voucherId", "code discount_percentage max_discount");
    try {
      await sendMail(
        populatedOrder.userId.email,
        "Your order has been created – Mattra Shop",
        `Hello ${populatedOrder.userId.username},\n\n` +
          `Your order (ID: ${populatedOrder._id}) has been created successfully.\n` +
          `Total Amount: $${populatedOrder.totalAmount.toFixed(2)}\n` +
          `Discount Applied: $${populatedOrder.discountApplied.toFixed(2)}\n` +
          `You can view all your orders here:\n` +
          `https://mattra-online-shop.vercel.app/orders\n\n` +
          `Thank you for shopping with us!`
      );
    } catch (error) {
      console.error("Error sending order creation email:", error);
    }

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};
// Apply a voucher to an existing order
exports.applyVoucher = async (req, res) => {
  try {
    const { orderId, voucherId } = req.body;
    if (!orderId || !voucherId) {
      return res
        .status(400)
        .json({ message: "Order ID and voucher ID are required" });
    }

    // 1) Find & validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only apply vouchers to your own orders" });
    }
    if (order.status !== "unverified") {
      return res
        .status(400)
        .json({ message: "Vouchers can only be applied to unverified orders" });
    }
    if (order.voucherId) {
      return res
        .status(400)
        .json({ message: "Order already has a voucher applied" });
    }

    // 2) Load user + find matching voucher entry
    const user = await User.findById(req.user.id).populate(
      "vouchers.voucherId"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userVoucher = user.vouchers.find(
      (v) =>
        v.voucherId._id.toString() === voucherId && v.status === "available"
    );
    if (!userVoucher) {
      return res
        .status(400)
        .json({ message: "Voucher not available for this user" });
    }
    const voucher = userVoucher.voucherId;

    // 3) Per-user expiration & subscriber-only checks
    if (voucher.expires_at < new Date()) {
      userVoucher.status = "expired";
      await user.save();
      return res.status(400).json({ message: "Voucher has expired" });
    }
    if (voucher.subscriberOnly && user.role !== "subscriber") {
      return res
        .status(403)
        .json({ message: "This voucher is exclusive to subscribers" });
    }

    // 4) Apply discount to the existing order
    const baseTotal = order.totalAmount + order.discountApplied;
    const discountApplied = Math.min(
      (voucher.discount_percentage / 100) * baseTotal,
      voucher.max_discount || Infinity
    );
    order.totalAmount = baseTotal - discountApplied;
    order.discountApplied = discountApplied;
    order.voucherId = voucher._id;
    await order.save();

    // 5) Mark _only_ the user’s voucher as used
    userVoucher.status = "used";
    await user.save();

    // 6) (Optional) Send voucher-applied email
    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email");
    try {
      await sendMail(
        populatedOrder.userId.email,
        `Voucher applied to your order – Mattra Shop`,
        `Hello ${populatedOrder.userId.username},\n\n` +
          `A voucher (${voucher.code}) has been applied to your order (ID: ${populatedOrder._id}).\n` +
          `Discount Applied: $${populatedOrder.discountApplied.toFixed(2)}\n` +
          `New Total Amount: $${populatedOrder.totalAmount.toFixed(2)}\n` +
          `You can view your order here:\n` +
          `https://mattra-online-shop.vercel.app/orders\n\n` +
          `Thank you for shopping with us!`
      );
    } catch (error) {
      console.error("Error sending voucher applied email:", error);
    }

    res.status(200).json({
      message: "Voucher applied successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Apply voucher error:", error);
    res.status(500).json({ message: "Failed to apply voucher" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("items.productId", "name price image")
      .populate("voucherId", "code discount_percentage max_discount")
      .select("-__v");

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const orders = await Order.find()
      .populate("userId", "username email")
      .populate("items.productId", "name price image")
      .populate("voucherId", "code discount_percentage max_discount")
      .select("-__v");

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel (user-initiated) an order
exports.cancelUserOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only cancel your own orders" });
    }
    if (order.status !== "unverified") {
      return res
        .status(400)
        .json({ message: "Order can only be cancelled in unverified status" });
    }

    // Restore voucher to user if one was applied
    if (order.voucherId) {
      const user = await User.findById(req.user.id);
      const userVoucher = user.vouchers.find(
        (v) => v.voucherId.toString() === order.voucherId.toString()
      );
      if (userVoucher) {
        userVoucher.status = "available";
        await user.save();
      }
      order.voucherId = null;
      order.discountApplied = 0;
      // Recompute totalAmount from line items
      order.totalAmount = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = [
      "unverified",
      "pending",
      "shipping",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === status) {
      return res
        .status(400)
        .json({ message: `Order is already in ${status} status` });
    }

    const validTransitions = {
      unverified: ["pending", "cancelled"],
      pending: ["shipping"],
      shipping: ["delivered"],
      delivered: [],
      cancelled: [],
    };
    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    order.status = status;
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email")
      .populate("voucherId", "code discount_percentage max_discount");

    // Send order status update email
    try {
      await sendMail(
        populatedOrder.userId.email,
        `Order #${populatedOrder._id} status updated – Mattra Shop`,
        `Hello ${populatedOrder.userId.username},\n\n` +
          `The status of your order (ID: ${populatedOrder._id}) has been updated to "${status}".\n` +
          `You can view your orders here:\n` +
          `https://mattra-online-shop.vercel.app/orders\n\n` +
          `Thank you for shopping with us!`
      );
    } catch (error) {
      console.error("Error sending order status update email:", error);
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only confirm your own orders" });
    }

    if (order.status !== "shipping") {
      return res.status(400).json({
        message: "Order must be in 'shipping' status to confirm delivery",
      });
    }

    order.status = "delivered";
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email")
      .populate("voucherId", "code discount_percentage max_discount");

    res.status(200).json({
      message: "Delivery confirmed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
