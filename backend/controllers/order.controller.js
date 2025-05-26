const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Voucher = require("../models/voucher.model");
const User = require("../models/user.model");
const { sendMail } = require("./mail.controller");

exports.createOrder = async (req, res) => {
  try {
    const { paymentMethod, shippingAddress, voucherId, selectedItems } =
      req.body;
    if (!paymentMethod || !shippingAddress) {
      return res
        .status(400)
        .json({ message: "Payment method and shipping address are required" });
    }

    const validPaymentMethods = ["Online Banking", "Cash on Delivery"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    if (
      !selectedItems ||
      !Array.isArray(selectedItems) ||
      selectedItems.length === 0
    ) {
      return res.status(400).json({
        message: "Selected items array is required and must not be empty",
      });
    }

    // Validate selected items
    const orderItems = [];
    let totalAmount = 0;
    const productIds = selectedItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    for (const item of selectedItems) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          message: "Each item must have a valid productId and quantity",
        });
      }
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product with ID ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${product.name}` });
      }
      const itemPrice = product.price * item.quantity;
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });
      totalAmount += itemPrice;
    }

    // Apply voucher discount if provided
    let discountApplied = 0;
    let appliedVoucherId = null;
    if (voucherId) {
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
      if (voucher.is_used || voucher.expires_at < new Date()) {
        userVoucher.status =
          voucher.expires_at < new Date() ? "expired" : "used";
        await user.save();
        return res.status(400).json({ message: "Voucher is used or expired" });
      }
      if (voucher.subscriberOnly && user.role !== "subscriber") {
        return res
          .status(403)
          .json({ message: "This voucher is exclusive to subscribers" });
      }
      discountApplied = Math.min(
        (voucher.discount_percentage / 100) * totalAmount,
        voucher.max_discount || Infinity
      );
      totalAmount -= discountApplied;
      voucher.is_used = true;
      userVoucher.status = "used";
      appliedVoucherId = voucher._id;
      await voucher.save();
      await user.save();
    }

    // Create order
    const order = new Order({
      userId: req.user.id,
      items: orderItems,
      totalAmount,
      discountApplied,
      voucherId: appliedVoucherId,
      paymentMethod,
      shippingAddress,
      status: "unverified",
    });
    await order.save();

    // Update stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear cart items
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { items: { productId: { $in: productIds } } } }
    );

    // Populate for response and email
    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email");

    // Send order creation email
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

exports.applyVoucher = async (req, res) => {
  try {
    const { orderId, voucherId } = req.body;
    if (!orderId || !voucherId) {
      return res
        .status(400)
        .json({ message: "Order ID and voucher ID are required" });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify user ownership
    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only apply vouchers to your own orders" });
    }

    // Check order status
    if (order.status !== "unverified") {
      return res
        .status(400)
        .json({ message: "Vouchers can only be applied to unverified orders" });
    }

    // Check if order already has a voucher
    if (order.voucherId) {
      return res
        .status(400)
        .json({ message: "Order already has a voucher applied" });
    }

    // Find user and validate voucher
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

    // Validate voucher
    if (voucher.is_used || voucher.expires_at < new Date()) {
      userVoucher.status = voucher.expires_at < new Date() ? "expired" : "used";
      await user.save();
      return res.status(400).json({ message: "Voucher is used or expired" });
    }
    if (voucher.subscriberOnly && user.role !== "subscriber") {
      return res
        .status(403)
        .json({ message: "This voucher is exclusive to subscribers" });
    }

    // Calculate discount
    let baseTotal = order.totalAmount + order.discountApplied; // Original total before any discount
    const discountApplied = Math.min(
      (voucher.discount_percentage / 100) * baseTotal,
      voucher.max_discount || Infinity
    );
    const newTotalAmount = baseTotal - discountApplied;

    // Update order
    order.totalAmount = newTotalAmount;
    order.discountApplied = discountApplied;
    order.voucherId = voucher._id;
    await order.save();

    // Mark voucher as used
    voucher.is_used = true;
    userVoucher.status = "used";
    await voucher.save();
    await user.save();

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email");

    // Send voucher applied email
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

exports.cancelUserOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("voucherId");
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

    order.status = "cancelled";
    // Revert voucher if applied
    if (order.voucherId) {
      const user = await User.findById(req.user.id);
      const userVoucher = user.vouchers.find(
        (v) => v.voucherId._id.toString() === order.voucherId._id.toString()
      );
      if (userVoucher) {
        userVoucher.status = "available";
        order.voucherId.is_used = false;
        await order.voucherId.save();
        await user.save();
      }
      order.voucherId = null;
      order.discountApplied = 0;
      order.totalAmount = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email");

    res.status(200).json({
      message: "Order cancelled successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
