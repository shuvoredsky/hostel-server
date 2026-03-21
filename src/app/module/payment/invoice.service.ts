import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';

const generateInvoicePDF = async (paymentId: string, ownerId: string, res: Response) => {
  // Payment data fetch করো
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      booking: {
        include: {
          listing: {
            include: {
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          extraCharges: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, 'Payment not found');
  }

  // Owner authorization check
  if (payment.booking.listing.owner.id !== ownerId) {
    throw new AppError(status.FORBIDDEN, 'You are not authorized to access this invoice');
  }

  if (payment.status !== 'PAID') {
    throw new AppError(status.BAD_REQUEST, 'Invoice only available for paid payments');
  }

  // Site logo fetch করো
  const siteSettings = await prisma.siteSettings.findFirst();
  const logoUrl = siteSettings?.logoUrl || null;

  // Extra charges total
  const extraTotal = payment.booking.extraCharges.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = payment.amount + extraTotal;

  // Invoice number বানাও
  const invoiceNumber = `INV-${payment.transactionId?.slice(-8).toUpperCase()}`;
  const invoiceDate = new Date(payment.paidAt!).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // PDF তৈরি শুরু
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Response headers set করো
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=invoice-${invoiceNumber}.pdf`,
  );

  doc.pipe(res);

  // ─── Colors ─────────────────────────────────────────────────────────────
  const primaryColor = '#1a56db';
  const darkColor = '#111827';
  const grayColor = '#6b7280';
  const lightGray = '#f3f4f6';
  const borderColor = '#e5e7eb';

  // ─── Header Section ──────────────────────────────────────────────────────
  // Background header bar
  doc.rect(0, 0, 595, 120).fill(primaryColor);

  // Logo (যদি থাকে)
  if (logoUrl) {
    try {
      const response = await fetch(logoUrl);
      const buffer = await response.arrayBuffer();
      doc.image(Buffer.from(buffer), 50, 20, { width: 80, height: 80 });
    } catch {
      // Logo load না হলে text দেখাও
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('DhakaStay', 50, 45);
    }
  } else {
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('DhakaStay', 50, 45);
    doc.fillColor('#bfdbfe').fontSize(10).font('Helvetica').text('Student Housing Marketplace', 50, 75);
  }

  // Invoice title right side
  doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold').text('INVOICE', 350, 35, { align: 'right' });
  doc.fillColor('#bfdbfe').fontSize(11).font('Helvetica').text(invoiceNumber, 350, 70, { align: 'right' });
  doc.fillColor('#bfdbfe').fontSize(10).text(`Date: ${invoiceDate}`, 350, 88, { align: 'right' });

  // ─── Status Badge ────────────────────────────────────────────────────────
  doc.rect(430, 130, 115, 28).fill('#d1fae5');
  doc.fillColor('#065f46').fontSize(12).font('Helvetica-Bold').text('✓  PAID', 440, 138);

  // ─── From / To Section ───────────────────────────────────────────────────
  doc.moveDown(4);

  // FROM (Owner)
  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('FROM', 50, 175);
  doc.fillColor(darkColor).fontSize(13).font('Helvetica-Bold').text(payment.booking.listing.owner.name, 50, 190);
  doc.fillColor(grayColor).fontSize(10).font('Helvetica').text(payment.booking.listing.owner.email, 50, 207);
  doc.fillColor(grayColor).fontSize(10).text('Owner / Landlord', 50, 222);

  // TO (Student)
  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('BILLED TO', 300, 175);
  doc.fillColor(darkColor).fontSize(13).font('Helvetica-Bold').text(payment.student.name, 300, 190);
  doc.fillColor(grayColor).fontSize(10).font('Helvetica').text(payment.student.email, 300, 207);
  doc.fillColor(grayColor).fontSize(10).text('Tenant / Student', 300, 222);

  // Divider
  doc.moveTo(50, 250).lineTo(545, 250).strokeColor(borderColor).lineWidth(1).stroke();

  // ─── Property Details ────────────────────────────────────────────────────
  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('PROPERTY DETAILS', 50, 265);

  doc.rect(50, 280, 495, 70).fill(lightGray);

  doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold')
    .text(payment.booking.listing.title, 65, 292);
  doc.fillColor(grayColor).fontSize(10).font('Helvetica')
    .text(`${payment.booking.listing.address}`, 65, 310);
  doc.fillColor(grayColor).fontSize(10)
    .text(`${payment.booking.listing.area}, ${payment.booking.listing.city}`, 65, 326);

  // Move in date
  if (payment.booking.moveInDate) {
    const moveIn = new Date(payment.booking.moveInDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
      .text(`Move-in Date: ${moveIn}`, 380, 318);
  }

  // ─── Invoice Table ───────────────────────────────────────────────────────
  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('INVOICE DETAILS', 50, 370);

  // Table header
  doc.rect(50, 385, 495, 30).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
    .text('Description', 65, 395)
    .text('Type', 300, 395)
    .text('Amount (BDT)', 420, 395);

  // Table rows
  let yPos = 415;

  // Monthly rent row
  doc.rect(50, yPos, 495, 30).fill(yPos % 60 === 0 ? lightGray : '#ffffff');
  doc.fillColor(darkColor).fontSize(10).font('Helvetica')
    .text('Monthly Rent', 65, yPos + 10)
    .text('Base Rent', 300, yPos + 10)
    .text(`${payment.amount.toLocaleString()} ৳`, 420, yPos + 10);
  yPos += 30;

  // Extra charges rows
  payment.booking.extraCharges.forEach((charge) => {
    doc.rect(50, yPos, 495, 30).fill(yPos % 60 === 0 ? lightGray : '#ffffff');
    doc.fillColor(darkColor).fontSize(10).font('Helvetica')
      .text(charge.title, 65, yPos + 10)
      .text(charge.description || 'Extra Charge', 300, yPos + 10)
      .text(`${charge.amount.toLocaleString()} ৳`, 420, yPos + 10);
    yPos += 30;
  });

  // Table border
  doc.rect(50, 385, 495, yPos - 385).strokeColor(borderColor).lineWidth(0.5).stroke();

  yPos += 15;

  // ─── Summary Section ─────────────────────────────────────────────────────
  // Subtotal
  doc.fillColor(grayColor).fontSize(10).font('Helvetica')
    .text('Subtotal:', 380, yPos)
    .text(`${payment.amount.toLocaleString()} ৳`, 470, yPos, { align: 'right' });
  yPos += 20;

  if (extraTotal > 0) {
    doc.fillColor(grayColor).fontSize(10)
      .text('Extra Charges:', 380, yPos)
      .text(`${extraTotal.toLocaleString()} ৳`, 470, yPos, { align: 'right' });
    yPos += 20;
  }

  // Divider before total
  doc.moveTo(370, yPos).lineTo(545, yPos).strokeColor(borderColor).lineWidth(0.5).stroke();
  yPos += 10;

  // Grand total
  doc.rect(370, yPos, 175, 35).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
    .text('Total:', 385, yPos + 10)
    .text(`${grandTotal.toLocaleString()} ৳`, 390, yPos + 10, { align: 'right', width: 140 });

  yPos += 55;

  // ─── Payment Info ─────────────────────────────────────────────────────────
  doc.rect(50, yPos, 495, 60).fill(lightGray);

  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('PAYMENT INFORMATION', 65, yPos + 10);

  doc.fillColor(darkColor).fontSize(10).font('Helvetica')
    .text(`Transaction ID:`, 65, yPos + 25)
    .text(`Payment Method:`, 65, yPos + 40);

  doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
    .text(`${payment.transactionId}`, 175, yPos + 25)
    .text('SSLCommerz', 175, yPos + 40);

  doc.fillColor(darkColor).fontSize(10).font('Helvetica')
    .text(`Booking ID:`, 320, yPos + 25)
    .text(`Paid On:`, 320, yPos + 40);

  doc.fillColor(grayColor).fontSize(10)
    .text(`${payment.bookingId.slice(0, 16)}...`, 400, yPos + 25)
    .text(`${invoiceDate}`, 400, yPos + 40);

  yPos += 80;

  // ─── Footer ───────────────────────────────────────────────────────────────
  doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor(borderColor).lineWidth(1).stroke();
  yPos += 15;

  doc.fillColor(grayColor).fontSize(9).font('Helvetica')
    .text('Thank you for using DhakaStay — Student Housing Marketplace, Dhaka, Bangladesh', 50, yPos, { align: 'center', width: 495 });

  doc.fillColor(grayColor).fontSize(8)
    .text('This is a computer-generated invoice. No signature required.', 50, yPos + 15, { align: 'center', width: 495 });

  doc.end();
};

export const InvoiceService = {
  generateInvoicePDF,
};