import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

out_dir = "/Users/ani/Desktop/EL/consumables/scratch/diagrams"
os.makedirs(out_dir, exist_ok=True)

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9

def make_folder_tree_diagram(filename, title, tree_lines, width=12, height=7):
    fig, ax = plt.subplots(figsize=(width, height), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Card background
    rect = patches.FancyBboxPatch((4, 4), 92, 92, boxstyle="round,pad=0.5", 
                                  facecolor='#1E293B', edgecolor='#334155', linewidth=1.5)
    ax.add_patch(rect)

    # Title header
    ax.text(8, 90, title, color='#38BDF8', fontsize=11, fontweight='bold')
    ax.plot([8, 92], [86, 86], color='#475569', linewidth=1)

    # Tree lines
    start_y = 80
    line_gap = (74) / max(len(tree_lines), 1)
    for i, line in enumerate(tree_lines):
        y = start_y - (i * line_gap)
        color = '#F8FAFC'
        weight = 'normal'
        if line.strip().endswith('/') or '├──' in line and ('.' not in line or line.strip().endswith('.js') is False and line.strip().endswith('.jsx') is False):
            color = '#38BDF8'
            weight = 'bold'
        elif line.strip().endswith('.js') or line.strip().endswith('.jsx'):
            color = '#A5F3FC'
        elif line.strip().endswith('.sql') or line.strip().endswith('.json'):
            color = '#FCD34D'
        elif line.strip().endswith('.css'):
            color = '#F472B6'

        ax.text(8, y, line, color=color, fontsize=8.5, fontfamily='monospace', fontweight=weight, va='center')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, filename), dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated {filename}")

# Generate Folder Trees
make_folder_tree_diagram(
    "fig_8_2_highlevel_view.png",
    "Highlevel Project Architecture Tree",
    [
        "Stock_Management_System/",
        "├── StockManagement/                 # Electrical Consumables Subsystem",
        "│   ├── server/                     # Express REST Backend (Port 5050)",
        "│   │   ├── config/                 # MySQL Database & Pool Connection",
        "│   │   ├── controllers/            # Stock & Indent Business Controllers",
        "│   │   ├── middleware/             # JWT Verification & Role Isolation",
        "│   │   ├── models/                 # Sequelize Entity Models",
        "│   │   ├── routes/                 # Express API Endpoint Routes",
        "│   │   └── services/               # Stock & Indent Fulfillment Logic",
        "│   └── consumable_stock_management.sql # Database Schema Definition",
        "├── ComputerHardwareManagement/     # Computer Hardware Subsystem",
        "│   ├── server/                     # Hardware Express Backend (Port 5051)",
        "│   └── src/                        # Unified React 18 SPA Frontend",
        "│       ├── components/             # Reusable UI & Modal Dialogs",
        "│       ├── context/                # Global State (Auth, System, Stock)",
        "│       ├── pages/                  # Subsystem View Pages",
        "│       └── routes/                 # RoleRoute & SystemRoute Guards",
        "└── package.json                    # Concurrently Launcher Config"
    ],
    width=13, height=8.5
)

make_folder_tree_diagram(
    "fig_8_3_backend_folder.png",
    "Backend Folder Structure (StockManagement & ComputerHardwareManagement)",
    [
        "server/",
        "├── config/",
        "│   └── db.js                       # mysql2 Connection Pool & Health Check",
        "├── controllers/",
        "│   ├── authController.js           # User Login & JWT Token Dispatch",
        "│   ├── productController.js        # Product Catalog & Register Linkage",
        "│   ├── purchaseController.js       # Incoming Stock (Purchase Inward)",
        "│   ├── transferController.js       # Outgoing Stock (Department Transfer)",
        "│   ├── indentController.js         # Faculty Requisition & Approval Engine",
        "│   ├── masterDataController.js     # Departments, Categories, Units, Registers",
        "│   ├── analyticsController.js      # Executive KPI Metrics & Aggregations",
        "│   └── stockHistoryController.js   # Immutable Stock Ledger Queries",
        "├── middleware/",
        "│   ├── auth.js                     # Token Extraction & Admin Route Guard",
        "│   └── errorHandler.js             # Centralized HTTP Error Handling",
        "├── models/                         # Sequelize Persistence Models",
        "├── routes/                         # REST API Route Declarations",
        "├── services/                       # Stock Calculation & Audit Services",
        "├── app.js                          # Express App & Subsystem Normalization",
        "└── server.js                       # HTTP Server Listen & Bootstrap"
    ],
    width=13, height=8.5
)

