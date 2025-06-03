// subscriptionOrder.controller.js

const SubscriptionOrder = require("../models/subscriptionOrder.model");
const Subscription = require("../models/subscription.model");
const { sendMail } = require("./mail.controller");

// Tạo một đơn hàng subscription mới
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { subscriptionId, paymentMethod, shippingAddress } = req.body;
    if (!subscriptionId || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "subscriptionId và paymentMethod là bắt buộc" });
    }

    // 1) Kiểm tra gói subscription có tồn tại
    const plan = await Subscription.findById(subscriptionId);
    if (!plan) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy gói subscription" });
    }

    // 2) Tạo và lưu đơn hàng
    const order = new SubscriptionOrder({
      userId: req.user.id,
      subscriptionId: plan._id,
      price: plan.price,
      paymentMethod,
      shippingAddress: shippingAddress || req.user.address || "",
      status: "unverified",
    });
    await order.save();

    // 3) Điền thông tin đầy đủ để trả về
    const populated = await SubscriptionOrder.findById(order._id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");

    // 4) Gửi email xác nhận
    try {
      await sendMail(
        populated.userId.email,
        `Đơn hàng subscription của bạn đã được tạo – Mattra Shop`,
        `Xin chào ${populated.userId.username},\n\n` +
          `Đơn hàng subscription của bạn (ID: ${populated._id}) cho gói "${populated.subscriptionId.name}" đã được tạo thành công.\n` +
          `Tổng số tiền: $${populated.price.toFixed(2)}\n` +
          `Bạn có thể xem chi tiết tài khoản và subscription tại:\n` +
          `https://mattra-online-shop.vercel.app/profile\n\n` +
          `Cảm ơn bạn đã đăng ký!`
      );
    } catch (error) {
      console.error("Lỗi khi gửi email xác nhận tạo đơn subscription:", error);
    }

    res.status(201).json({
      message: "Tạo đơn subscription thành công",
      order: populated,
    });
  } catch (error) {
    console.error("Lỗi tạo SubscriptionOrder:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả đơn hàng subscription của người dùng hiện tại
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

// Admin: lấy tất cả đơn hàng subscription
exports.getAllSubscriptionOrders = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Cần quyền admin" });
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

// Lấy một đơn hàng subscription theo ID (user hoặc admin)
exports.getSubscriptionOrderById = async (req, res) => {
  try {
    const order = await SubscriptionOrder.findById(req.params.id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");
    if (!order) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn hàng subscription" });
    }
    // Chỉ chủ đơn hoặc admin mới được xem
    if (
      req.user.role !== "admin" &&
      order.userId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    res.status(200).json({ subscriptionOrder: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: cập nhật trạng thái đơn hàng subscription (ví dụ: unverified → pending → active)
exports.updateSubscriptionOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Cần quyền admin" });
    }
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Trạng thái là bắt buộc" });
    }

    const validStatuses = ["unverified", "pending", "active", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const order = await SubscriptionOrder.findById(req.params.id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");
    if (!order) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn hàng subscription" });
    }

    const validTransitions = {
      unverified: ["pending", "cancelled"],
      pending: ["active", "cancelled"],
      active: ["cancelled"],
      cancelled: [],
    };
    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Không thể chuyển từ ${order.status} sang ${status}`,
      });
    }

    order.status = status;
    await order.save();

    // Gửi email thông báo cập nhật trạng thái
    try {
      await sendMail(
        order.userId.email,
        `Đơn subscription #${order._id} đã được cập nhật trạng thái – Mattra Shop`,
        `Xin chào ${order.userId.username},\n\n` +
          `Trạng thái của đơn hàng subscription (ID: ${order._id}) cho gói "${order.subscriptionId.name}" đã được cập nhật thành "${status}".\n` +
          `Bạn có thể xem chi tiết tài khoản và subscription tại:\n` +
          `https://mattra-online-shop.vercel.app/profile\n\n` +
          `Cảm ơn bạn đã sử dụng dịch vụ!`
      );
    } catch (error) {
      console.error(
        "Lỗi khi gửi email thông báo cập nhật trạng thái subscription:",
        error
      );
    }

    res.status(200).json({
      message: "Cập nhật trạng thái đơn subscription thành công",
      order,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn subscription:", error);
    res.status(500).json({ message: error.message });
  }
};

// Người dùng hoặc Admin: hủy đơn hàng subscription
exports.cancelSubscriptionOrder = async (req, res) => {
  try {
    const order = await SubscriptionOrder.findById(req.params.id)
      .populate("subscriptionId", "name price duration")
      .populate("userId", "username email");
    if (!order) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn hàng subscription" });
    }

    // Cho phép admin hủy bất kỳ, người dùng chỉ hủy khi ở trạng thái unverified/pending
    if (
      req.user.role !== "admin" &&
      (order.userId._id.toString() !== req.user.id ||
        !["unverified", "pending"].includes(order.status))
    ) {
      return res.status(400).json({
        message: "Không thể hủy đơn subscription ở giai đoạn hiện tại",
      });
    }

    order.status = "cancelled";
    await order.save();

    // Gửi email thông báo hủy đơn
    try {
      await sendMail(
        order.userId.email,
        `Đơn subscription #${order._id} đã bị hủy – Mattra Shop`,
        `Xin chào ${order.userId.username},\n\n` +
          `Đơn hàng subscription (ID: ${order._id}) cho gói "${order.subscriptionId.name}" đã bị hủy.\n` +
          `Bạn có thể xem chi tiết tài khoản và subscription tại:\n` +
          `https://mattra-online-shop.vercel.app/profile\n\n` +
          `Cảm ơn bạn đã sử dụng dịch vụ!`
      );
    } catch (error) {
      console.error("Lỗi khi gửi email thông báo hủy đơn subscription:", error);
    }

    res.status(200).json({
      message: "Hủy đơn subscription thành công",
      order,
    });
  } catch (error) {
    console.error("Lỗi hủy đơn subscription:", error);
    res.status(500).json({ message: error.message });
  }
};
