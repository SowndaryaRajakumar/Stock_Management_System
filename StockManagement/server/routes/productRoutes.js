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
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Products CRUD (Admin only on Electrical backend)
router.get('/', protect, requireAdmin, getProducts);
router.post('/', protect, requireAdmin, createProduct);

router.get('/:id', protect, requireAdmin, getProductById);
router.get('/:id/details', protect, requireAdmin, getProductDetails);
router.put('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

// References (Admin only)
router.get('/:id/references', protect, requireAdmin, getProductReferences);
router.post('/:id/references', protect, requireAdmin, addProductReference);
router.put('/:id/references/:referenceId', protect, requireAdmin, updateProductReference);
router.delete('/:id/references/:referenceId', protect, requireAdmin, deleteProductReference);

// Remarks (Admin only)
router.get('/:id/remarks', protect, requireAdmin, getProductRemarks);
router.post('/:id/remarks', protect, requireAdmin, addProductRemark);

export default router;
