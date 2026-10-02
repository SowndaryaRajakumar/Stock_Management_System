import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  unit_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  current_quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  minimum_quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  minimum_stock_level: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  stock_register_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  page_number: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'ACTIVE'
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Product;
