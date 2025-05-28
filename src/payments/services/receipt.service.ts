import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

// Company details for ScanServe
const companyDetails = {
  name: 'ScanServe Technologies',
  addressLine1: 'Unit 405, Tech Tower One',
  addressLine2: 'Cybercity, Bangalore, KA 560100, India',
  email: 'accounts@scanserve.com',
  phone: '+91-80-12345678',
  website: 'www.scanserve.com',
  gstin: '29AAPCS1234A1Z5',
};

// A more specific type for the payment object passed to prepareReceiptData
type PaymentWithRelations = any; // Replace 'any' with your actual Payment type from Prisma, including relations

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  receipt?: string;
  description: string;
  customer: {
    name: string;
    email: string;
    address?: string;
  };
  company: {
    name: string;
    addressLine1: string;
    addressLine2: string;
    email: string;
    phone: string;
    website: string;
    logoUrl?: string;
    gstin?: string;
  };
  organization?: {
    name: string;
    type: string;
  };
  plan?: {
    name: string;
    billingCycle: string;
  };
  venue?: {
    name: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    hsnSacCode?: string;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  notes?: string;
}

@Injectable()
export class ReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReceiptPDF(paymentId: string, userId: string): Promise<Buffer> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId,
          status: 'COMPLETED',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          venue: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found or not accessible');
      }

      const receiptData = await this.prepareReceiptData(payment as PaymentWithRelations);
      const pdfBuffer = await this.createPDFFromTemplate(receiptData);

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      throw error instanceof NotFoundException ? error : new Error('Failed to generate receipt PDF.');
    }
  }

  private async prepareReceiptData(payment: PaymentWithRelations): Promise<ReceiptData> {
    const metadata = (payment.metadata as Record<string, any>) || {};
    const notesData = payment.notes ? JSON.parse(payment.notes) : {};

    const receiptNumber = `RCP-${payment.receipt || payment.id.substring(0, 8).toUpperCase()}`;

    const totalAmount = Number(payment.amount);
    const taxRate = 0.18; // 18% GST
    const subtotal = totalAmount / (1 + taxRate);
    const tax = totalAmount - subtotal;

    const items = this.getReceiptItems(payment, metadata, notesData, subtotal);

    return {
      id: payment.id,
      receiptNumber,
      date: format(new Date(payment.createdAt), 'dd MMM, yyyy'),
      amount: totalAmount,
      currency: payment.currency || 'INR',
      status: payment.status,
      paymentMethod: payment.paymentMethod?.replace(/_/g, ' ') || 'Online Transfer',
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpayOrderId: payment.razorpayOrderId,
      receipt: payment.receipt,
      description: this.getPaymentDescription(payment, metadata, notesData),
      customer: {
        name: payment.user.name || 'Valued Customer',
        email: payment.user.email,
        address: (payment.user as any).address || 'Customer Address Not Provided',
      },
      company: companyDetails,
      organization: payment.organization
        ? {
            name: payment.organization.name,
            type: payment.organization.type,
          }
        : undefined,
      plan: metadata?.planName
        ? {
            name: metadata.planName,
            billingCycle: metadata.billingCycle || 'Monthly',
          }
        : undefined,
      venue: payment.venue
        ? {
            name: payment.venue.name,
          }
        : undefined,
      items,
      subtotal,
      tax,
      taxRate,
      total: totalAmount,
      notes: 'Thank you for your payment! This receipt confirms your successful transaction with ScanServe.',
    };
  }

  private getReceiptItems(payment: PaymentWithRelations, metadata: Record<string, any>, notes: Record<string, any>, subtotal: number): ReceiptData['items'] {
    let description = 'ScanServe Service';
    let hsnSacCode = '998314'; // Default SAC for IT services
    switch (payment.paymentType) {
      case 'ORGANIZATION_SETUP':
        description = `${notes.organization || 'Organization'} Setup - ${notes.type || 'Business'} Plan (${notes.billing || 'Monthly'} Billing)`;
        hsnSacCode = '998311'; // SAC for management consulting and management services
        break;
      case 'VENUE_CREATION':
        description = `Venue Creation - ${metadata?.venueName || notes.venue || 'New Venue'} (${notes.billingCycle || 'Monthly'} Billing)`;
        hsnSacCode = '998313'; // SAC for IT infrastructure provisioning services
        break;
      case 'SUBSCRIPTION':
        description = `Subscription - ${metadata?.planName || 'Selected Plan'} (${metadata?.billingCycle || 'Monthly'} Billing)`;
        hsnSacCode = '998315'; // SAC for hosting and IT infrastructure provisioning services
        break;
      default:
        description = payment.description || 'General ScanServe Software Service';
    }
    return [
      {
        description: description,
        quantity: 1,
        unitPrice: subtotal,
        totalPrice: subtotal,
        hsnSacCode: hsnSacCode,
      },
    ];
  }

  private getPaymentDescription(payment: PaymentWithRelations, metadata: Record<string, any>, notes: Record<string, any>): string {
    switch (payment.paymentType) {
      case 'ORGANIZATION_SETUP':
        return `Organization Setup Fee: ${notes.organization || 'Business'} - ${notes.type || 'Default Plan'}`;
      case 'VENUE_CREATION':
        return `Venue Creation Fee: ${metadata?.venueName || notes.venue || 'New Venue'}`;
      case 'SUBSCRIPTION':
        return `Software Subscription: ${metadata?.planName || 'Selected Plan'}`;
      default:
        return payment.description || 'Payment for ScanServe Software Services';
    }
  }

