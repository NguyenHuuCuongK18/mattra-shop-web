const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");

exports.createSubscription = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, price, duration, description } = req.body;
    if (!name || !price || !duration) {
      return res
        .status(400)
        .json({ message: "Name, price, and duration are required" });
    }
    if (price < 0) {
      return res.status(400).json({ message: "Price must be non-negative" });
    }
    if (duration < 1) {
      return res
        .status(400)
        .json({ message: "Duration must be at least 1 month" });
    }

    const existingSubscription = await Subscription.findOne({ name });
    if (existingSubscription) {
      return res
        .status(400)
        .json({ message: "Subscription name already exists" });
    }

    const subscription = new Subscription({
      name,
      price,
      duration,
      description,
    });
    await subscription.save();

    res.status(201).json({
      message: "Subscription created successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().select("-__v");
    res.status(200).json({
      message: "Subscriptions retrieved successfully",
      subscriptions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id).select(
      "-__v"
    );
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.status(200).json({
      message: "Subscription retrieved successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, price, duration, description } = req.body;
    if (!name || !price || !duration) {
      return res
        .status(400)
        .json({ message: "Name, price, and duration are required" });
    }
    if (price < 0) {
      return res.status(400).json({ message: "Price must be non-negative" });
    }
    if (duration < 1) {
      return res
        .status(400)
        .json({ message: "Duration must be at least 1 month" });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const existingSubscription = await Subscription.findOne({
      name,
      _id: { $ne: req.params.id },
    });
    if (existingSubscription) {
      return res
        .status(400)
        .json({ message: "Subscription name already exists" });
    }

    subscription.name = name;
    subscription.price = price;
    subscription.duration = duration;
    subscription.description = description;
    await subscription.save();

    res.status(200).json({
      message: "Subscription updated successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSubscribedUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const subscribedUsers = await User.find({
      role: "subscriber",
      "subscription.status": "active",
    })
      .select("username email name subscription")
      .populate("subscription.subscriptionId", "name price duration")
      .lean();

    res.status(200).json({
      message: "Subscribed users retrieved successfully",
      users: subscribedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
