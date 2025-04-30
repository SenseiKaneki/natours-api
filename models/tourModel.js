const mongoose = require('mongoose')
const { Schema } = require('mongoose');
const slugify = require('slugify');
const validator = require('validator')
// const UserModel = require('./userModel');
const AppError = require('../utils/appError');

const tourSchema = new Schema({
  name: {
    type: String,
    unique: true,
    trim: true,
    // Validators
    required: [true, 'A tour must have a name'],
    maxlength: [40, 'A tour name must have less or equal than 40 characters'],
    minlength: [10, 'A tour name must have more or equal than 10 characters'],
    // Custom Validator
    validate: [(val) => validator.isAlpha(val, 'en-GB', { ignore: " " }), 'A name can only include characters']
  },
  summary: {
    type: String,
    trim: true, // Removes whitespace in the beginning and end of the string
    required: [true, 'A tour must have a summary'],
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now,
    select: false,
  },
  startDates: [Date],
  startLocation: {
    // GeoJSON
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
    description: String,
  },
  description: {
    type: String,
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a Group Size'],
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        // this only points to current doc on NEW document creation
        return val < this.price;
      },
      message: 'The price discount ({VALUE}) has to be less than the price'
    }
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    enum: { // enum only for strings
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, medium, difficult',
    }
  },
  ratingsAverage: {
    type: Number,
    default: 0,
    min: [0, "Rating must be above 0.0."],
    max: [5, "Rating must be under 5.0"], // min and max also works for dates
    set: val => Math.round(val * 10) / 10, // Automatically rounds the average to e.g. 4.7 and not 4.66666666
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  slug: String,
  secretTour: {
    type: Boolean,
    default: false
  },
  locations: [
    {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      description: String,
      address: String,
      coordinates: [Number],
      day: Number,
    }
  ],
  // guides: Array
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
}, {
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  }
});

// Indexing makes it easier for MongoDB to find the data
// e.g. there are 9 tours, and we want a price lower than 1000, the results are 3 tours. With indexing, MongoDB only examines these 3, without all 9
// Set indexes for fields that are much searched and not for everyone, because each key is using resources
tourSchema.index({ price: 1, ratingsAverage: -1 }); // To index it to improve query performance |-1 is the descending order and 1 the ascending order
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: RUNS BEFORE .save() AND .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true })
  next();
})
// tourSchema.pre('save', async function (next) {
  // Embedding
  // const guidesPromises = this.guides.map(async id => await UserModel.findById(id));
  // const guides = await Promise.all(guidesPromises);
  // if (guides.includes(null)) next(new AppError('Invalid Guide ID', 400))
  // this.guides = guides;
//   next();
// })

// DOCUMENT MIDDLEWARE: RUNS AFTER .save() AND .create()
// tourSchema.post('save', function (doc, next) {
//   console.log(doc)
//   next();
// })

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) { // "/^find/" means all the strings (here methods) that contain find
  this.find({ secretTour: { $ne: true } })

  // this.start = Date.now(); // Somehow breaks the result of the query
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
})
// tourSchema.pre(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start}ms`)
//   console.log(docs);
//   next();
// });

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  if (this.pipeline().length > 0 && this.pipeline()[0]['$geoNear']) {
    return next(); // If $geoNear is already the first stage, do nothing
  }

  this.pipeline().unshift( { $match: { secretTour: { $ne: true } } } );
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;