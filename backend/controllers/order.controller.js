const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Voucher = require("../models/voucher.model");
const User = require("../models/user.model");
const { sendMail } = require("./mail.controller");

// Bản đồ dịch trạng thái đơn hàng sang tiếng Việt
const statusMap = {
  unverified: "Chưa xác nhận",
  pending: "Đang xử lý",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
};

// Mặc định phí vận chuyển
const DEFAULT_SHIPPING_FEE = 30000; // Phí vận chuyển mặc định 30,000 VND

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      paymentMethod,
      shippingAddress,
      voucherId,
      selectedItems,
      phone,
      shippingFee,
    } = req.body;

    if (!paymentMethod || !shippingAddress) {
      return res.status(400).json({
        message: "Phương thức thanh toán và địa chỉ giao hàng là bắt buộc",
      });
    }

    // Lấy số điện thoại: nếu client gửi lên thì dùng, ngược lại lấy từ profile user
    const userDoc = await User.findById(req.user.id);
    const phoneNumber = phone?.trim() || userDoc.phone;

    // Lấy phí vận chuyển từ request hoặc sử dụng mặc định
    const finalShippingFee =
      shippingFee && shippingFee >= 0 ? shippingFee : DEFAULT_SHIPPING_FEE;

    // Validate selected items & compute subtotal
    let subtotal = 0;
    const items = [];
    for (const item of selectedItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ message: `Sản phẩm không tồn tại: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Sản phẩm ${product.name} không đủ số lượng` });
      }
      subtotal += product.price * item.quantity;
      items.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Áp dụng voucher nếu có
    let appliedVoucherId = null;
    let discountApplied = 0;
    if (voucherId) {
      const user = await User.findById(req.user.id).populate(
        "vouchers.voucherId"
      );
      const userVoucher = user.vouchers.find(
        (v) =>
          v.voucherId._id.toString() === voucherId && v.status === "available"
      );
      if (!userVoucher) {
        return res
          .status(400)
          .json({ message: "Voucher không khả dụng cho người dùng này" });
      }
      const voucher = userVoucher.voucherId;

      if (voucher.expires_at < new Date()) {
        userVoucher.status = "expired";
        await user.save();
        return res.status(400).json({ message: "Voucher đã hết hạn" });
      }
      if (voucher.subscriberOnly && user.role !== "subscriber") {
        return res
          .status(403)
          .json({ message: "Voucher này chỉ dành cho người đăng ký" });
      }

      discountApplied = Math.min(
        (voucher.discount_percentage / 100) * subtotal,
        voucher.max_discount || Infinity
      );
      userVoucher.status = "used";
      appliedVoucherId = voucher._id;
      await user.save();
    }

    // Tính tổng tiền: subtotal - discount + shippingFee
    const totalAmount = subtotal - discountApplied + finalShippingFee;

    // Tạo đơn hàng
    const order = new Order({
      userId: req.user.id,
      phone: phoneNumber,
      items,
      paymentMethod,
      shippingAddress,
      shippingFee: finalShippingFee,
      totalAmount,
      discountApplied,
      voucherId: appliedVoucherId,
      status: "unverified",
      createdAt: new Date(),
    });
    await order.save();

    // Xóa giỏ hàng
    await Cart.findOneAndDelete({ userId: req.user.id });

    // Gửi email thông báo cho admin
    try {
      const formattedTotal = order.totalAmount.toLocaleString("vi-VN") + "₫";
      const formattedShippingFee =
        finalShippingFee.toLocaleString("vi-VN") + "₫";
      await sendMail(
        "cuongnhhe186494@fpt.edu.vn",
        "Thông Báo Đơn Hàng Mới – Mattra Shop",
        `Một đơn hàng mới đã được tạo:\n\n` +
          `Mã đơn hàng: ${order._id}\n` +
          `Tổng tiền: ${formattedTotal}\n` +
          `Phí vận chuyển: ${formattedShippingFee}\n` +
          `Phương thức thanh toán: ${paymentMethod}\n` +
          `Số điện thoại liên hệ: ${phoneNumber}\n\n` +
          `Vui lòng kiểm tra thanh toán và cập nhật trạng thái đơn hàng tại:\n` +
          `https://mattra-online-shop.vercel.app/admin/orders\n\n` +
          `Cảm ơn bạn!`
      );
    } catch (error) {
      console.error("Lỗi khi gửi email thông báo cho admin:", error);
    }

    // Gửi email xác nhận cho người dùng
    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email")
      .populate("voucherId", "code discount_percentage max_discount");

    try {
      const formattedTotal =
        populatedOrder.totalAmount.toLocaleString("vi-VN") + "₫";
      const formattedDiscount =
        populatedOrder.discountApplied.toLocaleString("vi-VN") + "₫";
      const formattedShippingFee =
        populatedOrder.shippingFee.toLocaleString("vi-VN") + "₫";

      await sendMail(
        populatedOrder.userId.email,
        "Đơn hàng của bạn đã được tạo - Mattra Shop",
        `Xin chào ${populatedOrder.userId.username},\n\n` +
          `Đơn hàng của bạn (Mã: ${populatedOrder._id}) đã được tạo thành công.\n` +
          `Tổng tiền: ${formattedTotal}\n` +
          `Phí vận chuyển: ${formattedShippingFee}\n` +
          `Giảm giá: ${formattedDiscount}\n` +
          `Nếu có bất kỳ thắc mắc gì, chúng tôi sẽ liên hệ lại qua số điện thoại ${phoneNumber}.\n\n` +
          `Cảm ơn bạn đã mua hàng!`
      );
    } catch (error) {
      console.error("Lỗi khi gửi email tạo đơn:", error);
    }

    res.status(201).json({ message: "Tạo đơn hàng thành công", order });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Tạo đơn hàng thất bại" });
  }
};

