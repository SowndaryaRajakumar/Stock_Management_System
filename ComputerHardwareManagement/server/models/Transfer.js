import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';

const Transfer = sequelize.define('Transfer', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  transfer_number: {
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
  department_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  issued_to: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  issued_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  purpose: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  transfer_date: {
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
  }
}, {
  tableName: 'transfers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Transfer;
