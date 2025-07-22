const PhonePeService = require("../services/phonepeService");
const { supabase } = require("../config/supabaseClient");
const { validatePaymentRequest } = require("../utils/validators");
const { getEnvironmentConfig } = require("../config/environment");

const phonepeConfig = require("../config/phonepe");

class PaymentController {
  static async initiatePayment(req, res) {
    console.log("=== PAY ROUTE CALLED ===");
    console.log("Request body:", req.body);

    try {
      const validation = validatePaymentRequest(req.body);

      if (!validation.isValid) {
        console.error("Missing required fields:", validation.missing);
        return res.status(400).send(`
          <h2>❌ Payment Error</h2>
          <p>Missing required payment information</p>
          <p>Required: ${validation.missing.join(", ")}</p>
          <pre>Received: ${JSON.stringify(req.body, null, 2)}</pre>
        `);
      }

      const redirectUrl = phonepeConfig.getRedirectUrl(
        process.env.PORT || 3000
      );
      const callbackUrl = phonepeConfig.getCallbackUrl(
        process.env.PORT || 3000
      );

      console.log("Processing payment for order:", validation.data.orderId);
      console.log("Amount:", validation.data.amount);

      const response = await PhonePeService.initiatePayment(
        validation.data,
        redirectUrl,
        callbackUrl
      );

      console.log("PhonePe response:", response);

      if (
        response.success &&
        response.data?.instrumentResponse?.redirectInfo?.url
      ) {
        const redirectUrl = response.data.instrumentResponse.redirectInfo.url;
        console.log("Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
      } else {
        console.error("PhonePe initialization failed:", response);
        return res.status(400).send(`<h2>❌ Payment Initialization Failed</h2>
          <p><strong>Error:</strong> ${
            response.message || "Invalid response"
          }</p>
          <pre>${JSON.stringify(response, null, 2)}</pre>`);
      }
    } catch (error) {
      console.error("❌ Payment route error:", error);
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
  }

  static async handleRedirect(req, res) {
    console.log("=== REDIRECT ROUTE CALLED ===");
    console.log("Request body:", req.body);

    const { code, merchantId, transactionId, providerReferenceId } = req.body;

    const orderIdFromPhonePe = transactionId;
    const phonepeTransactionId = providerReferenceId;

    console.log("Order ID:", orderIdFromPhonePe);
    console.log("PhonePe Transaction ID:", phonepeTransactionId);

    let paymentStatus = "failed";
    let orderStatus = "failed";

    if (code === "PAYMENT_SUCCESS") {
      paymentStatus = "completed";
      orderStatus = "confirmed";
    }

    try {
      const updateData = {
        status: orderStatus,
        payment_status: paymentStatus,
        transaction_id: phonepeTransactionId || "",
        upi_reference: providerReferenceId || "",
        updated_at: new Date().toISOString(),
      };

      console.log("Update data:", updateData);

      const { data: orderUpdate, error: orderError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderIdFromPhonePe)
        .select("*");

      console.log("💾 Update response:", {
        data: orderUpdate,
        error: orderError,
        affectedRows: orderUpdate?.length || 0,
      });

      if (orderError) {
        console.error("❌ DATABASE UPDATE FAILED:", orderError);
      } else if (!orderUpdate || orderUpdate.length === 0) {
        console.error("❌ NO ROWS UPDATED - Order may not exist");
      } else {
        console.log("✅ DATABASE UPDATE SUCCESS:", orderUpdate[0]);
      }
    } catch (error) {
      console.error("❌ EXCEPTION during update:", error);
    }

    res.send(`
      <html>
        <head>
          <title>PhonePe Payment Result</title>
          <meta http-equiv="refresh" content="3;url=/done?orderId=${orderIdFromPhonePe}" />
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>${
            paymentStatus === "completed"
              ? "✅ Payment Successful!"
              : "❌ Payment Failed"
          }</h2>
          <p><strong>Order ID:</strong> ${orderIdFromPhonePe}</p>
          <p><strong>PhonePe Transaction:</strong> ${
            phonepeTransactionId || "N/A"
          }</p>
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
  }

  static async handleCallback(req, res) {
    console.log("=== CALLBACK ROUTE CALLED ===");
    console.log("Request body:", req.body);

    const { code, transactionId, providerReferenceId } = req.body;
    const merchantTransactionId = transactionId;
    const phonepeTransactionId = providerReferenceId;

    let paymentStatus = "failed";
    if (code === "PAYMENT_SUCCESS") paymentStatus = "success";
    else if (code === "PAYMENT_PENDING" || code === "PAYMENT_INITIATED")
      paymentStatus = "pending";

    if (paymentStatus === "success") {
      try {
        await supabase
          .from("orders")
          .update({
            status: "confirmed",
            payment_status: "completed",
            transaction_id: phonepeTransactionId,
          })
          .eq("id", merchantTransactionId);

        const { data: orderDetails } = await supabase
          .from("orders")
          .select("user_id, amount")
          .eq("id", merchantTransactionId)
          .single();

        await supabase.from("payments").insert([
          {
            order_id: merchantTransactionId,
            user_id: orderDetails?.user_id || null,
            amount: orderDetails?.amount || null,
            status: paymentStatus,
            phonepe_txn_id: phonepeTransactionId,
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
        .update({
          status: "failed",
          payment_status: "failed",
        })
        .eq("id", merchantTransactionId);
    }

    res.status(200).json({ ok: true, message: "Callback handled." });
  }

  static async getStatus(req, res) {
    const txnId = req.params.txnId;
    try {
      const statusData = await PhonePeService.checkStatus(txnId);
      res.json({
        success: true,
        data: statusData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch payment status",
        details: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // In renderOrderComplete method:
  static renderOrderComplete(req, res) {
    const { orderId } = req.query;
    const { frontendUrl } = getEnvironmentConfig();

    console.log("Redirecting to frontend for order:", orderId);

    res.send(`
    <html>
      <head>
        <title>Finalizing Order...</title>
        <meta http-equiv="refresh" content="2;url=${frontendUrl}/order/${orderId}" />
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>🎉 Payment Processing Complete!</h2>
        <p>Redirecting you to your order confirmation...</p>
        <a href="${frontendUrl}/order/${orderId}" style="color: blue; text-decoration: underline;">
          Click here if not redirected automatically
        </a>
        <script>
          setTimeout(function(){ 
            window.location="${frontendUrl}/order/${orderId}"; 
          }, 1500);
        </script>
      </body>
    </html>
  `);
  }

  static getHealthStatus(req, res) {
    const PORT = process.env.PORT || 3000;
    res.json({
      status: "OK",
      ts: new Date().toISOString(),
      env: {
        merchantId: phonepeConfig.MERCHANT_ID,
        saltIndex: phonepeConfig.SALT_INDEX,
        REDIRECT_URL: phonepeConfig.getRedirectUrl(PORT),
        CALLBACK_URL: phonepeConfig.getCallbackUrl(PORT),
        BASE_URL: phonepeConfig.BASE_URL,
      },
    });
  }
}

module.exports = PaymentController;
