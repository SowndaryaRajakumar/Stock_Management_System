import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Ensure output directory exists
out_dir = "/Users/ani/Desktop/EL/consumables/scratch/diagrams"
os.makedirs(out_dir, exist_ok=True)

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9

def create_class_diagram():
    fig, ax = plt.subplots(figsize=(19, 13), dpi=300)
    ax.set_xlim(0, 190)
    ax.set_ylim(0, 130)
    ax.axis('off')
    
    # Title
    ax.text(95, 126, "UML Class Diagram - Electrical and Computer Hardware Stock Management System", 
            fontsize=16, fontweight='bold', ha='center', color='#1A365D')
    
    classes = [
        # (x, y, w, h, name, stereotype, attributes, methods)
        (5, 88, 32, 32, "User", None, 
         ["- id: int [PK]", "- username: string", "- password_hash: string", "- name: string", 
          "- email: string", "- role_id: int [FK]", "- department_id: int [FK]", "- active: boolean"],
         ["+ login(credentials)", "+ getProfile(): User", "+ verifyToken(): boolean", "+ updateStatus()"]),
         
        (45, 96, 26, 24, "Role", None,
         ["- id: int [PK]", "- name: string", "- description: string"],
         ["+ hasPermission(): bool", "+ getRoleName(): str"]),
         
        (78, 96, 32, 24, "Department", None,
         ["- id: int [PK]", "- name: string", "- code: string", "- description: string", "- active: boolean"],
         ["+ getDepartments()", "+ createDepartment()", "+ updateDepartment()"]),

        (117, 96, 32, 24, "Category", None,
         ["- id: int [PK]", "- name: string", "- description: string", "- active: boolean"],
         ["+ getCategories()", "+ addCategory()", "+ updateCategory()"]),

        (154, 96, 31, 24, "Unit", None,
         ["- id: int [PK]", "- name: string", "- symbol: string", "- active: boolean"],
         ["+ getUnits()", "+ addUnit()", "+ updateUnit()"]),

        (5, 48, 38, 34, "Product", None,
         ["- id: int [PK]", "- product_code: string", "- product_name: string", "- category_id: int [FK]",
          "- unit_id: int [FK]", "- current_quantity: decimal", "- minimum_quantity: decimal", 
          "- stock_register_id: int [FK]", "- page_number: int", "- status: string", "- active: boolean"],
         ["+ getStockLevel(): decimal", "+ updateQuantity(delta)", "+ checkLowStock(): bool", 
          "+ getDocumentReferences()", "+ addRemark(text)"]),

        (50, 52, 38, 28, "StockDocument", None,
         ["- id: int [PK]", "- document_code: string", "- document_name: string", 
          "- description: string", "- active: boolean"],
         ["+ getRegisters()", "+ createRegister()", "+ getLinkedItems()"]),

        (95, 52, 42, 28, "ProductDocumentReference", None,
         ["- id: int [PK]", "- product_id: int [FK]", "- stock_document_id: int [FK]", 
          "- stock_document_name: string", "- page_number: int", "- reference_note: string"],
         ["+ linkDocument()", "+ getReferences()"]),

        (144, 52, 41, 28, "ProductRemark", None,
         ["- id: int [PK]", "- product_id: int [FK]", "- remark: string", "- created_by: int [FK]", "- created_at: datetime"],
         ["+ addRemark()", "+ getRemarksByProduct()"]),

        (5, 6, 36, 34, "Purchase (Incoming Stock)", None,
         ["- id: int [PK]", "- purchase_number: string", "- product_id: int [FK]", 
          "- quantity: decimal", "- unit_price: decimal", "- total_amount: decimal",
          "- supplier: string", "- invoice_number: string", "- purchase_date: date", 
          "- stock_register_id: int [FK]", "- page_number: int", "- recorded_by: int [FK]"],
         ["+ recordPurchase()", "+ calculateTotal()", "+ getPurchaseHistory()"]),

        (48, 6, 36, 34, "Transfer (Outgoing Stock)", None,
         ["- id: int [PK]", "- transfer_number: string", "- product_id: int [FK]", 
          "- department_id: int [FK]", "- quantity: decimal", "- issued_to: string", 
          "- issued_by: int [FK]", "- purpose: string", "- transfer_date: date", 
          "- stock_register_id: int [FK]", "- page_number: int"],
         ["+ issueTransfer()", "+ validateStockAvailability()", "+ getTransferHistory()"]),

        (91, 6, 38, 34, "StockTransaction (Audit Ledger)", None,
         ["- id: int [PK]", "- transaction_code: string", "- product_id: int [FK]", 
          "- transaction_type: string", "- quantity: decimal", "- previous_quantity: decimal", 
          "- new_quantity: decimal", "- department_id: int [FK]", "- reference_id: int", 
          "- reference_type: string", "- recorded_by: int [FK]"],
         ["+ logTransaction()", "+ getLedgerHistory()", "+ auditStockBalance()"]),

        (136, 6, 25, 34, "Indent", None,
         ["- id: int [PK]", "- indent_number: str", "- department_id: int", 
          "- requested_by: int", "- status: string", "- remarks: string"],
         ["+ submitIndent()", "+ approveIndent()", "+ rejectIndent()", "+ issueIndent()"]),

        (165, 6, 22, 34, "IndentItem", None,
         ["- id: int [PK]", "- indent_id: int", "- product_id: int", 
          "- requested_qty: dec", "- approved_qty: dec", "- issued_qty: dec"],
         ["+ validateQty()", "+ fulfillItem()"])
    ]
    
    for x, y, w, h, name, stereo, attrs, meths in classes:
        # Outer box
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2", 
                                      facecolor='#F8FAFC', edgecolor='#2B6CB0', linewidth=1.5)
        ax.add_patch(rect)
        # Header box
        header_h = 4.5
        header = patches.Rectangle((x, y + h - header_h), w, header_h, 
                                   facecolor='#2B6CB0', edgecolor='#2B6CB0', linewidth=1)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - header_h/2, name, color='white', fontweight='bold', 
                ha='center', va='center', fontsize=9.5)
        
        # Attributes
        curr_y = y + h - header_h - 2
        for attr in attrs:
            ax.text(x + 1.2, curr_y, attr, color='#2D3748', fontsize=7.5, va='center')
            curr_y -= 2.2
            
        # Divider line
        div_y = y + len(meths) * 2.3 + 1.5
        ax.plot([x, x + w], [div_y, div_y], color='#CBD5E0', linewidth=1)
        
        # Methods
        curr_y = div_y - 2.0
        for meth in meths:
            ax.text(x + 1.2, curr_y, meth, color='#1A202C', fontsize=7.2, va='center', fontstyle='italic')
            curr_y -= 2.2

    # Draw associations
    def draw_assoc(x1, y1, x2, y2, mult1="1", mult2="*"):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-", color='#4A5568', lw=1.2))
        ax.text(x1 + (x2-x1)*0.15, y1 + (y2-y1)*0.15 + 1.2, mult1, fontsize=8, color='#4A5568', fontweight='bold')
        ax.text(x2 - (x2-x1)*0.15, y2 - (y2-y1)*0.15 + 1.2, mult2, fontsize=8, color='#4A5568', fontweight='bold')

    # Role - User
    draw_assoc(45, 108, 37, 108, "1", "*")
    # Dept - User
    draw_assoc(78, 108, 37, 104, "1", "*")
    # Category - Product
    draw_assoc(130, 96, 43, 75, "1", "*")
    # Unit - Product
    draw_assoc(165, 96, 43, 70, "1", "*")
    # Product - Reference
    draw_assoc(43, 62, 95, 62, "1", "*")
    # StockDocument - Reference
    draw_assoc(88, 62, 95, 62, "1", "*")
    # Product - Purchase
    draw_assoc(20, 48, 20, 40, "1", "*")
    # Product - Transfer
    draw_assoc(30, 48, 55, 40, "1", "*")
    # Product - Transaction
    draw_assoc(38, 48, 95, 40, "1", "*")
    # Indent - IndentItem
    draw_assoc(161, 22, 165, 22, "1", "*")
    # Product - IndentItem
    draw_assoc(43, 50, 165, 30, "1", "*")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "class_diagram.png"), dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated class_diagram.png")

