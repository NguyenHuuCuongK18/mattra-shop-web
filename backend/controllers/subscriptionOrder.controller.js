const SubscriptionOrder = require("../models/subscriptionOrder.model");
const Subscription = require("../models/subscription.model");

// Create a new subscription-order
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { subscriptionId, paymentMethod, shippingAddress } = req.body;
    if (!subscriptionId || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "subscriptionId and paymentMethod are required" });
    }

    // 1) verify plan exists
    const plan = await Subscription.findById(subscriptionId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // 2) build & save
    const order = new SubscriptionOrder({
      userId: req.user.id,
      subscriptionId: plan._id,
      price: plan.price,
      paymentMethod,
      shippingAddress: shippingAddress || req.user.address || "",
      status: "unverified",
    });
    await order.save();

    // 3) populate for response
    const populated = await SubscriptionOrder.findById(order._id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");

    res.status(201).json({
      message: "Subscription order created successfully",
      subscriptionOrder: populated,
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
    // only owner or admin can view
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

// Admin: update status (e.g. pending → active)
exports.updateSubscriptionOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { status } = req.body;
    const order = await SubscriptionOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Subscription order not found" });
    }
    res.status(200).json({
      message: "Subscription order status updated",
      subscriptionOrder: order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User: cancel if still unverified or pending
exports.cancelSubscriptionOrder = async (req, res) => {
  try {
    const order = await SubscriptionOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Subscription order not found" });
    }
    if (
      order.userId.toString() !== req.user.id ||
      !["unverified", "pending"].includes(order.status)
    ) {
      return res.status(400).json({
        message: "Cannot cancel this subscription order at its current stage",
      });
    }
    order.status = "cancelled";
    await order.save();
    res.status(200).json({
      message: "Subscription order cancelled",
      subscriptionOrder: order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
