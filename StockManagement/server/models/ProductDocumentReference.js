import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';

const ProductDocumentReference = sequelize.define('ProductDocumentReference', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  stock_document_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  stock_document_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  page_number: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  reference_note: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'product_document_references',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default ProductDocumentReference;
