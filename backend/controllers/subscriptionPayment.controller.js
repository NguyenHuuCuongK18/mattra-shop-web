const { VietQR } = require("vietqr");
const { put } = require("@vercel/blob");
const SubscriptionOrder = require("../models/subscriptionOrder.model");
const SubscriptionPayment = require("../models/subscriptionPayment.model");

// Generate a VietQR code and log payment for a subscription order
exports.generateSubscriptionVietQR = async (req, res) => {
  try {
    const { subscriptionOrderId } = req.body;
    const order = await SubscriptionOrder.findById(subscriptionOrderId);
    if (!order) {
      return res.status(404).json({ message: "Subscription order not found" });
    }

    // 1) Talk to VietQR
    const vietqr = new VietQR({
      clientID: process.env.VIETQR_CLIENT_ID,
      apiKey: process.env.VIETQR_API_KEY,
    });
    const qrRes = await vietqr.genQRCodeBase64({
      bank: process.env.VIETQR_ACQ_ID,
      accountName: process.env.VIETQR_ACCOUNT_NAME,
      accountNumber: process.env.VIETQR_ACCOUNT_NUMBER,
      amount: order.price.toString(),
      memo: `Subscription #${order._id}`,
      template: "compact",
    });

    const { code, data: qrData } = qrRes.data;
    if (code !== "00") {
      return res.status(502).json({ message: "VietQR error", code });
    }

    // 2) Persist a pending payment record
    let payment = await SubscriptionPayment.create({
      userId: req.user.id,
      subscriptionOrderId: order._id,
      amount: order.price,
      status: "pending",
      acqId: qrData.acqId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      history: [{ status: "generated", data: qrData }],
    });

    // 3) Convert base64 → Buffer
    const prefix = "data:image/png;base64,";
    const b64 = qrData.qrDataURL.startsWith(prefix)
      ? qrData.qrDataURL.slice(prefix.length)
      : qrData.qrDataURL;
    const imageBuffer = Buffer.from(b64, "base64");

    // 4) Upload to Vercel Blob
    const filename = `qr_subscription_${payment._id}.png`;
    const blob = await put(filename, imageBuffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // 5) Save the public URL on our record
    payment.paymentImgUrl = blob.url;
    await payment.save();

    // 6) Respond with the QR URL + expiry
    res.status(201).json({
      paymentId: payment._id,
      paymentImgUrl: payment.paymentImgUrl,
      expiresAt: payment.expiresAt,
    });
  } catch (err) {
    console.error("Subscription QR error:", err);
    res.status(500).json({ message: err.message });
  }
};
