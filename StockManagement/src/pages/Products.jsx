import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProductTable from '../components/products/ProductTable';
import AddProductModal from '../components/products/AddProductModal';
import EditProductModal from '../components/products/EditProductModal';
import SearchBar from '../components/common/SearchBar';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';
import { productApi, masterDataApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Products = () => {
  const { isAdmin, isFaculty } = useAuth();

  // If Faculty attempts to access Admin Products page, redirect to Faculty Catalog
  if (isFaculty && !isAdmin) {
    return <Navigate to="/faculty/catalog" replace />;
  }

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRegister, setSelectedRegister] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Fetch dynamic categories and register documents from MongoDB
  useEffect(() => {
    const loadMasterFilters = async () => {
      try {
        const [catRes, docRes] = await Promise.all([
          masterDataApi.getCategories(),
          masterDataApi.getStockDocuments()
        ]);
        if (catRes?.success && catRes.categories?.length > 0) {
          setCategories(catRes.categories.map(c => c.name));
        }
        if (docRes?.success && docRes.documents?.length > 0) {
          setRegisters(docRes.documents.map(d => d.name));
        }
      } catch (err) {
        console.error('Failed to load master filters:', err);
      }
    };
    loadMasterFilters();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedRegister !== 'ALL') params.register = selectedRegister;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      const res = await productApi.getProducts(params);
      if (res.success) {
        setProducts(res.products || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.products?.length || 0));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedRegister, selectedStatus, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedRegister, selectedStatus]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchProducts]);

  const handleProductCreated = (newProd) => {
    fetchProducts();
    setFeedback({
      type: 'success',
      message: `Product "${newProd.productName || newProd.name}" (${newProd.productCode}) created successfully.`
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleProductUpdated = (updatedProd) => {
    fetchProducts();
    setFeedback({
      type: 'success',
      message: `Product "${updatedProd.productName || updatedProd.name}" updated successfully.`
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete product "${product.productName || product.name}" (${product.productCode})?`
    );
    if (!confirmed) return;

    try {
      const res = await productApi.deleteProduct(product._id || product.id);
      if (res.success) {
        setFeedback({
          type: res.deactivated ? 'info' : 'success',
          message: res.message || (res.deactivated ? 'Product deactivated to protect historical records.' : 'Product deleted successfully.')
        });
        fetchProducts();
        setTimeout(() => setFeedback(null), 6000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete product.';
      setFeedback({ type: 'error', message: msg });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <Layout
      title="Product Inventory Management"
      breadcrumb="Central Store / Live Products Management"
    >
      {feedback && (
        <div
          className={feedback.type === 'success' ? 'success-box' : 'alert-box'}
          style={{ marginBottom: '16px' }}
        >
          {feedback.type === 'success' ? '✓ ' : '⚠ '}
          {feedback.message}
        </div>
      )}

      <div className="toolbar">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products by code, name, category..."
          />

          <select
            value={selectedRegister}
            onChange={(e) => setSelectedRegister(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              background: 'var(--white)',
              fontSize: '0.85rem'
            }}
            aria-label="Stock Register Filter"
          >
            <option value="ALL">All Registers</option>
            {registers.map((reg) => (
              <option key={reg} value={reg}>
                {reg} Register
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              background: 'var(--white)',
              fontSize: '0.85rem'
            }}
            aria-label="Category Filter"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              background: 'var(--white)',
              fontSize: '0.85rem'
            }}
            aria-label="Status Filter"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            icon="＋"
          >
            Add Product
          </Button>
        )}
      </div>

      <div className="card">
        {loading && products.length === 0 ? (
          <Loading message="Loading inventory items..." />
        ) : (
          <>
            <ProductTable
              products={products}
              onEdit={handleEditClick}
              onDelete={handleDeleteProduct}
            />
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {/* Add Product Modal (Admin only) */}
      {isAdmin && (
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProductCreated={handleProductCreated}
        />
      )}

      {/* Edit Product Modal (Admin only) */}
      {isAdmin && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={editingProduct}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </Layout>
  );
};

export default Products;
