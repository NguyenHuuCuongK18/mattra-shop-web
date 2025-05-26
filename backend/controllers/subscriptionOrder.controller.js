const SubscriptionOrder = require("../models/subscriptionOrder.model");
const Subscription = require("../models/subscription.model");
const { sendMail } = require("./mail.controller");

// Create a new subscription-order
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { subscriptionId, paymentMethod, shippingAddress } = req.body;
    if (!subscriptionId || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "subscriptionId and paymentMethod are required" });
    }

    // 1) Verify plan exists
    const plan = await Subscription.findById(subscriptionId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // 2) Build & save
    const order = new SubscriptionOrder({
      userId: req.user.id,
      subscriptionId: plan._id,
      price: plan.price,
      paymentMethod,
      shippingAddress: shippingAddress || req.user.address || "",
      status: "unverified",
    });
    await order.save();

    // 3) Populate for response
    const populated = await SubscriptionOrder.findById(order._id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");

    // 4) Send confirmation email
    try {
      await sendMail(
        populated.userId.email,
        `Your subscription order has been created – Mattra Shop`,
        `Hello ${populated.userId.username},\n\n` +
          `Your subscription order (ID: ${populated._id}) for "${populated.subscriptionId.name}" has been created successfully.\n` +
          `Total Amount: $${populated.price.toFixed(2)}\n` +
          `You can view your profile and subscription details here:\n` +
          `https://mattra-online-shop.vercel.app/profile\n\n` +
          `Thank you for subscribing!`
      );
    } catch (error) {
      console.error("Error sending subscription order creation email:", error);
    }

    res.status(201).json({
      message: "Subscription order created successfully",
      order: populated,
    });
  } catch (error) {
    console.error("SubscriptionOrder creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get current user's subscription-orders
exports.getUserSubscriptionOrders = async (req, res) => {
  try {
    const orders = await SubscriptionOrder.find({ userId: req.user.id })
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: get all subscription-orders
exports.getAllSubscriptionOrders = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const orders = await SubscriptionOrder.find()
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get one subscription-order by ID (user or admin)
exports.getSubscriptionOrderById = async (req, res) => {
  try {
    const order = await SubscriptionOrder.findById(req.params.id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");
    if (!order) {
      return res.status(404).json({ message: "Subscription order not found" });
    }
    // Only owner or admin can view
    if (
      req.user.role !== "admin" &&
      order.userId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.status(200).json({ subscriptionOrder: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: update status (e.g., unverified → pending → active)
exports.updateSubscriptionOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = ["unverified", "pending", "active", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await SubscriptionOrder.findById(req.params.id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");
    if (!order) {
      return res.status(404).json({ message: "Subscription order not found" });
    }

    const validTransitions = {
      unverified: ["pending", "cancelled"],
      pending: ["active", "cancelled"],
      active: ["cancelled"],
      cancelled: [],
    };
    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    order.status = status;
    await order.save();

    // Send status update email
    try {
      await sendMail(
        order.userId.email,
        `Subscription Order #${order._id} Status Updated – Mattra Shop`,
        `Hello ${order.userId.username},\n\n` +
          `The status of your subscription order (ID: ${order._id}) for "${order.subscriptionId.name}" has been updated to "${status}".\n` +
          `You can view your profile and subscription details here:\n` +
          `https://mattra-online-shop.vercel.app/profile\n\n` +
          `Thank you for subscribing!`
      );
    } catch (error) {
      console.error(
        "Error sending subscription order status update email:",
        error
      );
    }

    res.status(200).json({
      message: "Subscription order status updated",
      order,
    });
  } catch (error) {
    console.error("Update subscription order status error:", error);
    res.status(500).json({ message: error.message });
  }
};

// User or Admin: cancel subscription order
exports.cancelSubscriptionOrder = async (req, res) => {
  try {
    const order = await SubscriptionOrder.findById(req.params.id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");
    if (!order) {
      return res.status(404).json({ message: "Subscription order not found" });
    }

    // Allow admins to cancel any order, users only for unverified/pending
    if (
      req.user.role !== "admin" &&
      (order.userId._id.toString() !== req.user.id ||
        !["unverified", "pending"].includes(order.status))
    ) {
      return res.status(400).json({
        message: "Cannot cancel this subscription order at its current stage",
      });
    }

    order.status = "cancelled";
    await order.save();

    // Send cancellation email
    try {
      await sendMail(
        order.userId.email,
        `Subscription Order #${order._id} Cancelled – Mattra Shop`,
        `Hello ${order.userId.username},\n\n` +
          `Your subscription order (ID: ${order._id}) for "${order.subscriptionId.name}" has been cancelled.\n` +
          `You can view your profile and subscription details here:\n` +
          `https://mattra-online-shop.vercel.app/profile\n\n` +
          `Thank you for choosing Mattra Shop!`
      );
    } catch (error) {
      console.error(
        "Error sending subscription order cancellation email:",
        error
      );
    }

    res.status(200).json({
      message: "Subscription order cancelled",
      order,
    });
  } catch (error) {
    console.error("Cancel subscription order error:", error);
    res.status(500).json({ message: error.message });
  }
};
