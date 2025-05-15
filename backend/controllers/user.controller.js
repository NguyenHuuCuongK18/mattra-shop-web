const User = require("../models/users.model");
const BlacklistedToken = require("../models/blacklistedTokens.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

exports.register = async (req, res) => {
  try {
    const { username, name, email, password, address } = req.body;

    // Register validation
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
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

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
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Login validation
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Identifier and password are required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

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
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // req.user was set by auth.middleware
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required" });
    }

    // Find user by ID from JWT
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash and update new password
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

    // Validation
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Simulate sending email (replace with actual email service like Nodemailer)
    const resetLink = `https://yourwebsite.com/reset-password?token=${token}`;
    console.log(`Password reset link for ${email}: ${resetLink}`);
    // Example: await sendEmail(user.email, 'Password Reset', `Click to reset: ${resetLink}`);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    // Find user by token and check expiration
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired" });
    }

    // Update password and clear reset fields
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

    // Validation: Ensure at least one field is provided
    if (!name && !address) {
      return res.status(400).json({
        message: "At least one field (name or address) must be provided",
      });
    }

    // Find user by ID from JWT
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided and non-empty
    if (name) user.name = name;
    if (address) user.address = address;

    await user.save();

    // Return updated user details
    res.status(200).json({
      message: "User information updated successfully",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Decode token to get expiration (without verifying, as middleware already did)
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Add token to blacklistedTokens collection
    const blacklistedToken = new BlacklistedToken({
      token,
      expiresAt: new Date(decoded.exp * 1000), // Convert seconds to milliseconds
    });
    await blacklistedToken.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
