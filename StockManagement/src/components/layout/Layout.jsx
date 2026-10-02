import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ErrorBoundary from "../common/ErrorBoundary";

export const Layout = ({ children, title = "Dashboard", breadcrumb = "Overview" }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="main-col">
        <Topbar
          title={title}
          breadcrumb={breadcrumb}
          onToggleMobile={() => setMobileMenuOpen(prev => !prev)}
        />
        <main className="content">
          <div className="main-container">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <div className="footer-note">
              Consumable Stock Management System · Central Store Record Maintenance
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
