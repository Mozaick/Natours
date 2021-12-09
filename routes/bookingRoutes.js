const express = require('express');
const cors = require('cors');

const authControllers = require('../controllers/authController');
const bookingControllers = require('../controllers/bookingController');

const router = express.Router({ mergeParams: true });

// ONLY AUTHENTICATED USERS ARE
// ALLOWED TO USE THE ROUTES BELOW
router.use(cors(), authControllers.protect);

router.get(
  '/checkout-session/:tourId',
  bookingControllers.getCheckoutSession
);

router.use(authControllers.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingControllers.getAllBookings)
  .post(bookingControllers.createBooking);

router
  .route('/:id')
  .get(bookingControllers.getBooking)
  .patch(bookingControllers.updateBooking)
  .delete(bookingControllers.deleteBooking);

module.exports = router;
