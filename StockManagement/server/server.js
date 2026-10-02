import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

dotenv.config();

// Connect MySQL Database
await connectDB();

const PORT = process.env.PORT || 5050;

const server = app.listen(PORT, () => {
  console.log(`📦 Consumable Stock Management Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

export default server;
