import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  purchase_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  supplier: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  invoice_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  purchase_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  stock_register_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  page_number: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recorded_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  }
}, {
  tableName: 'purchases',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Purchase;