def create_er_diagram():
    fig, ax = plt.subplots(figsize=(18, 12), dpi=300)
    ax.set_xlim(0, 180)
    ax.set_ylim(0, 120)
    ax.axis('off')

    ax.text(90, 116, "Entity-Relationship (ER) Diagram - Electrical & Hardware Stock Management System", 
            fontsize=15, fontweight='bold', ha='center', color='#1A365D')

    entities = [
        # (x, y, w, h, title, fields)
        (6, 85, 32, 26, "USERS", ["PK: id INT", "FK: role_id INT", "FK: department_id INT", "username VARCHAR", "password VARCHAR", "name VARCHAR", "email VARCHAR", "active TINYINT"]),
        (46, 92, 28, 19, "ROLES", ["PK: id INT", "name VARCHAR(30)", "description VARCHAR"]),
        (80, 90, 32, 21, "DEPARTMENTS", ["PK: id INT", "code VARCHAR(30)", "name VARCHAR(150)", "active TINYINT"]),
        (118, 90, 28, 21, "CATEGORIES", ["PK: id INT", "name VARCHAR(150)", "description TEXT", "active TINYINT"]),
        (150, 90, 24, 21, "UNITS", ["PK: id INT", "name VARCHAR(100)", "symbol VARCHAR(30)", "active TINYINT"]),

        (6, 45, 38, 32, "PRODUCTS", ["PK: id INT", "product_code VARCHAR(50)", "product_name VARCHAR(255)", "FK: category_id INT", "FK: unit_id INT", "current_quantity DECIMAL", "minimum_quantity DECIMAL", "FK: stock_register_id INT", "page_number INT", "status VARCHAR", "active TINYINT"]),
        (50, 52, 35, 23, "STOCK_DOCUMENTS", ["PK: id INT", "document_code VARCHAR(50)", "document_name VARCHAR(150)", "description VARCHAR(255)", "active TINYINT"]),
        (92, 52, 42, 23, "PRODUCT_DOC_REFS", ["PK: id INT", "FK: product_id INT", "FK: stock_document_id INT", "page_number INT", "reference_note VARCHAR"]),
        (140, 52, 34, 23, "PRODUCT_REMARKS", ["PK: id INT", "FK: product_id INT", "remark TEXT", "FK: created_by INT", "created_at DATETIME"]),

        (6, 6, 38, 32, "PURCHASES", ["PK: id INT", "purchase_number VARCHAR", "FK: product_id INT", "quantity DECIMAL", "unit_price DECIMAL", "total_amount DECIMAL", "supplier VARCHAR", "invoice_number VARCHAR", "purchase_date DATE", "FK: stock_register_id INT", "page_number INT", "FK: recorded_by INT"]),
        (50, 6, 38, 32, "TRANSFERS", ["PK: id INT", "transfer_number VARCHAR", "FK: product_id INT", "FK: department_id INT", "quantity DECIMAL", "issued_to VARCHAR", "FK: issued_by INT", "purpose VARCHAR", "transfer_date DATE", "FK: stock_register_id INT", "page_number INT"]),
        (94, 6, 40, 32, "STOCK_TRANSACTIONS", ["PK: id INT", "transaction_code VARCHAR", "FK: product_id INT", "transaction_type VARCHAR", "quantity DECIMAL", "previous_quantity DECIMAL", "new_quantity DECIMAL", "FK: department_id INT", "reference_id INT", "reference_type VARCHAR", "FK: recorded_by INT"]),
        (140, 18, 22, 22, "INDENTS", ["PK: id INT", "indent_number VARCHAR", "FK: department_id INT", "FK: requested_by INT", "status VARCHAR", "created_at DATETIME"]),
        (164, 18, 14, 22, "INDENT_ITEMS", ["PK: id INT", "FK: indent_id INT", "FK: product_id INT", "requested_qty DEC", "approved_qty DEC", "issued_qty DEC"])
    ]

    for x, y, w, h, title, fields in entities:
        rect = patches.Rectangle((x, y), w, h, facecolor='#FFFFFF', edgecolor='#1A365D', linewidth=1.5)
        ax.add_patch(rect)
        hdr = patches.Rectangle((x, y + h - 4.5), w, 4.5, facecolor='#2B6CB0', edgecolor='#1A365D', linewidth=1)
        ax.add_patch(hdr)
        ax.text(x + w/2, y + h - 2.2, title, color='white', fontweight='bold', ha='center', va='center', fontsize=9)
        
        curr_y = y + h - 7
        for fld in fields:
            is_pk = "PK:" in fld
            is_fk = "FK:" in fld
            color = '#C53030' if is_pk else ('#2B6CB0' if is_fk else '#2D3748')
            weight = 'bold' if (is_pk or is_fk) else 'normal'
            ax.text(x + 1.2, curr_y, fld, color=color, fontsize=7.2, fontweight=weight, va='center')
            curr_y -= 2.2

    # Draw ER relationship lines
    def draw_rel(x1, y1, x2, y2, label="1:N"):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", color='#718096', lw=1.2, mutation_scale=10))
        ax.text((x1+x2)/2, (y1+y2)/2 + 0.8, label, fontsize=7.5, color='#2B6CB0', fontweight='bold', ha='center')

    draw_rel(46, 100, 38, 100, "1:N")
    draw_rel(80, 100, 38, 95, "1:N")
    draw_rel(125, 90, 44, 75, "1:N")
    draw_rel(155, 90, 44, 70, "1:N")
    draw_rel(44, 60, 92, 60, "1:N")
    draw_rel(85, 60, 92, 60, "1:N")
    draw_rel(22, 45, 22, 38, "1:N")
    draw_rel(30, 45, 55, 38, "1:N")
    draw_rel(38, 45, 94, 38, "1:N")
    draw_rel(162, 28, 164, 28, "1:N")

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "er_diagram.png"), dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated er_diagram.png")

