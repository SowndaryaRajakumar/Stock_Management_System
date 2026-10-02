import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';

const StockDocument = sequelize.define('StockDocument', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  document_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  document_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'stock_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default StockDocument;
