import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import Purchase from '../pages/Purchase';
import Transfer from '../pages/Transfer';
import Indents from '../pages/Indents';
import CreateIndent from '../pages/CreateIndent';
import IndentDetails from '../pages/IndentDetails';
import StockHistory from '../pages/StockHistory';
import LowStock from '../pages/LowStock';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';
import FacultyCatalog from '../pages/FacultyCatalog';
import Categories from '../pages/Categories';
import Units from '../pages/Units';
import StockRegisters from '../pages/StockRegisters';
import ManageIndents from '../pages/ManageIndents';
import Notifications from '../pages/Notifications';
import Faculty from '../pages/Faculty';
import Departments from '../pages/Departments';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Faculty Dedicated Routes */}
      <Route path="/catalog" element={<Navigate to="/faculty/catalog" replace />} />
      <Route
        path="/faculty/catalog"
        element={
          <ProtectedRoute>
            <FacultyCatalog />
          </ProtectedRoute>
        }
      />
      <Route path="/faculty/requests" element={<Navigate to="/indents" replace />} />
      <Route path="/faculty/dashboard" element={<Navigate to="/dashboard" replace />} />

      {/* Admin Route Aliases */}
      <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/admin/products" element={<Navigate to="/products" replace />} />
      <Route path="/admin/indents" element={<Navigate to="/manage-indents" replace />} />
      <Route path="/admin/requests" element={<Navigate to="/manage-indents" replace />} />
      <Route path="/admin/purchases" element={<Navigate to="/purchases" replace />} />
      <Route path="/admin/transfers" element={<Navigate to="/transfers" replace />} />
      <Route path="/admin/history" element={<Navigate to="/history" replace />} />
      <Route path="/admin/low-stock" element={<Navigate to="/low-stock" replace />} />
      <Route path="/admin/analytics" element={<Navigate to="/analytics" replace />} />
      <Route path="/admin/reports" element={<Navigate to="/reports" replace />} />
      <Route path="/admin/departments" element={<Navigate to="/departments" replace />} />

      {/* General Protected Routes (Admin & Faculty) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <ProductDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id/edit"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMIN']}>
              <ProductDetails initialEdit={true} />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/indents"
        element={
          <ProtectedRoute>
            <Indents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/indents/create"
        element={
          <ProtectedRoute>
            <CreateIndent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/indents/:id"
        element={
          <ProtectedRoute>
            <IndentDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Admin Only Master Data Routes */}
      <Route
        path="/categories"
        element={
          <RoleRoute requireAdmin={true}>
            <Categories />
          </RoleRoute>
        }
      />
      <Route
        path="/units"
        element={
          <RoleRoute requireAdmin={true}>
            <Units />
          </RoleRoute>
        }
      />
      <Route
        path="/stock-documents"
        element={
          <RoleRoute requireAdmin={true}>
            <StockRegisters />
          </RoleRoute>
        }
      />
      <Route
        path="/stock-registers"
        element={<Navigate to="/stock-documents" replace />}
      />
      <Route
        path="/departments"
        element={
          <RoleRoute requireAdmin={true}>
            <Departments />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={<Navigate to="/departments" replace />}
      />
      <Route
        path="/faculty"
        element={
          <RoleRoute requireAdmin={true}>
            <Faculty />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/faculty"
        element={<Navigate to="/faculty" replace />}
      />
      <Route
        path="/manage-indents"
        element={
          <RoleRoute requireAdmin={true}>
            <ManageIndents />
          </RoleRoute>
        }
      />

      {/* Admin Only Movement & Stock Routes */}
      <Route
        path="/purchases"
        element={
          <RoleRoute requireAdmin={true}>
            <Purchase />
          </RoleRoute>
        }
      />
      <Route
        path="/purchase"
        element={<Navigate to="/purchases" replace />}
      />
      <Route
        path="/incoming"
        element={<Navigate to="/purchases" replace />}
      />

      <Route
        path="/transfers"
        element={
          <RoleRoute requireAdmin={true}>
            <Transfer />
          </RoleRoute>
        }
      />
      <Route
        path="/transfer"
        element={<Navigate to="/transfers" replace />}
      />
      <Route
        path="/outgoing"
        element={<Navigate to="/transfers" replace />}
      />

      <Route
        path="/history"
        element={
          <RoleRoute requireAdmin={true}>
            <StockHistory />
          </RoleRoute>
        }
      />

      <Route
        path="/low-stock"
        element={
          <RoleRoute requireAdmin={true}>
            <LowStock />
          </RoleRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <RoleRoute requireAdmin={true}>
            <Analytics />
          </RoleRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <RoleRoute requireAdmin={true}>
            <Reports />
          </RoleRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
