import express from 'express';
import {
  getProducts,
  getProductById,
  getProductDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReferences,
  addProductReference,
  updateProductReference,
  deleteProductReference,
  getProductRemarks,
  addProductRemark
} from '../controllers/productController.js';
import { protect, requireAdmin, requireStaffOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Products CRUD
router.get('/', protect, getProducts);
router.post('/', protect, requireAdmin, createProduct);

router.get('/:id', protect, getProductById);
router.get('/:id/details', protect, getProductDetails);
router.put('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

// References
router.get('/:id/references', protect, getProductReferences);
router.post('/:id/references', protect, requireAdmin, addProductReference);
router.put('/:id/references/:referenceId', protect, requireAdmin, updateProductReference);
router.delete('/:id/references/:referenceId', protect, requireAdmin, deleteProductReference);

// Remarks
router.get('/:id/remarks', protect, getProductRemarks);
router.post('/:id/remarks', protect, requireStaffOrAdmin, addProductRemark);

export default router;
