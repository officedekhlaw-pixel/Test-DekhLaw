/**
 * DekhLaw — Notification Utility
 *
 * Notifies lawyers of new SOS matches via WhatsApp Business API / SMS.
 * Replace the stub implementations with real API keys in production.
 *
 * Supported channels:
 *  - WhatsApp Business API (Meta / Twilio / WATI)
 *  - SMS via MSG91 (popular in India)
 *  - Email via Nodemailer / SendGrid (fallback)
 */

/**
 * Notify a lawyer about a new SOS request.
 * @param {Object} lawyer - { id, full_name, phone, whatsapp }
 * @param {Object} sosData - { sosId, name, phone, city, legalIssue }
 */
async function notifyLawyer(lawyer, sosData) {
  const message = buildLawyerMessage(lawyer, sosData);

  try {
    if (lawyer.whatsapp && process.env.WATI_API_KEY) {
      await sendWhatsApp(lawyer.phone, message);
    } else if (process.env.MSG91_KEY) {
      await sendSMS(lawyer.phone, message);
    } else {
      // Dev mode: just log
      console.log(`[NOTIFY → Lawyer ${lawyer.full_name} (${lawyer.phone})]\n${message}\n`);
    }
  } catch (err) {
    // Notification failure must never crash the SOS submission
    console.error(`Notification failed for lawyer ${lawyer.id}:`, err.message);
  }
}

/**
 * Notify admin of a new SOS (can be Telegram bot, email, etc.)
 */
async function notifyAdminSOS(sosData) {
  const msg = `🚨 New SOS — ${sosData.legalIssue}\nFrom: ${sosData.name} (${sosData.phone})\nCity: ${sosData.city}`;
  console.log('[ADMIN ALERT]', msg);
  // TODO: Telegram bot / SendGrid email to admin
}

// ─── Message Builder ──────────────────────────────────────────────────────────

function buildLawyerMessage(lawyer, { sosId, name, phone, city, legalIssue }) {
  return `🚨 *DekhLaw SOS Alert — Emergency Client*

*Name:* ${name}
*Phone:* ${phone}
*City:* ${city}
*Issue:* ${legalIssue}
*SOS ID:* #${sosId}

This client needs urgent legal help. If you are available, please call them within 15 minutes.

_DekhLaw — India's Legal Emergency Platform_`;
}

// ─── WhatsApp via WATI ────────────────────────────────────────────────────────

async function sendWhatsApp(phone, message) {
  const endpoint = `${process.env.WATI_API_URL}/sendSessionMessage/${phone}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WATI_API_KEY}`,
    },
    body: JSON.stringify({ messageText: message }),
  });
  const result = await response.json();
  if (!result.result) throw new Error('WATI error: ' + JSON.stringify(result));
  return result;
}

// ─── SMS via MSG91 ────────────────────────────────────────────────────────────

async function sendSMS(phone, message) {
  const params = new URLSearchParams({
    sender:  process.env.MSG91_SENDER || 'DKHLAW',
    route:   '4',
    country: '91',
    sms:     JSON.stringify([{ message, to: [`91${phone}`] }]),
  });

  const response = await fetch(
    `https://api.msg91.com/api/sendhttp.php?authkey=${process.env.MSG91_KEY}&${params}`,
    { method: 'POST' }
  );
  const text = await response.text();
  return text;
}

module.exports = { notifyLawyer, notifyAdminSOS };