private async createPDFFromTemplate(receiptData: ReceiptData): Promise<Buffer> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // --- Document Settings ---
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // --- Colors ---
    const themeColor = '#FB9343';
    const primaryTextDark = '#263238';
    const secondaryTextMedium = '#546E7A';
    const lightGrayBackground = '#ECEFF1';
    const borderColorLight = '#CFD8DC';
    const whiteColor = '#FFFFFF';

    // --- Fonts ---
    const FONT_FAMILY_SANS = 'helvetica';

    const pointsToMm = (points: number) => (points / 72) * 25.4;

    // Helper function for adding text
    const addText = (text: string | string[], x: number, y: number, options: any = {}) => {
      pdf.setFont(options.font || FONT_FAMILY_SANS, options.style || 'normal');
      pdf.setFontSize(options.size || 10);
      pdf.setTextColor(options.color || primaryTextDark);
      pdf.text(text, x, y, { align: options.align || 'left', maxWidth: options.maxWidth });
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string = borderColorLight, lineWidth: number = 0.25) => {
        pdf.setDrawColor(color);
        pdf.setLineWidth(lineWidth);
        pdf.line(x1, y1, x2, y2);
    };

    const footerHeight = 30;

    // --- 1. Header Section ---
    const headerTopMargin = yPos;
    addText(receiptData.company.name.toUpperCase(), margin, yPos + 7, { size: 20, style: 'bold', color: primaryTextDark });
    yPos += 8;
    addText(receiptData.company.addressLine1, margin, yPos + 5, { size: 8.5, color: secondaryTextMedium });
    yPos += 4;
    addText(receiptData.company.addressLine2, margin, yPos + 5, { size: 8.5, color: secondaryTextMedium });
    yPos += 4;
    if (receiptData.company.gstin) {
      addText(`GSTIN: ${receiptData.company.gstin}`, margin, yPos + 5, { size: 8.5, color: secondaryTextMedium });
      yPos += 4;
    }
    addText(`Email: ${receiptData.company.email} | Phone: ${receiptData.company.phone}`, margin, yPos + 5, { size: 8.5, color: secondaryTextMedium });

    const receiptTitleY = headerTopMargin;
    addText('RECEIPT', pageWidth - margin, receiptTitleY + 10, { size: 24, style: 'bold', color: themeColor, align: 'right' });
    addText(`# ${receiptData.receiptNumber}`, pageWidth - margin, receiptTitleY + 18, { size: 11, color: primaryTextDark, align: 'right' });
    addText(`Date: ${receiptData.date}`, pageWidth - margin, receiptTitleY + 25, { size: 9, color: primaryTextDark, align: 'right' });

    yPos = Math.max(yPos, receiptTitleY + 25) + 15;
    drawLine(margin, yPos, pageWidth - margin, yPos, themeColor, 0.6);
    yPos += 10;

    // --- 2. Payment Information Section ---
    const paymentInfoX = margin;
    const detailsColX = pageWidth / 2 + margin / 4;
    const paymentSectionYStart = yPos;
    let leftColumnY = yPos;
    let rightColumnY = yPos;

    addText('PAYMENT RECEIVED FROM:', paymentInfoX, leftColumnY, { size: 9, style: 'bold', color: themeColor });
    leftColumnY += 5;
    addText(receiptData.customer.name, paymentInfoX, leftColumnY, { size: 10, style: 'bold', color: primaryTextDark, maxWidth: detailsColX - margin - 5});
    leftColumnY += 4.5;
    addText(receiptData.customer.email, paymentInfoX, leftColumnY, { size: 9, color: secondaryTextMedium, maxWidth: detailsColX - margin - 5 });
    leftColumnY += 4.5;

    if (receiptData.customer.address && receiptData.customer.address !== 'Customer Address Not Provided') {
        const customerAddressLines = pdf.splitTextToSize(receiptData.customer.address, detailsColX - margin - 10);
        customerAddressLines.forEach((line: string) => {
            addText(line, paymentInfoX, leftColumnY, { size: 8.5, color: secondaryTextMedium });
            leftColumnY += 4;
        });
    }
    leftColumnY = Math.max(leftColumnY, yPos + 18);

    addText(`Payment Method: ${receiptData.paymentMethod}`, paymentInfoX, leftColumnY, { size: 9, color: secondaryTextMedium });
    if (receiptData.razorpayPaymentId) {
      leftColumnY += 4.5;
      addText(`Transaction ID: ${receiptData.razorpayPaymentId}`, paymentInfoX, leftColumnY, { size: 8, color: secondaryTextMedium });
    }

    addText('PAYMENT STATUS:', detailsColX, rightColumnY, { size: 9, style: 'bold', color: themeColor });
    rightColumnY += 5;
    addText(receiptData.status, detailsColX, rightColumnY, {
      size: 12,
      style: 'bold',
      color: receiptData.status === 'COMPLETED' ? '#43A047' : '#E53935'
    });
    rightColumnY += 7;
    addText('Amount Paid:', detailsColX, rightColumnY, { size: 10, style: 'normal', color: secondaryTextMedium });
    const amountValueX = detailsColX + 25;
     addText(`${receiptData.currency} ${receiptData.total.toFixed(2)}`, amountValueX, rightColumnY, {
        size: 11,
        style: 'bold',
        color: primaryTextDark,
    });

    yPos = Math.max(leftColumnY, rightColumnY) + 12;

    // --- 3. Items Table ---
    const tableStartY = yPos;
    const cellPadding = 3;
    const minRowHeight = 10;
    const headerRowHeight = 10;

    // Font sizes for table content
    const fontSizeDescPt = 8.5;
    const fontSizeHsnSacPt = 7.5;
    const fontSizeQtyUnitPriceTotalPt = 8.5;

    // Convert font sizes to mm for calculations
    const fontSizeDescMm = pointsToMm(fontSizeDescPt);
    const fontSizeHsnSacMm = pointsToMm(fontSizeHsnSacPt);
    const fontSizeQtyUnitPriceTotalMm = pointsToMm(fontSizeQtyUnitPriceTotalPt);

    // Adjusted line heights based on font sizes (font size * 1.2 is a common approximation)
    const itemDescLineHeight = fontSizeDescMm * 1.2;
    const hsnSacLineHeight = fontSizeHsnSacMm * 1.2;
    const gapAfterDesc = 1; // mm, gap between description and HSN/SAC

    const colWidths = {
        no: 12,
        desc: contentWidth * 0.50,
        qty: contentWidth * 0.10,
        unitPrice: contentWidth * 0.19,
        total: contentWidth * 0.19,
    };

    const drawTableHeader = (currentY: number) => {
        pdf.setFillColor(lightGrayBackground);
        pdf.rect(margin, currentY, contentWidth, headerRowHeight, 'F');
        let currentX = margin;
        // Center text in header: header top + half header height + half font size (approx for baseline)
        const headerTextBaselineY = currentY + (headerRowHeight / 2) + (pointsToMm(9) * 0.35); // 9pt font for header
        const headerOptions = { size: 9, style: 'bold', color: primaryTextDark };

        addText('#', currentX + cellPadding, headerTextBaselineY, headerOptions);
        currentX += colWidths.no;
        addText('ITEM & DESCRIPTION', currentX + cellPadding, headerTextBaselineY, headerOptions);
        currentX += colWidths.desc;
        addText('QTY', currentX + colWidths.qty / 2, headerTextBaselineY, { ...headerOptions, align: 'center'});
        currentX += colWidths.qty;
        addText('UNIT PRICE', currentX + colWidths.unitPrice - cellPadding, headerTextBaselineY, { ...headerOptions, align: 'right' });
        currentX += colWidths.unitPrice;
        addText('TOTAL', currentX + colWidths.total - cellPadding, headerTextBaselineY, { ...headerOptions, align: 'right' });
        return currentY + headerRowHeight;
    };

    yPos = drawTableHeader(yPos);
    let tableContentStartY = yPos;

    receiptData.items.forEach((item, index) => {
        const descMaxWidth = colWidths.desc - 2 * cellPadding;
        const itemDescriptionLines = pdf.splitTextToSize(item.description, descMaxWidth);
        let hsnSacTextLines: string[] = [];
        if (item.hsnSacCode) {
            hsnSacTextLines = pdf.splitTextToSize(`HSN/SAC: ${item.hsnSacCode}`, descMaxWidth);
        }

        let textBlockHeight = itemDescriptionLines.length * itemDescLineHeight;
        if (hsnSacTextLines.length > 0) {
            if(itemDescriptionLines.length > 0) textBlockHeight -= itemDescLineHeight; // remove last line's full height
            textBlockHeight += (itemDescriptionLines.length > 0 ? itemDescLineHeight * 0.85 : 0); // add back effective height of last line
            textBlockHeight += gapAfterDesc; // Gap
            textBlockHeight += hsnSacTextLines.length * hsnSacLineHeight;
        }
         // Adjust if only HSN/SAC and no main description
        if (itemDescriptionLines.length === 0 && hsnSacTextLines.length > 0) {
            textBlockHeight = (hsnSacTextLines.length * hsnSacLineHeight) - hsnSacLineHeight + (hsnSacLineHeight * 0.85) ; // Only count effective height
        }


        const dynamicRowHeight = Math.max(minRowHeight, textBlockHeight + 2 * cellPadding);

        if (yPos + dynamicRowHeight > pageHeight - margin - footerHeight) {
            drawLine(margin, yPos, pageWidth - margin, yPos, borderColorLight, 0.25);
            let vLineXCheck = margin;
            drawLine(vLineXCheck, tableContentStartY, vLineXCheck, yPos, borderColorLight, 0.25);
            vLineXCheck += colWidths.no; drawLine(vLineXCheck, tableContentStartY, vLineXCheck, yPos, borderColorLight, 0.15);
            vLineXCheck += colWidths.desc; drawLine(vLineXCheck, tableContentStartY, vLineXCheck, yPos, borderColorLight, 0.15);
            vLineXCheck += colWidths.qty; drawLine(vLineXCheck, tableContentStartY, vLineXCheck, yPos, borderColorLight, 0.15);
            vLineXCheck += colWidths.unitPrice; drawLine(vLineXCheck, tableContentStartY, vLineXCheck, yPos, borderColorLight, 0.15);
            drawLine(pageWidth - margin, tableContentStartY, pageWidth - margin, yPos, borderColorLight, 0.25);

            pdf.addPage();
            yPos = margin;
            yPos = drawTableHeader(yPos);
            tableContentStartY = yPos;
        }

        drawLine(margin, yPos, pageWidth - margin, yPos, borderColorLight, 0.15);

        let itemX = margin;

        // Baseline for the first line of description text
        // Approx (Font Size in mm * 0.8) to get from top of line to baseline
        let currentDescTextBaselineY = yPos + cellPadding + (fontSizeDescMm * 0.85);

        // Column 1: #
        // Vertically align # with the center of the textBlockHeight in description
        const numberCellBaselineY = yPos + cellPadding + (textBlockHeight / 2) + (fontSizeQtyUnitPriceTotalMm * 0.35); // Center of text block + half font size up
        addText((index + 1).toString(), itemX + cellPadding, numberCellBaselineY, { size: fontSizeQtyUnitPriceTotalPt, color: secondaryTextMedium });
        itemX += colWidths.no;

        // Column 2: Item & Description + HSN/SAC
        itemDescriptionLines.forEach((line: string) => {
            addText(line, itemX + cellPadding, currentDescTextBaselineY, { size: fontSizeDescPt, color: primaryTextDark, maxWidth: descMaxWidth });
            currentDescTextBaselineY += itemDescLineHeight;
        });
        if (hsnSacTextLines.length > 0) {
            if (itemDescriptionLines.length > 0) { // If there was a description, adjust for gap
                currentDescTextBaselineY -= itemDescLineHeight; // Move back to baseline of last desc line
                currentDescTextBaselineY += itemDescLineHeight * 0.85; // to bottom of that line
                currentDescTextBaselineY += gapAfterDesc; // Add gap
                currentDescTextBaselineY += (fontSizeHsnSacMm * 0.85); // to baseline of HSN
            } else { // No main description, HSN is the first thing
                 currentDescTextBaselineY = yPos + cellPadding + (fontSizeHsnSacMm * 0.85);
            }

            hsnSacTextLines.forEach((line: string) => {
                addText(line, itemX + cellPadding, currentDescTextBaselineY, { size: fontSizeHsnSacPt, color: secondaryTextMedium, maxWidth: descMaxWidth });
                currentDescTextBaselineY += hsnSacLineHeight;
            });
        }
        itemX += colWidths.desc;

        // Vertical baseline for Qty, Unit Price, Total cells, centered against the description's textBlockHeight
        const singleLineContentBaselineY = yPos + cellPadding + (textBlockHeight / 2) + (fontSizeQtyUnitPriceTotalMm * 0.30); // font_size * ~0.3 to adjust baseline for visual center

        // Column 3: Quantity
        addText(item.quantity.toString(), itemX + colWidths.qty / 2, singleLineContentBaselineY, {
            size: fontSizeQtyUnitPriceTotalPt, color: primaryTextDark, align: 'center'
        });
        itemX += colWidths.qty;

        // Column 4: Unit Price
        addText(`${receiptData.currency} ${item.unitPrice.toFixed(2)}`, itemX + colWidths.unitPrice - cellPadding, singleLineContentBaselineY, {
            size: fontSizeQtyUnitPriceTotalPt, color: primaryTextDark, align: 'right'
        });
        itemX += colWidths.unitPrice;

        // Column 5: Total Price
        addText(`${receiptData.currency} ${item.totalPrice.toFixed(2)}`, itemX + colWidths.total - cellPadding, singleLineContentBaselineY, {
            size: fontSizeQtyUnitPriceTotalPt, style:'bold', color: primaryTextDark, align: 'right'
        });

        yPos += dynamicRowHeight;
    });

    drawLine(margin, yPos, pageWidth - margin, yPos, borderColorLight, 0.25);

    let vLineX = margin;
    drawLine(vLineX, tableContentStartY, vLineX, yPos, borderColorLight, 0.25);
    vLineX += colWidths.no; drawLine(vLineX, tableContentStartY, vLineX, yPos, borderColorLight, 0.15);
    vLineX += colWidths.desc; drawLine(vLineX, tableContentStartY, vLineX, yPos, borderColorLight, 0.15);
    vLineX += colWidths.qty; drawLine(vLineX, tableContentStartY, vLineX, yPos, borderColorLight, 0.15);
    vLineX += colWidths.unitPrice; drawLine(vLineX, tableContentStartY, vLineX, yPos, borderColorLight, 0.15);
    drawLine(pageWidth - margin, tableContentStartY, pageWidth - margin, yPos, borderColorLight, 0.25);

    yPos += 8;

    // --- 4. Totals Section ---
    const totalsSectionHeight = 40;
    if (yPos + totalsSectionHeight > pageHeight - margin - footerHeight) {
        pdf.addPage();
        yPos = margin;
    }

    // Position totals section properly within page margins
    const totalsWidth = 70; // Fixed width for totals section
    const totalsStartX = pageWidth - margin - totalsWidth;
    const totalsLabelX = totalsStartX + 5;
    const totalsValueX = pageWidth - margin - 5;

    // Create a subtle background for totals section
    pdf.setFillColor('#F8F9FA');
    pdf.rect(totalsStartX, yPos - 3, totalsWidth, 32, 'F');

    addText('Subtotal:', totalsLabelX, yPos, { size: 9, color: secondaryTextMedium, align: 'left' });
    addText(`${receiptData.currency} ${receiptData.subtotal.toFixed(2)}`, totalsValueX, yPos, { size: 9, color: primaryTextDark, align: 'right' });
    yPos += 6;

    addText(`GST (${(receiptData.taxRate * 100).toFixed(0)}%):`, totalsLabelX, yPos, { size: 9, color: secondaryTextMedium, align: 'left' });
    addText(`${receiptData.currency} ${receiptData.tax.toFixed(2)}`, totalsValueX, yPos, { size: 9, color: primaryTextDark, align: 'right' });
    yPos += 8;

    // Line separator
    drawLine(totalsLabelX, yPos, totalsValueX, yPos, borderColorLight, 0.5);
    yPos += 4;

    // Total paid section with theme color background
    pdf.setFillColor(themeColor);
    pdf.rect(totalsStartX, yPos - 2, totalsWidth, 12, 'F');

    addText('TOTAL PAID:', totalsLabelX, yPos + 6, { size: 10, style: 'bold', color: whiteColor, align: 'left'});
    addText(`${receiptData.currency} ${receiptData.total.toFixed(2)}`, totalsValueX, yPos + 6, { size: 11, style: 'bold', color: whiteColor, align: 'right' });
    yPos += 20;

    // --- 5. Notes Section ---
    if (receiptData.notes) {
        const notesEstHeight = pdf.splitTextToSize(receiptData.notes, contentWidth).length * 4 + 10;
        if (yPos + notesEstHeight > pageHeight - margin - footerHeight) {
             pdf.addPage();
             yPos = margin;
        }
        addText('Notes:', margin, yPos, { size: 9, style: 'bold', color: themeColor });
        yPos += 4.5;
        const notesLines = pdf.splitTextToSize(receiptData.notes, contentWidth);
        const noteLineRenderHeight = 3.5; // Line height for 8pt font notes
        notesLines.forEach((line: string) => {
            if (yPos + noteLineRenderHeight > pageHeight - margin - footerHeight) {
                pdf.addPage();
                yPos = margin;
            }
            addText(line, margin, yPos, { size: 8, color: secondaryTextMedium });
            yPos += 3.2; // tighter spacing for notes lines
        });
        yPos += 5;
    }

    // --- 6. Footer ---
    if (yPos > pageHeight - margin - footerHeight) {
        pdf.addPage();
        yPos = pageHeight - margin - footerHeight;
    } else {
        yPos = pageHeight - margin - footerHeight;
    }

    drawLine(margin, yPos, pageWidth - margin, yPos, themeColor, 0.6);
    yPos += 6;

    const footerTextYStart = yPos;
    addText(receiptData.company.name, margin, footerTextYStart, { size: 9, style: 'bold', color: primaryTextDark });
    addText(`${receiptData.company.addressLine1}, ${receiptData.company.addressLine2}`, margin, footerTextYStart + 4, {size: 7.5, color: secondaryTextMedium});
    addText(`Email: ${receiptData.company.email} | Web: ${receiptData.company.website}`, margin, footerTextYStart + 8, { size: 7.5, color: secondaryTextMedium });

    addText(`This is a computer-generated receipt.`, pageWidth - margin, footerTextYStart + 4, { size: 7.5, color: secondaryTextMedium, align: 'right' });
    addText(`Page ${pdf.getNumberOfPages()}`, pageWidth - margin, footerTextYStart + 8, { size: 7.5, color: secondaryTextMedium, align: 'right' });

    return Buffer.from(pdf.output('arraybuffer'));
  }

}
