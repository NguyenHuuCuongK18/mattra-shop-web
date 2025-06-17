const User = require("../models/user.model");
const BlacklistedToken = require("../models/blacklistedToken.model");
const Subscription = require("../models/subscription.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendMail } = require("./mail.controller");
const multer = require("multer");
const path = require("path");
const { put } = require("@vercel/blob");
const EmailVerification = require("../models/emailVerification.model");

// BƯỚC 1: Gửi mã xác minh 6 chữ số đến email người dùng
exports.requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    // Ngăn không cấp mã cho email đã được sử dụng
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Tạo và hash một mã số 6 chữ số
    const plainCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(plainCode, 10);

    // Hết hạn sau 15 phút
    const expireAt = new Date(Date.now() + 15 * 60 * 1000);

    // Xóa bất kỳ mã nào trước đó cho email này
    await EmailVerification.deleteMany({ email });

    // Lưu mã đã hash
    await new EmailVerification({ email, code: hashedCode, expireAt }).save();

    // Gửi mã
    await sendMail(
      email,
      "Mã xác minh của bạn",
      `Mã xác minh 6 chữ số của bạn là: ${plainCode}\nMã sẽ hết hiệu lực sau 15 phút.`
    );

    res.status(200).json({ message: "Mã xác minh đã được gửi đến email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BƯỚC 2: Đăng ký người dùng
exports.register = async (req, res) => {
  try {
    const {
      username,
      name,
      email,
      password,
      phone,
      address,
      verificationCode,
    } = req.body;

    // Bắt buộc nhập số điện thoại
    if (!username || !name || !email || !password || !phone) {
      return res.status(400).json({
        message: "Tất cả các trường (bao gồm số điện thoại) là bắt buộc",
      });
    }

    // Kiểm tra mã xác minh
    if (!verificationCode) {
      return res.status(400).json({ message: "Mã xác minh là bắt buộc" });
    }
    const record = await EmailVerification.findOne({ email });
    if (!record || !(await bcrypt.compare(verificationCode, record.code))) {
      return res.status(400).json({ message: "Mã xác minh không hợp lệ" });
    }

    // Kiểm tra trùng email/username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng" });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo người dùng mới
    const newUser = new User({
      username,
      name,
      email,
      password: hashedPassword,
      phone,
      address,
    });
    await newUser.save();

    // Xóa record xác minh
    await EmailVerification.deleteOne({ email });

    res.status(201).json({
      message: "Đăng ký người dùng thành công",
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    console.error("register error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Đăng nhập người dùng
exports.login = async (req, res) => {
  try {
    const { identification, password } = req.body;
    if (!identification || !password) {
      return res
        .status(400)
        .json({ message: "Tên đăng nhập/email và mật khẩu là bắt buộc" });
    }
    const user = await User.findOne({
      $or: [{ email: identification }, { username: identification }],
    })
      .populate(
        "subscription.subscriptionId",
        "name price duration description"
      )
      .populate(
        "vouchers.voucherId",
        "code discount_percentage max_discount subscriberOnly expires_at"
      );
    if (!user) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        subscription: user.subscription,
        vouchers: user.vouchers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin cá nhân người dùng
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate(
        "subscription.subscriptionId",
        "name price duration description"
      )
      .populate(
        "vouchers.voucherId",
        "code discount_percentage max_discount subscriberOnly expires_at"
      );
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      subscription: user.subscription,
      vouchers: user.vouchers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yêu cầu đặt lại mật khẩu
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
    await user.save();
    const frontendUrl =
      process.env.FRONTEND_URL || "https://mattra-online-shop.vercel.app";
    const resetLink = `${frontendUrl}/reset-password/?token=${token}`;
    await sendMail(
      user.email,
      "Yêu cầu đặt lại mật khẩu",
      `Nhấn vào liên kết sau để đặt lại mật khẩu: ${resetLink}\nLiên kết này sẽ hết hạn sau 1 giờ.`
    );
    res.status(200).json({ message: "Email đặt lại mật khẩu đã được gửi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) {
      return res
        .status(400)
        .json({ message: "Token là bắt buộc trong request body" });
    }
    if (!newPassword) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới là bắt buộc trong request body" });
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin người dùng
exports.updateUserInfo = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name && !address && !phone) {
      return res.status(400).json({
        message: "Phải cung cấp ít nhất một trường (name, address hoặc phone)",
      });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (name) user.name = name;
    if (address) user.address = address;
    if (phone) {
      // Validate phone number
      if (!/^\d{10,11}$/.test(phone)) {
        return res
          .status(400)
          .json({ message: "Số điện thoại không hợp lệ (10-11 chữ số)" });
      }
      user.phone = phone;
    }
    await user.save();
    res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Đăng xuất (lưu token vào blacklist)
exports.logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(400).json({ message: "Không có token" });
    }
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }
    const blacklistedToken = new BlacklistedToken({
      token,
      expiresAt: new Date(decoded.exp * 1000),
    });
    await blacklistedToken.save();
    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả người dùng (chỉ admin)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Cần quyền admin" });
    }
    const users = await User.find({})
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate(
        "subscription.subscriptionId",
        "name price duration description"
      )
      .populate(
        "vouchers.voucherId",
        "code discount_percentage max_discount subscriberOnly expires_at"
      );
    res.status(200).json({
      message: "Lấy danh sách người dùng thành công",
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật trạng thái subscription cho user (chỉ admin)
exports.updateSubscriptionStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Cần quyền admin" });
    }

    const { subscriptionId, status, startDate } = req.body;
    if (!status || !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp status hợp lệ (active/inactive)" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (user.role === "admin") {
      return res
        .status(400)
        .json({ message: "Không thể sửa subscription của admin" });
    }

    if (status === "active") {
      if (!subscriptionId) {
        return res
          .status(400)
          .json({ message: "subscriptionId là bắt buộc khi active" });
      }
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy gói subscription" });
      }

      const start = startDate ? new Date(startDate) : new Date();
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "startDate không hợp lệ" });
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
      message: `Cập nhật subscription cho user sang ${status} thành công`,
      user: {
        id: populatedUser._id,
        username: populatedUser.username,
        email: populatedUser.email,
        name: populatedUser.name,
        phone: populatedUser.phone,
        address: populatedUser.address,
        role: populatedUser.role,
        subscription: populatedUser.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cấu hình multer để upload avatar
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Chỉ cho phép tệp JPEG và PNG"), false);
    }
    cb(null, true);
  },
}).single("avatar");

// Cập nhật avatar người dùng
exports.updateAvatar = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file)
      return res.status(400).json({ message: "Không có tệp tải lên" });

    try {
      const user = await User.findById(req.user.id);
      if (!user)
        return res.status(404).json({ message: "Không tìm thấy người dùng" });

      const filename = `avatars/${user._id}_${Date.now()}${path.extname(
        req.file.originalname
      )}`;
      const blob = await put(filename, req.file.buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      user.avatar = blob.url;
      await user.save();

      res.status(200).json({
        message: "Cập nhật ảnh đại diện thành công",
        avatarUrl: blob.url,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

// Xóa người dùng (chỉ admin, không xóa admin khác)
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Cần quyền admin" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Không thể xóa tài khoản admin" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Xóa người dùng thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
