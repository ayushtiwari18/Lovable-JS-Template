shrifal-handicrafts/
├── backend/
│   ├── controllers/
│   │   ├── paymentController.js      # PhonePe payment logic
│   │   └── cloudinaryController.js   # Signed upload URLs
│   ├── routes/
│   │   ├── paymentRoutes.js
│   │   └── cloudinaryRoutes.js
│   ├── utils/
│   │   ├── phonepe.js                # HMAC generator, payload builder
│   │   └── cloudinary.js             # Signature creator
│   ├── middlewares/
│   │   └── errorHandler.js
│   ├── .env                          # PhonePe keys, Cloudinary secret
│   ├── server.js                     # Express entry
│   └── package.json
