import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def build_perfect_report():
    template_path = '/Users/ani/Downloads/report mwt.docx'
    output_path = '/Users/ani/Desktop/EL/consumables/Electrical_and_Computer_Hardware_Stock_Management_System_Project_Report.docx'
    diagrams_dir = '/Users/ani/Desktop/EL/consumables/scratch/diagrams'

    shutil.copyfile(template_path, output_path)
    doc = docx.Document(output_path)

    # Helper XML functions
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
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
        ("9", "CONCLUSION", "52")
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

    # Clear paragraphs from Chapter 1 onwards
    body = doc._body._body
    p30_elem = doc.paragraphs[30]._p
    p30_idx = list(body).index(p30_elem)
    for elem in list(body)[p30_idx:]:
        body.remove(elem)

    # Helper text functions
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
        "Effective inventory and stock management within higher educational institutions is essential to the smooth operation of modern colleges and engineering departments. Institutions coordinate laboratories, research centers, and infrastructure maintenance across shared consumables and hardware assets. Handling procurement, stock allocations, material movement, and departmental indents through manual logbooks or paper-based slips is time-consuming, error-prone, and lacks transparency. The Electrical and Computer Hardware Stock Management System addresses these challenges with a unified digital platform for stock governance, vendor purchasing, departmental transfers, and indent requisitions at National Engineering College."
    )
    add_body_p(
        "The system strictly enforces role-based access control (RBAC) across two isolated subsystems: the Electrical Consumables Subsystem (hosted on backend port 5050 and connecting to the 'consumable_stock_management' database) and the Computer Hardware Subsystem (hosted on backend port 5051 and connecting to the 'hardware_stock_management' database). Administrators can access both subsystems with full permissions to manage master data, record incoming purchases, issue outgoing transfers, review indents, monitor low-stock thresholds, and stream formatted reports. Faculty members access exclusively the Hardware Subsystem, enabling them to browse real-time inventory levels, raise multi-item indent requisitions, track approval statuses, and generate printable physical indent forms."
    )
    add_body_p(
        "The application uses React 18, Vite, and Tailwind CSS for its unified frontend SPA, with a Node.js v24 and Express.js v5 backend. It stores normalized relational data in MySQL InnoDB with connection pooling via the mysql2 driver. JWT authentication and BCrypt password hashing protect all REST API endpoints. This report presents the system's architecture, object-oriented design baselines, database schema, REST API contracts, and user interface implementations."
    )
    doc.add_page_break()

    # ==================== CHAPTER 2 ====================
    add_chapter_heading(2, "OBJECTIVES")
    add_bullet_p(
        "Replace outdated paper-based requisition slips and physical register ledgers with an instant, centralized digital web reservation platform to enhance stock tracking accuracy, administrative efficiency, and institutional accessibility.",
        "• To Digitize Institutional Stock Operations:"
    )
    add_bullet_p(
        "Maintain structured, consistent, and validated master data records across academic departments (CSE, IT, ECE, EEE, MECH, CIVIL), material classifications (Cables, Switchgear, Lighting, Storage, Memory, Processors), measurement units (Nos, Pkts, Meters, Rolls, Kg), and physical stock document registers.",
        "• To Centralize Master Data Governance:"
    )
    add_bullet_p(
        "Maintain complete physical and logical separation between Electrical consumables (port 5050, Admin-only) and Computer Hardware inventory (port 5051, Admin + Faculty RBAC) to prevent unauthorized cross-domain access.",
        "• To Enforce Dual-Subsystem Isolation:"
    )
    add_bullet_p(
        "Secure all platform capabilities through JSON Web Token (JWT) stateless authentication and role-specific route guards, cleanly isolating administrative oversight privileges from faculty reservation self-service.",
        "• To Enforce Role-Based Access Control (RBAC):"
    )
    add_bullet_p(
        "Provide departmental faculty coordinators with an intuitive requisition interface to select items, specify quantities, priority, and purpose, with real-time status tracking (SUBMITTED, APPROVED, ISSUED, REJECTED).",
        "• To Streamline Hardware Indent Requisitions:"
    )
    add_bullet_p(
        "Ensure that every inward purchase, outward departmental transfer, and indent fulfillment automatically updates live product balances and writes immutable ledger records to the stock_transactions table.",
        "• To Enforce Real-Time Transaction Ledgering:"
    )
    add_bullet_p(
        "Automatically detect when item quantities fall at or below configured minimum thresholds, triggering visual warning badges and dedicated replenishment tables on the executive dashboard.",
        "• To Automate Low-Stock Alerting:"
    )
    add_bullet_p(
        "Enable one-click streaming export of customized stock reports, movement registers, and indent registers to formatted Excel spreadsheets and printable PDF documents for administrative compliance and audits.",
        "• To Support Multi-Format Reporting & Analytics:"
    )
    doc.add_page_break()

    # ==================== CHAPTER 3 ====================
    add_chapter_heading(3, "DESCRIPTION")
    add_body_p(
        "The Electrical and Computer Hardware Stock Management System is an enterprise-grade full-stack web application developed to coordinate, automate, and audit institutional inventory workflows at National Engineering College. The application is architected around five major functional domains:"
    )
    add_section_heading("1. Master Data & Reference Catalog Management")
    add_body_p(
        "This module establishes the foundational reference catalog for the entire institution. Administrators maintain academic departments (with unique department codes like CSE, IT, EEE, ECE, MECH, CIVIL), material classifications (Cables, Switchgear, Lighting, Storage, Memory, Processors), measurement units, and physical stock document registers. Each physical product record captures its item code, product name, unit price, current on-hand quantity, minimum safety threshold, active status, and mapped physical register book and page number via associative document reference tables. Maintaining structured master data ensures consistency across all inward and outward transactions."
    )

    add_section_heading("2. Inventory Tracking & Physical Document Register Linkage")
    add_body_p(
        "Every inventory item is cataloged with a unique item code, standard product name, category, unit of measurement, current stock quantity, minimum threshold, active status, and physical stock register reference (Document Code and Page Number). Multiple document references and administrative remarks can be associated with each product to maintain a complete historical paper-trail and guarantee alignment with institutional physical ledger registers."
    )

    add_section_heading("3. Stock Movement & Department Issuance Engine (Purchases & Transfers)")
    add_body_p(
        "The stock movement engine coordinates inward procurement receipts and outward departmental transfers. Purchases capture supplier details, invoice numbers, purchase quantities, unit prices, and physical register page references, automatically incrementing live inventory. Transfers record recipient departments, staff receivers, purposes, and register references, validating available balances and atomically decrementing stock while logging immutable audit records to the stock_transactions ledger."
    )

    add_section_heading("4. Hardware Indent Lifecycle & Approval Workflow")
    add_body_p(
        "The indent module governs the transition of hardware requisition states from 'SUBMITTED' to 'REVIEWED', 'APPROVED', 'REJECTED', or 'ISSUED'. Faculty members select multiple items, enter justifications, and submit requests. Administrators evaluate indents in a centralized queue with remarks. Fulfilling an indent automatically deducts stock, creates transfer records, and dispatches in-app notifications to the requester. A dedicated printable Physical Indent format generates official paper slips matching college register stationery."
    )

    add_section_heading("5. Security, System Isolation & Business Analytics")
    add_body_p(
        "System security is anchored on stateless JSON Web Token (JWT) authentication, password hashing using salted BCrypt (cost factor 10), and strict subsystem route guards. The reporting module provides dynamic query filtering across custom date ranges, departments, and categories. The report engine supports streaming downloads of multi-column Microsoft Excel (.xlsx) workbooks generated via ExcelJS and styled, printable PDF documents compiled via PDFKit."
    )
    doc.add_page_break()

    # ==================== CHAPTER 4 ====================
    add_chapter_heading(4, "CLASS DIAGRAM")
    add_image_box(
        os.path.join(diagrams_dir, "class_diagram.png"),
        width_inches=6.4,
        caption="fig 4.1 Detailed UML Class Diagram of Electrical & Computer Hardware Stock Management System"
    )
    add_body_p(
        "The UML Class Diagram illustrates the object-oriented architectural design of the Electrical and Computer Hardware Stock Management System, delineating domain models, structural attributes, access visibilities, and controller method contracts. The User entity encapsulates user identity, credentials, roles (ADMIN and FACULTY), and department affiliations. The Product entity models physical inventory items, linking to Category, Unit, and StockDocument, while mapping physical book page numbers via ProductDocumentReference. The Purchase, Transfer, and StockTransaction entities coordinate stock movements, maintaining complete transactional auditability. The Indent and IndentItem classes orchestrate faculty requisition workflows, linking requisitions directly to stock fulfillment and user notifications."
    )
    doc.add_page_break()

    # ==================== CHAPTER 5 ====================
    add_chapter_heading(5, "TABLE STRUCTURES")
    add_body_p(
        "The relational database schema is implemented on MySQL 8.0 using the InnoDB storage engine, enforcing primary keys, foreign key constraints, unique indexes, and automated timestamp tracking across all 15 tables:"
    )

    tables_spec = [
        ("Users :", [
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
        ("Roles :", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("name", "varchar(30)", "NO", "UNI", "NULL", ""),
            ("description", "varchar(255)", "YES", "", "NULL", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Departments :", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("name", "varchar(150)", "NO", "UNI", "NULL", ""),
            ("code", "varchar(30)", "NO", "UNI", "NULL", ""),
            ("description", "varchar(255)", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Categories :", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("name", "varchar(150)", "NO", "UNI", "NULL", ""),
            ("description", "text", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Units :", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("name", "varchar(100)", "NO", "UNI", "NULL", ""),
            ("symbol", "varchar(30)", "NO", "", "NULL", ""),
            ("description", "varchar(255)", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Stock_documents :", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("document_code", "varchar(50)", "NO", "UNI", "NULL", ""),
            ("document_name", "varchar(150)", "NO", "", "NULL", ""),
            ("description", "varchar(255)", "YES", "", "NULL", ""),
            ("active", "tinyint(1)", "NO", "", "1", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Products :", [
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
        ("Product_document_references :", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("product_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> products(id) ON DELETE CASCADE"),
            ("stock_document_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> stock_documents(id)"),
            ("stock_document_name", "varchar(150)", "YES", "", "NULL", ""),
            ("page_number", "int(10) unsigned", "YES", "", "NULL", ""),
            ("reference_note", "varchar(255)", "YES", "", "NULL", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Product_remarks :", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("product_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> products(id) ON DELETE CASCADE"),
            ("remark", "text", "NO", "", "NULL", ""),
            ("created_by", "int(10) unsigned", "YES", "MUL", "NULL", "FK -> users(id)"),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Purchases :", [
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
        ("Transfers :", [
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
        ("Stock_transactions :", [
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
        ("Indents :", [
            ("id", "int(10) unsigned", "NO", "PRI", "NULL", "auto_increment"),
            ("indent_number", "varchar(50)", "NO", "UNI", "NULL", ""),
            ("department_id", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> departments(id)"),
            ("requested_by", "int(10) unsigned", "NO", "MUL", "NULL", "FK -> users(id)"),
            ("status", "varchar(30)", "NO", "MUL", "'SUBMITTED'", "'SUBMITTED','APPROVED','ISSUED','REJECTED'"),
            ("remarks", "text", "YES", "", "NULL", ""),
            ("created_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", ""),
            ("updated_at", "datetime", "NO", "", "CURRENT_TIMESTAMP", "on update CURRENT_TIMESTAMP")
        ]),
        ("Indent_items :", [
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
        ("Notifications :", [
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
        add_subsection_heading(title)
        tbl = doc.add_table(rows=1, cols=6)
        format_table(tbl, col_w_db, headers_db, rows)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    doc.add_page_break()

    # ==================== CHAPTER 6 ====================
    add_chapter_heading(6, "ER DIAGRAM")
    add_image_box(
        os.path.join(diagrams_dir, "er_diagram.png"),
        width_inches=6.4,
        caption="fig 6.1 Complete Entity Relationship Diagram of Stock Management System"
    )
    add_body_p(
        "The Entity-Relationship (ER) Diagram establishes the conceptual data architecture of the system. It delineates entity sets, primary identifier keys, foreign key associations, and cardinalities spanning master entities, inventory products, movements, and indent workflows. As illustrated in Figure 6.1, the database design enforces relational normalization (3NF):"
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

    add_body_p(
        "The decoupled architecture pairs a React single-page application with two dedicated Express.js REST API servers (Port 5050 for Electrical Consumables and Port 5051 for Computer Hardware), ensuring strict subsystem isolation, responsive client interactions, and high transaction throughput."
    )
    doc.add_page_break()

    # ==================== CHAPTER 8 ====================
    add_chapter_heading(8, "MODULES")
    
    add_section_heading("8.1 Design Approach")
    add_body_p(
        "Every module follows a rigorous engineering lifecycle ensuring security, scalability, and audit compliance. The design process maps each requirement across functional boundaries, low-level architecture, database contracts, and verified user interfaces."
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_1_request_flow.png"),
        width_inches=6.2,
        caption="Fig 8.1 Overall request flow of the Stock Management System"
    )

    design_headers = ["Step", "Question it answers", "Presented in each module as"]
    design_widths = [1.8, 2.8, 1.8]
    design_rows = [
        ("1. Functional requirements", "What must the module do?", "Section 8.x.2"),
        ("2. Non-functional requirements", "How fast, concurrent, and secure must it operate?", "Section 8.x.3"),
        ("3. Tech stack", "Which tools suit this domain, and why?", "Section 8.x.4"),
        ("4. Estimation", "What are the storage, throughput, and memory bounds?", "Section 8.x.5"),
        ("5. Low-level architecture", "How do client, controller, service, and DB interact?", "Section 8.x.6"),
        ("6. API Design", "What are the RESTful HTTP endpoint contracts?", "Section 8.x.7"),
        ("7. DB Design", "Which tables, foreign keys, and indexes are used?", "Section 8.x.8"),
        ("8. Screenshots", "How is the verified user interface rendered?", "Section 8.x.9")
    ]
    tbl_design = doc.add_table(rows=1, cols=3)
    format_table(tbl_design, design_widths, design_headers, design_rows)

    add_section_heading("8.2 FOLDER STRUCTURE")
    add_body_p(
        "The project follows a clean decoupled directory layout separating backend Express servers from the React frontend SPA:"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_2_highlevel_view.png"),
        width_inches=6.2,
        caption="Fig 8.2 Highlevel view of project"
    )

    add_subsection_heading("8.2.1 BACKEND FOLDER")
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_3_backend_folder.png"),
        width_inches=6.2,
        caption="Fig 8.3 Backend Folder Structure – Overall organization of backend files showing modular architecture"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_4_config_folder.png"),
        width_inches=5.8,
        caption="Fig 8.4 config Folder structure"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_5_controller_folder.png"),
        width_inches=6.2,
        caption="Fig 8.5 Controller Folder"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_6_middleware_folder.png"),
        width_inches=5.8,
        caption="Fig 8.6 Middleware Folder Structure"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_7_model_service_folder.png"),
        width_inches=6.2,
        caption="Fig 8.7 Model & Service Folder Structure"
    )

    add_subsection_heading("8.2.2 FRONTEND FOLDER")
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_8_frontend_folder.png"),
        width_inches=6.2,
        caption="FIG 8.8 Structure of Frontend Folder"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_9_frontend_src.png"),
        width_inches=6.0,
        caption="Fig 8.9 Structure of frontend/src"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_10_pages_folder.png"),
        width_inches=6.4,
        caption="Fig 8.10 Structure of frontend/src/pages Folder"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_11_routes_api.png"),
        width_inches=6.0,
        caption="Fig 8.11 Structure of frontend/src/routes and frontend/src/services"
    )
    add_image_box(
        os.path.join(diagrams_dir, "fig_8_12_components.png"),
        width_inches=6.0,
        caption="Fig 8.12 Structure of frontend/src/components"
    )
    doc.add_page_break()

    # --- 8.3 AUTH MODULE ---
    add_section_heading("8.3 USER AUTHENTICATION & ACCESS CONTROL")
    add_subsection_heading("8.3.1 Purpose & Scope")
    add_body_p(
        "The User Authentication & Access Control module governs user identity verification, stateless token issuance, and granular privilege enforcement across both Electrical and Hardware subsystems. It cleanly isolates administrative oversight capabilities from faculty requisition self-service."
    )
    add_subsection_heading("8.3.2 Functional Requirements")
    add_bullet_p("Authenticate administrative and faculty users using unique username and password credentials.", "• Credential Verification:")
    add_bullet_p("Issue signed JSON Web Tokens (JWT) with 24-hour expiration containing user identity, role, and department IDs.", "• Stateless Token Issuance:")
    add_bullet_p("Grant System Administrators complete access to both Electrical (Port 5050) and Hardware (Port 5051) modules.", "• Administrative Full Access:")
    add_bullet_p("Restrict Faculty users strictly to the Hardware module, rejecting Electrical endpoint requests with HTTP 403 Forbidden.", "• Faculty Role Restriction:")

    add_subsection_heading("8.3.3 Non-Functional Requirements")
    add_bullet_p("Credential verification and token dispatch resolve in under 150 ms under concurrent laboratory peak logins.", "• Response Latency:")
    add_bullet_p("Passwords hashed using salted BCrypt (cost factor 10). Bearer tokens cryptographically verified on every request.", "• Cryptographic Security:")

    add_subsection_heading("8.3.4 Tech Stack")
    t_w = [1.8, 1.8, 2.8]
    t_h = ["Concern", "Choice", "Why it fits this module"]
    t_r = [
        ("Password Hashing", "bcryptjs (10 salt rounds)", "Cryptographically secure key derivation resistant to brute-force attacks"),
        ("Session Management", "JSON Web Tokens (JWT, 24 h)", "Stateless bearer authentication eliminating server-side session overhead"),
        ("Client Protection", "RoleRoute & ProtectedRoute", "React Router higher-order guards intercepting unauthorized URL navigation")
    ]
    tbl = doc.add_table(rows=1, cols=3); format_table(tbl, t_w, t_h, t_r)

    add_subsection_heading("8.3.5 Back-of-the-Envelope Estimation")
    est_w = [1.8, 1.8, 2.8]
    est_h = ["Quantity", "Estimate", "Basis"]
    est_r = [
        ("Registered Staff Users", "150 accounts", "Campus engineering faculty coordinators and store administrators"),
        ("Daily Login Operations", "300 requests / day", "Average 2 logins per staff member during institutional hours"),
        ("JWT Signature Verification", "< 1 ms per request", "In-memory symmetric key verification via jsonwebtoken library"),
        ("Token Storage Footprint", "200 bytes per token", "Stored in client localStorage and React AuthContext")
    ]
    tbl_est = doc.add_table(rows=1, cols=3); format_table(tbl_est, est_w, est_h, est_r)

    add_subsection_heading("8.3.6 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_3_auth.png"), width_inches=6.0, caption="Fig 8.13 Low-level architecture – USER AUTHENTICATION & ACCESS CONTROL")

    add_subsection_heading("8.3.7 API Design")
    api_w = [1.2, 2.4, 2.8]
    api_h = ["Method", "Endpoint", "Purpose / contract"]
    api_r = [
        ("POST", "/api/auth/login", "Public login endpoint. Validates credentials, returns JWT token and user profile"),
        ("GET", "/api/auth/me", "Token-protected endpoint. Returns current authenticated user profile and roles"),
        ("GET", "/api/auth/users", "Admin-protected endpoint. Returns list of all registered system users and statuses")
    ]
    tbl_api = doc.add_table(rows=1, cols=3); format_table(tbl_api, api_w, api_h, api_r)

    add_subsection_heading("8.3.8 DB Design")
    db_w = [1.8, 2.0, 2.6]
    db_h = ["Table", "Keys & indexes", "Key columns"]
    db_r = [
        ("users", "PK: id, UNI: username, email", "username, password, name, email, role_id, department_id, active"),
        ("roles", "PK: id, UNI: name", "id, name (ADMIN, FACULTY), description")
    ]
    tbl_db = doc.add_table(rows=1, cols=3); format_table(tbl_db, db_w, db_h, db_r)

    add_subsection_heading("8.3.9 Screenshots")
    add_screenshot_placeholder("User Login Interface", "/login", "Credential login form with subsystem brand headers, input validation, and alert toasts.", "fig 8.14 User Login & Authentication Interface")
    add_screenshot_placeholder("System Selection Portal", "/select-system", "Dual-subsystem chooser allowing administrators to toggle between Electrical and Hardware modules.", "fig 8.15 System Selection Portal")
    add_screenshot_placeholder("User Profile & Security", "/profile", "Staff profile overview showing personal details, department affiliation, and role permissions.", "fig 8.16 User Profile & Security Overview")
    doc.add_page_break()

    # --- 8.4 DEPARTMENT & FACULTY MASTER MANAGEMENT ---
    add_section_heading("8.4 DEPARTMENT & FACULTY MASTER MANAGEMENT")
    add_subsection_heading("8.4.1 Purpose & Scope")
    add_body_p(
        "The Department and Faculty Master Management module organizes academic departments, laboratory centers, and staff account directories across the college."
    )
    add_subsection_heading("8.4.2 Functional Requirements")
    add_bullet_p("Maintain academic departments (CSE, IT, ECE, EEE, MECH, CIVIL) with unique codes.", "• Department Directory:")
    add_bullet_p("Provision and manage faculty accounts with department mappings and status controls.", "• Staff Provisioning:")
    add_bullet_p("Prevent accidental deletion of departments referenced in transaction histories.", "• Referential Protection:")

    add_subsection_heading("8.4.3 Non-Functional Requirements")
    add_bullet_p("Department lists and faculty directories load in under 100 ms.", "• Throughput:")
    add_bullet_p("Atomic SQL transactions prevent orphan records upon department updates.", "• Integrity:")

    add_subsection_heading("8.4.4 Tech Stack")
    tbl_t4 = doc.add_table(rows=1, cols=3)
    format_table(tbl_t4, t_w, t_h, [
        ("Data Persistence", "MySQL InnoDB", "Relational foreign keys maintain strict department-user associations"),
        ("CRUD Controls", "Departments.jsx & Faculty.jsx", "Responsive modal dialogs with client validation and status badges")
    ])

    add_subsection_heading("8.4.5 Back-of-the-Envelope Estimation")
    tbl_e4 = doc.add_table(rows=1, cols=3)
    format_table(tbl_e4, est_w, est_h, [
        ("Academic Departments", "12 departments", "Covers all engineering, science, and administrative branches"),
        ("Faculty Accounts", "150 staff profiles", "Indexed on role_id and department_id for instant retrieval")
    ])

    add_subsection_heading("8.4.6 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_4_master_data.png"), width_inches=6.0, caption="Fig 8.17 Low-level architecture – DEPARTMENT & FACULTY MANAGEMENT")

    add_subsection_heading("8.4.7 API Design")
    tbl_a4 = doc.add_table(rows=1, cols=3)
    format_table(tbl_a4, api_w, api_h, [
        ("GET / POST", "/api/departments", "Admin: List all departments or create a new department record"),
        ("PUT / DELETE", "/api/departments/:id", "Admin: Update department details or deactivate department"),
        ("GET / POST", "/api/faculty", "Admin: Fetch faculty directory or provision new staff account")
    ])

    add_subsection_heading("8.4.8 DB Design")
    tbl_d4 = doc.add_table(rows=1, cols=3)
    format_table(tbl_d4, db_w, db_h, [
        ("departments", "PK: id, UNI: name, code", "id, name, code, description, active"),
        ("users", "PK: id, MUL: department_id", "id, username, name, email, department_id, active")
    ])

    add_subsection_heading("8.4.9 Screenshots")
    add_screenshot_placeholder("Department Master Management", "/departments", "Department list view with Add Department modal, Code, Name, and Status pills.", "fig 8.18 Department Master Management")
    add_screenshot_placeholder("Faculty Directory", "/faculty", "Faculty staff directory with department badges, email contacts, and account action buttons.", "fig 8.19 Faculty Directory & Management")
    add_screenshot_placeholder("Add Faculty Modal", "/faculty/new", "Modal form for provisioning staff credentials, selecting department, and assigning role.", "fig 8.20 Add Faculty Account Modal")
    doc.add_page_break()

    # --- 8.5 CATEGORY, UNIT & STOCK DOCUMENT REGISTER MANAGEMENT ---
    add_section_heading("8.5 CATEGORY, UNIT & STOCK DOCUMENT REGISTER MANAGEMENT")
    add_subsection_heading("8.5.1 Purpose & Scope")
    add_body_p(
        "This module establishes the foundational taxonomy for inventory items and physical stock register documents."
    )
    add_subsection_heading("8.5.2 Functional Requirements")
    add_bullet_p("Organize items into distinct categories (Cables, Switchgear, Storage, Memory, Processors).", "• Category Governance:")
    add_bullet_p("Standardize measurement units (Nos, Pkts, Meters, Rolls, Kg).", "• Unit Governance:")
    add_bullet_p("Digitize physical stock register books (Document Code, Document Name, Description).", "• Stock Register Governance:")

    add_subsection_heading("8.5.3 Non-Functional Requirements")
    add_bullet_p("Unique constraints enforced at the database level prevent duplicate codes.", "• Data Integrity:")
    add_bullet_p("Master tables cached in frontend context for sub-millisecond dropdown rendering.", "• Performance:")

    add_subsection_heading("8.5.4 Tech Stack")
    tbl_t5 = doc.add_table(rows=1, cols=3)
    format_table(tbl_t5, t_w, t_h, [
        ("Master Controller", "masterDataController.js", "Centralized handler for categories, units, and stock documents"),
        ("Context State", "StockContext.jsx", "Client-side state caching eliminating redundant network requests")
    ])

    add_subsection_heading("8.5.5 Back-of-the-Envelope Estimation")
    tbl_e5 = doc.add_table(rows=1, cols=3)
    format_table(tbl_e5, est_w, est_h, [
        ("Material Categories", "25 categories", "Spanning electrical consumables and computer hardware"),
        ("Measurement Units", "15 units", "Standard institutional measurement abbreviations"),
        ("Physical Stock Registers", "50 register books", "Mapped to historical physical college register ledgers")
    ])

    add_subsection_heading("8.5.6 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_4_master_data.png"), width_inches=6.0, caption="Fig 8.21 Low-level architecture – CATEGORY, UNIT & STOCK REGISTER MANAGEMENT")

    add_subsection_heading("8.5.7 API Design")
    tbl_a5 = doc.add_table(rows=1, cols=3)
    format_table(tbl_a5, api_w, api_h, [
        ("GET / POST", "/api/categories", "Admin: List material categories or add new category"),
        ("GET / POST", "/api/units", "Admin: List measurement units or create new unit symbol"),
        ("GET / POST", "/api/stock-documents", "Admin: List physical register books or register new document")
    ])

    add_subsection_heading("8.5.8 DB Design")
    tbl_d5 = doc.add_table(rows=1, cols=3)
    format_table(tbl_d5, db_w, db_h, [
        ("categories", "PK: id, UNI: name", "id, name, description, active"),
        ("units", "PK: id, UNI: name", "id, name, symbol, description, active"),
        ("stock_documents", "PK: id, UNI: document_code", "id, document_code, document_name, description, active")
    ])

    add_subsection_heading("8.5.9 Screenshots")
    add_screenshot_placeholder("Categories Master Directory", "/categories", "Item category management panel with Add Category modal and active item counts.", "fig 8.22 Categories Master Directory")
    add_screenshot_placeholder("Units Master Directory", "/units", "Measurement units management panel with Unit Name, Symbol, and Description.", "fig 8.23 Units of Measurement Master")
    add_screenshot_placeholder("Stock Registers Master", "/stock-registers", "Physical stock document registers directory with Document Code and Description.", "fig 8.24 Physical Stock Document Registers Master")
    doc.add_page_break()

    # --- 8.6 PRODUCT CATALOG & PHYSICAL REGISTER REFERENCE MANAGEMENT ---
    add_section_heading("8.6 PRODUCT CATALOG & PHYSICAL REGISTER REFERENCE MANAGEMENT")
    add_subsection_heading("8.6.1 Purpose & Scope")
    add_body_p(
        "The Product Catalog coordinates the inventory repository for both Electrical consumables and Computer Hardware materials. It tracks live stock balances, minimum replenishment thresholds, physical register page numbers, and item remarks."
    )
    add_subsection_heading("8.6.2 Functional Requirements")
    add_bullet_p("Create, view, update, and search inventory items with unique product codes and names.", "• Product Management:")
    add_bullet_p("Link items to specific physical stock register books and page numbers.", "• Physical Register Referencing:")
    add_bullet_p("Flag items with ACTIVE / INACTIVE / LOW_STOCK statuses automatically.", "• Status Management:")
    add_bullet_p("Read-only catalog enabling faculty coordinators to check stock levels.", "• Faculty View:")

    add_subsection_heading("8.6.3 Non-Functional Requirements")
    add_bullet_p("Product searches across thousands of items complete in < 50 ms via indexed SQL queries.", "• Search Latency:")
    add_bullet_p("Calculated on-hand stock quantities update in real time following transactions.", "• Consistency:")

    add_subsection_heading("8.6.4 Tech Stack")
    tbl_t6 = doc.add_table(rows=1, cols=3)
    format_table(tbl_t6, t_w, t_h, [
        ("Catalog Engine", "productController.js", "Handles paginated search, filter, and document reference joins"),
        ("Reactive UI", "Products.jsx & FacultyCatalog.jsx", "Real-time stock badges, search debouncing, and pagination controls")
    ])

    add_subsection_heading("8.6.5 Back-of-the-Envelope Estimation")
    tbl_e6 = doc.add_table(rows=1, cols=3)
    format_table(tbl_e6, est_w, est_h, [
        ("Total Catalog Items", "1,500 active products", "Spanning electrical components and hardware inventory"),
        ("Catalog Query Volume", "1,200 reads / day", "Faculty browsing and administrative stock audits")
    ])

    add_subsection_heading("8.6.6 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_5_products.png"), width_inches=6.0, caption="Fig 8.26 Low-level architecture – PRODUCT CATALOG & PHYSICAL REGISTER REFERENCE MANAGEMENT")

    add_subsection_heading("8.6.7 API Design")
    tbl_a6 = doc.add_table(rows=1, cols=3)
    format_table(tbl_a6, api_w, api_h, [
        ("GET", "/api/products", "Fetch paginated, filtered list of products with search and category filters"),
        ("POST", "/api/products", "Admin: Create a new inventory product with initial quantities and register refs"),
        ("GET", "/api/products/:id/details", "Fetch complete product details including remarks and document references")
    ])

    add_subsection_heading("8.6.8 DB Design")
    tbl_d6 = doc.add_table(rows=1, cols=3)
    format_table(tbl_d6, db_w, db_h, [
        ("products", "PK: id, UNI: product_code, MUL: category_id, unit_id", "product_code, product_name, current_quantity, minimum_quantity, status"),
        ("product_document_references", "PK: id, MUL: product_id, stock_document_id", "product_id, stock_document_id, page_number, reference_note"),
        ("product_remarks", "PK: id, MUL: product_id", "product_id, remark, created_by, created_at")
    ])

    add_subsection_heading("8.6.9 Screenshots")
    add_screenshot_placeholder("Admin Product Catalog", "/products", "Admin product table with item codes, category filters, current stock, and edit actions.", "fig 8.27 Admin Product Catalog & Stock Status")
    add_screenshot_placeholder("Product Document References", "/products/:id/references", "Modal dialog listing linked physical stock register document codes and page numbers.", "fig 8.28 Product Document References & Page Numbers")
    add_screenshot_placeholder("Product Remarks & Audit Notes", "/products/:id/remarks", "Product history remarks log capturing administrative notes and technical details.", "fig 8.29 Product Remarks & Audit Notes")
    doc.add_page_break()

    # --- 8.7 INCOMING STOCK (PURCHASE) & OUTGOING STOCK (TRANSFER) WORKFLOW ---
    add_section_heading("8.7 INCOMING STOCK (PURCHASE) & OUTGOING STOCK (TRANSFER) WORKFLOW")
    add_subsection_heading("8.7.1 Purpose & Scope")
    add_body_p(
        "This module coordinates material receipts from vendors (Purchases / Incoming Stock) and material issuances to academic departments (Transfers / Outgoing Stock)."
    )
    add_subsection_heading("8.7.2 Functional Requirements")
    add_bullet_p("Record purchase entries with supplier name, invoice number, unit price, and physical register page.", "• Purchase Inward Flow:")
    add_bullet_p("Record departmental transfers with recipient department, receiver staff name, and purpose.", "• Transfer Outward Flow:")
    add_bullet_p("Atomically update product current_quantity and commit audit records to stock_transactions.", "• Atomic Ledger Update:")

    add_subsection_heading("8.7.3 Non-Functional Requirements")
    add_bullet_p("Stock update operations executed inside ACID database transactions to prevent race conditions.", "• Concurrency:")
    add_bullet_p("Over-issuance requests are blocked with clear validation error messages.", "• Deficit Guard:")

    add_subsection_heading("8.7.4 Tech Stack")
    tbl_t7 = doc.add_table(rows=1, cols=3)
    format_table(tbl_t7, t_w, t_h, [
        ("Transaction Service", "stockService.js", "Encapsulates inventory increments, decrements, and ledger writes"),
        ("Movement Modals", "IncomingStock.jsx & Transfer.jsx", "Streamlined inward and outward material logging interfaces")
    ])

    add_subsection_heading("8.7.5 Back-of-the-Envelope Estimation")
    tbl_e7 = doc.add_table(rows=1, cols=3)
    format_table(tbl_e7, est_w, est_h, [
        ("Monthly Inward Purchases", "50 purchase entries", "Vendor deliveries for engineering laboratory stock"),
        ("Monthly Outward Transfers", "200 department issues", "Materials dispatched for laboratory experiments and maintenance")
    ])

    add_subsection_heading("8.7.6 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_6_purchase.png"), width_inches=6.0, caption="Fig 8.28 Low-level architecture – INCOMING STOCK & OUTGOING STOCK WORKFLOW")

    add_subsection_heading("8.7.7 API Design")
    tbl_a7 = doc.add_table(rows=1, cols=3)
    format_table(tbl_a7, api_w, api_h, [
        ("POST", "/api/purchases", "Admin: Record purchase, increment product stock, and log transaction"),
        ("POST", "/api/transfers", "Admin: Record transfer, decrement product stock, and log transaction"),
        ("GET", "/api/stock-transactions", "Fetch complete historical audit ledger of all stock movements")
    ])

    add_subsection_heading("8.7.8 DB Design")
    tbl_d7 = doc.add_table(rows=1, cols=3)
    format_table(tbl_d7, db_w, db_h, [
        ("purchases", "PK: id, UNI: purchase_number, MUL: product_id", "purchase_number, product_id, quantity, unit_price, total_amount, supplier"),
        ("transfers", "PK: id, UNI: transfer_number, MUL: product_id, department_id", "transfer_number, product_id, department_id, quantity, issued_to, purpose"),
        ("stock_transactions", "PK: id, UNI: transaction_code", "transaction_code, product_id, transaction_type, quantity, new_quantity")
    ])

    add_subsection_heading("8.7.9 Screenshots")
    add_screenshot_placeholder("Incoming Stock Form", "/purchases", "Purchase entry form with Supplier, Invoice, Quantity, Unit Price, and Register reference.", "fig 8.30 Incoming Stock Purchase Entry Form")
    add_screenshot_placeholder("Purchases Register", "/purchases/history", "Table of historical purchase vouchers with supplier breakdown and date filters.", "fig 8.31 Purchases Register & Supplier Records")
    add_screenshot_placeholder("Outgoing Stock Modal", "/transfers", "Stock transfer modal with Department selector, Receiver field, and Purpose input.", "fig 8.32 Outgoing Stock Transfer Modal")
    add_screenshot_placeholder("Department Issuance Register", "/transfers/history", "Register of historical stock transfers issued to campus departments and labs.", "fig 8.33 Department Stock Issuance Register")
    doc.add_page_break()

    # --- 8.8 HARDWARE INDENT REQUISITION, APPROVAL & PHYSICAL REGISTER WORKFLOW ---
    add_section_heading("8.8 HARDWARE INDENT REQUISITION, APPROVAL & PHYSICAL REGISTER WORKFLOW")
    add_subsection_heading("8.8.1 Purpose & Scope")
    add_body_p(
        "The Indent module digitizes the departmental requisition workflow for computer hardware materials. It bridges electronic requisition with formal institutional physical indent documentation."
    )
    add_subsection_heading("8.8.2 Functional Requirements")
    add_bullet_p("Faculty coordinators select multiple items, quantities, required date, priority, and purpose.", "• Requisition Creation:")
    add_bullet_p("Status progresses through SUBMITTED -> REVIEWED -> APPROVED / REJECTED -> ISSUED.", "• State Machine:")
    add_bullet_p("Issuing an indent automatically triggers an outward transfer and ledger update.", "• Stock Issuance Integration:")
    add_bullet_p("Generate printable physical indent forms formatted for physical signatures.", "• Physical Indent Support:")

    add_subsection_heading("8.8.3 Non-Functional Requirements")
    add_bullet_p("Indent state transitions propagate instant in-app alerts to requesters.", "• Notification Latency:")
    add_bullet_p("Printable physical slips render in under 1 second matching institutional paper registers.", "• Print Readiness:")

    add_subsection_heading("8.8.4 Tech Stack")
    tbl_t8 = doc.add_table(rows=1, cols=3)
    format_table(tbl_t8, t_w, t_h, [
        ("Workflow Controller", "indentController.js", "Manages state transitions, item approvals, and stock issuance hooks"),
        ("Indent Forms", "CreateIndent.jsx & ManageIndents.jsx", "Multi-item dynamic row form and administrative approval workspace")
    ])

    add_subsection_heading("8.8.5 Back-of-the-Envelope Estimation")
    tbl_e8 = doc.add_table(rows=1, cols=3)
    format_table(tbl_e8, est_w, est_h, [
        ("Semester Indent Requests", "120 requisitions", "Raised by department coordinators across academic semesters"),
        ("Items Per Indent", "3 to 8 items", "Consolidated hardware requisitions for laboratory batches")
    ])

    add_subsection_heading("8.8.6 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_8_indents.png"), width_inches=6.0, caption="Fig 8.33 Low-level architecture – INDENT REQUISITION & APPROVAL WORKFLOW")

    add_subsection_heading("8.8.7 API Design")
    tbl_a8 = doc.add_table(rows=1, cols=3)
    format_table(tbl_a8, api_w, api_h, [
        ("POST", "/api/indents", "Faculty / Admin: Create multi-item hardware indent requisition"),
        ("GET", "/api/indents", "Fetch indents list (Admin sees all, Faculty sees own department indents)"),
        ("POST", "/api/indents/:id/approve", "Admin: Approve indent with administrative remarks"),
        ("POST", "/api/indents/:id/issue", "Admin: Issue approved items, deducting stock and creating transfer records")
    ])

    add_subsection_heading("8.8.8 DB Design")
    tbl_d8 = doc.add_table(rows=1, cols=3)
    format_table(tbl_d8, db_w, db_h, [
        ("indents", "PK: id, UNI: indent_number, MUL: department_id, requested_by", "indent_number, department_id, requested_by, status, remarks"),
        ("indent_items", "PK: id, MUL: indent_id, product_id", "indent_id, product_id, requested_quantity, approved_quantity, issued_quantity")
    ])

    add_subsection_heading("8.8.9 Screenshots")
    add_screenshot_placeholder("Create Hardware Indent Form", "/indents/create", "Multi-item indent form with item selection, quantity inputs, purpose, and required date.", "fig 8.34 Faculty Multi-Item Indent Requisition Form")
    add_screenshot_placeholder("Faculty My Indents Tracker", "/indents/my", "Status tracking register showing submitted indents with color-coded status badges.", "fig 8.35 Faculty My Indents Tracker")
    add_screenshot_placeholder("Admin Indent Approval Queue", "/indents", "Admin review queue with Approve, Reject, and Issue buttons, with remarks modals.", "fig 8.36 Admin Indent Review & Approval Queue")
    add_screenshot_placeholder("Physical Indent Slip View", "/indents/register", "Printable academic physical indent slip layout matching college register format.", "fig 8.37 Physical Indent Document Register Slip")
    doc.add_page_break()

    # --- 8.9 EXECUTIVE DASHBOARD, STOCK HISTORY LEDGER & BUSINESS ANALYTICS ---
    add_section_heading("8.9 EXECUTIVE DASHBOARD, STOCK HISTORY LEDGER & BUSINESS ANALYTICS")
    add_subsection_heading("8.9.1 Purpose & Scope")
    add_body_p(
        "The Analytics and Reporting module provides institutional leaders and administrators with high-level KPI oversight, sub-second transaction ledger querying, automated low-stock warnings, and multi-format document exports."
    )
    add_subsection_heading("8.9.2 Functional Requirements")
    add_bullet_p("Render real-time metric cards for Total Items, Valuation, Low Stock Alerts, and Active Indents.", "• Executive KPI Cards:")
    add_bullet_p("Query immutable historical ledger with date, category, and transaction-type filters.", "• Stock History Ledger:")
    add_bullet_p("Dedicated table highlighting items requiring immediate purchase replenishment.", "• Low Stock Monitoring:")
    add_bullet_p("Generate formatted Excel (.xlsx) and styled PDF summary reports on demand.", "• Document Exporting:")

    add_subsection_heading("8.9.3 Non-Functional Requirements")
    add_bullet_p("Executive dashboard aggregates compute in < 80 ms via optimized SQL aggregation queries.", "• Aggregation Speed:")
    add_bullet_p("Report generation streams file downloads directly to the browser without server disk bottlenecks.", "• Streaming:")

    add_subsection_heading("8.9.4 Tech Stack")
    tbl_t9 = doc.add_table(rows=1, cols=3)
    format_table(tbl_t9, t_w, t_h, [
        ("Reporting Service", "ExcelJS & PDFKit", "Generates styled multi-column Excel workbooks and paginated PDF documents"),
        ("Analytics View", "Dashboard.jsx & Reports.jsx", "Dynamic KPI metric widgets, filter bars, and export action buttons")
    ])

    add_subsection_heading("8.9.5 Back-of-the-Envelope Estimation")
    tbl_e9 = doc.add_table(rows=1, cols=3)
    format_table(tbl_e9, est_w, est_h, [
        ("Transaction Ledger Records", "10,000+ entries", "Historical immutable stock movement log records"),
        ("Generated Export Reports", "50 reports / month", "Monthly institutional compliance and departmental audits")
    ])

    add_subsection_heading("8.9.6 Low-Level Architecture")
    add_image_box(os.path.join(diagrams_dir, "arch_8_9_dashboard.png"), width_inches=6.0, caption="Fig 8.37 Low-level architecture – EXECUTIVE DASHBOARD & BUSINESS ANALYTICS")

    add_subsection_heading("8.9.7 API Design")
    tbl_a9 = doc.add_table(rows=1, cols=3)
    format_table(tbl_a9, api_w, api_h, [
        ("GET", "/api/dashboard", "Fetch aggregated KPI stats, low-stock counts, and recent transactions"),
        ("GET", "/api/stock-transactions", "Fetch paginated, filtered transaction ledger with audit details"),
        ("GET", "/api/reports", "Generate comprehensive filtered reports with Excel/PDF streaming")
    ])

    add_subsection_heading("8.9.8 DB Design")
    tbl_d9 = doc.add_table(rows=1, cols=3)
    format_table(tbl_d9, db_w, db_h, [
        ("stock_transactions", "PK: id, UNI: transaction_code, MUL: product_id", "transaction_code, product_id, transaction_type, quantity, previous_quantity, new_quantity"),
        ("notifications", "PK: id, MUL: user_id, is_read", "user_id, title, message, type, is_read, created_at")
    ])

    add_subsection_heading("8.9.9 Screenshots")
    add_screenshot_placeholder("Executive KPI Dashboard", "/dashboard", "Executive analytics overview with KPI summary cards, stock movement charts, and quick-action buttons.", "fig 8.38 Administrator Executive Dashboard Overview")
    add_screenshot_placeholder("Low Stock Alert Panel", "/low-stock", "Dedicated replenishment queue highlighting items with current quantities below minimum thresholds.", "fig 8.39 Low Stock Inventory Alert Panel")
    add_screenshot_placeholder("Stock History Transaction Ledger", "/stock-history", "Reactive stock transaction ledger table with search, movement filter chips, and balance columns.", "fig 8.40 Stock History Immutable Transaction Ledger")
    add_screenshot_placeholder("Reports & Analytics Export", "/reports", "Customizable report filter panel with Export to Excel and Export to PDF action buttons.", "fig 8.41 Multi-Format Reports & Analytics Filter Panel")
    add_screenshot_placeholder("System Notifications Center", "/notifications", "Real-time user notification center displaying indent updates, approvals, and threshold alerts.", "fig 8.42 Real-Time Notifications Center")
    add_screenshot_placeholder("User Profile & Security Settings", "/profile", "User security settings panel allowing password updates and session credential review.", "fig 8.43 User Profile & Security Settings")
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

        if not sectPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}footerReference'):
            footer_ref = parse_xml(f'<w:footerReference {nsdecls("w")} {nsdecls("r")} w:type="default" r:id="rId57"/>')
            sectPr.append(footer_ref)

    doc.save(output_path)
    print(f"PERFECT MATCH REPORT GENERATED SUCCESSFULLY: {output_path}")

if __name__ == "__main__":
    build_perfect_report()
