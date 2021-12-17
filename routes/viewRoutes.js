const express = require('express');
const viewController = require('../controllers/viewController');
const authControllers = require('../controllers/authController');

const CSP = 'Content-Security-Policy';
const POLICY =
  "base-uri 'self';block-all-mixed-content;" +
  "font-src 'self' https: data:;" +
  "frame-ancestors 'self';" +
  "img-src http://localhost:8000 'self' blob: data:;" +
  "object-src 'none';" +
  "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
  "script-src-attr 'none';" +
  "style-src 'self' https: 'unsafe-inline';" +
  'upgrade-insecure-requests;';

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader(CSP, POLICY);
  next();
});

router.get('/', authControllers.isLoggedIn, viewController.getOverview);

router.get(
  '/tour/:slug',
  authControllers.isLoggedIn,
  viewController.getTourOverview
);
router.get('/login', authControllers.isLoggedIn, viewController.getLoginForm);
router.get('/signup', viewController.getSignupForm);
router.get('/my', authControllers.protect, viewController.getAccount);
router.get(
  '/my-booked-tours',
  authControllers.protect,
  viewController.getMyBookedTours
);

router.post(
  '/submit-my-data',
  authControllers.protect,
  viewController.updateUserData
);

module.exports = router;
