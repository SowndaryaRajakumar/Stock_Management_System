import sequelize from './mysql.js';

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ MySQL Database Connected: ${process.env.MYSQL_DATABASE || 'consumable_stock_management'} at ${process.env.MYSQL_HOST || '127.0.0.1'}:${process.env.MYSQL_PORT || 3306}`);
  } catch (error) {
    console.error(`❌ MySQL Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
