import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  updateUnitStatus,
  deleteUnit,
  getStockDocuments,
  getStockDocumentById,
  createStockDocument,
  updateStockDocument,
  updateStockDocumentStatus,
  deleteStockDocument
} from '../controllers/masterDataController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

export const departmentRouter = express.Router();
departmentRouter.get('/', protect, getDepartments);
departmentRouter.get('/:id', protect, getDepartmentById);
departmentRouter.post('/', protect, requireAdmin, createDepartment);
departmentRouter.put('/:id', protect, requireAdmin, updateDepartment);
departmentRouter.patch('/:id/status', protect, requireAdmin, updateDepartmentStatus);
departmentRouter.delete('/:id', protect, requireAdmin, deleteDepartment);

export const categoryRouter = express.Router();
categoryRouter.get('/', protect, getCategories);
categoryRouter.get('/:id', protect, getCategoryById);
categoryRouter.post('/', protect, requireAdmin, createCategory);
categoryRouter.put('/:id', protect, requireAdmin, updateCategory);
categoryRouter.patch('/:id/status', protect, requireAdmin, updateCategoryStatus);
categoryRouter.delete('/:id', protect, requireAdmin, deleteCategory);

export const unitRouter = express.Router();
unitRouter.get('/', protect, getUnits);
unitRouter.get('/:id', protect, getUnitById);
unitRouter.post('/', protect, requireAdmin, createUnit);
unitRouter.put('/:id', protect, requireAdmin, updateUnit);
unitRouter.patch('/:id/status', protect, requireAdmin, updateUnitStatus);
unitRouter.delete('/:id', protect, requireAdmin, deleteUnit);

export const stockDocumentRouter = express.Router();
stockDocumentRouter.get('/', protect, getStockDocuments);
stockDocumentRouter.get('/:id', protect, getStockDocumentById);
stockDocumentRouter.post('/', protect, requireAdmin, createStockDocument);
stockDocumentRouter.put('/:id', protect, requireAdmin, updateStockDocument);
stockDocumentRouter.patch('/:id/status', protect, requireAdmin, updateStockDocumentStatus);
stockDocumentRouter.delete('/:id', protect, requireAdmin, deleteStockDocument);

export default {
  departmentRouter,
  categoryRouter,
  unitRouter,
  stockDocumentRouter
};
