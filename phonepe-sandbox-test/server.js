require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// --- Supabase Initialization ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- ENV ---
const { MERCHANT_ID, SALT_KEY, SALT_INDEX } = process.env;

// LOCAL REDIRECT/CALLBACK URLs
const REDIRECT_URL = `http://localhost:${PORT}/redirect`;
const CALLBACK_URL = `http://localhost:${PORT}/callback`;

const BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

// --- Health/Root Routes ---
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    ts: new Date().toISOString(),
    env: {
      merchantId: MERCHANT_ID,
      saltIndex: SALT_INDEX,
      REDIRECT_URL,
      CALLBACK_URL,
      BASE_URL,
    },
  });
});

// --- Payment Initiation: /pay ---
app.post("/pay", async (req, res) => {
  try {
    const {
      amount,
      orderId, // our own order id (uuid)
      customerEmail,
      customerPhone,
      customerName,
    } = req.body;

    const merchantTransactionId = orderId;
    const merchantOrderId = orderId;

    // Prepare payload for PhonePe
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: customerEmail || "user_" + Date.now(),
      amount: parseInt(amount), // in paise
      merchantOrderId,
      redirectUrl: REDIRECT_URL,
      redirectMode: "POST",
      callbackUrl: CALLBACK_URL,
      mobileNumber: customerPhone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Encode, sign, X-VERIFY
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );
    const stringToHash = payloadBase64 + "/pg/v1/pay" + SALT_KEY;
    const hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerify = `${hash}###${SALT_INDEX}`;

    // Make PhonePe API request
    const response = await axios.post(
      `${BASE_URL}/pg/v1/pay`,
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": MERCHANT_ID,
        },
        timeout: 15000,
      }
    );

    // Get the redirect URL for payment page
    if (
      response.data.success &&
      response.data.data?.instrumentResponse?.redirectInfo?.url
    ) {
      const redirectUrl =
        response.data.data.instrumentResponse.redirectInfo.url;
      return res.redirect(redirectUrl);
    } else {
      return res.status(400).send(`<h2>❌ Payment Initialization Failed</h2>
        <p><strong>Error:</strong> ${
          response.data.message || "Invalid response"
        }</p>
        <pre>${JSON.stringify(response.data)}</pre>`);
    }
  } catch (error) {
    return res.status(500).send(`
      <h2>❌ Payment Error</h2>
      <p>${error?.response?.data?.message || error.message}</p>
      <pre>${JSON.stringify(error?.response?.data || {}, null, 2)}</pre>
    `);
  }
});

// --- Payment result redirect (user sees this page after PG) ---
app.post("/redirect", async (req, res) => {
  const {
    code,
    merchantId,
    merchantTransactionId,
    transactionId,
    providerReferenceId,
  } = req.body;

  let paymentStatus = "failed";
  if (code === "PAYMENT_SUCCESS") paymentStatus = "success";
  else if (code === "PAYMENT_PENDING" || code === "PAYMENT_INITIATED")
    paymentStatus = "pending";

  // If payment was successful, update orders/payments in Supabase
  if (paymentStatus === "success") {
    try {
      // 1️⃣  Update order status to "confirmed"
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", merchantTransactionId);

      // 2️⃣  Insert payment record
      await supabase.from("payments").insert([
        {
          order_id: merchantTransactionId,
          user_id: null, // You can fetch user_id from order if needed!
          amount: null, // You can fetch amount from order if needed!
          status: paymentStatus,
          phonepe_txn_id: transactionId,
          phonepe_response: req.body,
          customer_info: {}, // Optionally from order
        },
      ]);
    } catch (error) {
      console.error("Supabase update error:", error.message);
      // We continue: payment succeeded for user
    }
  } else {
    // update order as failed/cancelled if needed
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", merchantTransactionId);
  }

  // Render a simple page, can auto-redirect to your FE order summary page
  res.send(`
    <html>
      <head>
        <title>PhonePe Payment Result</title>
        <meta http-equiv="refresh" content="2;url=/done?orderId=${merchantTransactionId}" />
      </head>
      <body>
        <h2>${
          paymentStatus === "success"
            ? "✅ Payment Successful!"
            : "❌ Payment Failed"
        }</h2>
        <p>Transaction: ${transactionId}</p>
        <p>Order: ${merchantTransactionId}</p>
        <p>Status: ${paymentStatus}</p>
        <script>
          setTimeout(function(){ window.location="/done?orderId=${merchantTransactionId}"; }, 1500);
        </script>
      </body>
    </html>
  `);
});

// --- Payment backend callback (webhook-like, update DB for reconciliation) ---
app.post("/callback", async (req, res) => {
  const { code, merchantTransactionId, transactionId } = req.body;

  let paymentStatus = "failed";
  if (code === "PAYMENT_SUCCESS") paymentStatus = "success";
  else if (code === "PAYMENT_PENDING" || code === "PAYMENT_INITIATED")
    paymentStatus = "pending";

  // Update order/payments as above (idempotent)
  if (paymentStatus === "success") {
    try {
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", merchantTransactionId);

      await supabase.from("payments").insert([
        {
          order_id: merchantTransactionId,
          user_id: null,
          amount: null,
          status: paymentStatus,
          phonepe_txn_id: transactionId,
          phonepe_response: req.body,
          customer_info: {},
        },
      ]);
    } catch (error) {
      console.error("Supabase update error [callback]:", error.message);
    }
  } else {
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", merchantTransactionId);
  }

  res.status(200).json({ ok: true, message: "Callback handled." });
});

// --- Order result info route (for front-end redirect) ---
app.get("/done", async (req, res) => {
  // Can accept orderId and return a JS/redirect to your React /order/:id route
  const { orderId } = req.query;
  res.send(`
    <html>
      <head>
        <title>Finalizing Order...</title>
        <meta http-equiv="refresh" content="1;url=http://localhost:5173/order/${orderId}" />
      </head>
      <body>
        <h2>Redirecting you to your order confirmation…</h2>
        <a href="http://localhost:5173/order/${orderId}">Click here if not redirected</a>
      </body>
    </html>
  `);
});

// (OPTIONAL) Status check route for admin/ops
app.get("/status/:txnId", async (req, res) => {
  const txnId = req.params.txnId;
  try {
    const apiPath = `/pg/v1/status/${MERCHANT_ID}/${txnId}`;
    const stringToHash = apiPath + SALT_KEY;
    const hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerify = hash + "###" + SALT_INDEX;
    const statusRes = await axios.get(BASE_URL + apiPath, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": MERCHANT_ID,
      },
      timeout: 10000,
    });
    res.json({
      success: true,
      data: statusRes.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch payment status",
      details: error.response?.data || error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// --- Generic Error Handler ---
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`💡 For payment redirection, use http://localhost:${PORT}/pay`);
});
