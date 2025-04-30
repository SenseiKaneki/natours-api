// Sync Process Exception Handling
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);

  process.exit(1);
});

require('dotenv').config({ path: `${__dirname}/config.env` });
console.log('config connection');
const app = require(`./app.js`);
console.log('app connection');
const mongoose = require('mongoose');
console.log('MongoDB connection');

// console.log(app.get('env')); // Find out in which environment you are

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,

  })
  .then(() => console.log('Connected to MongoDB'));

mongoose.connection.on('connecting', () => {
  console.log('Connecting to MongoDB...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});


// Server Config
const port = Number(process.env.PORT) || 8000;
// const hostname = '0.0.0.0';
const hostname = '127.0.0.1';

// Server Start
const server = app.listen(port, hostname, () => {
  console.log(`Listening on ${hostname}:${port}`);
});

// Async Process Exception Handling
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);

  server.close(() => {
    process.exit(1);
  });
});

// console.log(x)