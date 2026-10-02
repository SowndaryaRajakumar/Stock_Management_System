import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { StockProvider } from './context/StockContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <StockProvider>
          <AppRoutes />
        </StockProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
