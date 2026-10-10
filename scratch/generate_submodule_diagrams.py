import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

out_dir = "/Users/ani/Desktop/EL/consumables/scratch/diagrams"
os.makedirs(out_dir, exist_ok=True)

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9

def make_submodule_diagram(filename, title, boxes, connections):
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
    ax.set_xlim(0, 140)
    ax.set_ylim(0, 80)
    ax.axis('off')

    ax.text(70, 75, title, fontsize=13, fontweight='bold', ha='center', color='#1A365D')

    for x, y, w, h, name, subtext, bg, border in boxes:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4", 
                                      facecolor=bg, edgecolor=border, linewidth=1.3)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 3.5, name, color='#1A365D', fontweight='bold', 
                ha='center', va='center', fontsize=8.5)
        
        curr_y = y + h - 8.5
        for st in subtext:
            ax.text(x + w/2, curr_y, st, color='#4A5568', fontsize=7.2, ha='center', va='center')
            curr_y -= 2.5

    for (x1, y1), (x2, y2), label, color in connections:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.3))
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 1.2, label, fontsize=7.2, color=color, fontweight='bold', ha='center')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, filename), dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated {filename}")

# 8.3 Auth
make_submodule_diagram(
    "arch_8_3_auth.png",
    "Low-Level Architecture: User Authentication & Role-Based Access Control",
    [
        (5, 45, 38, 22, "Client Presentation", ["Login.jsx (Credentials Form)", "AuthContext.jsx (Token Store)", "RoleRoute / SystemRoute Guards"], "#EBF8FF", "#3182CE"),
        (51, 45, 38, 22, "Auth Controller & Middleware", ["authController.loginUser()", "verifyToken (JWT Signature)", "requireAdmin / Role Filter"], "#FEFCBF", "#D69E2E"),
        (97, 45, 38, 22, "Data Persistence", ["users (BCrypt Hash cost 10)", "roles (ADMIN / FACULTY)", "departments (User Mapping)"], "#C6F6D5", "#38A169"),
        (51, 10, 38, 22, "System Isolation Guard", ["Dynamic Subsystem Routing", "Port 5050: Electrical (Admin Only)", "Port 5051: Hardware (Admin+Faculty)"], "#FED7D7", "#E53E3E")
    ],
    [
        ((43, 56), (51, 56), "POST /api/auth/login", "#3182CE"),
        ((89, 56), (97, 56), "Query & Validate", "#38A169"),
        ((70, 45), (70, 32), "Enforce Subsystem Guard", "#E53E3E")
    ]
)

# 8.4 Master Data
make_submodule_diagram(
    "arch_8_4_master_data.png",
    "Low-Level Architecture: Master Data Governance (Depts, Categories, Units, Registers)",
    [
        (5, 45, 38, 22, "Admin UI Components", ["Departments.jsx", "Categories.jsx / Units.jsx", "StockRegisters.jsx (Registers)"], "#EBF8FF", "#3182CE"),
        (51, 45, 38, 22, "Master Data Controller", ["masterDataController.js", "Input Sanitization & Unique Checks", "Active/Inactive Flag Toggle"], "#FEFCBF", "#D69E2E"),
        (97, 45, 38, 22, "Relational Master Tables", ["departments (code, name)", "categories & units", "stock_documents (registers)"], "#C6F6D5", "#38A169"),
        (51, 10, 38, 22, "Constraint Verifier", ["Deactivation Guard on FK Ref", "Prevents Orphan Records", "Safe Audit Trail Integrity"], "#EDF2F7", "#4A5568")
    ],
    [
        ((43, 56), (51, 56), "REST CRUD Calls", "#3182CE"),
        ((89, 56), (97, 56), "Atomic SQL Execute", "#38A169"),
        ((70, 45), (70, 32), "Verify Foreign Key Constraints", "#4A5568")
    ]
)

# 8.5 Products
make_submodule_diagram(
    "arch_8_5_products.png",
    "Low-Level Architecture: Product Catalog & Physical Document Register Linkage",
    [
        (5, 45, 38, 22, "Catalog Interface", ["Products.jsx (Admin View)", "FacultyCatalog.jsx (Read Only)", "ProductDetails.jsx (Deep View)"], "#EBF8FF", "#3182CE"),
        (51, 45, 38, 22, "Product Controller & Logic", ["productController.js", "Document Reference Manager", "Min Quantity Alert Triggers"], "#FEFCBF", "#D69E2E"),
        (97, 45, 38, 22, "Catalog & Reference DB", ["products (stock levels, status)", "product_document_references", "product_remarks (Audit Notes)"], "#C6F6D5", "#38A169"),
        (51, 10, 38, 22, "Low Stock Evaluator", ["Calculates (Current <= Minimum)", "Emits System Low-Stock Flag", "Feeds Dashboard KPI Card"], "#FEEBC8", "#DD6B20")
    ],
    [
        ((43, 56), (51, 56), "Fetch / Create Product", "#3182CE"),
        ((89, 56), (97, 56), "Store Product & References", "#38A169"),
        ((70, 45), (70, 32), "Evaluate Stock Thresholds", "#DD6B20")
    ]
)

