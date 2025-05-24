// controllers/payment.controller.js

const crypto = require("crypto");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");

// VNPay sandbox endpoint (override via VNPAY_URL env var if desired)
const VNPAY_URL =
  process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

/**
 * Format a Date into YYYYMMDDHHmmss (GMT+7) for VNPay
 */
function formatDate(date) {
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

/**
 * POST /api/payments/create
 * Body: { orderId: ObjectId }
 *
 * - Fetches order.totalAmount
 * - Generates VNPay-QR URL
 * - Logs a Payment record (status “pending”) with paymentUrl & expiry
 */
exports.createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!tmnCode || !hashSecret || !frontendUrl) {
      return res
        .status(500)
        .json({
          message: "Missing VNPAY_TMN_CODE, VNPAY_HASH_SECRET, or FRONTEND_URL",
        });
    }

    // 1) Lookup order and verify ownership
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not own this order" });
    }

    // 2) Use order.totalAmount (in VND) for the payment
    const amount = order.totalAmount; // :contentReference[oaicite:0]{index=0}

    // 3) Create a pending Payment record
    const payment = await Payment.create({
      userId: req.user.id,
      orderId,
      amount, // you may store in cents per your schema comment :contentReference[oaicite:1]{index=1}
      status: "pending",
      // ensure your schema also has: paymentUrl: String, expiresAt: Date
    });

    // 4) Build VNPay parameters
    const now = new Date();
    const vnp_CreateDate = formatDate(now);
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000); // +15 minutes
    const vnp_ExpireDate = formatDate(expireDate);
    const returnUrl = `${frontendUrl}/payment/result`;

    const vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Amount: amount * 100, // VNPay expects amount in “cents”
      vnp_CurrCode: "VND",
      vnp_TxnRef: payment._id.toString(),
      vnp_OrderInfo: `Payment for order ${orderId}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: req.ip,
      vnp_CreateDate,
      vnp_ExpireDate,
      vnp_BankCode: "VNPAYQR",
    };

    // 5) Sign and build the full URL
    const sortedKeys = Object.keys(vnpParams).sort();
    const signData = sortedKeys.map((k) => `${k}=${vnpParams[k]}`).join("&");
    const secureHash = crypto
      .createHmac("sha512", hashSecret)
      .update(signData)
      .digest("hex");

    const query = sortedKeys
      .map((k) => `${k}=${encodeURIComponent(vnpParams[k])}`)
      .join("&");
    const paymentUrl = `${VNPAY_URL}?${query}&vnp_SecureHash=${secureHash}`;

    // 6) Save retry link + expiry on Payment
    payment.paymentUrl = paymentUrl;
    payment.expiresAt = expireDate;
    await payment.save();

    // 7) Return URL to client
    return res.json({ paymentUrl });
  } catch (err) {
    console.error("createPayment error:", err);
    return res.status(500).json({ message: err.message });
  }
};
