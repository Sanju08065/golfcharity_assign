/**
 * Email Service — sends transactional emails via Resend.
 * Handles: welcome emails, draw results, winner notifications, system updates.
 */
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'GolfCharity <onboarding@resend.dev>';

/**
 * Send welcome email after registration.
 */
async function sendWelcomeEmail(email, fullName) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to GolfCharity!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D1B2A;color:#fff;padding:40px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:30px;">
            <div style="display:inline-block;background:#D4AF37;color:#0D1B2A;font-weight:bold;padding:10px 16px;border-radius:8px;font-size:18px;">GC</div>
          </div>
          <h1 style="color:#D4AF37;text-align:center;">Welcome, ${fullName}!</h1>
          <p style="color:#ccc;text-align:center;line-height:1.6;">
            You've joined a community that plays golf, wins prizes, and changes lives through charity.
          </p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#D4AF37;color:#0D1B2A;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Go to Dashboard</a>
          </div>
          <p style="color:#666;text-align:center;font-size:12px;">GolfCharity — Play. Win. Give.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }
}

/**
 * Send draw results notification to a subscriber.
 */
async function sendDrawResultEmail(email, fullName, drawMonth, drawYear, winningNumbers, matchCount, prizeAmount) {
  try {
    const monthName = new Date(0, drawMonth - 1).toLocaleString('en', { month: 'long' });
    const isWinner = matchCount >= 3;

    const numbersHtml = (winningNumbers || []).map(n =>
      `<span style="display:inline-block;background:#D4AF37;color:#0D1B2A;width:44px;height:44px;line-height:44px;text-align:center;border-radius:10px;font-weight:900;font-size:16px;margin:0 4px;">${n}</span>`
    ).join('');

    const winnerBanner = isWinner ? `
      <div style="background:linear-gradient(135deg,#1B2D45,#0D1B2A);border:2px solid #D4AF37;border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
        <div style="font-size:40px;margin-bottom:8px;">🎉</div>
        <p style="color:#D4AF37;font-size:22px;font-weight:900;margin:0 0 8px;">You matched ${matchCount} number${matchCount !== 1 ? 's' : ''}!</p>
        <p style="color:#fff;font-size:28px;font-weight:900;margin:0 0 12px;">Prize: £${(prizeAmount || 0).toFixed(2)}</p>
        <p style="color:#9ca3af;font-size:13px;margin:0 0 20px;">Upload your proof of play to claim your prize.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/winnings"
          style="display:inline-block;background:#D4AF37;color:#0D1B2A;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:900;font-size:14px;">
          Claim Prize →
        </a>
      </div>
    ` : `
      <div style="background:#1B2D45;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
        <p style="color:#9ca3af;font-size:15px;margin:0;">You matched <strong style="color:#fff;">${matchCount}</strong> number${matchCount !== 1 ? 's' : ''} this month.</p>
        <p style="color:#6b7280;font-size:13px;margin:8px 0 0;">Keep logging your scores for next month's draw!</p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: isWinner
        ? `🎉 You won in the ${monthName} ${drawYear} draw — claim your prize!`
        : `📣 ${monthName} ${drawYear} Draw Results — see your numbers`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0D1B2A;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#0D1B2A,#1B2D45);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.2);">
            <div style="display:inline-block;background:#D4AF37;color:#0D1B2A;font-weight:900;padding:8px 14px;border-radius:8px;font-size:16px;letter-spacing:1px;margin-bottom:16px;">GC</div>
            <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 4px;">Draw Results Announced</h1>
            <p style="color:#D4AF37;font-size:14px;font-weight:600;margin:0;">${monthName} ${drawYear}</p>
          </div>

          <!-- Body -->
          <div style="padding:32px 40px;">
            <p style="color:#9ca3af;font-size:15px;margin:0 0 24px;">Hi <strong style="color:#fff;">${fullName}</strong>, the ${monthName} ${drawYear} draw has been published. Here are the winning numbers:</p>

            <!-- Winning numbers -->
            <div style="text-align:center;margin:0 0 8px;padding:24px;background:#1B2D45;border-radius:12px;">
              <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 16px;">Winning Numbers</p>
              <div>${numbersHtml}</div>
            </div>

            ${winnerBanner}

            <!-- CTA -->
            <div style="text-align:center;margin:28px 0 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard/draws"
                style="display:inline-block;background:#D4AF37;color:#0D1B2A;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:900;font-size:15px;">
                View Full Results
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="color:#4b5563;font-size:12px;margin:0;">GolfCharity — Play. Win. Give.</p>
            <p style="color:#374151;font-size:11px;margin:6px 0 0;">You're receiving this because you're an active GolfCharity subscriber.</p>
          </div>
        </div>
      `,
    });
    console.log(`Draw result email sent to ${email}`);
  } catch (err) {
    console.error(`Draw result email failed for ${email}:`, err.message);
  }
}

/**
 * Send winner verification notification.
 */
async function sendWinnerVerifiedEmail(email, fullName, status, prizeAmount, reason) {
  try {
    const isApproved = status === 'approved';
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: isApproved ? '✅ Your prize has been verified!' : '❌ Prize verification update',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D1B2A;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:${isApproved ? '#D4AF37' : '#E8553A'};text-align:center;">
            ${isApproved ? 'Prize Verified!' : 'Verification Update'}
          </h1>
          ${isApproved ? `
            <p style="color:#ccc;text-align:center;">Congratulations ${fullName}! Your prize of £${prizeAmount?.toFixed(2)} has been verified and will be paid out shortly.</p>
          ` : `
            <p style="color:#ccc;text-align:center;">Hi ${fullName}, unfortunately your submission was not approved.</p>
            ${reason ? `<p style="color:#E8553A;text-align:center;">Reason: ${reason}</p>` : ''}
          `}
        </div>
      `,
    });
  } catch (err) {
    console.error('Verification email failed:', err.message);
  }
}

/**
 * Send payment confirmation email.
 */
async function sendPaymentEmail(email, fullName, prizeAmount) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '💰 Your prize has been paid!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D1B2A;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#D4AF37;text-align:center;">Payment Sent!</h1>
          <p style="color:#ccc;text-align:center;">Hi ${fullName}, your prize of £${prizeAmount?.toFixed(2)} has been paid out. Thank you for playing!</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Payment email failed:', err.message);
  }
}

/**
 * Send OTP email for password reset.
 */
async function sendOtpEmail(email, fullName, otp) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${otp} — Your GolfCharity password reset code`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D1B2A;color:#fff;padding:40px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#D4AF37;color:#0D1B2A;font-weight:900;padding:10px 16px;border-radius:8px;font-size:18px;">GC</div>
          </div>
          <h1 style="color:#fff;text-align:center;font-size:22px;margin-bottom:8px;">Password Reset</h1>
          <p style="color:#9ca3af;text-align:center;margin-bottom:32px;">Hi ${fullName}, use the code below to reset your password. It expires in 10 minutes.</p>
          <div style="text-align:center;margin:0 auto 32px;background:#1B2D45;border:1px solid rgba(212,175,55,0.3);border-radius:16px;padding:32px;">
            <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:4px;margin-bottom:12px;">Your OTP</p>
            <p style="color:#D4AF37;font-size:48px;font-weight:900;letter-spacing:12px;margin:0;">${otp}</p>
          </div>
          <p style="color:#6b7280;text-align:center;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color:#4b5563;text-align:center;font-size:12px;margin-top:24px;">GolfCharity — Play. Win. Give.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('OTP email failed:', err.message);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendDrawResultEmail,
  sendWinnerVerifiedEmail,
  sendPaymentEmail,
  sendOtpEmail,
};