# 8.6 Purchase
make_submodule_diagram(
    "arch_8_6_purchase.png",
    "Low-Level Architecture: Incoming Stock (Purchase & Inward Goods Flow)",
    [
        (5, 45, 38, 22, "Incoming Stock UI", ["Purchase.jsx (Inward Form)", "Supplier & Invoice Capture", "Stock Document Page Reference"], "#EBF8FF", "#3182CE"),
        (51, 45, 38, 22, "Purchase & Stock Service", ["purchaseController.recordPurchase()", "stockService.handleIncomingStock()", "Atomic Transaction Wrapper"], "#FEFCBF", "#D69E2E"),
        (97, 45, 38, 22, "Purchase & Ledger DB", ["purchases (Invoice, Supplier, Total)", "products (Qty Increment)", "stock_transactions (Audit Record)"], "#C6F6D5", "#38A169"),
        (51, 10, 38, 22, "Stock Register Cross-Ref", ["Links Inward Entry to Physical Page", "Validates Document Code", "Guarantees Book Auditability"], "#E9D8FD", "#805AD5")
    ],
    [
        ((43, 56), (51, 56), "POST /api/stock/incoming", "#3182CE"),
        ((89, 56), (97, 56), "Update Qty & Insert Tx", "#38A169"),
        ((70, 45), (70, 32), "Bind Register Page Number", "#805AD5")
    ]
)

# 8.7 Transfer
make_submodule_diagram(
    "arch_8_7_transfer.png",
    "Low-Level Architecture: Outgoing Stock (Transfer & Department Issuance)",
    [
        (5, 45, 38, 22, "Outgoing Stock UI", ["Transfer.jsx (Outgoing Form)", "Department & Receiver Entry", "Purpose & Issue Remarks"], "#EBF8FF", "#3182CE"),
        (51, 45, 38, 22, "Transfer & Stock Service", ["transferController.issueTransfer()", "stockService.handleOutgoingStock()", "Stock Availability Validation"], "#FEFCBF", "#D69E2E"),
        (97, 45, 38, 22, "Transfer & Ledger DB", ["transfers (Dept, Issued To, Date)", "products (Qty Decrement)", "stock_transactions (Audit Record)"], "#C6F6D5", "#38A169"),
        (51, 10, 38, 22, "Deficit Prevention Guard", ["Ensures (TransferQty <= CurrentQty)", "Rejects Over-Issuance (400)", "Logs Transaction Actor ID"], "#FED7D7", "#E53E3E")
    ],
    [
        ((43, 56), (51, 56), "POST /api/stock/outgoing", "#3182CE"),
        ((89, 56), (97, 56), "Decrement Qty & Insert Tx", "#38A169"),
        ((70, 45), (70, 32), "Verify Sufficient Balance", "#E53E3E")
    ]
)

# 8.8 Indent
make_submodule_diagram(
    "arch_8_8_indents.png",
    "Low-Level Architecture: Indent Requisition, Admin Review & Physical Slip Support",
    [
        (5, 45, 38, 22, "Faculty Indent Portal", ["CreateIndent.jsx (Requisition)", "Multi-Item Selector & Priority", "MyIndents.jsx (Status Tracker)"], "#EBF8FF", "#3182CE"),
        (51, 45, 38, 22, "Indent Controller & Workflow", ["indentController.js", "Workflow State Transitions", "SUBMITTED -> APPROVED -> ISSUED"], "#FEFCBF", "#D69E2E"),
        (97, 45, 38, 22, "Requisition Database", ["indents (Header, Status, Remarks)", "indent_items (Requested/Issued Qty)", "notifications (Requester Alerts)"], "#C6F6D5", "#38A169"),
        (51, 10, 38, 22, "Admin Review & Issue Engine", ["ManageIndents.jsx (Admin Queue)", "Physical Indent Print Support", "Auto-Triggers Stock Transfer"], "#C6F6D5", "#22543D")
    ],
    [
        ((43, 56), (51, 56), "POST /api/indents", "#3182CE"),
        ((89, 56), (97, 56), "Save Indent Header & Items", "#38A169"),
        ((70, 45), (70, 32), "Admin Approval & Item Issuance", "#22543D")
    ]
)

# 8.9 Dashboard & Analytics
make_submodule_diagram(
    "arch_8_9_dashboard.png",
    "Low-Level Architecture: Executive Dashboard, Stock History Ledger & Reports",
    [
        (5, 45, 38, 22, "Dashboard & Report UI", ["Dashboard.jsx (KPI Metric Cards)", "StockHistory.jsx (Reactive Ledger)", "Reports.jsx (Export Filters)"], "#EBF8FF", "#3182CE"),
        (51, 45, 38, 22, "Analytics & Report Engine", ["analyticsController.getOverview()", "stockHistoryController.getLedger()", "Excel / CSV / PDF Formatters"], "#FEFCBF", "#D69E2E"),
        (97, 45, 38, 22, "Aggregated Data Sources", ["stock_transactions (Full Ledger)", "products (Low Stock Calculations)", "purchases & transfers (Sums)"], "#C6F6D5", "#38A169"),
        (51, 10, 38, 22, "Reactive Ledger Polling", ["Sub-second Transaction Search", "Category & Movement Filtering", "Export Service (Client & Server)"], "#EDF2F7", "#4A5568")
    ],
    [
        ((43, 56), (51, 56), "GET /api/dashboard & /reports", "#3182CE"),
        ((89, 56), (97, 56), "Aggregate SQL Queries", "#38A169"),
        ((70, 45), (70, 32), "Stream File / Render KPI", "#4A5568")
    ]
)

print("ALL SUBMODULE DIAGRAMS GENERATED SUCCESSFULLY!")
