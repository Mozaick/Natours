const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.singUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get('host')}/my`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // Read email and password
  const { email, password } = req.body;

  // Check if email && password exist
  if (!email || !password) {
    return next(new AppError('Please, provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged_out', {
    // disappear from the browser in 10 seconds
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Please login to get access', 401));
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const existentUser = await User.findById(decoded.id);

  if (!existentUser)
    return next(
      new AppError('The user of the token does no longer exist', 401)
    );

  // 4) Check if user changed password (after the token was issued)
  if (existentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = existentUser;
  res.locals.user = existentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const existentUser = await User.findById(decoded.id);

      if (!existentUser) return next();

      // 3) Check if user changed password (after the token was issued)
      if (existentUser.changedPasswordAfter(decoded.iat)) return next();

      // THERE IS A LOGGED IN USER
      res.locals.user = existentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Find on DB User Based on POSTed Email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError('User with this email does not exist', 404));

  // 2) Generate the Random Reset Token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  /*
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new 'password'\
   and 'passwordConfirm' to:\n${resetURL}\nIf you did not forget your password, please ignore this email!`;

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } 
  */

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    req.body.PasswordResetToken = undefined;

    req.body.PasswordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Please try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User Based On Token(was sent to them via email)

  // Hash the Token Given To the Client
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Get the User Based on the Token and check if whether it is expired
  const user = await User.findOne({
    PasswordResetToken: hashedToken,
    PasswordResetExpires: { $gt: Date.now() },
  });

  // 2) If Token Is Not Expired; meaning that, There Is a User, Set a New Password
  if (!user) return next(new AppError('Token is invalid or expired!', 400));

  // Set a New Password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.PasswordResetToken = undefined;
  user.PasswordResetExpires = undefined;

  await user.save();
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Check user if exists
  const loggedinUser = await User.findById(req.user.id).select('+password');

  // 2) if so check if password is correct
  if (
    !(await loggedinUser.correctPassword(
      req.body.currentPassword,
      loggedinUser.password
    ))
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) if so update password
  loggedinUser.password = req.body.password;
  loggedinUser.passwordConfirm = req.body.passwordConfirm;

  // 4) log loggedinUser in and send a jwt token
  await loggedinUser.save();

  createSendToken(loggedinUser, 200, req, res);
});
