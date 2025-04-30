require('dotenv').config({ path: `${__dirname}/../../config.env` });
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true
  })
  .then(() => console.log('Connected to MongoDB'));

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
tours.forEach(tour => {
  tour = {...tour, _id: tour._id, id: tour.id}
  tour.locations = tour.locations.map(loc => loc = { ...loc, _id: new mongoose.Types.ObjectId(loc._id) });
})
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
users.forEach(user => {
  user = {...user, _id: user._id, id: user.id}
})
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
reviews.forEach(review => {
  review = {...review, _id: review._id, id: review.id}
})

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await User.create(users, {
      validateBeforeSave: false,
    });
    await Tour.create(tours);
    await Review.create(reviews);
    console.log('Tours, Reviews and Users created');
    process.exit()
  } catch (e) {
    console.error(e);
  }
}

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Tours, Reviews and Users deleted');
    process.exit()
  } catch (e) {
    console.error(e);
  }
}

if(process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}