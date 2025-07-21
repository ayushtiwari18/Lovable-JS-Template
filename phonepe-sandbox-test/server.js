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
  console.log("=== PAY ROUTE CALLED ===");
  console.log("Request body:", req.body);

  try {
    const {
      orderId, // This should come from frontend now
      amount, // This should come from frontend
      customerEmail,
      customerPhone,
      customerName,
      cartItems,
      shippingInfo,
    } = req.body;

    // Validate required fields
    if (
      !orderId ||
      !amount ||
      !customerEmail ||
      !customerPhone ||
      !customerName
    ) {
      console.error("Missing required fields:", {
        orderId,
        amount,
        customerEmail,
        customerPhone,
        customerName,
      });
      return res.status(400).send(`
        <h2>❌ Payment Error</h2>
        <p>Missing required payment information</p>
        <p>Required: orderId, amount, customerEmail, customerPhone, customerName</p>
        <pre>Received: ${JSON.stringify(req.body, null, 2)}</pre>
      `);
    }

    const merchantTransactionId = orderId;
    const merchantOrderId = orderId;

    console.log("Processing payment for order:", orderId);
    console.log("Amount:", amount);

    // Prepare payload for PhonePe
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: customerEmail || "user_" + Date.now(),
      amount: parseInt(amount),
      merchantOrderId,
      redirectUrl: REDIRECT_URL,
      redirectMode: "POST",
      callbackUrl: CALLBACK_URL,
      mobileNumber: customerPhone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    console.log("PhonePe payload:", payload);

    // Encode, sign, X-VERIFY
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );
    const stringToHash = payloadBase64 + "/pg/v1/pay" + SALT_KEY;
    const hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerify = `${hash}###${SALT_INDEX}`;

    console.log("Making request to PhonePe...");

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

    console.log("PhonePe response:", response.data);

    // Get the redirect URL for payment page
    if (
      response.data.success &&
      response.data.data?.instrumentResponse?.redirectInfo?.url
    ) {
      const redirectUrl =
        response.data.data.instrumentResponse.redirectInfo.url;
      console.log("Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    } else {
      console.error("PhonePe initialization failed:", response.data);
      return res.status(400).send(`<h2>❌ Payment Initialization Failed</h2>
        <p><strong>Error:</strong> ${
          response.data.message || "Invalid response"
        }</p>
        <pre>${JSON.stringify(response.data, null, 2)}</pre>`);
    }
  } catch (error) {
    console.error("❌ Payment route error:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    return res.status(500).send(`
      <h2>❌ Payment Error</h2>
      <p><strong>Error:</strong> ${
        error?.response?.data?.message || error.message
      }</p>
      <pre>Request body: ${JSON.stringify(req.body, null, 2)}</pre>
      <pre>Error details: ${JSON.stringify(
        error?.response?.data || {},
        null,
        2
      )}</pre>
    `);
  }
});

// --- Payment result redirect (user sees this page after PG) ---
// --- Payment result redirect (user sees this page after PG) ---
app.post("/redirect", async (req, res) => {
  console.log("=== REDIRECT ROUTE CALLED ===");
  console.log("Request body:", req.body);

  const {
    code,
    merchantId,
    transactionId, // PhonePe sends OUR order ID as transactionId
    providerReferenceId,
  } = req.body;

  // Use transactionId as our order ID (merchantTransactionId)
  const orderIdFromPhonePe = transactionId;
  const phonepeTransactionId = providerReferenceId;

  console.log("Order ID from PhonePe:", orderIdFromPhonePe);
  console.log("PhonePe Transaction ID:", phonepeTransactionId);

  let paymentStatus = "failed";
  if (code === "PAYMENT_SUCCESS") paymentStatus = "success";
  else if (code === "PAYMENT_PENDING" || code === "PAYMENT_INITIATED")
    paymentStatus = "pending";

  console.log("Payment status:", paymentStatus);

  // If payment was successful, update orders/payments in Supabase
  if (paymentStatus === "success") {
    try {
      console.log("Updating order status to confirmed for:", orderIdFromPhonePe);

      // 1️⃣ Update order status to "confirmed"
      const { data: orderUpdate, error: orderError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          payment_status: "completed",
          transaction_id: phonepeTransactionId,
          upi_reference: providerReferenceId || "",
        })
        .eq("id", orderIdFromPhonePe); // Use the correct order ID

      if (orderError) {
        console.error("Order update error:", orderError);
      } else {
        console.log("Order updated successfully");
      }

      // 2️⃣ Get order details first for payment record
      const { data: orderDetails } = await supabase
        .from("orders")
        .select("user_id, amount")
        .eq("id", orderIdFromPhonePe)
        .single();

      if (orderDetails) {
        // 3️⃣ Insert payment record with proper user_id
        const { data: paymentInsert, error: paymentError } = await supabase
          .from("payments")
          .insert([
            {
              order_id: orderIdFromPhonePe,
              user_id: orderDetails.user_id, // Use actual user_id from order
              amount: orderDetails.amount,
              status: paymentStatus,
              phonepe_txn_id: phonepeTransactionId,
              phonepe_response: req.body,
              customer_info: {},
            },
          ]);

        if (paymentError) {
          console.error("Payment insert error:", paymentError);
        } else {
          console.log("Payment record created successfully");
        }
      }
    } catch (error) {
      console.error("Supabase update error:", error.message);
    }
  } else {
    // Update order as failed/cancelled
    try {
      await supabase
        .from("orders")
        .update({
          status: "failed",
          payment_status: "failed",
        })
        .eq("id", orderIdFromPhonePe);
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  }

  // Render result page with correct order ID
  res.send(`
    <html>
      <head>
        <title>PhonePe Payment Result</title>
        <meta http-equiv="refresh" content="3;url=/done?orderId=${orderIdFromPhonePe}" />
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>${
          paymentStatus === "success"
            ? "✅ Payment Successful!"
            : "❌ Payment Failed"
        }</h2>
        <p><strong>Order ID:</strong> ${orderIdFromPhonePe}</p>
        <p><strong>PhonePe Transaction:</strong> ${phonepeTransactionId || "N/A"}</p>
        <p><strong>Status:</strong> ${paymentStatus}</p>
        <p>Redirecting you to order confirmation...</p>
        <script>
          setTimeout(function(){ 
            window.location="/done?orderId=${orderIdFromPhonePe}"; 
          }, 2000);
        </script>
      </body>
    </html>
  `);
});


// --- Payment backend callback ---
// --- Payment backend callback ---
app.post("/callback", async (req, res) => {
  console.log("=== CALLBACK ROUTE CALLED ===");
  console.log("Request body:", req.body);
  
  const { code, transactionId, providerReferenceId } = req.body;

  // The transactionId from PhonePe is actually our order ID
  const merchantTransactionId = transactionId;
  const phonepeTransactionId = providerReferenceId;

  let paymentStatus = "failed";
  if (code === "PAYMENT_SUCCESS") paymentStatus = "success";
  else if (code === "PAYMENT_PENDING" || code === "PAYMENT_INITIATED")
    paymentStatus = "pending";

  // Update order/payments (same as redirect route)
  if (paymentStatus === "success") {
    try {
      await supabase
        .from("orders")
        .update({ 
          status: "confirmed",
          payment_status: "completed",
          transaction_id: phonepeTransactionId
        })
        .eq("id", merchantTransactionId);

      // Get order details for payment record
      const { data: orderDetails } = await supabase
        .from("orders")
        .select("user_id, amount")
        .eq("id", merchantTransactionId)
        .single();

      await supabase.from("payments").insert([{
        order_id: merchantTransactionId,
        user_id: orderDetails?.user_id || null,
        amount: orderDetails?.amount || null,
        status: paymentStatus,
        phonepe_txn_id: phonepeTransactionId,
        phonepe_response: req.body,
        customer_info: {},
      }]);
    } catch (error) {
      console.error("Supabase update error [callback]:", error.message);
    }
  } else {
    await supabase
      .from("orders")
      .update({ 
        status: "failed",
        payment_status: "failed" 
      })
      .eq("id", merchantTransactionId);
  }

  res.status(200).json({ ok: true, message: "Callback handled." });
});


// --- Order result info route ---
app.get("/done", async (req, res) => {
  const { orderId } = req.query;
  console.log("Redirecting to frontend for order:", orderId);

  res.send(`
    <html>
      <head>
        <title>Finalizing Order...</title>
        <meta http-equiv="refresh" content="2;url=http://localhost:5173/order/${orderId}" />
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>🎉 Payment Processing Complete!</h2>
        <p>Redirecting you to your order confirmation...</p>
        <a href="http://localhost:5173/order/${orderId}" style="color: blue; text-decoration: underline;">
          Click here if not redirected automatically
        </a>
        <script>
          setTimeout(function(){ 
            window.location="http://localhost:5173/order/${orderId}"; 
          }, 1500);
        </script>
      </body>
    </html>
  `);
});

// --- Status check route ---
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