def create_system_architecture():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=300)
    ax.set_xlim(0, 160)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(80, 96, "System Architecture & Subsystem Isolation Flow", 
            fontsize=15, fontweight='bold', ha='center', color='#1A365D')

    # Client Layer
    client_box = patches.FancyBboxPatch((10, 68), 140, 22, boxstyle="round,pad=0.5", 
                                        facecolor='#EBF8FF', edgecolor='#3182CE', linewidth=1.5)
    ax.add_patch(client_box)
    ax.text(14, 85, "PRESENTATION LAYER (React 18 + Vite SPA)", fontsize=11, fontweight='bold', color='#2B6CB0')
    
    # Client Subcomponents
    sub_c = [
        (15, 71, 28, 11, "System Selection Portal\n(/select-system)", "#FFFFFF"),
        (48, 71, 28, 11, "Electrical Subsystem\n(Admin Only)", "#FFFFFF"),
        (81, 71, 28, 11, "Hardware Subsystem\n(Admin & Faculty)", "#FFFFFF"),
        (114, 71, 32, 11, "Auth & Role Guards\n(RoleRoute / JWT)", "#FFFFFF")
    ]
    for x, y, w, h, txt, bg in sub_c:
        r = patches.Rectangle((x, y), w, h, facecolor=bg, edgecolor='#4299E1', lw=1)
        ax.add_patch(r)
        ax.text(x+w/2, y+h/2, txt, ha='center', va='center', fontsize=8, fontweight='bold', color='#2D3748')

    # Backend Layer
    # Electrical Backend
    elec_box = patches.FancyBboxPatch((10, 32), 65, 28, boxstyle="round,pad=0.5", 
                                       facecolor='#FEFCBF', edgecolor='#D69E2E', linewidth=1.5)
    ax.add_patch(elec_box)
    ax.text(14, 55, "ELECTRICAL BACKEND (Port 5050)", fontsize=10, fontweight='bold', color='#744210')
    ax.text(14, 51, "Express.js REST API | Admin-Only Isolation Guard", fontsize=8, color='#744210')
    
    e_modules = [
        (14, 35, 18, 12, "Stock / Purchase\n& Transfer Routes"),
        (34, 35, 18, 12, "Master Data &\nRegister Routes"),
        (54, 35, 18, 12, "Analytics &\nReport Engine")
    ]
    for x, y, w, h, txt in e_modules:
        r = patches.Rectangle((x, y), w, h, facecolor='#FFFFFF', edgecolor='#D69E2E', lw=1)
        ax.add_patch(r)
        ax.text(x+w/2, y+h/2, txt, ha='center', va='center', fontsize=7.5, color='#744210')

    # Hardware Backend
    hw_box = patches.FancyBboxPatch((85, 32), 65, 28, boxstyle="round,pad=0.5", 
                                    facecolor='#C6F6D5', edgecolor='#38A169', linewidth=1.5)
    ax.add_patch(hw_box)
    ax.text(89, 55, "HARDWARE BACKEND (Port 5051)", fontsize=10, fontweight='bold', color='#22543D')
    ax.text(89, 51, "Express.js REST API | Role-Based Access Control (Admin + Faculty)", fontsize=8, color='#22543D')
    
    h_modules = [
        (89, 35, 18, 12, "Faculty Indent\nRequisition Engine"),
        (109, 35, 18, 12, "Admin Review &\nIssuance Engine"),
        (129, 35, 18, 12, "Hardware Stock &\nLedger Service")
    ]
    for x, y, w, h, txt in h_modules:
        r = patches.Rectangle((x, y), w, h, facecolor='#FFFFFF', edgecolor='#38A169', lw=1)
        ax.add_patch(r)
        ax.text(x+w/2, y+h/2, txt, ha='center', va='center', fontsize=7.5, color='#22543D')

    # Database Layer
    db_box = patches.FancyBboxPatch((10, 4), 140, 20, boxstyle="round,pad=0.5", 
                                    facecolor='#EDF2F7', edgecolor='#4A5568', linewidth=1.5)
    ax.add_patch(db_box)
    ax.text(14, 19, "DATA PERSISTENCE LAYER (MySQL 8.0 InnoDB Engine)", fontsize=10, fontweight='bold', color='#2D3748')
    
    dbs = [
        (20, 7, 50, 9, "Database: consumable_stock_management\n(Electrical Consumables & Register References)", '#FFFFFF'),
        (90, 7, 50, 9, "Database: hardware_stock_management\n(Computer Hardware Items, Indents & Movements)", '#FFFFFF')
    ]
    for x, y, w, h, txt, bg in dbs:
        r = patches.Rectangle((x, y), w, h, facecolor=bg, edgecolor='#718096', lw=1)
        ax.add_patch(r)
        ax.text(x+w/2, y+h/2, txt, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#2D3748')

    # Flow arrows
    ax.annotate("", xy=(42, 60), xytext=(42, 68), arrowprops=dict(arrowstyle="<|-|>", color='#D69E2E', lw=2))
    ax.annotate("", xy=(117, 60), xytext=(117, 68), arrowprops=dict(arrowstyle="<|-|>", color='#38A169', lw=2))
    ax.annotate("", xy=(42, 16), xytext=(42, 32), arrowprops=dict(arrowstyle="<|-|>", color='#D69E2E', lw=2))
    ax.annotate("", xy=(117, 16), xytext=(117, 32), arrowprops=dict(arrowstyle="<|-|>", color='#38A169', lw=2))

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "architecture_diagram.png"), dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated architecture_diagram.png")

