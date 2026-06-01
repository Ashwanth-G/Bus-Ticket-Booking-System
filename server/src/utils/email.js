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

export const sendRegistrationEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #1e3a8a; text-align: center;">Welcome to SmartBus Pro!</h2>
      <p>Dear ${user.fullName},</p>
      <p>Thank you for registering with SmartBus Pro. Your account has been successfully created.</p>
      <p><strong>Login Email:</strong> ${user.email}</p>
      <p>You can now search and book bus tickets instantly with live availability, seat selection, and digital tickets.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a>
      </div>
      <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px;">
        This is a simulated notification. No SMTP action was performed.
      </p>
    </div>
  `;

  console.log(`\n================== [SIMULATED EMAIL SENT] ==================`);
  console.log(`TO: ${user.email}`);
  console.log(`SUBJECT: Welcome to SmartBus Pro!`);
  console.log(`BODY (HTML Content Logged below):`);
  console.log(html);
  console.log(`============================================================\n`);
  
  return true;
};

export const sendBookingConfirmationEmail = async (user, booking) => {
  const passengersHtml = booking.passengers.map(p => 
    `<li>Passenger: ${p.passengerName} (Seat: ${getSeatLabel(p.seatNumber, booking.schedule.bus.busType)})</li>`
  ).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #10b981; text-align: center;">Booking Confirmed!</h2>
      <p>Dear ${user.fullName},</p>
      <p>Your bus booking is confirmed. Here are your booking details:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
        <p><strong>Total Fare:</strong> $${booking.totalFare.toFixed(2)}</p>
        <p><strong>Bus:</strong> ${booking.schedule.bus.busName} (${booking.schedule.bus.busType})</p>
        <p><strong>Route:</strong> ${booking.schedule.route.sourceCity} to ${booking.schedule.route.destinationCity}</p>
        <p><strong>Departure:</strong> ${new Date(booking.schedule.departureDate).toLocaleDateString()} at ${booking.schedule.departureTime}</p>
      </div>
      <h3>Passengers</h3>
      <ul>
        ${passengersHtml}
      </ul>
      <p>Thank you for choosing SmartBus Pro. Have a safe journey!</p>
      <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px;">
        This is a simulated notification. No SMTP action was performed.
      </p>
    </div>
  `;

  console.log(`\n================== [SIMULATED EMAIL SENT] ==================`);
  console.log(`TO: ${user.email}`);
  console.log(`SUBJECT: Booking Confirmation - Reference ${booking.bookingReference}`);
  console.log(`BODY (HTML Content Logged below):`);
  console.log(html);
  console.log(`============================================================\n`);

  return true;
};

export const sendBookingCancellationEmail = async (user, booking) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #ef4444; text-align: center;">Booking Cancelled</h2>
      <p>Dear ${user.fullName},</p>
      <p>Your booking with reference <strong>${booking.bookingReference}</strong> has been cancelled.</p>
      <p>We have processed a refund of <strong>$${booking.totalFare.toFixed(2)}</strong> back to your original payment method. It will reflect in 3-5 business days.</p>
      <p>If you did not request this cancellation, please contact our support team immediately.</p>
      <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px;">
        This is a simulated notification. No SMTP action was performed.
      </p>
    </div>
  `;

  console.log(`\n================== [SIMULATED EMAIL SENT] ==================`);
  console.log(`TO: ${user.email}`);
  console.log(`SUBJECT: Booking Cancellation - Reference ${booking.bookingReference}`);
  console.log(`BODY (HTML Content Logged below):`);
  console.log(html);
  console.log(`============================================================\n`);

  return true;
};
