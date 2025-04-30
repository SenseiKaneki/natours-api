const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const CatchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (model) => {
  return catchAsync(async(req, res, next) => {
    const doc = await model.findByIdAndDelete(req.params.id);

    if (!doc) return next(new AppError('No document found with that ID', 404));

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
}
exports.updateOne = (model, options={
  new: true,
  runValidators: true // !!! IMPORTANT !!!
}) => {
  return catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, options);
    if (!doc) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
}
exports.createOne = (model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
}
exports.getOne = (model, populateOptions = undefined) => {
  return catchAsync(async (req, res, next) => {
    const doc = await model.findById(req.params.id).populate(populateOptions);

    if (!doc) return next(new AppError('No document found with that ID', 404));

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    })
  });
}
exports.getAll = (model) => {
  return CatchAsync(async (req, res, next) => {
    const docQuery = new ApiFeatures(model.find(), req.query)
      .filter()
      .sort()
      .project()
      .paginate();
    const docs = await docQuery.query;
    // const docs = await docQuery.query.explain();

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        docs
      }
    });
  });
}