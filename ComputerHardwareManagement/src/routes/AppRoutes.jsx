import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import SystemRoute from './SystemRoute';
import { useSystem } from '../context/SystemContext';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/Login';
import SystemSelection from '../pages/SystemSelection';
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
import FacultyRequests from '../pages/FacultyRequests';
import Categories from '../pages/Categories';
import Units from '../pages/Units';
import StockRegisters from '../pages/StockRegisters';
import ManageIndents from '../pages/ManageIndents';
import Notifications from '../pages/Notifications';
import Faculty from '../pages/Faculty';
import Departments from '../pages/Departments';
import ElectricalIndentRegister from '../pages/ElectricalIndentRegister';

/**
 * Reusable full-suite router for either Electrical or Hardware subsystem
 */
const SubsystemSuite = ({ system }) => {
  const isElectrical = system === 'electrical';

  return (
    <SystemRoute requiredSystem={system}>
      <Routes>
        {/* Dashboard */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Hardware-Only Faculty Dedicated Catalog & Requisitions */}
        {!isElectrical && (
          <>
            <Route
              path="faculty/catalog"
              element={
                <ProtectedRoute>
                  <FacultyCatalog />
                </ProtectedRoute>
              }
            />
            <Route path="catalog" element={<Navigate to="faculty/catalog" replace />} />
            <Route path="faculty/requests" element={<Navigate to="../indents/my" replace />} />
            <Route path="faculty/dashboard" element={<Navigate to="dashboard" replace />} />

            {/* Faculty My Indents: Distinct Faculty Route */}
            <Route
              path="indents/my"
              element={
                <ProtectedRoute>
                  <FacultyRequests />
                </ProtectedRoute>
              }
            />

            {/* Create Indent: Distinct Faculty Route */}
            <Route
              path="indents/create"
              element={
                <ProtectedRoute>
                  <CreateIndent />
                </ProtectedRoute>
              }
            />

            {/* Indent Details Route */}
            <Route
              path="indents/:id"
              element={
                <ProtectedRoute>
                  <IndentDetails />
                </ProtectedRoute>
              }
            />

            {/* Admin Manage Indents: ADMIN ONLY (/hardware/indents) */}
            <Route
              path="indents"
              element={
                <RoleRoute requireAdmin={true}>
                  <ManageIndents />
                </RoleRoute>
              }
            />
            <Route path="manage-indents" element={<Navigate to="../indents" replace />} />
          </>
        )}

        {/* Electrical-Only Manual Indent Register */}
        {isElectrical && (
          <>
            <Route
              path="indents"
              element={
                <RoleRoute requireAdmin={true}>
                  <ElectricalIndentRegister />
                </RoleRoute>
              }
            />
            <Route path="indent-register" element={<Navigate to="../indents" replace />} />
            <Route path="manage-indents" element={<Navigate to="../indents" replace />} />
            {/* Guard against online requisition routes for Electrical */}
            <Route path="indents/create" element={<Navigate to="../indents" replace />} />
            <Route path="indents/my" element={<Navigate to="../indents" replace />} />
            <Route path="faculty/catalog" element={<Navigate to="../dashboard" replace />} />
            <Route path="catalog" element={<Navigate to="../dashboard" replace />} />
            <Route path="faculty/requests" element={<Navigate to="../dashboard" replace />} />
          </>
        )}

        {/* Admin Route Aliases */}
        <Route path="admin/dashboard" element={<Navigate to="dashboard" replace />} />
        <Route path="admin/products" element={<Navigate to="products" replace />} />
        <Route path="admin/indents" element={<Navigate to="../indents" replace />} />
        <Route path="admin/requests" element={<Navigate to="../indents" replace />} />
        <Route path="admin/purchases" element={<Navigate to="purchases" replace />} />
        <Route path="admin/transfers" element={<Navigate to="transfers" replace />} />
        <Route path="admin/history" element={<Navigate to="history" replace />} />
        <Route path="admin/low-stock" element={<Navigate to="low-stock" replace />} />
        <Route path="admin/analytics" element={<Navigate to="analytics" replace />} />
        <Route path="admin/reports" element={<Navigate to="reports" replace />} />
        <Route path="admin/departments" element={<Navigate to="departments" replace />} />
        <Route path="admin/faculty" element={<Navigate to="faculty" replace />} />

        {/* General Protected Routes */}
        <Route
          path="products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/:id"
          element={
            <ProtectedRoute>
              <ProductDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/:id/edit"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['ADMIN']}>
                <ProductDetails initialEdit={true} />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Master Data Routes */}
        <Route
          path="categories"
          element={
            <RoleRoute requireAdmin={true}>
              <Categories />
            </RoleRoute>
          }
        />
        <Route
          path="units"
          element={
            <RoleRoute requireAdmin={true}>
              <Units />
            </RoleRoute>
          }
        />
        <Route
          path="stock-documents"
          element={
            <RoleRoute requireAdmin={true}>
              <StockRegisters />
            </RoleRoute>
          }
        />
        <Route path="stock-registers" element={<Navigate to="stock-documents" replace />} />
        <Route
          path="departments"
          element={
            <RoleRoute requireAdmin={true}>
              <Departments />
            </RoleRoute>
          }
        />
        <Route
          path="faculty"
          element={
            <RoleRoute requireAdmin={true}>
              <Faculty />
            </RoleRoute>
          }
        />

        {/* Admin Only Movement & Stock Routes */}
        <Route
          path="purchases"
          element={
            <RoleRoute requireAdmin={true}>
              <Purchase />
            </RoleRoute>
          }
        />
        <Route path="purchase" element={<Navigate to="purchases" replace />} />
        <Route path="incoming" element={<Navigate to="purchases" replace />} />

        <Route
          path="transfers"
          element={
            <RoleRoute requireAdmin={true}>
              <Transfer />
            </RoleRoute>
          }
        />
        <Route path="transfer" element={<Navigate to="transfers" replace />} />
        <Route path="outgoing" element={<Navigate to="transfers" replace />} />

        <Route
          path="history"
          element={
            <RoleRoute requireAdmin={true}>
              <StockHistory />
            </RoleRoute>
          }
        />
        <Route
          path="low-stock"
          element={
            <RoleRoute requireAdmin={true}>
              <LowStock />
            </RoleRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <RoleRoute requireAdmin={true}>
              <Analytics />
            </RoleRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRoute requireAdmin={true}>
              <Reports />
            </RoleRoute>
          }
        />

        {/* Default subroute fallback */}
        <Route path="" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </SystemRoute>
  );
};