make_folder_tree_diagram(
    "fig_8_4_config_folder.png",
    "Backend config/ Folder Structure",
    [
        "server/config/",
        "├── db.js                           # mysql2 Connection Pool Configuration",
        "│   ├── host: process.env.DB_HOST",
        "│   ├── user: process.env.DB_USER",
        "│   ├── password: process.env.DB_PASSWORD",
        "│   ├── database: consumable_stock_management / hardware_stock_management",
        "│   ├── waitForConnections: true",
        "│   ├── connectionLimit: 10",
        "│   └── queueLimit: 0",
        "└── .env                            # Environment Secrets & Port Configuration"
    ],
    width=11, height=6
)

make_folder_tree_diagram(
    "fig_8_5_controller_folder.png",
    "Backend controllers/ Folder Structure",
    [
        "server/controllers/",
        "├── analyticsController.js          # getDashboardStats(), getAnalyticsOverview()",
        "├── authController.js               # loginUser(), getMe(), getUsers()",
        "├── facultyController.js            # getFacultyList(), createFaculty(), updateFaculty()",
        "├── indentController.js             # createIndent(), approveIndent(), issueIndent()",
        "├── masterDataController.js         # CRUD for Departments, Categories, Units, Registers",
        "├── notificationController.js       # getNotifications(), markNotificationRead()",
        "├── productController.js            # getProducts(), createProduct(), getProductDetails()",
        "├── purchaseController.js           # recordPurchase(), getPurchases()",
        "├── reportController.js             # getReportData(), streamExcelReport(), streamPDFReport()",
        "├── stockController.js              # handleIncomingStock(), handleOutgoingStock()",
        "├── stockHistoryController.js       # getStockHistory(), getTransactionsLedger()",
        "└── transferController.js           # issueTransfer(), getTransfers()"
    ],
    width=13, height=7.5
)

make_folder_tree_diagram(
    "fig_8_6_middleware_folder.png",
    "Backend middleware/ Folder Structure",
    [
        "server/middleware/",
        "├── auth.js                         # JWT Verification (verifyToken) & requireAdmin",
        "├── authenticateToken.js            # Alternative Bearer Token Extraction",
        "└── errorHandler.js                 # Global Exception & Validation Handler"
    ],
    width=11, height=5
)

make_folder_tree_diagram(
    "fig_8_7_model_service_folder.png",
    "Backend models/ and services/ Folder Structure",
    [
        "server/models/ & server/services/",
        "├── models/",
        "│   ├── Category.js                 # Item Category Domain Model",
        "│   ├── Department.js               # Academic Department Model",
        "│   ├── Indent.js                   # Indent Header Model",
        "│   ├── IndentItem.js               # Multi-Item Indent Entity",
        "│   ├── Notification.js             # In-App User Alert Model",
        "│   ├── Product.js                  # Inventory Product & Stock Model",
        "│   ├── Role.js                     # System Role (Admin / Faculty)",
        "│   ├── StockDocument.js            # Physical Stock Register Document",
        "│   ├── StockTransaction.js         # Immutable Transaction Ledger",
        "│   ├── Unit.js                     # Measurement Unit Model",
        "│   └── User.js                     # User Credentials & Role Mapping",
        "└── services/",
        "    ├── indentService.js            # Indent Workflow & Fulfillment Logic",
        "    └── stockService.js             # Atomic Inward/Outward Inventory Engine"
    ],
    width=13, height=8.5
)