def create_use_case_diagram():
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    ax.set_xlim(0, 160)
    ax.set_ylim(0, 110)
    ax.axis('off')

    ax.text(80, 105, "UML Use Case Diagram - Role-Based Capabilities", 
            fontsize=15, fontweight='bold', ha='center', color='#1A365D')

    # Boundary box
    bound = patches.Rectangle((35, 6), 90, 94, facecolor='#F7FAFC', edgecolor='#4A5568', lw=1.5, linestyle='--')
    ax.add_patch(bound)
    ax.text(80, 96, "Electrical & Hardware Stock Management System", fontsize=11, fontweight='bold', ha='center', color='#2B6CB0')

    # Actors
    def draw_actor(x, y, name):
        # Head
        circle = patches.Circle((x, y+6), 2, facecolor='#FFFFFF', edgecolor='#1A202C', lw=1.5)
        ax.add_patch(circle)
        # Body
        ax.plot([x, x], [y+4, y], color='#1A202C', lw=1.5)
        # Arms
        ax.plot([x-3, x+3], [y+2.5, y+2.5], color='#1A202C', lw=1.5)
        # Legs
        ax.plot([x, x-2.5], [y, y-4], color='#1A202C', lw=1.5)
        ax.plot([x, x+2.5], [y, y-4], color='#1A202C', lw=1.5)
        ax.text(x, y-7, name, ha='center', fontsize=9.5, fontweight='bold', color='#1A202C')

    draw_actor(15, 55, "Administrator\n(Admin Role)")
    draw_actor(145, 55, "Faculty\n(Department Staff)")

    # Use cases
    use_cases = [
        (80, 88, "User Authentication & JWT Verification"),
        (80, 78, "Manage Master Data (Categories, Units, Depts, Registers)"),
        (80, 68, "Record Incoming Stock (Purchases / Supplier Inward)"),
        (80, 58, "Record Outgoing Stock (Transfers / Department Issues)"),
        (80, 48, "Review, Approve & Issue Hardware Indent Requests"),
        (80, 38, "Monitor Low Stock Alerts & View Audit Ledger"),
        (80, 28, "Generate & Export Stock Reports (Excel & PDF)"),
        (80, 18, "Browse Hardware Catalog & Check Stock Levels"),
        (80, 10, "Raise Hardware Indent Requisition (Multi-Item)")
    ]

    for ux, uy, utext in use_cases:
        ellipse = patches.Ellipse((ux, uy), 68, 6.5, facecolor='#EBF8FF', edgecolor='#3182CE', lw=1.2)
        ax.add_patch(ellipse)
        ax.text(ux, uy, utext, ha='center', va='center', fontsize=7.8, fontweight='bold', color='#2D3748')

    # Admin lines (top 7)
    for i in range(7):
        uy = use_cases[i][1]
        ax.plot([22, 46], [55, uy], color='#3182CE', lw=1.2)

    # Faculty lines (auth, browse, raise indent, my indents)
    ax.plot([138, 114], [55, 88], color='#38A169', lw=1.2) # Auth
    ax.plot([138, 114], [55, 18], color='#38A169', lw=1.2) # Browse Catalog
    ax.plot([138, 114], [55, 10], color='#38A169', lw=1.2) # Raise Indent

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "use_case_diagram.png"), dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated use_case_diagram.png")

