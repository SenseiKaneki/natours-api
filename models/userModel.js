const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const local = 'en-GB';

const validateName = (value, options) => {
  return validator.isAlpha(value, local, options) && value.includes(' ');
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'A user must have a name.'],
    // validate: [(val) => validateName(val, { ignore: " " }), 'A name can only include characters and the name must have a pre- and lastname.']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'A user must have a email address.'],
    validate: [validator.isEmail, 'The email adress is invalid.'],
    lowercase: true
  },
  role: {
    type: String,
    default: 'user',
    required: [true, 'A user must have a role.'],
    enum: {
      values: [ 'user', 'guide', 'lead-guide', 'admin' ],
      message: 'The role must be either user or admin.'
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  photo: {
    type: String,
    default: 'default.jpg',
    required: [true, 'A user must have a photo.']
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must confirm the password.'],
    validate: {
      // Only works on CREATE AND SAVE!!!
      validator: function(val) {
        return this.password === val;
      },
      message: 'The confirmed password is not equal to the password.'
    },
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  // Skip process if the password isn't modified
  if (!this.isModified('password')) return next();

  // Hash the Password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete confirmed Password (not needed anymore)
  this.passwordConfirm = undefined;
  this.passwordChangedAt = Date.now();

  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

// Instance Method
userSchema.methods.comparePassword = async function (enteredPassword, userPassword) {
  // return await bcrypt.compare(password, this.password) // this.password isn't available because select is false
  return await bcrypt.compare(enteredPassword, userPassword);
}
userSchema.methods.changedPasswordAfter = function (timestamp) {
  // return this.passwordChangedAt && Date.parse(this.passwordChangedAt) > timestamp;
  return this.passwordChangedAt && parseInt((this.passwordChangedAt.getTime() / 1000), 10) > timestamp;
}
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes in milliseconds

  return resetToken;
}

const userModel = new mongoose.model('User', userSchema);

module.exports = userModel;