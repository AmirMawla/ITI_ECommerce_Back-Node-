const axios = require("axios");
const crypto = require("crypto");
const queryString = require("query-string");
const _ = require("underscore");

const httpClient = axios.create({
  baseURL: process.env.KASHIER_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: process.env.KASHIER_SECRET_KEY,
    "api-key": process.env.KASHIER_API_KEY,
  },
});


const urlencode = (value) => encodeURIComponent(String(value ?? "").trim());

const createPaymentSession = async ({ amount, orderId, notes = "Order payment" }) => {
  if (!process.env.KASHIER_URL || !process.env.KASHIER_API_KEY) {
    throw new Error(
      "Kashier is not configured (set KASHIER_URL, KASHIER_API_KEY, and related env vars)."
    );
  }

  let merchantRedirect = "";
  try {
    const rawRedirect = process.env.FRONTEND_URL || "https://example.com/redirect";
    const rawWebhook = process.env.WEBHOOK_URL ? process.env.WEBHOOK_URL.trim() : "";
    const webhookBase = (() => {
      if (!rawWebhook) return null;
      const s = String(rawWebhook);
      const m = s.match(/^(https?:\/\/[^/]+)/i);
      return m ? m[1] : null;
    })();

    
    const merchantRedirectUrl = (() => {
      if (!webhookBase) throw new Error("WEBHOOK_URL must be set to build merchantRedirect.");
      const u = new URL(webhookBase);
      u.protocol = "https:";
      u.pathname = "/orders/redirect";
      u.searchParams.set("orderId", String(orderId));
      return u.toString();
    })();

    merchantRedirect = merchantRedirectUrl;

    const response = await httpClient.post("/v3/payment/sessions", {
      paymentType: "credit",
      amount: Number(amount).toFixed(2),
      currency: "EGP",
      order: orderId,
      display: "en",
      allowedMethods: "card,wallet",
      merchantRedirect,
      redirectMethod: null,
      failureRedirect: false,
      iframeBackgroundColor: "#FFFFFF",
      merchantId: process.env.KASHIER_MERCHANT_ID,
      brandColor: "#5020FF",
      defaultMethod: "card",
      description: `Payment for order ${orderId}`,
      manualCapture: false,
      saveCard: "none",
      interactionSource: "ECOMMERCE",
      enable3DS: true,
      serverWebhook: process.env.WEBHOOK_URL ? process.env.WEBHOOK_URL.trim() : undefined,
      notes,
    });

    return response?.data;
  } catch (err) {
    const detail =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.response?.statusText ||
      err.message ||
      "Kashier request failed";
    console.error("Kashier createPaymentSession:", detail, err.response?.status, { merchantRedirect });
    throw new Error(`Payment session failed: ${detail}`);
  }
};

const isValidWebhookSignature = (data, signatureHeader) => {
  if (!data || !Array.isArray(data.signatureKeys) || !signatureHeader) return false;
  data.signatureKeys.sort();
  const objectSignaturePayload = _.pick(data, data.signatureKeys);
  const signaturePayload = queryString.stringify(objectSignaturePayload);
  const signature = crypto
    .createHmac("sha256", process.env.KASHIER_API_KEY)
    .update(signaturePayload)
    .digest("hex");
  return signatureHeader === signature;
};

module.exports = {
  createPaymentSession,
  isValidWebhookSignature,
};
