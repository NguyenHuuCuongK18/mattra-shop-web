const { VietQR } = require("vietqr");
const { put } = require("@vercel/blob");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");

exports.generateVietQR = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const vietqr = new VietQR({
      clientID: process.env.VIETQR_CLIENT_ID,
      apiKey: process.env.VIETQR_API_KEY,
    });

    // Generate base64 QR
    const apiRes = await vietqr.genQRCodeBase64({
      bank: process.env.VIETQR_ACQ_ID,
      accountName: process.env.VIETQR_ACCOUNT_NAME,
      accountNumber: process.env.VIETQR_ACCOUNT_NUMBER,
      amount: order.totalAmount.toString(),
      memo: `Order #${order._id}`,
      template: "compact2",
    });

    const { code, desc, data: qrData } = apiRes.data;
    if (code !== "00") {
      return res.status(502).json({ error: "VietQR failed", code, desc });
    }

    // Persist payment record (without image URL for now)
    let payment = await Payment.create({
      userId: req.user.id,
      orderId: order._id,
      amount: order.totalAmount,
      status: "pending",
      acqId: qrData.acqId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      history: [
        {
          status: "generated",
          data: qrData,
        },
      ],
    });

    // Decode the base64 payload into a Buffer
    const prefix = "data:image/png;base64,";
    const b64 = qrData.qrDataURL.startsWith(prefix)
      ? qrData.qrDataURL.slice(prefix.length)
      : qrData.qrDataURL;
    const imageBuffer = Buffer.from(b64, "base64");

    // Upload to Vercel Blob
    const filename = `qr_${payment._id}.png`;
    const blob = await put(filename, imageBuffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Save the public blob URL as `paymentImgUrl`
    payment.paymentImgUrl = blob.url;
    await payment.save();

    // Return only the new image URL and expiry
    return res.json({
      paymentId: payment._id,
      paymentImgUrl: payment.paymentImgUrl,
      expiresAt: payment.expiresAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.logPaymentStatus = async (req, res) => {
  try {
    const { paymentId, status, payload } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.history.push({
      status,
      data: payload,
      timestamp: new Date(),
    });
    if (status === "completed") payment.status = "completed";
    if (status === "failed") payment.status = "failed";

    await payment.save();
    return res.json({ message: "Payment history logged." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * On-demand polling endpoint: call VietQR's Check Transaction API
 * and update our record if the user has paid.
 * This method does not exists.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Optionally check expiration
    if (payment.expiresAt < new Date()) {
      return res.status(410).json({ message: "QR code has expired." });
    }

    const vietqr = new VietQR({
      clientID: process.env.VIETQR_CLIENT_ID,
      apiKey: process.env.VIETQR_API_KEY,
    });

    // Obtain a fresh token
    const token = await vietqr.getToken();

    // Call the Check Transaction endpoint
    const resp = await fetch(
      "https://api.vietqr.vn/bank/api/check-transaction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": vietqr.clientID,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionid: payment.acqId,
        }),
      }
    );
    const json = await resp.json();

    // Log the polling result
    payment.history.push({
      status: "polled",
      data: json,
      timestamp: new Date(),
    });

    // If VietQR says it's completed, update our status
    if (json.code === "00" && json.data && json.data.status === "COMPLETED") {
      payment.status = "completed";
    }

    await payment.save();

    // Return the raw VietQR response plus our current payment status
    return res.json({
      ourStatus: payment.status,
      vietqr: json,
      history: payment.history,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