def create_sequence_diagram():
    fig, ax = plt.subplots(figsize=(17, 11), dpi=300)
    ax.set_xlim(0, 170)
    ax.set_ylim(0, 110)
    ax.axis('off')

    ax.text(85, 105, "UML Sequence Diagram - Indent Requisition & Stock Issuance Workflow", 
            fontsize=15, fontweight='bold', ha='center', color='#1A365D')

    lifelines = [
        (20, "Faculty"),
        (50, "Frontend UI"),
        (85, "Hardware API (:5051)"),
        (120, "StockService / Controller"),
        (152, "MySQL Database")
    ]

    for lx, name in lifelines:
        box = patches.Rectangle((lx-14, 94), 28, 6, facecolor='#2B6CB0', edgecolor='#1A365D', lw=1)
        ax.add_patch(box)
        ax.text(lx, 97, name, color='white', fontweight='bold', ha='center', va='center', fontsize=8.5)
        ax.plot([lx, lx], [12, 94], color='#A0AEC0', linestyle='--', lw=1)

    steps = [
        (90, 20, 50, "1. Select Products & Submit Indent Form", True),
        (83, 50, 85, "2. POST /api/indents (with JWT & items payload)", True),
        (76, 85, 120, "3. validateIndentItems() & checkStock()", True),
        (69, 120, 152, "4. INSERT INTO indents & indent_items (STATUS='SUBMITTED')", True),
        (62, 152, 85, "5. Indent Created (id: 42, indent_no: IND-2026-042)", False),
        (55, 85, 50, "6. 201 Created Response + Notification Dispatched", False),
        (48, 50, 20, "7. Display Success Toast & Indent Reference", False),
        (40, 85, 120, "8. Admin Reviews: approveIndent() / issueIndent()", True),
        (32, 120, 152, "9. Deduct current_quantity & Record in transfers", True),
        (24, 152, 120, "10. INSERT stock_transactions (Ledger Audit Record)", True),
        (16, 120, 85, "11. Indent Status Updated to 'ISSUED'", False)
    ]

    for y, x1, x2, msg, is_call in steps:
        style = "->" if is_call else "-->"
        color = "#2B6CB0" if is_call else "#38A169"
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.3, linestyle="solid" if is_call else "dashed"))
        mid_x = (x1 + x2) / 2
        ax.text(mid_x, y + 1.2, msg, ha='center', fontsize=7.8, color='#2D3748', fontweight='bold')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "sequence_diagram.png"), dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated sequence_diagram.png")

