require('dotenv').config();
const errorHandler = require('./middlewares/errorhandler');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require("helmet");
const { sanitizeMongoInput } = require("express-v5-mongo-sanitize");
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');
require('dotenv').config();
const { connectRabbitMQ, closeConnection } = require('./Config/rabbitmq');
const { limiter } = require('./middlewares/rateLimiter');

// app routes imports :__:
const authRoute = require("./routes/auth.routes")



const app = express();

// app level middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(sanitizeMongoInput);
app.use(xss());
app.use(hpp());
app.use(limiter);



// routers
app.use('/auth', authRoute);



app.use(errorHandler);
const startServer = async () => {
  try {
    const Port = Number(process.env.PORT) || 3000;

    await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
    console.log('✅ Connected to MongoDB');

    await connectRabbitMQ();

    app.listen(Port, () => {
      console.log(`✅ Server is running on Port: ${Port}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};


process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  await closeConnection();
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  await closeConnection();
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = app;
