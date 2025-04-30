const model = require('./../models/userModel');
const CatchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { deleteOne, updateOne, createOne, getOne, getAll } = require('./handlerFactory')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     // user-id-timestamp
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    return cb(null, true);
  } else {
    return cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(128, 128)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
}

const filterObj = (obj, ...keys) => {
  const filteredObj = {};
  for (let key in obj) {
    if (keys.includes(key)) obj[key] ? filteredObj[key] = obj[key] : null;
  }
  return filteredObj;
}

exports.getAllUsers = getAll(model);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}
exports.updateMe = CatchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (['password', 'passwordConfirm'].some(key => key in req.body)) return next(new AppError('You are not allowed to change your Password in this route.', 400));

  // if (['role', 'passwordChangedAt', 'photo', 'active', '_id', '__v'].some(key => key in req.body)) return next(new AppError('Invalid arguments.', 400));
  //
  // // 2) Update user document
  // for (let key in req.body) {
  //   req.user[key] = req.body[key];
  // }
  // req.user.save();

  if (!(req.user.photo === 'default.jpg') && req.file && !(req.user.photo.split('-')[1].length <= 2)) {
    const oldImgPath = path.join(__dirname, '../public/img/users', req.user.photo);
    fs.unlink(oldImgPath, (err) => {
      if (err) {
        return next(err);
      }
    });
  }

  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const user = await model.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  })

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  })
});
exports.deleteMe = CatchAsync(async (req, res, next) => {
  await model.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  })
});

exports.getUser = getOne(model);
// DONT UPDATE PASSWORD WITH THIS !!!
exports.updateUser = updateOne(model);
exports.deleteUser = deleteOne(model);