def create_activity_diagram():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 150)
    ax.set_ylim(0, 110)
    ax.axis('off')

    ax.text(75, 105, "UML Activity Diagram - Material Movement & Indent Processing Lifecycle", 
            fontsize=15, fontweight='bold', ha='center', color='#1A365D')

    # Initial node
    start = patches.Circle((75, 96), 2.5, facecolor='#1A365D', edgecolor='#1A365D')
    ax.add_patch(start)

    # Activity nodes
    def draw_act(x, y, w, h, text):
        box = patches.FancyBboxPatch((x-w/2, y-h/2), w, h, boxstyle="round,pad=0.3", 
                                     facecolor='#EBF8FF', edgecolor='#3182CE', lw=1.2)
        ax.add_patch(box)
        ax.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color='#2D3748')

    def draw_dec(x, y, w, h, text):
        diamond = patches.Polygon([[x, y+h/2], [x+w/2, y], [x, y-h/2], [x-w/2, y]], 
                                  facecolor='#FEFCBF', edgecolor='#D69E2E', lw=1.2)
        ax.add_patch(diamond)
        ax.text(x, y, text, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#744210')

    draw_act(75, 87, 55, 6, "User Authenticates & Accesses Subsystem")
    draw_dec(75, 75, 45, 8, "Stock Operation Type?")
    
    # Left Branch: Incoming Stock (Purchase)
    draw_act(30, 62, 44, 7, "Enter Supplier, Invoice & Unit Price")
    draw_act(30, 48, 44, 7, "Link Stock Document & Page Number")
    draw_act(30, 34, 44, 7, "Increment current_quantity in products")
    draw_act(30, 20, 44, 7, "Append 'PURCHASE' to stock_transactions")

    # Center Branch: Outgoing Stock (Direct Transfer)
    draw_act(75, 62, 42, 7, "Select Department & Receiver Info")
    draw_act(75, 48, 42, 7, "Validate Available Stock Level")
    draw_act(75, 34, 42, 7, "Decrement current_quantity in products")
    draw_act(75, 20, 42, 7, "Append 'TRANSFER' to stock_transactions")

    # Right Branch: Faculty Indent Requisition
    draw_act(120, 62, 44, 7, "Faculty Raises Hardware Indent Form")
    draw_act(120, 48, 44, 7, "Admin Reviews & Approves Indent")
    draw_act(120, 34, 44, 7, "Issue Items -> Deduct Stock Balance")
    draw_act(120, 20, 44, 7, "Generate Outgoing Record & Alert User")

    # End Node
    end_outer = patches.Circle((75, 8), 3, facecolor='none', edgecolor='#1A365D', lw=1.5)
    end_inner = patches.Circle((75, 8), 2, facecolor='#1A365D', edgecolor='#1A365D')
    ax.add_patch(end_outer)
    ax.add_patch(end_inner)

    # Connecting arrows
    ax.annotate("", xy=(75, 90), xytext=(75, 93.5), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.2))
    ax.annotate("", xy=(75, 79), xytext=(75, 84), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.2))
    
    # Branches
    ax.annotate("", xy=(30, 66), xytext=(52.5, 75), arrowprops=dict(arrowstyle="->", color='#D69E2E', lw=1.2))
    ax.text(38, 73, "[Purchase]", fontsize=7.5, color='#744210', fontweight='bold')

    ax.annotate("", xy=(75, 66), xytext=(75, 71), arrowprops=dict(arrowstyle="->", color='#D69E2E', lw=1.2))
    ax.text(77, 68, "[Transfer]", fontsize=7.5, color='#744210', fontweight='bold')

    ax.annotate("", xy=(120, 66), xytext=(97.5, 75), arrowprops=dict(arrowstyle="->", color='#D69E2E', lw=1.2))
    ax.text(105, 73, "[Indent]", fontsize=7.5, color='#744210', fontweight='bold')

    # Sequential arrows in columns
    for y1, y2 in [(58.5, 51.5), (44.5, 37.5), (30.5, 23.5)]:
        ax.annotate("", xy=(30, y2), xytext=(30, y1), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.2))
        ax.annotate("", xy=(75, y2), xytext=(75, y1), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.2))
        ax.annotate("", xy=(120, y2), xytext=(120, y1), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.2))

    # Converge to end node
    ax.annotate("", xy=(72, 8), xytext=(30, 16.5), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.2))
    ax.annotate("", xy=(75, 11), xytext=(75, 16.5), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.2))
    ax.annotate("", xy=(78, 8), xytext=(120, 16.5), arrowprops=dict(arrowstyle="->", color='#4A5568', lw=1.2))

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "activity_diagram.png"), dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated activity_diagram.png")

if __name__ == "__main__":
    create_class_diagram()
    create_er_diagram()
    create_system_architecture()
    create_use_case_diagram()
    create_sequence_diagram()
    create_activity_diagram()
    print("ALL UML DIAGRAMS GENERATED SUCCESSFULLY!")
