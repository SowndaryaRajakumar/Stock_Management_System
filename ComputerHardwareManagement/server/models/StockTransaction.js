import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';

const StockTransaction = sequelize.define('StockTransaction', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  transaction_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  previous_quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  new_quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  reference_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  transaction_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  recorded_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  }
}, {
  tableName: 'stock_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default StockTransaction;
