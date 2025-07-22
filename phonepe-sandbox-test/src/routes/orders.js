const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/auth");
const validationMiddleware = require("../middleware/validation");
const rateLimiter = require("../middleware/rateLimiter");

// Apply general rate limiting
router.use(rateLimiter.apiLimiter());

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Public/Private
 */
router.post(
  "/",
  authMiddleware.optionalAuth,
  validationMiddleware.validateOrderCreation(),
  orderController.createOrder
);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order by ID
 * @access  Public (with restrictions)
 */
router.get(
  "/:orderId",
  authMiddleware.optionalAuth,
  validationMiddleware.validateObjectId("orderId"),
  orderController.getOrderById
);

/**
 * @route   GET /api/orders/user/:userId
 * @desc    Get orders for specific user
 * @access  Private (user or admin)
 */
router.get(
  "/user/:userId",
  authMiddleware.authenticateToken,
  authMiddleware.checkResourceOwnership("userId"),
  validationMiddleware.validateObjectId("userId"),
  validationMiddleware.validatePagination(),
  orderController.getUserOrders
);

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status
 * @access  Admin only
 */
router.put(
  "/:orderId/status",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validationMiddleware.validateObjectId("orderId"),
  validationMiddleware.validateOrderStatusUpdate(),
  orderController.updateOrderStatus
);

/**
 * @route   POST /api/orders/:orderId/cancel
 * @desc    Cancel order
 * @access  Private (owner or admin)
 */
router.post(
  "/:orderId/cancel",
  authMiddleware.authenticateToken,
  validationMiddleware.validateObjectId("orderId"),
  [
    body("reason")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Cancellation reason must not exceed 500 characters"),
  ],
  orderController.cancelOrder
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders (with filters)
 * @access  Admin only
 */
router.get(
  "/",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validationMiddleware.validatePagination(),
  [
    query("status")
      .optional()
      .isIn([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ])
      .withMessage("Invalid status filter"),
    query("search")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Search query must be 2-100 characters"),
  ],
  orderController.getAllOrders
);

/**
 * @route   GET /api/orders/analytics/summary
 * @desc    Get order analytics summary
 * @access  Admin only
 */
router.get(
  "/analytics/summary",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validationMiddleware.validateDateRange(),
  orderController.getOrderAnalytics
);

/**
 * @route   PUT /api/orders/:orderId
 * @desc    Update order details
 * @access  Admin only
 */
router.put(
  "/:orderId",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validationMiddleware.validateObjectId("orderId"),
  [
    body("shippingAddress.street").optional().notEmpty(),
    body("shippingAddress.city").optional().notEmpty(),
    body("shippingAddress.state").optional().notEmpty(),
    body("shippingAddress.pincode").optional().isLength({ min: 6, max: 6 }),
    body("notes").optional().isLength({ max: 1000 }),
  ],
  orderController.updateOrder
);

/**
 * @route   POST /api/orders/:orderId/shipping
 * @desc    Add shipping information
 * @access  Admin only
 */
router.post(
  "/:orderId/shipping",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validationMiddleware.validateObjectId("orderId"),
  [
    body("trackingNumber")
      .notEmpty()
      .withMessage("Tracking number is required"),
    body("carrier").notEmpty().withMessage("Carrier is required"),
    body("estimatedDelivery")
      .optional()
      .isISO8601()
      .withMessage("Invalid delivery date"),
  ],
  orderController.addShippingInfo
);

/**
 * @route   GET /api/orders/:orderId/tracking
 * @desc    Get order tracking information
 * @access  Private (owner or admin)
 */
router.get(
  "/:orderId/tracking",
  authMiddleware.authenticateToken,
  validationMiddleware.validateObjectId("orderId"),
  orderController.getOrderTracking
);

/**
 * @route   POST /api/orders/:orderId/notes
 * @desc    Add notes to order
 * @access  Admin only
 */
router.post(
  "/:orderId/notes",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validationMiddleware.validateObjectId("orderId"),
  [
    body("note")
      .notEmpty()
      .isLength({ max: 1000 })
      .withMessage("Note is required and must not exceed 1000 characters"),
    body("isInternal")
      .optional()
      .isBoolean()
      .withMessage("isInternal must be boolean"),
  ],
  orderController.addOrderNote
);

/**
 * @route   GET /api/orders/export/csv
 * @desc    Export orders to CSV
 * @access  Admin only
 */
router.get(
  "/export/csv",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validationMiddleware.validateDateRange(),
  orderController.exportOrdersCSV
);

/**
 * @route   POST /api/orders/bulk/update
 * @desc    Bulk update order statuses
 * @access  Admin only
 */
router.post(
  "/bulk/update",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  [
    body("orderIds")
      .isArray({ min: 1 })
      .withMessage("Order IDs array is required"),
    body("status")
      .notEmpty()
      .isIn(["confirmed", "processing", "shipped", "delivered", "cancelled"])
      .withMessage("Valid status is required"),
    body("note")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Note must not exceed 500 characters"),
  ],
  orderController.bulkUpdateOrders
);

module.exports = router;