make_folder_tree_diagram(
    "fig_8_8_frontend_folder.png",
    "Frontend Root Folder Structure (React 18 + Vite)",
    [
        "ComputerHardwareManagement/",
        "├── index.html                      # Single Page Application Entrypoint",
        "├── vite.config.js                  # Vite Dev Server & Build Bundler",
        "├── package.json                    # Frontend Dependencies & Scripts",
        "├── css/                            # Global Theme Styles",
        "└── src/                            # Application Source Code",
        "    ├── assets/                     # Static Brand Icons & Media",
        "    ├── components/                 # Modular React UI Components",
        "    ├── context/                    # React Context State Providers",
        "    ├── data/                       # Mock Data & Static Seed Catalogs",
        "    ├── pages/                      # Application Route Pages",
        "    ├── routes/                     # React Router 6 Configuration",
        "    ├── services/                   # Axios API Clients & Export Utilities",
        "    ├── test/                       # Vitest Integration Test Suites",
        "    ├── App.jsx                     # Root Component & Layout Wrapper",
        "    ├── main.jsx                    # DOM Bootstrap & Context Tree",
        "    └── index.css                   # Global Tailwind CSS Tokens"
    ],
    width=13, height=8.5
)

make_folder_tree_diagram(
    "fig_8_9_frontend_src.png",
    "Frontend src/ Organization Structure",
    [
        "src/",
        "├── components/                     # UI Building Blocks (Layout, Common, Modals)",
        "├── context/                        # Global State (Auth, System, Stock, Notifications)",
        "├── data/                           # Fallback Mock Data & Default References",
        "├── pages/                          # View Components for Electrical & Hardware",
        "├── routes/                         # AppRoutes, RoleRoute, SystemRoute, ProtectedRoute",
        "├── services/                       # api.js (Axios Client) & exportService.js",
        "├── test/                           # 8 Comprehensive Vitest Test Suites",
        "├── App.jsx                         # Main Routing Container",
        "├── index.css                       # Styling Rules & CSS Variables",
        "└── main.jsx                        # React 18 createRoot Entrypoint"
    ],
    width=12, height=6.5
)

make_folder_tree_diagram(
    "fig_8_10_pages_folder.png",
    "Frontend src/pages/ Directory Structure",
    [
        "src/pages/",
        "├── Analytics.jsx                   # Departmental Stock Analytics & Charts",
        "├── Categories.jsx                  # Material Categories Master Directory",
        "├── CreateIndent.jsx                # Faculty Hardware Requisition Form",
        "├── Dashboard.jsx                   # Executive KPI Overview & Recent Activity",
        "├── Departments.jsx                 # Academic Departments Master Manager",
        "├── ElectricalIndentRegister.jsx    # Electrical Indent Slip View",
        "├── Faculty.jsx                     # Faculty Account Management Directory",
        "├── FacultyCatalog.jsx              # Faculty Read-Only Hardware Catalog",
        "├── FacultyRequests.jsx             # Faculty My Indents Status Tracker",
        "├── IncomingStock.jsx               # Purchase & Inward Material Entry",
        "├── IndentDetails.jsx               # Deep View of Indent Header & Items",
        "├── Indents.jsx                     # Requisition Management Register",
        "├── Login.jsx                       # User Authentication Form",
        "├── LowStock.jsx                    # Deficit Items & Replenishment Queue",
        "├── ManageIndents.jsx               # Admin Review, Approval & Issuance",
        "├── Notifications.jsx               # System Alerts & Notification Center",
        "├── OutgoingStock.jsx               # Department Issuance & Gate Outward",
        "├── ProductDetails.jsx              # Product Profile, References & Remarks",
        "├── Products.jsx                    # Admin Comprehensive Inventory Catalog",
        "├── Purchase.jsx                    # Inward Goods Procurement Form",
        "├── Reports.jsx                     # Report Generator with Excel/PDF Export",
        "├── StockHistory.jsx                # Reactive Immutable Transaction Ledger",
        "├── StockRegisters.jsx              # Physical Stock Document Registers",
        "├── SystemSelection.jsx             # Dual Subsystem Selection Portal",
        "├── Transfer.jsx                    # Outward Stock Transfer Issuance Form",
        "└── Units.jsx                       # Measurement Units Master Manager"
    ],
    width=14, height=11
)

make_folder_tree_diagram(
    "fig_8_11_routes_api.png",
    "Frontend src/routes/ and src/services/ Structure",
    [
        "src/routes/ & src/services/",
        "├── routes/",
        "│   ├── AppRoutes.jsx               # Complete React Router 6 URL Mapping",
        "│   ├── ProtectedRoute.jsx          # JWT Authentication Enforcer",
        "│   ├── RoleRoute.jsx               # Admin vs Faculty Role Guard",
        "│   └── SystemRoute.jsx             # Subsystem Context Guard",
        "└── services/",
        "    ├── api.js                      # Axios Client with Subsystem Port Base URLs",
        "    │   ├── electricalClient (Port 5050)",
        "    │   ├── hardwareClient (Port 5051)",
        "    │   └── JWT Bearer Token Interceptor",
        "    └── exportService.js            # Client-Side CSV, Excel & PDF Formatters"
    ],
    width=13, height=7.5
)

