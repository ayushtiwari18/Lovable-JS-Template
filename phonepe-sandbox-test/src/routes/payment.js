const express = require("express");
const PaymentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/pay", PaymentController.initiatePayment);
router.post("/redirect", PaymentController.handleRedirect);
router.post("/callback", PaymentController.handleCallback);
router.get("/status/:txnId", PaymentController.getStatus);
router.get("/done", PaymentController.renderOrderComplete);
router.get("/health", PaymentController.getHealthStatus);

module.exports = router;