// Apply a voucher to an existing order
exports.applyVoucher = async (req, res) => {
  try {
    const { orderId, voucherId } = req.body;
    if (!orderId || !voucherId) {
      return res
        .status(400)
        .json({ message: "Mã đơn hàng và mã voucher là bắt buộc" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }
    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể áp dụng voucher cho đơn của mình" });
    }
    if (order.status !== "unverified") {
      return res
        .status(400)
        .json({ message: "Chỉ có thể áp dụng voucher cho đơn chưa xác nhận" });
    }
    if (order.voucherId) {
      return res.status(400).json({ message: "Đơn hàng đã có voucher" });
    }

    const user = await User.findById(req.user.id).populate(
      "vouchers.voucherId"
    );
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    const userVoucher = user.vouchers.find(
      (v) =>
        v.voucherId._id.toString() === voucherId && v.status === "available"
    );
    if (!userVoucher) {
      return res
        .status(400)
        .json({ message: "Voucher không khả dụng cho người dùng này" });
    }
    const voucher = userVoucher.voucherId;

    if (voucher.expires_at < new Date()) {
      userVoucher.status = "expired";
      await user.save();
      return res.status(400).json({ message: "Voucher đã hết hạn" });
    }
    if (voucher.subscriberOnly && user.role !== "subscriber") {
      return res
        .status(403)
        .json({ message: "Voucher này chỉ dành cho người đăng ký" });
    }

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discountApplied = Math.min(
      (voucher.discount_percentage / 100) * subtotal,
      voucher.max_discount || Infinity
    );
    order.totalAmount = subtotal - discountApplied + order.shippingFee;
    order.discountApplied = discountApplied;
    order.voucherId = voucher._id;
    await order.save();

    userVoucher.status = "used";
    await user.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email");
    try {
      const formattedDiscount =
        populatedOrder.discountApplied.toLocaleString("vi-VN") + "₫";
      const formattedTotal =
        populatedOrder.totalAmount.toLocaleString("vi-VN") + "₫";

      // await sendMail(
      //   populatedOrder.userId.email,
      //   "Voucher đã được áp dụng cho đơn hàng – Mattra Shop",
      //   `Xin chào ${populatedOrder.userId.username},\n\n` +
      //     `Mã voucher (${voucher.code}) đã được áp dụng cho đơn hàng (Mã: ${populatedOrder._id}).\n` +
      //     `Giảm giá: ${formattedDiscount}\n` +
      //     `Tổng tiền mới: ${formattedTotal}\n` +
      //     `Bạn có thể xem chi tiết đơn hàng tại:\n` +
      //     `https://mattra-online-shop.vercel.app/orders\n\n` +
      //     `Cảm ơn bạn!`
      // );
    } catch (error) {
      console.error("Lỗi khi gửi email voucher:", error);
    }

    res.status(200).json({
      message: "Áp dụng voucher thành công",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Apply voucher error:", error);
    res.status(500).json({ message: "Không thể áp dụng voucher" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("items.productId", "name price image")
      .populate("voucherId", "code discount_percentage max_discount")
      .select("-__v");

    res.status(200).json({
      message: "Lấy danh sách đơn hàng thành công",
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Cần quyền admin" });
    }

    const orders = await Order.find()
      .populate("userId", "username email")
      .populate("items.productId", "name price image")
      .populate("voucherId", "code discount_percentage max_discount")
      .select("-__v");

    res.status(200).json({
      message: "Lấy danh sách đơn hàng thành công",
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
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }
    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể hủy đơn của chính mình" });
    }
    if (order.status !== "unverified") {
      return res
        .status(400)
        .json({ message: "Chỉ có thể hủy đơn ở trạng thái chưa xác nhận" });
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
      order.totalAmount =
        order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
        order.shippingFee;
    }

    order.status = "cancelled";
    await order.save();

    // Gửi email thông báo hủy đơn bằng tiếng Việt
    try {
      const user = await User.findById(req.user.id);
      const formattedTotal = order.totalAmount.toLocaleString("vi-VN") + "₫";
      const formattedShippingFee =
        order.shippingFee.toLocaleString("vi-VN") + "₫";

      await sendMail(
        user.email,
        "Bạn đã hủy đơn hàng – Mattra Shop",
        `Xin chào ${user.username},\n\n` +
          `Bạn đã hủy đơn hàng (Mã: ${order._id}).\n` +
          `Tổng tiền của đơn: ${formattedTotal}\n` +
          `Phí vận chuyển: ${formattedShippingFee}\n` +
          `Nếu bạn muốn yêu cầu hoàn tiền, vui lòng liên hệ chúng tôi tại:\n` +
          `https://www.facebook.com/profile.php?id=61576949481579\n\n` +
          `Cảm ơn bạn!`
      );
    } catch (error) {
      console.error("Lỗi khi gửi email hủy đơn:", error);
    }

    res.status(200).json({ message: "Huỷ đơn hàng thành công", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Huỷ đơn hàng thất bại" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Cần quyền admin" });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Trạng thái là bắt buộc" });
    }

    const validStatuses = [
      "unverified",
      "pending",
      "shipping",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (order.status === status) {
      return res
        .status(400)
        .json({ message: `Đơn đã ở trạng thái ${statusMap[status]}` });
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
        message: `Không thể chuyển từ ${statusMap[order.status]} sang ${
          statusMap[status]
        }`,
      });
    }

    order.status = status;
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email")
      .populate("voucherId", "code discount_percentage max_discount");

    // Gửi email cập nhật trạng thái đơn bằng tiếng Việt
    try {
      const formattedStatus = statusMap[status];
      const formattedTotal =
        populatedOrder.totalAmount.toLocaleString("vi-VN") + "₫";
      const formattedShippingFee =
        populatedOrder.shippingFee.toLocaleString("vi-VN") + "₫";

      await sendMail(
        populatedOrder.userId.email,
        `Đơn hàng #${populatedOrder._id} đã được cập nhật – Mattra Shop`,
        `Xin chào ${populatedOrder.userId.username},\n\n` +
          `Trạng thái của đơn hàng (Mã: ${populatedOrder._id}) đã được cập nhật sang "${formattedStatus}".\n` +
          `Tổng tiền: ${formattedTotal}\n` +
          `Phí vận chuyển: ${formattedShippingFee}\n` +
          `Bạn có thể xem chi tiết đơn hàng tại:\n` +
          `https://mattra-online-shop.vercel.app/orders\n\n` +
          `Cảm ơn bạn!`
      );
    } catch (error) {
      console.error("Lỗi khi gửi email cập nhật trạng thái:", error);
    }

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
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
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể xác nhận đơn của chính mình" });
    }

    if (order.status !== "shipping") {
      return res.status(400).json({
        message: "Đơn phải ở trạng thái 'Đang giao hàng' để xác nhận",
      });
    }

    order.status = "delivered";
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name price image")
      .populate("userId", "username email")
      .populate("voucherId", "code discount_percentage max_discount");

    res.status(200).json({
      message: "Xác nhận giao hàng thành công",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tìm order và populate các trường liên quan
    const order = await Order.findById(id)
      .populate("items.productId", "name price image")
      .populate("voucherId", "code discount_percentage max_discount")
      .populate("userId", "username email");

    // 2. Nếu không tìm thấy đơn hàng
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    // 3. Kiểm tra quyền truy cập
    //    - Admin có thể xem tất cả
    //    - User thường chỉ xem được đơn hàng của chính họ
    if (
      req.user.role !== "admin" &&
      order.userId._id.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem đơn hàng này" });
    }

    // 4. Trả về đơn hàng
    res.status(200).json({
      message: "Lấy chi tiết đơn hàng thành công",
      order,
    });
  } catch (error) {
    console.error("getOrderById error:", error);
    res.status(500).json({ message: "Không thể lấy chi tiết đơn hàng" });
  }
};
