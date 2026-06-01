import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const getSeatLabel = (seatNumber, busType) => {
  if (busType && busType.toLowerCase().includes('sleeper')) {
    if (seatNumber <= 18) {
      return `l-${seatNumber}`;
    } else {
      return `u-${seatNumber - 18}`;
    }
  }
  return seatNumber.toString();
};

export const generateTicketPDF = async (booking, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to response
  doc.pipe(res);

  // Compile QR Code data
  const qrData = JSON.stringify({
    ref: booking.bookingReference,
    route: `${booking.schedule.route.sourceCity} ➔ ${booking.schedule.route.destinationCity}`,
    date: new Date(booking.schedule.departureDate).toLocaleDateString(),
    time: booking.schedule.departureTime,
    seats: booking.passengers.map(p => getSeatLabel(p.seatNumber, booking.schedule.bus.busType)).join(', ')
  });

  try {
    const qrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 70 });
    doc.image(qrBuffer, 480, 15, { width: 70, height: 70 });
  } catch (err) {
    console.error('Error adding QR code to PDF:', err);
  }

  // Styling Constants
  const primaryColor = '#1e3a8a'; // Dark Blue
  const secondaryColor = '#3b82f6'; // Light Blue
  const textColor = '#1f2937'; // Slate

  // Header Title
  doc.fillColor(primaryColor)
     .fontSize(24)
     .text('SMARTBUS PRO TICKET', { align: 'center', bold: true });
  
  doc.moveDown();
  
  // Draw a horizontal line
  doc.strokeColor(secondaryColor)
     .lineWidth(2)
     .moveTo(50, 90)
     .lineTo(550, 90)
     .stroke();

  doc.moveDown(1.5);

  // Booking Info Section
  doc.fillColor(primaryColor).fontSize(14).text('Booking Details', { underline: true });
  doc.moveDown(0.5);

  doc.fillColor(textColor).fontSize(12);
  doc.text(`Booking Reference: ${booking.bookingReference}`);
  doc.text(`Booked At: ${new Date(booking.bookedAt).toLocaleString()}`);
  doc.text(`Status: ${booking.bookingStatus}`);
  doc.text(`Total Fare: $${booking.totalFare.toFixed(2)}`);
  
  doc.moveDown();

  // Journey Info Section
  doc.fillColor(primaryColor).fontSize(14).text('Journey Details', { underline: true });
  doc.moveDown(0.5);

  const formattedDate = new Date(booking.schedule.departureDate).toLocaleDateString();

  doc.fillColor(textColor).fontSize(12);
  doc.text(`Bus: ${booking.schedule.bus.busName} (${booking.schedule.bus.busType})`);
  doc.text(`Operator: ${booking.schedule.bus.operatorName}`);
  doc.text(`Route: ${booking.schedule.route.sourceCity} ➔ ${booking.schedule.route.destinationCity}`);
  doc.text(`Date of Journey: ${formattedDate}`);
  doc.text(`Departure Time: ${booking.schedule.departureTime}`);
  doc.text(`Estimated Arrival: ${booking.schedule.arrivalTime}`);
  
  doc.moveDown();

  // Passenger & Seat Info Section
  doc.fillColor(primaryColor).fontSize(14).text('Passenger & Seat Details', { underline: true });
  doc.moveDown(0.5);

  booking.passengers.forEach((passenger, index) => {
    doc.fillColor(textColor).fontSize(12);
    doc.text(`${index + 1}. Name: ${passenger.passengerName} | Phone: ${passenger.passengerPhone} | Seat: ${getSeatLabel(passenger.seatNumber, booking.schedule.bus.busType)}`);
  });

  doc.moveDown(2);

  // Footer Section
  doc.strokeColor('#d1d5db')
     .lineWidth(1)
     .moveTo(50, 600)
     .lineTo(550, 600)
     .stroke();

  doc.fillColor('#6b7280')
     .fontSize(10)
     .text('Thank you for booking with SmartBus Pro! Please bring a copy of this ticket (digital or printed) and a valid ID card during your travel.', 50, 620, { align: 'center', width: 500 });

  // Finish document writing
  doc.end();
};
