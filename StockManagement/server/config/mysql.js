import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'consumable_stock_management';
const dbUser = process.env.DB_USER || process.env.MYSQL_USER || 'root';
const dbPass = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.MYSQL_PASSWORD || '');
const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
const dbPort = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: true,
    timestamps: true
  }
});

export default sequelize;