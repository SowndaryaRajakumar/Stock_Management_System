import sequelize from '../config/mysql.js';
import Role from './Role.js';
import Department from './Department.js';
import Category from './Category.js';
import Unit from './Unit.js';
import StockDocument from './StockDocument.js';
import User from './User.js';
import Product from './Product.js';
import ProductDocumentReference from './ProductDocumentReference.js';
import ProductRemark from './ProductRemark.js';
import Purchase from './Purchase.js';
import Transfer from './Transfer.js';
import StockTransaction from './StockTransaction.js';
import Indent from './Indent.js';
import IndentItem from './IndentItem.js';
import Notification from './Notification.js';
import Faculty from './Faculty.js';

// ==========================================
// RELATIONSHIPS / ASSOCIATIONS
// ==========================================

// Roles
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Departments
Department.hasMany(User, { foreignKey: 'department_id', as: 'users' });
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Department.hasMany(Transfer, { foreignKey: 'department_id', as: 'transfers' });
Transfer.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Department.hasMany(Indent, { foreignKey: 'department_id', as: 'indents' });
Indent.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Categories
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Units
Unit.hasMany(Product, { foreignKey: 'unit_id', as: 'products' });
Product.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });

// Stock Documents
StockDocument.hasMany(Product, { foreignKey: 'stock_register_id', as: 'products' });
Product.belongsTo(StockDocument, { foreignKey: 'stock_register_id', as: 'stockDocument' });

StockDocument.hasMany(ProductDocumentReference, { foreignKey: 'stock_document_id', as: 'documentReferences' });
ProductDocumentReference.belongsTo(StockDocument, { foreignKey: 'stock_document_id', as: 'stockDocument' });

// Products
Product.hasMany(ProductDocumentReference, { foreignKey: 'product_id', as: 'documentReferences' });
ProductDocumentReference.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductRemark, { foreignKey: 'product_id', as: 'remarks' });
ProductRemark.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(Purchase, { foreignKey: 'product_id', as: 'purchases' });
Purchase.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(Transfer, { foreignKey: 'product_id', as: 'transfers' });
Transfer.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(StockTransaction, { foreignKey: 'product_id', as: 'stockTransactions' });
StockTransaction.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Indents & Indent Items
Indent.hasMany(IndentItem, { foreignKey: 'indent_id', as: 'items' });
IndentItem.belongsTo(Indent, { foreignKey: 'indent_id', as: 'indent' });

Product.hasMany(IndentItem, { foreignKey: 'product_id', as: 'indentItems' });
IndentItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Users
User.hasMany(Indent, { foreignKey: 'requested_by', as: 'indents' });
Indent.belongsTo(User, { foreignKey: 'requested_by', as: 'requester' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Additional Relationships
User.hasMany(ProductRemark, { foreignKey: 'created_by', as: 'createdRemarks' });
ProductRemark.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Purchase, { foreignKey: 'recorded_by', as: 'recordedPurchases' });
Purchase.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

Purchase.belongsTo(StockDocument, { foreignKey: 'stock_register_id', as: 'stockDocument' });
StockDocument.hasMany(Purchase, { foreignKey: 'stock_register_id', as: 'purchases' });

Transfer.belongsTo(StockDocument, { foreignKey: 'stock_register_id', as: 'stockDocument' });
StockDocument.hasMany(Transfer, { foreignKey: 'stock_register_id', as: 'transfers' });

User.hasMany(Transfer, { foreignKey: 'issued_by', as: 'issuedTransfers' });
Transfer.belongsTo(User, { foreignKey: 'issued_by', as: 'issuer' });

User.hasMany(StockTransaction, { foreignKey: 'recorded_by', as: 'recordedTransactions' });
StockTransaction.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

Department.hasMany(StockTransaction, { foreignKey: 'department_id', as: 'departmentTransactions' });
StockTransaction.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Faculty
User.hasOne(Faculty, { foreignKey: 'user_id', as: 'facultyProfile' });
Faculty.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Department.hasMany(Faculty, { foreignKey: 'department_id', as: 'facultyMembers' });
Faculty.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

export {
  sequelize,
  Role,
  Department,
  Category,
  Unit,
  StockDocument,
  User,
  Faculty,
  Product,
  ProductDocumentReference,
  ProductRemark,
  Purchase,
  Transfer,
  StockTransaction,
  Indent,
  IndentItem,
  Notification
};

export default {
  sequelize,
  Role,
  Department,
  Category,
  Unit,
  StockDocument,
  User,
  Faculty,
  Product,
  ProductDocumentReference,
  ProductRemark,
  Purchase,
  Transfer,
  StockTransaction,
  Indent,
  IndentItem,
  Notification
};