make_folder_tree_diagram(
    "fig_8_12_components.png",
    "Frontend src/components/ Directory Structure",
    [
        "src/components/",
        "├── common/                         # Button, Modal, Table, Badge, Form Controls",
        "├── dashboard/                      # StatCard, TrendChart, LowStockSummary",
        "├── indents/                        # IndentItemRow, StatusTimeline, PhysicalSlip",
        "├── layout/                         # Topbar (System Switcher), Sidebar, Breadcrumb",
        "├── products/                       # ProductForm, DocumentRefModal, RemarkList",
        "└── stock/                          # InwardForm, OutwardTransferModal, LedgerTable"
    ],
    width=12, height=6.5
)

# Flow Diagrams
def make_request_flow_diagram():
    fig, ax = plt.subplots(figsize=(15, 8), dpi=300)
    ax.set_xlim(0, 150)
    ax.set_ylim(0, 80)
    ax.axis('off')

    ax.text(75, 74, "Overall Request Flow of the Stock Management System", 
            fontsize=14, fontweight='bold', ha='center', color='#1A365D')

    steps = [
        (10, 30, 24, 25, "1. Client Browser\n(React 18 + Vite)\n- Axios HTTP Client\n- JWT in AuthContext\n- Role/System Guard", "#EBF8FF", "#3182CE"),
        (42, 30, 26, 25, "2. Express Gateway\n- CORS Whitelist\n- Subsystem Normalizer\n- verifyToken Middleware\n- requireAdmin Check", "#FEFCBF", "#D69E2E"),
        (76, 30, 28, 25, "3. Controller & Service\n- Input Validation\n- stockService Logic\n- indentService Workflow\n- Audit Trail Commit", "#C6F6D5", "#38A169"),
        (112, 30, 28, 25, "4. Database Engine\n(MySQL 8.0 InnoDB)\n- Connection Pooling\n- ACID Transactions\n- Foreign Key Integrity", "#EDF2F7", "#4A5568")
    ]

    for x, y, w, h, text, bg, border in steps:
        r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4", 
                                   facecolor=bg, edgecolor=border, lw=1.5)
        ax.add_patch(r)
        ax.text(x+w/2, y+h/2, text, ha='center', va='center', fontsize=8, color='#1A202C', fontweight='bold')

    # Arrows
    ax.annotate("", xy=(42, 42.5), xytext=(34, 42.5), arrowprops=dict(arrowstyle="->", color='#3182CE', lw=1.8))
    ax.text(38, 45, "HTTP\nReq", fontsize=7.5, ha='center', color='#3182CE', fontweight='bold')

    ax.annotate("", xy=(76, 42.5), xytext=(68, 42.5), arrowprops=dict(arrowstyle="->", color='#D69E2E', lw=1.8))
    ax.text(72, 45, "Route\nMatch", fontsize=7.5, ha='center', color='#D69E2E', fontweight='bold')

    ax.annotate("", xy=(112, 42.5), xytext=(104, 42.5), arrowprops=dict(arrowstyle="->", color='#38A169', lw=1.8))
    ax.text(108, 45, "SQL\nQuery", fontsize=7.5, ha='center', color='#38A169', fontweight='bold')

    # Return arrows
    ax.annotate("", xy=(104, 35), xytext=(112, 35), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.5, linestyle='--'))
    ax.annotate("", xy=(68, 35), xytext=(76, 35), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.5, linestyle='--'))
    ax.annotate("", xy=(34, 35), xytext=(42, 35), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.5, linestyle='--'))
    ax.text(75, 26, "JSON Response / Export Payload Stream", fontsize=8, ha='center', color='#4A5568', fontstyle='italic')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "fig_8_1_request_flow.png"), dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated fig_8_1_request_flow.png")

make_request_flow_diagram()

print("ALL TEMPLATE-MATCHING DIAGRAMS GENERATED SUCCESSFULLY!")
