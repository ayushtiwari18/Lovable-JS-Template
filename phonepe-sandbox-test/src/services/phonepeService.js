const crypto = require("crypto");
const axios = require("axios");
const config = require("../config/phonepe");

class PhonePeService {
  static createPayload(paymentData, redirectUrl, callbackUrl) {
    const { orderId, amount, customerEmail, customerPhone } = paymentData;

    return {
      merchantId: config.MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: customerEmail || "user_" + Date.now(),
      amount: parseInt(amount),
      merchantOrderId: orderId,
      redirectUrl,
      redirectMode: "POST",
      callbackUrl,
      mobileNumber: customerPhone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
  }

  static createSignature(payload) {
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );
    const stringToHash = payloadBase64 + "/pg/v1/pay" + config.SALT_KEY;
    const hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerify = `${hash}###${config.SALT_INDEX}`;

    return { payloadBase64, xVerify };
  }

  static async initiatePayment(paymentData, redirectUrl, callbackUrl) {
    const payload = this.createPayload(paymentData, redirectUrl, callbackUrl);
    const { payloadBase64, xVerify } = this.createSignature(payload);

    const response = await axios.post(
      `${config.BASE_URL}/pg/v1/pay`,
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": config.MERCHANT_ID,
        },
        timeout: 15000,
      }
    );

    return response.data;
  }

  static async checkStatus(txnId) {
    const apiPath = `/pg/v1/status/${config.MERCHANT_ID}/${txnId}`;
    const stringToHash = apiPath + config.SALT_KEY;
    const hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerify = hash + "###" + config.SALT_INDEX;

    const response = await axios.get(config.BASE_URL + apiPath, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": config.MERCHANT_ID,
      },
      timeout: 10000,
    });

    return response.data;
  }
}

module.exports = PhonePeService;
