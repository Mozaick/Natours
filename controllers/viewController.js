const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alert = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert =
      'Your Booking is successful. A confirmation email was sent to you.. NOTE: booked tours may take up to 5 minutes to show up in your My Bookings page.';
  }
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Natours Tours',
    tours,
  });
});

exports.getTourOverview = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with this name!!', 405));
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login to your account',
  });
});

exports.getSignupForm = catchAsync(async (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Sign Up',
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyBookedTours = catchAsync(async (req, res) => {
  // 1) find all bookings

  const bookings = await Booking.find({ user: req.user.id });

  // 2) find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);

  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Booked tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
