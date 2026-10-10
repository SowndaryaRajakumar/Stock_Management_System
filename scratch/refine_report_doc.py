import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def refine_report_document():
    template_path = '/Users/ani/Downloads/report mwt.docx'
    output_path = '/Users/ani/Desktop/EL/consumables/Electrical_and_Computer_Hardware_Stock_Management_System_Project_Report.docx'
    diagrams_dir = '/Users/ani/Desktop/EL/consumables/scratch/diagrams'

    shutil.copyfile(template_path, output_path)
    doc = docx.Document(output_path)

    # XML Helpers
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_table_borders(table, color="B0BEC5", sz="4", val="single"):
        tblPr = table._tbl.tblPr
        tblBorders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(tblBorders)

    # 1. Update Cover Page Title (P0)
    p0 = doc.paragraphs[0]
    p0.text = "ELECTRICAL AND COMPUTER HARDWARE STOCK MANAGEMENT SYSTEM"
    for r in p0.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0, 0, 0)
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # 2. Update Table of Contents Table (Table 1)
    toc_table = doc.tables[1]
    toc_data = [
        ("1", "INTRODUCTION", "3"),
        ("2", "OBJECTIVES", "4"),
        ("3", "DESCRIPTION", "5"),
        ("4", "CLASS DIAGRAM", "7"),
        ("5", "TABLE STRUCTURES", "8"),
        ("6", "ER DIAGRAM", "18"),
        ("7", "TECH STACK", "20"),
        ("8", "MODULES", "22"),
        ("9", "CONCLUSION", "50")
    ]
    for i, (ch, title, page) in enumerate(toc_data):
        if i + 1 < len(toc_table.rows):
            row = toc_table.rows[i + 1]
            row.cells[0].text = ch
            row.cells[1].text = title
            row.cells[2].text = page
            for c in row.cells:
                for p in c.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    if p.runs:
                        p.runs[0].font.name = "Times New Roman"
                        p.runs[0].font.size = Pt(11)

    # Remove all paragraphs and tables from Chapter 1 onwards
    body = doc._body._body
    p30_elem = doc.paragraphs[30]._p
    p30_idx = list(body).index(p30_elem)
    for elem in list(body)[p30_idx:]:
        body.remove(elem)

    # Text builder functions
    def add_chapter_heading(ch_num, ch_title):
        p_ch = doc.add_paragraph()
        p_ch.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_ch.paragraph_format.space_before = Pt(20)
        p_ch.paragraph_format.space_after = Pt(4)
        run_ch = p_ch.add_run(f"CHAPTER {ch_num}")
        run_ch.font.name = "Times New Roman"
        run_ch.font.size = Pt(14)
        run_ch.font.bold = True

        p_t = doc.add_paragraph()
        p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_t.paragraph_format.space_before = Pt(0)
        p_t.paragraph_format.space_after = Pt(14)
        run_t = p_t.add_run(ch_title)
        run_t.font.name = "Times New Roman"
        run_t.font.size = Pt(14)
        run_t.font.bold = True

    def add_section_heading(sec_title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(sec_title)
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)
        run.font.bold = True
        return p

    def add_subsection_heading(subsec_title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(subsec_title)
        run.font.name = "Times New Roman"
        run.font.size = Pt(11.5)
        run.font.bold = True
        return p

    def add_body_p(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(11)
        return p

    def add_bullet_p(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        
        run_bullet = p.add_run("• ")
        run_bullet.font.name = "Times New Roman"
        run_bullet.font.size = Pt(11)
        run_bullet.font.bold = True

        if bold_prefix:
            run_b = p.add_run(bold_prefix + " ")
            run_b.font.name = "Times New Roman"
            run_b.font.size = Pt(11)
            run_b.font.bold = True

        run_t = p.add_run(text)
        run_t.font.name = "Times New Roman"
        run_t.font.size = Pt(11)
        return p

    def add_fig_caption(caption_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(10)
        run = p.add_run(caption_text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        run.font.italic = True
        run.font.bold = True
        return p

    def add_image_box(img_path, width_inches=6.2, caption=""):
        if os.path.exists(img_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run()
            run.add_picture(img_path, width=Inches(width_inches))
            if caption:
                add_fig_caption(caption)

    def add_screenshot_placeholder(page_name, route, description, caption):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.4)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        set_table_borders(tbl, color="CBD5E0", sz="6", val="single")

        cp = cell.paragraphs[0]
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        r1 = cp.add_run(f"📷 [ APPLICATION SCREENSHOT PLACEHOLDER ]\n")
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(10)
        r1.font.bold = True
        r1.font.color.rgb = RGBColor(43, 108, 176)

        r2 = cp.add_run(f"Page: {page_name}  |  Route: {route}\n")
        r2.font.name = "Times New Roman"
        r2.font.size = Pt(9.5)
        r2.font.bold = True
        r2.font.color.rgb = RGBColor(45, 55, 72)

        r3 = cp.add_run(f"{description}")
        r3.font.name = "Times New Roman"
        r3.font.size = Pt(9)
        r3.font.italic = True
        r3.font.color.rgb = RGBColor(113, 128, 150)

        if caption:
            add_fig_caption(caption)

    def format_table(tbl, col_widths, headers, rows_data):
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, color="B0BEC5", sz="4", val="single")
        
        # Header Row
        hdr_cells = tbl.rows[0].cells
        for col_idx, (text, width) in enumerate(zip(headers, col_widths)):
            hdr_cells[col_idx].width = Inches(width)
            set_cell_background(hdr_cells[col_idx], "D9E1F2")
            set_cell_margins(hdr_cells[col_idx], top=80, bottom=80, left=100, right=100)
            p = hdr_cells[col_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(9.5)
            run.font.bold = True

        # Data Rows
        for r_idx, row_data in enumerate(rows_data):
            row_cells = tbl.add_row().cells
            bg_color = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
            for col_idx, (val, width) in enumerate(zip(row_data, col_widths)):
                row_cells[col_idx].width = Inches(width)
                set_cell_background(row_cells[col_idx], bg_color)
                set_cell_margins(row_cells[col_idx], top=60, bottom=60, left=100, right=100)
                p = row_cells[col_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx != 0 else WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                run = p.add_run(str(val))
                run.font.name = "Times New Roman"
                run.font.size = Pt(9)

    # ==================== CHAPTER 1 ====================
    add_chapter_heading(1, "INTRODUCTION")
    add_body_p(
        "Effective inventory and stock management within higher educational institutions is critical for maintaining academic laboratory continuity, facilitating technical instruction, and ensuring optimal resource allocation. Academic departments, specialized research laboratories, and centralized computer maintenance cells handle a wide array of physical inventory—ranging from electrical consumable items like wiring harnesses, switches, circuit breakers, LEDs, transformers, and ICs, to computer hardware components including processors, RAM modules, solid-state drives, motherboards, SMPS power units, and networking peripherals."
    )
    add_body_p(
        "Historically, departmental stock tracking has relied upon manual paper logbooks, decentralized indent requisition slips, and disconnected spreadsheet records. These manual workflows suffer from significant operational bottlenecks, including unrecorded item issuances, delayed indent approval cycles, lack of real-time visibility into inventory depletion, and frequent inventory discrepancies during statutory annual stock verifications. To address these challenges, the Electrical and Computer Hardware Stock Management System has been engineered as an enterprise-grade, dual-subsystem full-stack web application developed for National Engineering College."
    )
    add_body_p(
        "The system architecture strictly enforces role-based access control (RBAC) and complete subsystem isolation across two distinct operational domains:"
    )
    add_bullet_p(
        "Operates on dedicated backend port 5050 and connects to the 'consumable_stock_management' database. This module is restricted exclusively to System Administrators. It digitizes the complete procurement lifecycle, vendor bill entries, physical stock register page references, departmental transfers, and immutable transaction ledger logging.",
        "1. Electrical Consumables Stock Subsystem:"
    )
    add_bullet_p(
        "Operates on dedicated backend port 5051 and connects to the 'hardware_stock_management' database. It supports dual-role interaction: Faculty members can browse real-time hardware component catalogs, check minimum stock thresholds, raise multi-item indent requisitions, and track approval states, while Administrators execute indents, manage vendor purchases, and generate printable physical indent audit registers.",
        "2. Computer Hardware Stock Subsystem:"
    )
    add_body_p(
        "The frontend is implemented using React 18, Vite, and modern CSS, offering a unified single-page application (SPA) with dynamic subsystem switching, real-time toast feedback, responsive KPI metric dashboards, and comprehensive export capabilities to Microsoft Excel (.xlsx) and printable PDF documents. The backend is built on Node.js and Express.js v5 with MySQL InnoDB storage, utilizing connection pooling and JWT stateless authentication."
    )
    doc.add_page_break()

    # ==================== CHAPTER 2 ====================
    add_chapter_heading(2, "OBJECTIVES")
    add_body_p("The primary objectives of the Electrical and Computer Hardware Stock Management System are:")
    add_bullet_p(
        "Replace fragmented manual paper registers and decentralized logbooks with a centralized, responsive web platform for real-time inventory tracking across campus departments.",
        "• Digitize Institutional Stock Operations:"
    )
    add_bullet_p(
        "Maintain normalized, validated master records for Academic Departments, Material Categories, Units of Measurement (Nos, Pkts, Meters, Rolls), and Physical Stock Register Reference Documents.",
        "• Centralize Master Data Governance:"
    )
    add_bullet_p(
        "Maintain complete physical and logical separation between Electrical consumables (port 5050, Admin-only) and Computer Hardware inventory (port 5051, Admin + Faculty RBAC) to prevent unauthorized cross-domain access.",
        "• Enforce Dual-Subsystem Isolation:"
    )
    add_bullet_p(
        "Secure all REST API endpoints using stateless JSON Web Tokens (JWT) and BCrypt password hashing, with strict client-side (RoleRoute/SystemRoute) and server-side authorization middleware.",
        "• Implement Robust Role-Based Access Control (RBAC):"
    )
    add_bullet_p(
        "Provide faculty coordinators with an intuitive requisition interface to select items, specify required quantities, priority, and purpose, with real-time status tracking (SUBMITTED, APPROVED, ISSUED, REJECTED).",
        "• Streamline Hardware Indent Requisitions:"
    )
    add_bullet_p(
        "Ensure that every inward purchase, outward departmental transfer, and indent fulfillment automatically updates live product balances and writes immutable ledger records to the stock_transactions table.",
        "• Enforce Real-Time Transaction Ledgering:"
    )
    add_bullet_p(
        "Automatically detect when item quantities fall at or below configured minimum thresholds, triggering visual warning badges and dedicated replenishment tables on the dashboard.",
        "• Automated Low-Stock Alerting:"
    )
    add_bullet_p(
        "Enable one-click streaming export of customized stock reports, movement registers, and indent registers to formatted Excel spreadsheets and printable PDF documents for administrative compliance and audits.",
        "• Multi-Format Reporting & Analytics:"
    )
    doc.add_page_break()

    # ==================== CHAPTER 3 ====================
    add_chapter_heading(3, "DESCRIPTION")
    add_body_p(
        "The Electrical and Computer Hardware Stock Management System is designed to coordinate, automate, and audit institutional inventory workflows. The system is architected around nine core functional domains:"
    )
    
    add_section_heading("1. Dual-Subsystem Gateway & Role-Based Routing")
    add_body_p(
        "The platform incorporates a SystemSelection portal enabling authorized users to navigate between the Electrical Consumables domain and the Computer Hardware domain. SystemRoute and RoleRoute higher-order components intercept unauthorized route transitions. When a Faculty member authenticates, the system automatically redirects them to the Hardware Subsystem, blocking access to Electrical administrative endpoints with HTTP 403 Forbidden."
    )

    add_section_heading("2. Master Data Governance")
    add_body_p(
        "Administrators maintain foundational master entities including Academic Departments (CSE, IT, ECE, EEE, MECH, CIVIL), Item Categories (Cables & Wires, Switchgear, Lighting, Processors, Memory, Storage, Peripherals), Units of Measurement, and Stock Documents. Master records enforce referential integrity; records referenced in existing transactions are prevented from hard deletion and are instead marked inactive."
    )

    add_section_heading("3. Product Catalog & Physical Document Register Linkage")
    add_body_p(
        "Every inventory item is cataloged with a unique item code, standard product name, category, unit of measurement, current stock quantity, minimum threshold, active status, and physical stock register reference (Document Code and Page Number). Multiple document references and administrative remarks can be associated with each product to maintain a complete historical paper-trail."
    )

    add_section_heading("4. Incoming Stock Management (Purchases)")
    add_body_p(
        "The Purchase module handles inward material receipts. Administrators enter purchase orders, invoice numbers, supplier names, unit prices, purchase quantities, and physical register page references. Submitting a purchase automatically increments the product's live stock quantity and logs a 'PURCHASE' transaction in the immutable ledger."
    )

    add_section_heading("5. Outgoing Stock Management (Transfers & Department Issuances)")
    add_body_p(
        "The Transfer module records the issuance of materials to academic departments and laboratories. The system verifies that requested quantities do not exceed available on-hand stock, decrements inventory atomically, records receiver details and issue purposes, and logs a 'TRANSFER' ledger transaction."
    )

    add_section_heading("6. Hardware Indent Lifecycle & Approval Engine")
    add_body_p(
        "Faculty members initiate hardware requisitions by creating multi-item indents specifying required dates, priority levels, and justifications. Administrators review indents in a centralized queue, approving, rejecting, or issuing items with remarks. Fulfilling an indent automatically deducts stock, creates transfer records, and dispatches in-app notifications to the requester."
    )

    add_section_heading("7. Physical Indent Format Support")
    add_body_p(
        "To bridge digital workflows with institutional paper protocol, the system provides a printable Physical Indent format. This allows faculty to generate formal requisition printouts matching institutional stationery, complete with signature blocks for Recommending Authority, HOD, Store Keeper, and Principal."
    )

    add_section_heading("8. Immutable Transaction Audit Ledger")
    add_body_p(
        "All stock movements (INITIAL, PURCHASE, TRANSFER, ADJUSTMENT) are committed to the stock_transactions table. Each record captures unique transaction codes, previous quantity, new quantity, delta quantity, department reference, user ID, and timestamp, guaranteeing complete traceability for audit compliance."
    )

    add_section_heading("9. Executive Dashboards, Low Stock Alerts & Document Exports")
    add_body_p(
        "The executive dashboard renders live KPI cards (Total Products, Total Inventory Valuation, Low Stock Alerts, Pending Indents, Recent Transfers). The reporting engine provides dynamic date and category filtering with multi-format streaming export to Excel (.xlsx) and printable PDF documents."
    )
    doc.add_page_break()

    # ==================== CHAPTER 4 ====================
    add_chapter_heading(4, "CLASS DIAGRAM")
    add_body_p(
        "The UML Class Diagram illustrates the object-oriented architectural design of the Electrical and Computer Hardware Stock Management System. It models the core domain entities, structural attributes, access visibilities, controller contracts, and entity relationships established in the Node.js backend and Sequelize/MySQL persistence layer."
    )
    
    add_image_box(
        os.path.join(diagrams_dir, "class_diagram.png"),
        width_inches=6.4,
        caption="fig 4.1 Detailed UML Class Diagram of Electrical & Hardware Stock Management System"
    )

    add_body_p(
        "As depicted in Figure 4.1, the User entity encapsulates authentication credentials, roles, and department affiliations. The Product entity serves as the central domain model, maintaining relational foreign keys to Category, Unit, and StockDocument. Specialized entities including ProductDocumentReference and ProductRemark allow tracking physical register page allocations and maintenance notes. Stock movements are governed by Purchase, Transfer, and StockTransaction entities. The Indent and IndentItem classes orchestrate faculty requisition workflows, linking requisitions directly to stock fulfillment and user notifications."
    )
    doc.add_page_break()

    # ==================== CHAPTER 5 ====================
    add_chapter_heading(5, "TABLE STRUCTURES")
    add_body_p(
        "The database schema is implemented on MySQL 8.0 with InnoDB storage engine, enforcing strict foreign key constraints, unique indexes, and cascading referential integrity. The complete schema comprises 15 relational tables:"
    )

    tables_spec = [
        ("Roles Table (roles)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("name", "varchar(30)", "NO", "UNI", "NULL", ""),
            ("description", "varchar(255)", "YES", "", "NULL", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Departments Table (departments)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("name", "varchar(150)", "NO", "UNI", "NULL", ""),
            ("code", "varchar(30)", "NO", "UNI", "NULL", ""),
            ("description", "varchar(255)", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Categories Table (categories)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("name", "varchar(150)", "NO", "UNI", "NULL", ""),
            ("description", "text", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Units Table (units)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("name", "varchar(100)", "NO", "UNI", "NULL", ""),
            ("symbol", "varchar(30)", "NO", "", "NULL", ""),
            ("description", "varchar(255)", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Stock Documents Table (stock_documents)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("document_code", "varchar(50)", "NO", "UNI", "NULL", ""),
            ("document_name", "varchar(150)", "NO", "", "NULL", ""),
            ("description", "varchar(255)", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Users Table (users)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("username", "varchar(100)", "NO", "UNI", "NULL", ""),
            ("password", "varchar(255)", "NO", "", "NULL", ""),
            ("name", "varchar(150)", "NO", "", "NULL", ""),
            ("email", "varchar(255)", "NO", "UNI", "NULL", ""),
            ("role_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> roles(id)"),
            ("department_id", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> departments(id)"),
            ("avatar_text", "varchar(10)", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Products Table (products)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("product_code", "varchar(50)", "NO", "UNI", "NULL", ""),
            ("product_name", "varchar(255)", "NO", "", "NULL", ""),
            ("name", "varchar(255)", "YES", "", "NULL", ""),
            ("description", "text", "YES", "", "NULL", ""),
            ("category_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> categories(id)"),
            ("unit_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> units(id)"),
            ("current_quantity", "decimal(12,2)", "NO", "", "0.00", ""),
            ("minimum_quantity", "decimal(12,2)", "NO", "", "0.00", ""),
            ("stock_register_id", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> stock_documents(id)"),
            ("page_number", "int(10) unsigned", "YES", "", "NULL", ""),
            ("status", "varchar(30)", "NO", "", "'ACTIVE'", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_by", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> users(id)"),
            ("updated_by", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> users(id)"),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Product Document References Table (product_document_references)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("product_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> products(id) ON DELETE CASCADE"),
            ("stock_document_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> stock_documents(id)"),
            ("stock_document_name", "varchar(150)", "YES", "", "NULL", ""),
            ("page_number", "int(10) unsigned", "YES", "", "NULL", ""),
            ("reference_note", "varchar(255)", "YES", "", "NULL", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Product Remarks Table (product_remarks)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("product_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> products(id) ON DELETE CASCADE"),
            ("remark", "text", "NO", "", "NULL", ""),
            ("created_by", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> users(id)"),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Purchases Table - Incoming Stock (purchases)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("purchase_number", "varchar(50)", "NO", "UNI", "NULL", ""),
            ("product_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> products(id)"),
            ("quantity", "decimal(12,2)", "NO", "", "NULL", ""),
            ("unit_price", "decimal(12,2)", "YES", "", "NULL", ""),
            ("total_amount", "decimal(14,2)", "YES", "", "NULL", ""),
            ("supplier", "varchar(255)", "YES", "", "NULL", ""),
            ("invoice_number", "varchar(100)", "YES", "", "NULL", ""),
            ("purchase_date", "date", "NO", "", "NULL", ""),
            ("stock_register_id", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> stock_documents(id)"),
            ("page_number", "int(10) unsigned", "YES", "", "NULL", ""),
            ("remarks", "text", "YES", "", "NULL", ""),
            ("recorded_by", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> users(id)"),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Transfers Table - Outgoing Stock (transfers)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("transfer_number", "varchar(50)", "NO", "UNI", "NULL", ""),
            ("product_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> products(id)"),
            ("quantity", "decimal(12,2)", "NO", "", "NULL", ""),
            ("department_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> departments(id)"),
            ("issued_to", "varchar(150)", "YES", "", "NULL", ""),
            ("issued_by", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> users(id)"),
            ("purpose", "varchar(255)", "YES", "", "NULL", ""),
            ("transfer_date", "date", "NO", "", "NULL", ""),
            ("stock_register_id", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> stock_documents(id)"),
            ("page_number", "int(10) unsigned", "YES", "", "NULL", ""),
            ("remarks", "text", "YES", "", "NULL", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Stock Transactions Table - Audit Ledger (stock_transactions)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("transaction_code", "varchar(50)", "NO", "UNI", "NULL", ""),
            ("product_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> products(id)"),
            ("transaction_type", "varchar(30)", "NO", "MUL", "NULL", "'PURCHASE','TRANSFER','INITIAL'"),
            ("quantity", "decimal(12,2)", "NO", "", "NULL", ""),
            ("previous_quantity", "decimal(12,2)", "NO", "", "NULL", ""),
            ("new_quantity", "decimal(12,2)", "NO", "", "NULL", ""),
            ("department_id", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> departments(id)"),
            ("reference_id", "int(10) unsigned", "YES", "", "NULL", ""),
            ("reference_type", "varchar(50)", "YES", "", "NULL", ""),
            ("remarks", "text", "YES", "", "NULL", ""),
            ("transaction_date", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("recorded_by", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> users(id)"),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Indents Table (indents)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("indent_number", "varchar(50)", "NO", "UNI", "NULL", ""),
            ("department_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> departments(id)"),
            ("requested_by", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> users(id)"),
            ("status", "varchar(30)", "NO", "MUL", "'SUBMITTED'", "'SUBMITTED','APPROVED','ISSUED','REJECTED'"),
            ("remarks", "text", "YES", "", "NULL", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Indent Items Table (indent_items)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("indent_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> indents(id) ON DELETE CASCADE"),
            ("product_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> products(id)"),
            ("requested_quantity", "decimal(12,2)", "NO", "", "NULL", ""),
            ("approved_quantity", "decimal(12,2)", "NO", "", "0.00", ""),
            ("issued_quantity", "decimal(12,2)", "NO", "", "0.00", ""),
            ("remarks", "text", "YES", "", "NULL", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Notifications Table (notifications)", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("user_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> users(id) ON DELETE CASCADE"),
            ("type", "varchar(50)", "NO", "", "NULL", ""),
            ("title", "varchar(255)", "NO", "", "NULL", ""),
            ("message", "text", "NO", "", "NULL", ""),
            ("reference_id", "int(10) unsigned", "YES", "", "NULL", ""),
            ("reference_type", "varchar(50)", "YES", "", "NULL", ""),
            ("is_read", "tinyint(1)", "NO", "MUL", "0", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ])
    ]

    col_w_db = [1.2, 1.2, 0.6, 0.6, 1.2, 1.6]
    headers_db = ["Field", "Type", "Null", "Key", "Default", "Extra"]

    for title, rows in tables_spec:
        add_section_heading(title)
        tbl = doc.add_table(rows=1, cols=6)
        format_table(tbl, col_w_db, headers_db, rows)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    doc.add_page_break()

    # ==================== CHAPTER 6 ====================
    add_chapter_heading(6, "ER DIAGRAM")
    add_body_p(
        "The Entity-Relationship (ER) Diagram establishes the conceptual data architecture of the system. It delineates entity sets, primary identifier keys, foreign key associations, and cardinalities spanning master entities, inventory products, movements, and indent workflows."
    )
    
    add_image_box(
        os.path.join(diagrams_dir, "er_diagram.png"),
        width_inches=6.4,
        caption="fig 6.1 Complete Entity Relationship Diagram of Stock Management System"
    )

    add_body_p(
        "As illustrated in Figure 6.1, the database design enforces relational normalization (3NF):"
    )
    add_bullet_p(
        "One Department contains multiple Users (1:N), receives multiple Stock Transfers (1:N), and originates multiple Indents (1:N).",
        "• Department Relationships:"
    )
    add_bullet_p(
        "Each Product belongs to exactly one Category (N:1) and one Unit (N:1). A single product participates in multiple Purchases (1:N), Transfers (1:N), Stock Transactions (1:N), and Indent Items (1:N).",
        "• Product Relationships:"
    )
    add_bullet_p(
        "A physical StockDocument (Register) can be referenced by multiple Products, Purchases, and Transfers to guarantee physical book auditability.",
        "• Stock Document Relationships:"
    )
    add_bullet_p(
        "An Indent header aggregates multiple IndentItems in a composition relationship (1:N), ensuring items are cascaded upon deletion.",
        "• Indent Lifecycle Relationships:"
    )
    doc.add_page_break()

    # ==================== CHAPTER 7 ====================
    add_chapter_heading(7, "TECH STACK")
    add_body_p(
        "The technology stack is selected to provide high responsiveness, absolute data consistency, sub-second API latency, and complete operational security across both Electrical and Hardware subsystems."
    )

    tech_headers = ["Layer", "Technology", "Purpose"]
    tech_widths = [1.6, 2.0, 2.8]
    tech_rows = [
        ("Frontend Framework", "React.js 18 (Vite)", "Single-page application with modular, reactive components and fast HMR bundling"),
        ("Styling & Icons", "Tailwind CSS & Lucide Icons", "Utility-first CSS framework with responsive layout tokens and vector iconography"),
        ("State Management", "React Context API", "Decoupled global state for AuthContext, SystemContext, StockContext, and Notifications"),
        ("HTTP Client", "Axios", "RESTful communication with centralized JWT Bearer authentication interceptor"),
        ("Backend Server", "Node.js (v24) + Express.js (v5)", "Asynchronous, event-driven RESTful API server with modular route handlers"),
        ("Database Engine", "MySQL 8.0 (InnoDB)", "Relational database supporting ACID transactions, foreign keys, and connection pooling"),
        ("Database Driver", "mysql2 / Sequelize ORM", "High-performance promise-based SQL client driver with connection pooling"),
        ("Security & Auth", "JWT + BCrypt (cost 10)", "Stateless bearer token authentication and salted cryptographic password hashing"),
        ("Reporting Engine", "ExcelJS & PDFKit", "Streaming generation of formatted Microsoft Excel workbooks and styled printable PDFs"),
        ("Testing Framework", "Vitest & React Testing Library", "High-speed unit and integration testing suite verifying RBAC and stock workflows")
    ]

    tbl_tech = doc.add_table(rows=1, cols=3)
    format_table(tbl_tech, tech_widths, tech_headers, tech_rows)

    add_section_heading("System Architecture & Subsystem Isolation Flow")
    add_body_p(
        "The application architecture strictly separates the Electrical Consumables domain from the Computer Hardware domain, preventing accidental cross-contamination of stock registers while sharing a unified frontend experience."
    )
    add_image_box(
        os.path.join(diagrams_dir, "architecture_diagram.png"),
        width_inches=6.4,
        caption="fig 7.1 System Architecture and Dual-Subsystem Isolation Flow"
    )

    add_section_heading("UML Use Case Diagram")
    add_body_p(
        "The Use Case Diagram defines the operational boundaries and distinct capabilities available to System Administrators and Departmental Faculty coordinators."
    )
    add_image_box(
        os.path.join(diagrams_dir, "use_case_diagram.png"),
        width_inches=6.2,
        caption="fig 7.2 UML Use Case Diagram - Role-Based Capabilities"
    )
    doc.add_page_break()

    # ==================== CHAPTER 8 ====================
    add_chapter_heading(8, "MODULES")
    
    add_section_heading("8.1 Design Approach & Request Flow")
    add_body_p(
        "Every module follows a rigorous engineering lifecycle ensuring security, scalability, and audit compliance. The design process maps each requirement across functional boundaries, low-level architecture, database contracts, and verified user interfaces."
    )

    add_image_box(
        os.path.join(diagrams_dir, "activity_diagram.png"),
        width_inches=6.2,
        caption="fig 8.1 UML Activity Diagram - Material Movement & Indent Processing Lifecycle"
    )

    add_image_box(
        os.path.join(diagrams_dir, "sequence_diagram.png"),
        width_inches=6.2,
        caption="fig 8.2 UML Sequence Diagram - Indent Requisition & Stock Issuance Workflow"
    )

    design_headers = ["Step", "Question it answers", "Presented in each module as"]
    design_widths = [1.8, 2.8, 1.8]
    design_rows = [
        ("1. Functional requirements", "What must the module do?", "Section 8.x.1"),
        ("2. Non-functional requirements", "How fast, concurrent, and secure must it operate?", "Section 8.x.2"),
        ("3. Tech stack", "Which libraries and tools suit this domain?", "Section 8.x.3"),
        ("4. Low-level architecture", "How do client, controller, service, and DB interact?", "Section 8.x.4"),
        ("5. API Design", "What are the RESTful HTTP endpoint contracts?", "Section 8.x.5"),
        ("6. DB Design", "Which tables, foreign keys, and indexes are used?", "Section 8.x.6"),
        ("7. Screenshots & UI", "How is the verified user interface rendered?", "Section 8.x.7")
    ]
    tbl_design = doc.add_table(rows=1, cols=3)
    format_table(tbl_design, design_widths, design_headers, design_rows)

    add_section_heading("8.2 Folder Structure")
    add_body_p(
        "The project follows a clean decoupled directory layout separating backend Express servers from the React frontend SPA:"
    )
    add_bullet_p("Contains server.js, app.js, controllers, models, routes, middleware, and services for Electrical Consumables (port 5050).", "• StockManagement/server/:")
    add_bullet_p("Contains the backend server and services for Computer Hardware Management (port 5051).", "• ComputerHardwareManagement/server/:")
    add_bullet_p("Houses the unified React 18 SPA with src/pages, src/components, src/context, src/routes, and src/services.", "• ComputerHardwareManagement/src/:")

    doc.add_page_break()

    # --- 8.3 AUTH MODULE ---
    add_section_heading("8.3 USER AUTHENTICATION & ROLE-BASED ACCESS CONTROL")
    add_subsection_heading("8.3.1 Purpose & Scope")
    add_body_p(
        "The Authentication & RBAC module governs identity verification, token issuance, and privilege enforcement across both Electrical and Hardware subsystems. It isolates administrative permissions from faculty self-service."
    )
    add_subsection_heading("8.3.2 Functional Requirements")
    add_bullet_p("Authenticate users using unique username and password credentials.", "• User Login:")
    add_bullet_p("Generate signed JWT tokens (24-hour expiration) containing user ID, username, and role ID.", "• Stateless Token Issuance:")
    add_bullet_p("Ensure Admin users can access both Electrical and Hardware subsystems.", "• Admin Privilege Matrix:")
    add_bullet_p("Enforce that Faculty users can access ONLY the Hardware subsystem, blocking Electrical requests with 403 Forbidden.", "• Faculty Access Restriction:")

    add_subsection_heading("8.3.3 Non-Functional Requirements")
    add_bullet_p("Login authentication resolves in < 200 ms under typical campus network loads.", "• Latency:")
    add_bullet_p("Passwords hashed with BCrypt (cost factor 10). Cryptographic tokens verified on every inbound request.", "• Security:")

    add_subsection_heading("8.3.4 Tech Stack")
    t_w = [1.8, 1.8, 2.8]
    t_h = ["Concern", "Choice", "Why it fits this module"]
    t_r = [
        ("Password Security", "bcryptjs (10 salt rounds)", "Cryptographically secure key derivation resistant to brute-force attacks"),
        ("Session Management", "JSON Web Tokens (JWT, 24 h)", "Stateless bearer authentication eliminating server-side session overhead"),
        ("Client Protection", "RoleRoute & ProtectedRoute", "React Router higher-order guards intercepting unauthorized URL navigation")
    ]
    tbl = doc.add_table(rows=1, cols=3); format_table(tbl, t_w, t_h, t_r)

    add_subsection_heading("8.3.5 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_3_auth.png"), width_inches=6.0, caption="fig 8.3 Low-level architecture – USER AUTHENTICATION & ACCESS CONTROL")

    add_subsection_heading("8.3.6 API Design")
    api_w = [1.2, 2.4, 2.8]
    api_h = ["Method", "Endpoint", "Purpose / Contract"]
    api_r = [
        ("POST", "/api/auth/login", "Public login endpoint. Validates credentials, returns JWT token and user profile"),
        ("GET", "/api/auth/me", "Token-protected endpoint. Returns current authenticated user profile and roles"),
        ("GET", "/api/auth/users", "Admin-protected endpoint. Returns list of all registered system users and statuses")
    ]
    tbl_api = doc.add_table(rows=1, cols=3); format_table(tbl_api, api_w, api_h, api_r)

    add_subsection_heading("8.3.7 DB Design")
    db_w = [1.8, 2.0, 2.6]
    db_h = ["Table", "Keys & Indexes", "Key Columns"]
    db_r = [
        ("users", "PK: id, UNI: username, email", "username, password, name, email, role_id, department_id, active"),
        ("roles", "PK: id, UNI: name", "id, name (ADMIN, FACULTY), description")
    ]
    tbl_db = doc.add_table(rows=1, cols=3); format_table(tbl_db, db_w, db_h, db_r)

    add_subsection_heading("8.3.8 Screenshots")
    add_screenshot_placeholder("Login Interface", "/login", "User credential login form with subsystem brand headers and validation toasts.", "fig 8.4 User Login & Authentication Interface")
    add_screenshot_placeholder("System Selection Portal", "/select-system", "Dual-subsystem chooser allowing administrators to toggle between Electrical and Hardware modules.", "fig 8.5 Subsystem Selection Portal")

    doc.add_page_break()

    # --- 8.4 MASTER DATA MANAGEMENT ---
    add_section_heading("8.4 MASTER DATA MANAGEMENT")
    add_subsection_heading("8.4.1 Purpose & Scope")
    add_body_p(
        "Master Data Management establishes standardized reference catalogs for Academic Departments, Material Categories, Measurement Units, and Physical Stock Document Registers."
    )
    add_subsection_heading("8.4.2 Functional Requirements")
    add_bullet_p("Maintain academic department codes (CSE, IT, EEE, ECE, MECH, CIVIL) and active states.", "• Department Master:")
    add_bullet_p("Organize items into distinct categories (Cables, Switchgear, Storage, Memory, Processors).", "• Category Master:")
    add_bullet_p("Standardize measurement units (Nos, Pkts, Meters, Rolls, Kg).", "• Unit Master:")
    add_bullet_p("Digitize physical stock register books (Document Code, Document Name, Description).", "• Stock Documents Register:")

    add_subsection_heading("8.4.3 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_4_master_data.png"), width_inches=6.0, caption="fig 8.6 Low-level architecture – MASTER DATA MANAGEMENT")

    add_subsection_heading("8.4.4 API Design")
    api_r4 = [
        ("GET / POST", "/api/departments", "Admin endpoint: List all departments or create a new department record"),
        ("PUT / DELETE", "/api/departments/:id", "Admin endpoint: Update department details or deactivate/delete department"),
        ("GET / POST", "/api/categories", "Admin endpoint: List all material categories or add new category"),
        ("GET / POST", "/api/units", "Admin endpoint: List measurement units or create new unit symbol"),
        ("GET / POST", "/api/stock-documents", "Admin endpoint: List physical register books or register new document")
    ]
    tbl_api4 = doc.add_table(rows=1, cols=3); format_table(tbl_api4, api_w, api_h, api_r4)

    add_subsection_heading("8.4.5 DB Design")
    db_r4 = [
        ("departments", "PK: id, UNI: name, code", "id, name, code, description, active"),
        ("categories", "PK: id, UNI: name", "id, name, description, active"),
        ("units", "PK: id, UNI: name", "id, name, symbol, description, active"),
        ("stock_documents", "PK: id, UNI: document_code", "id, document_code, document_name, description, active")
    ]
    tbl_db4 = doc.add_table(rows=1, cols=3); format_table(tbl_db4, db_w, db_h, db_r4)

    add_subsection_heading("8.4.6 Screenshots")
    add_screenshot_placeholder("Departments Master", "/departments", "Department list view with Add Department modal, Code, Name, and Status pills.", "fig 8.7 Department Master Management")
    add_screenshot_placeholder("Stock Registers Master", "/stock-registers", "Physical stock document registers directory with Document Code and Descriptions.", "fig 8.8 Physical Stock Registers Management")

    doc.add_page_break()

    # --- 8.5 PRODUCT CATALOG & STOCK INVENTORY ---
    add_section_heading("8.5 PRODUCT CATALOG & STOCK INVENTORY MANAGEMENT")
    add_subsection_heading("8.5.1 Purpose & Scope")
    add_body_p(
        "The Product Catalog coordinates the inventory repository for both Electrical consumables and Computer Hardware materials. It tracks live stock balances, minimum replenishment thresholds, physical register page numbers, and item remarks."
    )
    add_subsection_heading("8.5.2 Functional Requirements")
    add_bullet_p("Create, view, update, and search inventory items with unique product codes and names.", "• Product Management:")
    add_bullet_p("Link items to specific physical stock register books and page numbers.", "• Physical Register Referencing:")
    add_bullet_p("Flag items with ACTIVE / INACTIVE / LOW_STOCK statuses automatically.", "• Status Management:")
    add_bullet_p("Read-only catalog enabling faculty coordinators to check stock levels.", "• Faculty View:")

    add_subsection_heading("8.5.3 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_5_products.png"), width_inches=6.0, caption="fig 8.9 Low-level architecture – PRODUCT CATALOG MANAGEMENT")

    add_subsection_heading("8.5.4 API Design")
    api_r5 = [
        ("GET", "/api/products", "Fetch paginated, filtered list of products with search and category filters"),
        ("POST", "/api/products", "Admin: Create a new inventory product with initial quantities and register refs"),
        ("GET", "/api/products/:id/details", "Fetch complete product details including remarks and document references"),
        ("PUT / DELETE", "/api/products/:id", "Admin: Update product parameters or toggle active status")
    ]
    tbl_api5 = doc.add_table(rows=1, cols=3); format_table(tbl_api5, api_w, api_h, api_r5)

    add_subsection_heading("8.5.5 DB Design")
    db_r5 = [
        ("products", "PK: id, UNI: product_code, MUL: category_id, unit_id", "product_code, product_name, current_quantity, minimum_quantity, status"),
        ("product_document_references", "PK: id, MUL: product_id, stock_document_id", "product_id, stock_document_id, page_number, reference_note"),
        ("product_remarks", "PK: id, MUL: product_id", "product_id, remark, created_by, created_at")
    ]
    tbl_db5 = doc.add_table(rows=1, cols=3); format_table(tbl_db5, db_w, db_h, db_r5)

    add_subsection_heading("8.5.6 Screenshots")
    add_screenshot_placeholder("Product Catalog (Admin)", "/products", "Admin product table with item codes, category filters, current stock, min levels, and edit actions.", "fig 8.10 Admin Product Catalog & Stock Inventory")
    add_screenshot_placeholder("Faculty Product Catalog", "/faculty/catalog", "Faculty read-only catalog with search bar, category chips, and stock availability badges.", "fig 8.11 Faculty Product Catalog Workspace")

    doc.add_page_break()

    # --- 8.6 INCOMING STOCK (PURCHASE) ---
    add_section_heading("8.6 INCOMING STOCK (PURCHASE) MANAGEMENT")
    add_subsection_heading("8.6.1 Purpose & Scope")
    add_body_p(
        "The Incoming Stock module manages procurement entries and vendor receipts. Every inward entry increments inventory balances atomically and establishes an immutable audit entry."
    )
    add_subsection_heading("8.6.2 Functional Requirements")
    add_bullet_p("Capture purchase number, supplier name, invoice number, unit price, and purchase date.", "• Inward Data Capture:")
    add_bullet_p("Automatically increment current_quantity in products table by the purchased amount.", "• Atomic Inventory Increment:")
    add_bullet_p("Record purchase entry in physical stock register document and page number.", "• Register Cross-Referencing:")
    add_bullet_p("Append a 'PURCHASE' transaction record to stock_transactions ledger.", "• Ledger Commitment:")

    add_subsection_heading("8.6.3 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_6_purchase.png"), width_inches=6.0, caption="fig 8.12 Low-level architecture – INCOMING STOCK (PURCHASE) MANAGEMENT")

    add_subsection_heading("8.6.4 API Design")
    api_r6 = [
        ("GET", "/api/purchases", "Admin: Fetch historical purchase entries with supplier and date filters"),
        ("POST", "/api/purchases", "Admin: Record new purchase, update product stock, and log transaction"),
        ("POST", "/api/stock/incoming", "Alternative endpoint for direct stock inward adjustment with register ref")
    ]
    tbl_api6 = doc.add_table(rows=1, cols=3); format_table(tbl_api6, api_w, api_h, api_r6)

    add_subsection_heading("8.6.5 DB Design")
    db_r6 = [
        ("purchases", "PK: id, UNI: purchase_number, MUL: product_id", "purchase_number, product_id, quantity, unit_price, total_amount, supplier, invoice_number"),
        ("stock_transactions", "PK: id, UNI: transaction_code", "transaction_code, product_id, transaction_type='PURCHASE', quantity, new_quantity")
    ]
    tbl_db6 = doc.add_table(rows=1, cols=3); format_table(tbl_db6, db_w, db_h, db_r6)

    add_subsection_heading("8.6.6 Screenshots")
    add_screenshot_placeholder("Incoming Stock Form", "/purchases", "Purchase entry form with Supplier Name, Invoice Number, Quantity, Unit Price, and Register reference.", "fig 8.13 Incoming Stock (Purchase) Entry Interface")

    doc.add_page_break()

    # --- 8.7 OUTGOING STOCK (TRANSFER) ---
    add_section_heading("8.7 OUTGOING STOCK (TRANSFER) & DEPARTMENT ISSUANCE")
    add_subsection_heading("8.7.1 Purpose & Scope")
    add_body_p(
        "The Outgoing Stock module governs material issuances to academic departments and laboratories. It prevents over-issuance and maintains complete traceability of departed goods."
    )
    add_subsection_heading("8.7.2 Functional Requirements")
    add_bullet_p("Capture destination department, receiver name, transfer date, and issuance purpose.", "• Issuance Tracking:")
    add_bullet_p("Verify that requested quantity does not exceed current available stock balance.", "• Deficit Validation:")
    add_bullet_p("Atomically decrement current_quantity in products table.", "• Inventory Reduction:")
    add_bullet_p("Commit a 'TRANSFER' record to the stock_transactions ledger.", "• Audit Logging:")

    add_subsection_heading("8.7.3 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_7_transfer.png"), width_inches=6.0, caption="fig 8.14 Low-level architecture – OUTGOING STOCK (TRANSFER) MANAGEMENT")

    add_subsection_heading("8.7.4 API Design")
    api_r7 = [
        ("GET", "/api/transfers", "Admin: Fetch historical transfer and issuance records"),
        ("POST", "/api/transfers", "Admin: Record new department transfer, decrement stock, and log transaction"),
        ("POST", "/api/stock/outgoing", "Alternative endpoint for direct stock outward transfer")
    ]
    tbl_api7 = doc.add_table(rows=1, cols=3); format_table(tbl_api7, api_w, api_h, api_r7)

    add_subsection_heading("8.7.5 DB Design")
    db_r7 = [
        ("transfers", "PK: id, UNI: transfer_number, MUL: product_id, department_id", "transfer_number, product_id, department_id, quantity, issued_to, purpose, transfer_date"),
        ("stock_transactions", "PK: id, UNI: transaction_code", "transaction_code, product_id, transaction_type='TRANSFER', quantity, new_quantity")
    ]
    tbl_db7 = doc.add_table(rows=1, cols=3); format_table(tbl_db7, db_w, db_h, db_r7)

    add_subsection_heading("8.7.6 Screenshots")
    add_screenshot_placeholder("Outgoing Stock Screen", "/transfers", "Stock transfer modal with Department selector, Receiver field, Purpose, and Stock Availability check.", "fig 8.15 Outgoing Stock (Transfer) Issuance Workspace")

    doc.add_page_break()

    # --- 8.8 INDENT LIFECYCLE & APPROVAL ---
    add_section_heading("8.8 HARDWARE INDENT LIFECYCLE & APPROVAL WORKFLOW")
    add_subsection_heading("8.8.1 Purpose & Scope")
    add_body_p(
        "The Indent module digitizes the departmental requisition workflow for computer hardware materials. It bridges electronic requisition with formal institutional physical indent documentation."
    )
    add_subsection_heading("8.8.2 Functional Requirements")
    add_bullet_p("Faculty coordinators select multiple items, quantities, required date, priority, and purpose.", "• Requisition Creation:")
    add_bullet_p("Status progresses through SUBMITTED -> REVIEWED -> APPROVED / REJECTED -> ISSUED.", "• State Machine:")
    add_bullet_p("Issuing an indent automatically triggers an outward transfer and ledger update.", "• Stock Issuance Integration:")
    add_bullet_p("Generate printable physical indent forms formatted for physical signatures.", "• Physical Indent Support:")

    add_subsection_heading("8.8.3 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_8_indents.png"), width_inches=6.0, caption="fig 8.16 Low-level architecture – INDENT REQUISITION & APPROVAL WORKFLOW")

    add_subsection_heading("8.8.4 API Design")
    api_r8 = [
        ("POST", "/api/indents", "Faculty / Admin: Create multi-item hardware indent requisition"),
        ("GET", "/api/indents", "Fetch indents list (Admin sees all, Faculty sees own department indents)"),
        ("POST", "/api/indents/:id/approve", "Admin: Approve indent with remarks"),
        ("POST", "/api/indents/:id/issue", "Admin: Issue approved items, deducting stock and creating transfer records")
    ]
    tbl_api8 = doc.add_table(rows=1, cols=3); format_table(tbl_api8, api_w, api_h, api_r8)

    add_subsection_heading("8.8.5 DB Design")
    db_r8 = [
        ("indents", "PK: id, UNI: indent_number, MUL: department_id, requested_by", "indent_number, department_id, requested_by, status, remarks"),
        ("indent_items", "PK: id, MUL: indent_id, product_id", "indent_id, product_id, requested_quantity, approved_quantity, issued_quantity")
    ]
    tbl_db8 = doc.add_table(rows=1, cols=3); format_table(tbl_db8, db_w, db_h, db_r8)

    add_subsection_heading("8.8.6 Screenshots")
    add_screenshot_placeholder("Create Indent Screen", "/indents/create", "Multi-item indent form with item selection, quantity inputs, purpose, and required date.", "fig 8.17 Create Hardware Indent Requisition")
    add_screenshot_placeholder("Manage Indents Queue", "/indents", "Admin indent management register with approval status badges, review modal, and issue actions.", "fig 8.18 Manage Indents Approval Queue")
    add_screenshot_placeholder("Physical Indent Register View", "/indents/register", "Printable academic physical indent slip layout matching college register format.", "fig 8.19 Physical Indent Document Register Format")

    doc.add_page_break()

    # --- 8.9 DASHBOARD, LEDGER & ANALYTICS ---
    add_section_heading("8.9 EXECUTIVE DASHBOARD, STOCK HISTORY LEDGER & REPORTS")
    add_subsection_heading("8.9.1 Purpose & Scope")
    add_body_p(
        "The Analytics and Reporting module provides institutional leaders and administrators with high-level KPI oversight, sub-second transaction ledger querying, automated low-stock warnings, and multi-format document exports."
    )
    add_subsection_heading("8.9.2 Functional Requirements")
    add_bullet_p("Render real-time metric cards for Total Items, Valuation, Low Stock Alerts, and Active Indents.", "• Executive KPI Cards:")
    add_bullet_p("Query immutable historical ledger with date, category, and transaction-type filters.", "• Stock History Ledger:")
    add_bullet_p("Dedicated table highlighting items requiring immediate purchase replenishment.", "• Low Stock Monitoring:")
    add_bullet_p("Generate formatted Excel (.xlsx) and styled PDF summary reports on demand.", "• Document Exporting:")

    add_subsection_heading("8.9.3 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_9_dashboard.png"), width_inches=6.0, caption="fig 8.20 Low-level architecture – EXECUTIVE DASHBOARD & BUSINESS ANALYTICS")

    add_subsection_heading("8.9.4 API Design")
    api_r9 = [
        ("GET", "/api/dashboard", "Fetch aggregated KPI stats, low-stock counts, and recent transactions"),
        ("GET", "/api/stock-transactions", "Fetch paginated, filtered transaction ledger with audit details"),
        ("GET", "/api/reports", "Generate comprehensive filtered reports with Excel/PDF streaming")
    ]
    tbl_api9 = doc.add_table(rows=1, cols=3); format_table(tbl_api9, api_w, api_h, api_r9)

    add_subsection_heading("8.9.5 DB Design")
    db_r9 = [
        ("stock_transactions", "PK: id, UNI: transaction_code, MUL: product_id", "transaction_code, product_id, transaction_type, quantity, previous_quantity, new_quantity"),
        ("notifications", "PK: id, MUL: user_id, is_read", "user_id, title, message, type, is_read, created_at")
    ]
    tbl_db9 = doc.add_table(rows=1, cols=3); format_table(tbl_db9, db_w, db_h, db_r9)

    add_subsection_heading("8.9.6 Screenshots")
    add_screenshot_placeholder("Executive Dashboard", "/dashboard", "Analytics overview with KPI summary cards, stock movement bar charts, and quick-action buttons.", "fig 8.21 Executive KPI Dashboard Overview")
    add_screenshot_placeholder("Stock History Ledger", "/stock-history", "Reactive stock transaction ledger table with search, movement filter chips, and balance columns.", "fig 8.22 Stock History Transaction Ledger")
    add_screenshot_placeholder("Reports & Analytics Export", "/reports", "Customizable report filter panel with Export to Excel and Export to PDF action buttons.", "fig 8.23 Reports & Analytics Export Interface")

    doc.add_page_break()

    # ==================== CHAPTER 9 ====================
    add_chapter_heading(9, "CONCLUSION")
    add_body_p(
        "The Electrical and Computer Hardware Stock Management System delivers a robust, scalable, and secure digital platform for managing institutional inventory at National Engineering College. By enforcing strict subsystem isolation between Electrical consumables (port 5050, Admin-only) and Computer Hardware assets (port 5051, Admin and Faculty RBAC), the system guarantees operational security while eliminating data confusion."
    )
    add_body_p(
        "Key outcomes and verified system capabilities achieved include:"
    )
    add_bullet_p(
        "Eliminated paper requisition delays and manual record-keeping errors through real-time digital indent submission, administrative review, and automated item fulfillment.",
        "• Complete Process Digitization:"
    )
    add_bullet_p(
        "Maintained full alignment between digital database records and institutional physical stock registers through dedicated Document Reference and Page Number tracking.",
        "• Physical Register Alignment:"
    )
    add_bullet_p(
        "Every inward purchase, outward departmental transfer, and indent issuance commits an immutable transaction record to the ledger, guaranteeing zero untracked inventory depletion.",
        "• Immutable Audit Ledgering:"
    )
    add_bullet_p(
        "All 38 integration tests in the Electrical module and 57 integration tests in the Hardware module passed successfully under Vitest, verifying RBAC enforcement, stock calculations, and route protections.",
        "• Verified Code Reliability:"
    )
    add_body_p(
        "Future enhancements planned for the platform include barcode and QR-code scanning for rapid gate inward receipts, automated email/SMS alerts to department heads upon threshold breach, and predictive procurement forecasting using historical seasonal consumption trends."
    )

    # Re-apply page borders and footer references to all document sections
    for section in doc.sections:
        sectPr = section._sectPr
        # Remove old pgBorders if present to avoid duplication
        for old_pb in sectPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pgBorders'):
            sectPr.remove(old_pb)
        pgBorders = parse_xml(
            f'<w:pgBorders {nsdecls("w")} w:offsetFrom="page">'
            f'<w:top w:val="single" w:sz="6" w:space="24" w:color="000000"/>'
            f'<w:left w:val="single" w:sz="6" w:space="24" w:color="000000"/>'
            f'<w:bottom w:val="single" w:sz="6" w:space="24" w:color="000000"/>'
            f'<w:right w:val="single" w:sz="6" w:space="24" w:color="000000"/>'
            f'</w:pgBorders>'
        )
        sectPr.append(pgBorders)

        # Attach footer reference for page numbering if missing
        if not sectPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}footerReference'):
            footer_ref = parse_xml(f'<w:footerReference {nsdecls("w")} {nsdecls("r")} w:type="default" r:id="rId57"/>')
            sectPr.append(footer_ref)

    doc.save(output_path)
    print(f"REFINED REPORT SUCCESSFULLY GENERATED: {output_path}")

if __name__ == "__main__":
    refine_report_document()
