import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { Role, Department, Category, Unit, StockDocument, User, Product, sequelize } from '../models/index.js';

dotenv.config();

/**
 * Non-destructive seed check for MySQL database.
 * The consumable_stock_management database already contains initial data from consumable_stock_management.sql.
 */
const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Verifying existing MySQL seed data...');

    const [roleCount, userCount, productCount, deptCount] = await Promise.all([
      Role.count(),
      User.count(),
      Product.count(),
      Department.count()
    ]);

    console.log(`Current MySQL Records:
- Roles: ${roleCount}
- Users: ${userCount}
- Products: ${productCount}
- Departments: ${deptCount}
`);

    if (userCount > 0 && productCount > 0) {
      console.log('✅ MySQL database already contains required seed data. Preserving all records.');
    } else {
      console.log('ℹ️ Database is empty. Please import consumable_stock_management.sql via phpMyAdmin or mysql client.');
    }
  } catch (error) {
    console.error('Error verifying MySQL seed data:', error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
