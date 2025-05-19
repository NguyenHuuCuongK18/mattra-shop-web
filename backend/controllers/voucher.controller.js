const Voucher = require("../models/voucher.model");
const User = require("../models/user.model");

// Utility function to generate a unique voucher code
const generateVoucherCode = async () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const existingVoucher = await Voucher.findOne({ code });
  if (existingVoucher) return generateVoucherCode(); // Recurse if code exists
  return code;
};

exports.createVoucher = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { discount_percentage, max_discount, subscriberOnly, expires_at } =
      req.body;
    if (!discount_percentage || !max_discount || !expires_at) {
      return res.status(400).json({
        message:
          "Discount percentage, max discount, and expiration date are required",
      });
    }
    if (discount_percentage < 0 || discount_percentage > 100) {
      return res
        .status(400)
        .json({ message: "Discount percentage must be between 0 and 100" });
    }
    if (max_discount < 0) {
      return res
        .status(400)
        .json({ message: "Max discount must be non-negative" });
    }
    const expiresAtDate = new Date(expires_at);
    if (isNaN(expiresAtDate.getTime()) || expiresAtDate <= new Date()) {
      return res
        .status(400)
        .json({ message: "Expiration date must be a valid future date" });
    }

    const code = await generateVoucherCode();
    const voucher = new Voucher({
      code,
      discount_percentage,
      max_discount,
      subscriberOnly: !!subscriberOnly,
      expires_at: expiresAtDate,
      created_at: new Date(),
      is_used: false,
    });
    await voucher.save();

    res.status(201).json({
      message: "Voucher created successfully",
      voucher,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      expires_at: { $gt: new Date() },
      is_used: false,
    }).select("-__v");
    res.status(200).json({
      message: "Vouchers retrieved successfully",
      vouchers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id).select("-__v");
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    if (voucher.is_used || voucher.expires_at <= new Date()) {
      return res.status(400).json({ message: "Voucher is used or expired" });
    }
    res.status(200).json({
      message: "Voucher retrieved successfully",
      voucher,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserVouchers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: "vouchers.voucherId",
        select:
          "code discount_percentage max_discount subscriberOnly created_at expires_at",
      })
      .select("vouchers");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const vouchers = user.vouchers.filter(
      (v) => v.status === "available" && v.voucherId.expires_at > new Date()
    );
    res.status(200).json({
      message: "User vouchers retrieved successfully",
      vouchers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignVoucher = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { userId, voucherId } = req.body;
    if (!userId || !voucherId) {
      return res
        .status(400)
        .json({ message: "userId and voucherId are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    if (voucher.is_used || voucher.expires_at <= new Date()) {
      return res.status(400).json({ message: "Voucher is used or expired" });
    }
    if (voucher.subscriberOnly && user.role !== "subscriber") {
      return res.status(400).json({
        message: "Cannot assign subscriber-only voucher to non-subscriber",
      });
    }

    if (user.vouchers.some((v) => v.voucherId.toString() === voucherId)) {
      return res
        .status(400)
        .json({ message: "Voucher already assigned to user" });
    }

    user.vouchers.push({ voucherId, status: "available" });
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate({
        path: "vouchers.voucherId",
        select:
          "code discount_percentage max_discount subscriberOnly created_at expires_at",
      })
      .select("vouchers");

    res.status(200).json({
      message: "Voucher assigned successfully",
      vouchers: updatedUser.vouchers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignEveryone = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { voucherId } = req.body;
    if (!voucherId) {
      return res.status(400).json({ message: "voucherId is required" });
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    if (voucher.is_used || voucher.expires_at <= new Date()) {
      return res.status(400).json({ message: "Voucher is used or expired" });
    }

    const users = await User.find();
    let assignedCount = 0;

    for (const user of users) {
      if (!user.vouchers.some((v) => v.voucherId.toString() === voucherId)) {
        user.vouchers.push({ voucherId, status: "available" });
        await user.save();
        assignedCount++;
      }
    }

    res.status(200).json({
      message: `Voucher assigned to ${assignedCount} users`,
      assignedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignSubscribers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { voucherId } = req.body;
    if (!voucherId) {
      return res.status(400).json({ message: "voucherId is required" });
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    if (voucher.is_used || voucher.expires_at <= new Date()) {
      return res.status(400).json({ message: "Voucher is used or expired" });
    }
    if (!voucher.subscriberOnly) {
      return res
        .status(400)
        .json({ message: "Voucher must be subscriber-only" });
    }

    const subscribers = await User.find({ role: "subscriber" });
    let assignedCount = 0;

    for (const user of subscribers) {
      if (!user.vouchers.some((v) => v.voucherId.toString() === voucherId)) {
        user.vouchers.push({ voucherId, status: "available" });
        await user.save();
        assignedCount++;
      }
    }

    res.status(200).json({
      message: `Voucher assigned to ${assignedCount} subscribers`,
      assignedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.claimVoucher = async (req, res) => {
  try {
    const { voucherId } = req.body;
    if (!voucherId) {
      return res.status(400).json({ message: "voucherId is required" });
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    if (voucher.is_used || voucher.expires_at <= new Date()) {
      return res.status(400).json({ message: "Voucher is used or expired" });
    }
    if (voucher.subscriberOnly && req.user.role !== "subscriber") {
      return res
        .status(403)
        .json({ message: "This voucher is exclusive to subscribers" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.vouchers.some((v) => v.voucherId.toString() === voucherId)) {
      return res.status(400).json({ message: "Voucher already claimed" });
    }

    user.vouchers.push({ voucherId, status: "available" });
    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .populate({
        path: "vouchers.voucherId",
        select:
          "code discount_percentage max_discount subscriberOnly created_at expires_at",
      })
      .select("vouchers");

    res.status(200).json({
      message: "Voucher claimed successfully",
      vouchers: updatedUser.vouchers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { discount_percentage, max_discount, subscriberOnly, expires_at } =
      req.body;
    if (!discount_percentage || !max_discount || !expires_at) {
      return res.status(400).json({
        message:
          "Discount percentage, max discount, and expiration date are required",
      });
    }
    if (discount_percentage < 0 || discount_percentage > 100) {
      return res
        .status(400)
        .json({ message: "Discount percentage must be between 0 and 100" });
    }
    if (max_discount < 0) {
      return res
        .status(400)
        .json({ message: "Max discount must be non-negative" });
    }
    const expiresAtDate = new Date(expires_at);
    if (isNaN(expiresAtDate.getTime()) || expiresAtDate <= new Date()) {
      return res
        .status(400)
        .json({ message: "Expiration date must be a valid future date" });
    }

    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    if (voucher.is_used) {
      return res.status(400).json({ message: "Cannot update used voucher" });
    }

    voucher.discount_percentage = discount_percentage;
    voucher.max_discount = max_discount;
    voucher.subscriberOnly = !!subscriberOnly;
    voucher.expires_at = expiresAtDate;
    await voucher.save();

    res.status(200).json({
      message: "Voucher updated successfully",
      voucher,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    await User.updateMany(
      { "vouchers.voucherId": voucher._id },
      { $pull: { vouchers: { voucherId: voucher._id } } }
    );

    res.status(200).json({
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
