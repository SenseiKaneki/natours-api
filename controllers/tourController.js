const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const { deleteOne, updateOne, createOne } = require('../controllers/handlerFactory');
const { getOne, getAll } = require('./handlerFactory');
const AppError = require('../utils/appError');

  /*
exports.checkId = (req, res, next, val) => {
  const tour = tours.find((tour) => tour.id === Number(val));
  if (!tour) {
    return res.jsend.notFound('Tour not found');
  }
  res.tour = tour;
  next();
}
exports.checkBody = (req, res, next) => {
  if (!('name' in req.body) || !('price' in req.body)) {
    return res.jsend.badRequest('Body has to contain name and price');
  }
  next();
}

   */
exports.aliasTopTours = (req, res, next) => {
  // sort=-ratingsAverage,price&limit=5
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}

exports.createTour = createOne(Tour);
exports.deleteTour = deleteOne(Tour);
exports.getAllTours = getAll(Tour);
exports.getTour = getOne(Tour, { path: 'reviews' });
exports.updateTour = updateOne(Tour);
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // {
    //   $match: {
    //     ratingsAverage: { $gte: 4.5 }
    //   }
    // },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // One Big Group
        numTours: {$sum: 1 }, // 1 for each of the documents
        numRatings: {$sum: '$ratingsQuantity'},
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      }
    },
    {
      $sort: {
        avgRating: -1
      }
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' } // $ne = Not equal
    //   }
    // }
  ]);

  res.jsend.found('stats', stats);
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    { $unwind: "$startDates" },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: '$startDates',
        },
        // month: { $arrayElemAt: [monthNames, { $subtract: [{ $month: '$startDates' }, 1] }] },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
        avgRating: { $avg: '$ratingsAverage' },
        numRating: { $sum: '$ratingsQuantity' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numTours: -1,
        month: 1,
      }
    },
    {
      $limit: 12
    }
  ]);

  res.jsend.found('plan', plan);
});
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [ lat, lng ] = latlng.split(',');

  if (!lat || !lng) return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [ [lng, lat], radius ] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      docs: tours
    }
  })
});
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [ lat, lng ] = latlng.split(',');

  if (!lat || !lng) return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));

  const distances = await Tour.aggregate([
    {
      $geoNear: { // geoNear NEEDS TO BE THE FIRST STAGE when we aggregate Geospacial data | requires that one field has a geosphere index (startLocation in this API)
        // key: 'startLocation' // Not needed because we only have one geosphere index
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], // * 1 for convertion to numbers
        },
        distanceField: 'distance',
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001 // 0.001 is in km and that multiplied by 0.621371 is the miles, so 0.000621371
      }
    },
    { // We only want to see the name and distance, so we project them (_id is automatically projected)
      $project: {
        name: 1,
        distance: 1
      }
    }
  ])
  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      docs: distances,
    }
  })
})