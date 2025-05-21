const User = require("../models/user.model");
const BlacklistedToken = require("../models/blacklistedToken.model");
const Subscription = require("../models/subscription.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendMail } = require("./mail.controller");

exports.register = async (req, res) => {
  try {
    const { username, name, email, password, address } = req.body;
    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      name,
      email,
      password: hashedPassword,
      address,
      role: "user",
      subscription: { status: "inactive" },
    });
    await newUser.save();
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        role: newUser.role,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { identification, password } = req.body;
    if (!identification || !password) {
      return res
        .status(400)
        .json({ message: "Identification and password are required" });
    }
    const user = await User.findOne({
      $or: [{ email: identification }, { username: identification }],
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate(
        "subscription.subscriptionId",
        "name price duration description"
      );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      subscription: user.subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    const frontendUrl =
      process.env.FRONTEND_URL || "https://mattra-online-shop.vercel.app";
    const resetLink = `${frontendUrl}/reset-password/?token=${token}`;
    await sendMail(
      user.email,
      "Password Reset Request",
      `Click the following link to reset your password: ${resetLink}\nThis link will expire in 1 hour.`
    );
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.body;
    const { newPassword } = req.body;
    if (!token) {
      return res
        .status(400)
        .json({ message: "Token is required in request body" });
    }
    if (!newPassword) {
      return res
        .status(400)
        .json({ message: "New password is required in request body" });
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserInfo = async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name && !address) {
      return res.status(400).json({
        message: "At least one field (name or address) must be provided",
      });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.name = name;
    if (address) user.address = address;
    await user.save();
    res.status(200).json({
      message: "User information updated successfully",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return res.status(400).json({ message: "Invalid token" });
    }
    const blacklistedToken = new BlacklistedToken({
      token,
      expiresAt: new Date(decoded.exp * 1000),
    });
    await blacklistedToken.save();
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const users = await User.find({})
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate(
        "subscription.subscriptionId",
        "name price duration description"
      );
    res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubscriptionStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { subscriptionId, status, startDate } = req.body;
    if (!status || !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Valid status (active/inactive) is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res
        .status(400)
        .json({ message: "Cannot modify admin subscription" });
    }

    if (status === "active") {
      if (!subscriptionId) {
        return res
          .status(400)
          .json({ message: "subscriptionId is required for active status" });
      }
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      const start = startDate ? new Date(startDate) : new Date();
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "Invalid startDate" });
      }
      const end = new Date(start);
      end.setMonth(end.getMonth() + subscription.duration);

      user.subscription = {
        subscriptionId,
        status: "active",
        startDate: start,
        endDate: end,
      };
      user.role = "subscriber";
    } else {
      user.subscription = { status: "inactive" };
      user.role = "user";
    }

    await user.save();

    const populatedUser = await User.findById(user._id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate(
        "subscription.subscriptionId",
        "name price duration description"
      );

    res.status(200).json({
      message: `User subscription updated to ${status}`,
      user: {
        id: populatedUser._id,
        username: populatedUser.username,
        email: populatedUser.email,
        name: populatedUser.name,
        address: populatedUser.address,
        role: populatedUser.role,
        subscription: populatedUser.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
