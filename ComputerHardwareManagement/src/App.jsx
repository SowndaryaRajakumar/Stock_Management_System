import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { StockProvider } from './context/StockContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';

export function App() {
  return (
    <AuthProvider>
      <SystemProvider>
        <NotificationProvider>
          <StockProvider>
            <AppRoutes />
          </StockProvider>
        </NotificationProvider>
      </SystemProvider>
    </AuthProvider>
  );
}

export default App;