/**
 * Helper to dynamically redirect un-prefixed links to the active subsystem
 */
const SystemRedirect = ({ target }) => {
  const { activeSystem, isElectrical } = useSystem();
  const { isAdmin } = useAuth();
  const system = activeSystem || localStorage.getItem('stock_active_system') || 'hardware';
  
  if (target === 'indents') {
    if (system === 'electrical' || isElectrical) {
      return <Navigate to="/electrical/indents" replace />;
    }
    return isAdmin ? <Navigate to="/hardware/indents" replace /> : <Navigate to="/hardware/indents/my" replace />;
  }
  if (target === 'manage-indents') {
    return <Navigate to={`/${system}/indents`} replace />;
  }
  return <Navigate to={`/${system}/${target}`} replace />;
};

const SystemIndentDetailsRedirect = () => {
  const { id } = useParams();
  const { activeSystem } = useSystem();
  const system = activeSystem || localStorage.getItem('stock_active_system') || 'hardware';
  return <Navigate to={`/${system}/indents/${id}`} replace />;
};

const SystemProductDetailsRedirect = () => {
  const { id } = useParams();
  const { activeSystem } = useSystem();
  const system = activeSystem || localStorage.getItem('stock_active_system') || 'hardware';
  return <Navigate to={`/${system}/products/${id}`} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* System Selection Portal */}
      <Route
        path="/select-system"
        element={
          <ProtectedRoute>
            <SystemSelection />
          </ProtectedRoute>
        }
      />

      {/* Namespaced Electrical Subsystem */}
      <Route path="/electrical/*" element={<SubsystemSuite system="electrical" />} />

      {/* Namespaced Computer Hardware Subsystem */}
      <Route path="/hardware/*" element={<SubsystemSuite system="hardware" />} />

      {/* Un-prefixed Compatibility Redirects */}
      <Route path="/dashboard" element={<SystemRedirect target="dashboard" />} />
      <Route path="/products" element={<SystemRedirect target="products" />} />
      <Route path="/products/:id" element={<SystemProductDetailsRedirect />} />
      <Route path="/indents" element={<SystemRedirect target="indents" />} />
      <Route path="/indents/my" element={<SystemRedirect target="indents/my" />} />
      <Route path="/indents/create" element={<SystemRedirect target="indents/create" />} />
      <Route path="/indents/:id" element={<SystemIndentDetailsRedirect />} />
      <Route path="/purchases" element={<SystemRedirect target="purchases" />} />
      <Route path="/transfers" element={<SystemRedirect target="transfers" />} />
      <Route path="/low-stock" element={<SystemRedirect target="low-stock" />} />
      <Route path="/history" element={<SystemRedirect target="history" />} />
      <Route path="/categories" element={<SystemRedirect target="categories" />} />
      <Route path="/units" element={<SystemRedirect target="units" />} />
      <Route path="/stock-documents" element={<SystemRedirect target="stock-documents" />} />
      <Route path="/departments" element={<SystemRedirect target="departments" />} />
      <Route path="/faculty" element={<SystemRedirect target="faculty" />} />
      <Route path="/faculty/catalog" element={<SystemRedirect target="faculty/catalog" />} />
      <Route path="/manage-indents" element={<SystemRedirect target="manage-indents" />} />
      <Route path="/analytics" element={<SystemRedirect target="analytics" />} />
      <Route path="/reports" element={<SystemRedirect target="reports" />} />
      <Route path="/notifications" element={<SystemRedirect target="notifications" />} />

      {/* Root Fallback */}
      <Route path="/" element={<Navigate to="/select-system" replace />} />
      <Route path="*" element={<Navigate to="/select-system" replace />} />
    </Routes>
  );
};

export default AppRoutes;
