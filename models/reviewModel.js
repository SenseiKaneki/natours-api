const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review cannot be blank'],
  },
  rating: {
    type: Number,
    min: [1, 'The rating must be between 1.0 and 5.0'],
    max: [5, 'The rating must be between 1.0 and 5.0'],
    required: [true, 'Review needs to contain a rating'],
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour.'],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must be posted by a user.'],
  }
},
{
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  }
});
reviewSchema.pre(/^find/, async function(next) {
  // this.populate([
  //   {
  //     path: 'author',
  //     select: 'name photo'
  //   },
  //   {
  //     path: 'tour',
  //     select: 'name'
  //   }
  // ]);
  this.populate(
      {
            path: 'author',
            select: 'name photo'
      }
    );
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId
      }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
      // ratingsAverage: Math.round(stats[0].avgRating * 10) / 10
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    })
  }
}

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.post('save', function () {
  // this points to the current review
  const ReviewModel = this.constructor
  ReviewModel.calcAverageRatings(this.tour);
});
reviewSchema.pre(/^findOneAnd/, async function(next) {
  const filter = await this.getFilter();
  this.r = await this.model.findOne(filter);

  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  if (this.r) this.model.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;