import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass || user.startsWith('replace_with') || pass.startsWith('replace_with')) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  }
  return transporter;
}

async function sendMail({ to, subject, html, attachments }) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email disabled - set GMAIL_USER/GMAIL_APP_PASSWORD in .env] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const info = await mailer.sendMail({ from: `"LiveInAus" <${process.env.GMAIL_USER}>`, to, subject, html, attachments });
    console.log(`[email sent] To: ${to} | Subject: ${subject} | id: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[email failed] To: ${to} | Subject: ${subject} |`, error.message);
    return false;
  }
}

export async function sendOtpEmail(email, otp) {
  console.log(`OTP for ${email}: ${otp}`);
  return sendMail({
    to: email,
    subject: `Your LiveInAus verification code: ${otp}`,
    html: `<p>Your LiveInAus verification code is:</p>
           <p style="font-size:28px;font-weight:800;letter-spacing:4px;">${otp}</p>
           <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`
  });
}

function formatIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildAppointmentIcs({ title, description, start, durationMinutes = 60 }) {
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const uid = `${start.getTime()}-${Math.round(Math.random() * 1e6)}@liveinaus`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LiveInAus//Appointment//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export async function sendAppointmentStatusEmail({ requesterEmail, listingTitle, date, preferredTime, status, adminNotes }) {
  const approved = status === 'approved';
  const dateLabel = new Date(date).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const subject = approved
    ? `Your appointment with ${listingTitle} is confirmed`
    : `Your appointment request with ${listingTitle} was declined`;

  const html = approved
    ? `<p>Your appointment request with <strong>${listingTitle}</strong> has been <strong>approved</strong>.</p>
       <p><strong>Date:</strong> ${dateLabel}<br/><strong>Time:</strong> ${preferredTime || 'To be confirmed'}</p>
       ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ''}
       <p>A calendar invite is attached to this email — open it to add the appointment straight to your calendar.</p>`
    : `<p>Your appointment request with <strong>${listingTitle}</strong> for ${dateLabel} has been <strong>declined</strong>.</p>
       ${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ''}
       <p>You're welcome to submit a new request for a different date.</p>`;

  let attachments;
  if (approved) {
    const [hours, minutes] = (preferredTime || '09:00').split(':').map(Number);
    const start = new Date(date);
    start.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    const ics = buildAppointmentIcs({
      title: `Appointment with ${listingTitle}`,
      description: `LiveInAus appointment with ${listingTitle}`,
      start
    });
    attachments = [{ filename: 'appointment.ics', content: ics, contentType: 'text/calendar' }];
  }

  return sendMail({ to: requesterEmail, subject, html, attachments });
}
