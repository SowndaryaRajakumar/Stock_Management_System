import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';

const Indent = sequelize.define('Indent', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  indent_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  department_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  requested_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'SUBMITTED'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'indents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Indent;
