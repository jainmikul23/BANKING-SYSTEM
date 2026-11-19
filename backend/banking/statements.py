import csv
import io
from decimal import Decimal
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_csv_statement(account, transactions, start_date=None, end_date=None) -> HttpResponse:
    """Generate and return CSV statement download."""
    response = HttpResponse(content_type='text/csv')
    filename = f"Statement_{account.account_number}_{timezone.now().strftime('%Y%m%d')}.csv"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(['ATHERIA RESERVE - ACCOUNT STATEMENT'])
    writer.writerow(['Account Number', account.account_number])
    writer.writerow(['Account Type', account.get_type_display()])
    writer.writerow(['Account Holder', account.customer.full_name])
    writer.writerow(['IFSC Code', account.branch.ifsc_code])
    writer.writerow(['Branch', account.branch.name])
    writer.writerow(['Current Balance (INR)', f"{account.balance:,.2f}"])
    if start_date and end_date:
        writer.writerow(['Statement Period', f"{start_date} to {end_date}"])
    writer.writerow([])
    writer.writerow(['Date & Time', 'Reference No', 'Type', 'Description', 'Amount (INR)', 'Balance After (INR)'])

    for txn in transactions:
        writer.writerow([
            txn.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            txn.reference_no,
            txn.get_type_display(),
            txn.description,
            f"{txn.amount:,.2f}",
            f"{txn.balance_after:,.2f}",
        ])

    return response


def generate_pdf_statement(account, transactions, start_date=None, end_date=None) -> HttpResponse:
    """Generate beautifully formatted PDF bank statement using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    elements = []
    styles = getSampleStyleSheet()

    # Custom typography styles
    primary_color = colors.HexColor('#0B1426')
    accent_color = colors.HexColor('#1D4ED8')
    text_dark = colors.HexColor('#1E293B')
    text_muted = colors.HexColor('#64748B')
    border_color = colors.HexColor('#E2E8F0')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=text_muted
    )
    header_right = ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        alignment=2,
        textColor=accent_color
    )
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=text_dark
    )
    val_style = ParagraphStyle(
        'Value',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_muted
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=text_dark
    )
    cell_cr = ParagraphStyle(
        'CellCr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#16A34A')
    )
    cell_dr = ParagraphStyle(
        'CellDr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#DC2626')
    )

    # Header section
    header_data = [
        [
            Paragraph("<b>ATHERIA RESERVE BANK</b><br/><font size=9 color='#64748B'>Official Statement of Account</font>", title_style),
            Paragraph(f"<b>GENERATED:</b> {timezone.now().strftime('%d %b %Y, %H:%M')}<br/><font size=8 color='#64748B'>Computer-Generated e-Statement</font>", header_right)
        ]
    ]
    header_table = Table(header_data, colWidths=[300, 222])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceBefore=4, spaceAfter=14))

    # Customer and Account Information Grid
    info_data = [
        [
            Paragraph("<b>Account Holder:</b>", label_style),
            Paragraph(account.customer.full_name, val_style),
            Paragraph("<b>Account Number:</b>", label_style),
            Paragraph(f"<b>{account.account_number}</b>", val_style),
        ],
        [
            Paragraph("<b>Registered Phone:</b>", label_style),
            Paragraph(account.customer.phone, val_style),
            Paragraph("<b>Account Type:</b>", label_style),
            Paragraph(account.get_type_display(), val_style),
        ],
        [
            Paragraph("<b>Email:</b>", label_style),
            Paragraph(account.customer.user.email, val_style),
            Paragraph("<b>IFSC Code:</b>", label_style),
            Paragraph(account.branch.ifsc_code, val_style),
        ],
        [
            Paragraph("<b>Branch:</b>", label_style),
            Paragraph(f"{account.branch.name}, {account.branch.city}", val_style),
            Paragraph("<b>Current Balance:</b>", label_style),
            Paragraph(f"<b>₹{account.balance:,.2f}</b>", label_style),
        ],
    ]
    if start_date and end_date:
        info_data.append([
            Paragraph("<b>Statement Period:</b>", label_style),
            Paragraph(f"{start_date} to {end_date}", val_style),
            Paragraph("<b>Account Status:</b>", label_style),
            Paragraph(account.get_status_display().upper(), val_style),
        ])

    info_table = Table(info_data, colWidths=[110, 150, 110, 152])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#EEF2F6')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 14))

    # Compute Totals for the transactions
    total_cr = Decimal('0.00')
    total_dr = Decimal('0.00')
    for t in transactions:
        if t.type in ('deposit', 'transfer_in', 'loan_credit'):
            total_cr += t.amount
        else:
            total_dr += t.amount

    summary_data = [
        [
            Paragraph(f"<b>Total Credits:</b> ₹{total_cr:,.2f}", cell_cr),
            Paragraph(f"<b>Total Debits:</b> ₹{total_dr:,.2f}", cell_dr),
            Paragraph(f"<b>Net Flow:</b> ₹{(total_cr - total_dr):,.2f}", label_style),
            Paragraph(f"<b>Total Records:</b> {len(transactions)}", label_style),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[130, 130, 132, 130])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # Transaction Table
    table_header = [
        Paragraph("<b>Date / Time</b>", label_style),
        Paragraph("<b>Reference</b>", label_style),
        Paragraph("<b>Type</b>", label_style),
        Paragraph("<b>Description</b>", label_style),
        Paragraph("<b>Amount (₹)</b>", label_style),
        Paragraph("<b>Balance (₹)</b>", label_style),
    ]

    table_rows = [table_header]
    for txn in transactions:
        is_credit = txn.type in ('deposit', 'transfer_in', 'loan_credit')
        amt_str = f"+ ₹{txn.amount:,.2f}" if is_credit else f"- ₹{txn.amount:,.2f}"
        amt_style = cell_cr if is_credit else cell_dr

        table_rows.append([
            Paragraph(txn.created_at.strftime('%d-%m-%Y %H:%M'), cell_style),
            Paragraph(txn.reference_no, cell_style),
            Paragraph(txn.get_type_display(), cell_style),
            Paragraph(txn.description[:35], cell_style),
            Paragraph(amt_str, amt_style),
            Paragraph(f"₹{txn.balance_after:,.2f}", cell_style),
        ])

    txn_table = Table(table_rows, colWidths=[80, 85, 75, 142, 70, 70])
    txn_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,1), (-1,-1), 4),
    ]))
    elements.append(txn_table)

    # Disclaimer Footer
    elements.append(Spacer(1, 16))
    elements.append(Paragraph(
        "<font size=7 color='#94A3B8'>* This document is an electronically authenticated banking statement generated by Atheria Reserve Core Engine. No physical signature is required. For inquiries, reach out to support@atheriareserve.in.</font>",
        subtitle_style
    ))

    doc.build(elements)
    buffer.seek(0)

    filename = f"Statement_{account.account_number}_{timezone.now().strftime('%Y%m%d')}.pdf"
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

