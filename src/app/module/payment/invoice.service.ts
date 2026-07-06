import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';
import { calculateInstallments } from '../../utils/pricing';

const generateInvoicePDF = async (
  paymentId: string,
  userId: string,
  userRole: string,
  res: Response,
) => {
  // Payment data fetch
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
      installments: true,
    },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, 'Payment not found');
  }

  // Authorization check
  const isOwner = payment.booking.listing.owner.id === userId;
  const isStudent = payment.student.id === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isStudent && !isAdmin) {
    throw new AppError(status.FORBIDDEN, 'You are not authorized to access this invoice');
  }

  // Partial (half-monthly installment) paid hole ও invoice allow koro
  const paidInstallments = payment.installments.filter((i) => i.status === 'PAID');
  const isFullyPaid = payment.status === 'PAID';
  const hasAnyPayment = isFullyPaid || paidInstallments.length > 0;

  if (!hasAnyPayment) {
    throw new AppError(status.BAD_REQUEST, 'Invoice only available for paid payments');
  }

  // Site logo
  const siteSettings = await prisma.siteSettings.findFirst();
  const logoUrl = siteSettings?.logoUrl || null;

  // Calculations — partial paid hole shudhu shei paid portion dhoro
  const extraTotal = payment.booking.extraCharges.reduce((sum, e) => sum + e.amount, 0);

  const paidAmount = isFullyPaid
    ? payment.amount
    : paidInstallments.reduce((sum, i) => sum + i.amount, 0);

  const paidCommission = isFullyPaid
    ? payment.commission
    : paidInstallments.reduce((sum, i) => sum + i.commission, 0);

  const grandTotal = paidAmount + extraTotal;
  const netOwnerAmount = grandTotal - paidCommission;

  // Invoice meta
  const invoiceNumber = `INV-${payment.transactionId?.slice(-8).toUpperCase()}`;

  const latestPaidDate =
    payment.paidAt ??
    paidInstallments
      .map((i) => i.paidAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] ??
    new Date();

  const invoiceDate = new Date(latestPaidDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // PDF setup
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNumber}.pdf`);
  doc.pipe(res);

  // Colors
  const primaryColor = '#1a56db';
  const darkColor = '#111827';
  const grayColor = '#6b7280';
  const lightGray = '#f3f4f6';
  const borderColor = '#e5e7eb';
  const greenColor = '#065f46';
  const orangeColor = '#92400e';

  // ─── Header ──────────────────────────────────────────────────────────────
  doc.rect(0, 0, 595, 120).fill(primaryColor);

  if (logoUrl) {
    try {
      const response = await fetch(logoUrl);
      const buffer = await response.arrayBuffer();
      doc.image(Buffer.from(buffer), 50, 20, { width: 80, height: 80 });
    } catch {
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('DhakaStay', 50, 45);
    }
  } else {
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('DhakaStay', 50, 45);
    doc.fillColor('#bfdbfe').fontSize(10).font('Helvetica').text('Student Housing Marketplace', 50, 75);
  }

  doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold').text('INVOICE', 350, 35, { align: 'right' });
  doc.fillColor('#bfdbfe').fontSize(11).font('Helvetica').text(invoiceNumber, 350, 70, { align: 'right' });
  doc.fillColor('#bfdbfe').fontSize(10).text(`Date: ${invoiceDate}`, 350, 88, { align: 'right' });

  // Role badge (top right corner under header)
  const roleBadgeText = isAdmin ? 'ADMIN COPY' : isOwner ? 'OWNER COPY' : 'TENANT COPY';
  const roleBadgeColor = isAdmin ? '#dbeafe' : isOwner ? '#fef3c7' : '#d1fae5';
  const roleBadgeTextColor = isAdmin ? '#1e40af' : isOwner ? orangeColor : greenColor;

  // Paid / Partially Paid badge
  const badgeColor = isFullyPaid ? '#d1fae5' : '#fef3c7';
  const badgeTextColor = isFullyPaid ? greenColor : orangeColor;
  const badgeLabel = isFullyPaid ? 'PAID' : 'PARTIALLY PAID';

  doc.rect(400, 130, 145, 28).fill(badgeColor);
  doc.fillColor(badgeTextColor).fontSize(11).font('Helvetica-Bold').text(badgeLabel, 415, 138);

  doc.rect(280, 130, 110, 28).fill(roleBadgeColor);
  doc.fillColor(roleBadgeTextColor).fontSize(10).font('Helvetica-Bold').text(roleBadgeText, 285, 138);

  // ─── From / To ───────────────────────────────────────────────────────────
  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('FROM', 50, 175);
  doc.fillColor(darkColor).fontSize(13).font('Helvetica-Bold').text(payment.booking.listing.owner.name, 50, 190);
  doc.fillColor(grayColor).fontSize(10).font('Helvetica').text(payment.booking.listing.owner.email, 50, 207);
  doc.fillColor(grayColor).fontSize(10).text('Owner / Landlord', 50, 222);

  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('BILLED TO', 300, 175);
  doc.fillColor(darkColor).fontSize(13).font('Helvetica-Bold').text(payment.student.name, 300, 190);
  doc.fillColor(grayColor).fontSize(10).font('Helvetica').text(payment.student.email, 300, 207);
  doc.fillColor(grayColor).fontSize(10).text('Tenant / Student', 300, 222);

  doc.moveTo(50, 250).lineTo(545, 250).strokeColor(borderColor).lineWidth(1).stroke();

  // ─── Property Details ─────────────────────────────────────────────────────
  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('PROPERTY DETAILS', 50, 265);
  doc.rect(50, 280, 495, 70).fill(lightGray);
  doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text(payment.booking.listing.title, 65, 292);
  doc.fillColor(grayColor).fontSize(10).font('Helvetica').text(payment.booking.listing.address, 65, 310);
  doc.fillColor(grayColor).fontSize(10).text(`${payment.booking.listing.area}, ${payment.booking.listing.city}`, 65, 326);

  if (payment.booking.moveInDate) {
    const moveIn = new Date(payment.booking.moveInDate).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(`Move-in Date: ${moveIn}`, 380, 318);
  }

  // ─── Invoice Table ────────────────────────────────────────────────────────
  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('INVOICE DETAILS', 50, 370);

  doc.rect(50, 385, 495, 30).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
    .text('Description', 65, 395)
    .text('Type', 300, 395)
    .text('Amount (BDT)', 420, 395);

  let yPos = 415;

  doc.rect(50, yPos, 495, 30).fill(yPos % 60 === 0 ? lightGray : '#ffffff');
  doc.fillColor(darkColor).fontSize(10).font('Helvetica')
    .text(isFullyPaid ? 'Monthly Rent' : 'Rent (Paid Installments)', 65, yPos + 10)
    .text('Base Rent', 300, yPos + 10)
    .text(`${paidAmount.toLocaleString()} BDT`, 420, yPos + 10);
  yPos += 30;

  payment.booking.extraCharges.forEach((charge) => {
    doc.rect(50, yPos, 495, 30).fill(yPos % 60 === 0 ? lightGray : '#ffffff');
    doc.fillColor(darkColor).fontSize(10).font('Helvetica')
      .text(charge.title, 65, yPos + 10)
      .text(charge.description || 'Extra Charge', 300, yPos + 10)
      .text(`${charge.amount.toLocaleString()} BDT`, 420, yPos + 10);
    yPos += 30;
  });

  doc.rect(50, 385, 495, yPos - 385).strokeColor(borderColor).lineWidth(0.5).stroke();
  yPos += 15;

  // ─── Summary (Role-based) ─────────────────────────────────────────────────
  doc.fillColor(grayColor).fontSize(10).font('Helvetica')
    .text('Subtotal:', 380, yPos)
    .text(`${paidAmount.toLocaleString()} BDT`, 470, yPos, { align: 'right' });
  yPos += 20;

  if (extraTotal > 0) {
    doc.fillColor(grayColor).fontSize(10)
      .text('Extra Charges:', 380, yPos)
      .text(`${extraTotal.toLocaleString()} BDT`, 470, yPos, { align: 'right' });
    yPos += 20;
  }

  // OWNER: commission deducted, net amount দেখাবে
  if (isOwner && !isAdmin) {
    doc.fillColor('#b45309').fontSize(10).font('Helvetica')
      .text('Platform Commission (10%):', 340, yPos)
      .text(`- ${paidCommission.toLocaleString()} BDT`, 470, yPos, { align: 'right' });
    yPos += 10;

    doc.moveTo(370, yPos).lineTo(545, yPos).strokeColor(borderColor).lineWidth(0.5).stroke();
    yPos += 10;

    doc.rect(370, yPos, 175, 35).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
      .text('Net Received:', 385, yPos + 10)
      .text(`${netOwnerAmount.toLocaleString()} BDT`, 390, yPos + 10, { align: 'right', width: 140 });
    yPos += 55;
  }

  // ADMIN: commission আলাদা দেখাবে, সব info
  else if (isAdmin) {
    doc.fillColor('#1e40af').fontSize(10).font('Helvetica')
      .text('Platform Commission (10%):', 340, yPos)
      .text(`${paidCommission.toLocaleString()} BDT`, 470, yPos, { align: 'right' });
    yPos += 10;

    doc.moveTo(370, yPos).lineTo(545, yPos).strokeColor(borderColor).lineWidth(0.5).stroke();
    yPos += 10;

    doc.rect(370, yPos, 175, 35).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
      .text('Total:', 385, yPos + 10)
      .text(`${grandTotal.toLocaleString()} BDT`, 390, yPos + 10, { align: 'right', width: 140 });
    yPos += 55;
  }

  // STUDENT: শুধু total
  else {
    doc.moveTo(370, yPos).lineTo(545, yPos).strokeColor(borderColor).lineWidth(0.5).stroke();
    yPos += 10;

    doc.rect(370, yPos, 175, 35).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
      .text(isFullyPaid ? 'Total Paid:' : 'Total Paid So Far:', 385, yPos + 10)
      .text(`${grandTotal.toLocaleString()} BDT`, 390, yPos + 10, { align: 'right', width: 140 });
    yPos += 55;
  }

  // ─── Admin Extra Section ──────────────────────────────────────────────────
  if (isAdmin) {
    doc.rect(50, yPos, 495, 55).fill('#eff6ff');
    doc.fillColor('#1e40af').fontSize(9).font('Helvetica-Bold').text('PLATFORM EARNINGS SUMMARY', 65, yPos + 10);
    doc.fillColor(darkColor).fontSize(10).font('Helvetica')
      .text(`Owner Receives:`, 65, yPos + 25)
      .text(`DhakaStay Commission:`, 250, yPos + 25);
    doc.fillColor(greenColor).fontSize(11).font('Helvetica-Bold')
      .text(`${netOwnerAmount.toLocaleString()} BDT`, 175, yPos + 25);
    doc.fillColor('#1e40af').fontSize(11).font('Helvetica-Bold')
      .text(`${paidCommission.toLocaleString()} BDT`, 420, yPos + 25);
    yPos += 70;
  }

  // ─── Payment Info ─────────────────────────────────────────────────────────
  doc.rect(50, yPos, 495, 60).fill(lightGray);
  doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('PAYMENT INFORMATION', 65, yPos + 10);
  doc.fillColor(darkColor).fontSize(10).font('Helvetica')
    .text('Transaction ID:', 65, yPos + 25)
    .text('Payment Method:', 65, yPos + 40);
  doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
    .text(`${payment.transactionId}`, 175, yPos + 25)
    .text('SSLCommerz', 175, yPos + 40);
  doc.fillColor(darkColor).fontSize(10).font('Helvetica')
    .text('Booking ID:', 320, yPos + 25)
    .text('Paid On:', 320, yPos + 40);
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