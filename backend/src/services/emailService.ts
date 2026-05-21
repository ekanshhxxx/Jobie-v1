import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM = process.env.BREVO_FROM;
const APP_NAME = 'Jobie';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const isConfigured = Boolean((EMAIL_USER && EMAIL_PASS) || (BREVO_API_KEY && BREVO_FROM));

let primaryTransporter: nodemailer.Transporter | null = null;
let fallbackTransporter: nodemailer.Transporter | null = null;
let primaryFrom = '';
let fallbackFrom = '';

const configureTransporters = () => {
  if (EMAIL_USER && EMAIL_PASS) {
    primaryTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
    primaryFrom = `"${APP_NAME}" <${EMAIL_USER}>`;
    console.log('[EmailService] Primary SMTP: Gmail');
  }

  if (BREVO_API_KEY && BREVO_FROM) {
    const brevoT = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: { user: BREVO_FROM, pass: BREVO_API_KEY },
    });
    const brevoF = `"${APP_NAME}" <${BREVO_FROM}>`;
    
    if (!primaryTransporter) {
      primaryTransporter = brevoT;
      primaryFrom = brevoF;
      console.log('[EmailService] Primary SMTP: Brevo');
    } else {
      fallbackTransporter = brevoT;
      fallbackFrom = brevoF;
      console.log('[EmailService] Fallback SMTP: Brevo');
    }
  }
};

configureTransporters();

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!primaryTransporter) {
    console.log(`[EmailService] NOTICE: Email not configured. Would have sent to ${options.to}: "${options.subject}"`);
    return;
  }
  try {
    console.log('\n==================================================');
    console.log(`[EmailService] PREPARING EMAIL TO: ${options.to}`);
    console.log(`[EmailService] SUBJECT: ${options.subject}`);
    console.log(`[EmailService] TEXT PREVIEW:\n${options.text || 'No plain text'}`);
    console.log('==================================================\n');

    try {
      await primaryTransporter.sendMail({
        from: primaryFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`[EmailService] ✅ Email successfully sent via Primary SMTP to ${options.to}`);
      return;
    } catch (primaryErr: any) {
      console.warn(`[EmailService] ⚠️ Primary SMTP failed for ${options.to}: ${primaryErr.message}`);
      
      if (fallbackTransporter) {
        console.log(`[EmailService] 🔄 Attempting fallback SMTP...`);
        await fallbackTransporter.sendMail({
          from: fallbackFrom,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        console.log(`[EmailService] ✅ Email successfully sent via Fallback SMTP to ${options.to}`);
        return;
      }
      
      throw primaryErr; // No fallback available, throw to outer catch
    }
  } catch (err: any) {
    console.error(`[EmailService] ❌ Failed to send email to ${options.to} completely:`, err.message);
    // Non-throwing — email failure should never break API response
  }
}

const baseStyle = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #030712;
  margin: 0; padding: 40px 20px;
  -webkit-font-smoothing: antialiased;
`;

const cardStyle = `
  max-width: 600px;
  margin: 0 auto;
  background: #09090b;
  border-radius: 24px;
  border: 1px solid #1f2937;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const gradientHeader = (gradient: string) => `
  background: ${gradient};
  padding: 4px;
`;

const bodyStyle = `
  padding: 48px 40px;
  color: #9ca3af;
  font-size: 16px;
  line-height: 1.7;
`;

const h1Style = `
  margin: 0 0 8px;
  color: #f9fafb;
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
`;

const h2Style = `
  margin: 0 0 32px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const btnStyle = (gradient: string, shadow: string) => `
  display: inline-block;
  margin-top: 32px;
  background: ${gradient};
  color: #ffffff;
  text-decoration: none;
  padding: 16px 36px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.02em;
  box-shadow: ${shadow};
  text-align: center;
`;

const tableStyle = `
  width: 100%;
  border-collapse: collapse;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  overflow: hidden;
  margin: 32px 0;
`;

const tdLabelStyle = `
  padding: 16px 20px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid #1f2937;
`;

const tdValueStyle = `
  padding: 16px 20px;
  color: #f3f4f6;
  font-size: 15px;
  font-weight: 600;
  text-align: right;
  border-bottom: 1px solid #1f2937;
`;

const footerStyle = `
  padding: 24px 40px;
  background: #030712;
  font-size: 12px;
  color: #4b5563;
  text-align: center;
  border-top: 1px solid #1f2937;
`;

// ─── 1. Shortlisted / Selected for Interview ─────────────────────────────────
export async function sendShortlistedEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
  recruiterName?: string;
}): Promise<void> {
  const { candidateName, candidateEmail, jobTitle, company, recruiterName } = params;
  await sendMail({
    to: candidateEmail,
    subject: `🎯 You've been shortlisted for ${jobTitle} at ${company}`,
    html: `
      <div style="${baseStyle}">
        <div style="${cardStyle}">
          <div style="${gradientHeader('linear-gradient(90deg, #3b82f6, #8b5cf6)')}"></div>
          <div style="${bodyStyle}">
            <h1 style="${h1Style}">Shortlisted. 🎯</h1>
            <p style="${h2Style}">${APP_NAME} Recruitment</p>
            
            <p>Hi <strong style="color: #f9fafb;">${candidateName}</strong>,</p>
            <p>Great news — the hiring team${recruiterName ? ` at <strong style="color: #f9fafb;">${company}</strong>` : ''} has shortlisted you for the <strong style="color: #f9fafb;">${jobTitle}</strong> position.</p>
            <p>Your profile stood out from a highly competitive applicant pool. You can expect to hear from the recruiter soon regarding next steps, which will likely include an interview invitation.</p>
            
            <center>
              <a href="${APP_URL}/candidate/applications" style="${btnStyle('linear-gradient(135deg, #3b82f6, #6366f1)', '0 4px 14px 0 rgba(99, 102, 241, 0.39)')}">Track Your Application</a>
            </center>
          </div>
          <div style="${footerStyle}">Sent securely by ${APP_NAME} • You are receiving this because you applied to ${company}.</div>
        </div>
      </div>
    `,
    text: `Hi ${candidateName}, you've been shortlisted for ${jobTitle} at ${company}. Log in to ${APP_URL}/candidate/applications to view your application.`,
  });
}

// ─── 2. Interview Scheduled ───────────────────────────────────────────────────
export async function sendInterviewScheduledEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
  scheduledAt: string;     // ISO date string
  duration: number;        // minutes
  meetingUrl?: string | null;
  recruiterName?: string;
}): Promise<void> {
  const { candidateName, candidateEmail, jobTitle, company, scheduledAt, duration, meetingUrl, recruiterName } = params;
  const dateObj = new Date(scheduledAt);
  const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  await sendMail({
    to: candidateEmail,
    subject: `📅 Interview Scheduled: ${jobTitle} at ${company}`,
    html: `
      <div style="${baseStyle}">
        <div style="${cardStyle}">
          <div style="${gradientHeader('linear-gradient(90deg, #0ea5e9, #8b5cf6, #ec4899)')}"></div>
          <div style="${bodyStyle}">
            <h1 style="${h1Style}; font-size: 42px;">Boom! You're In. 🚀</h1>
            <p style="${h2Style}; color: #38bdf8;">${APP_NAME} Recruitment</p>
            
            <p>Hi <strong style="color: #f9fafb; font-size: 18px;">${candidateName}</strong>,</p>
            <p>This is it. The moment you've been waiting for. <strong style="color: #f9fafb;">${company}</strong> wants to meet you for the <strong style="color: #f9fafb;">${jobTitle}</strong> role!</p>
            <p>Get ready to show them what you're made of. This is a life-changing opportunity, and you've already made it past the hardest part. Here are the details of your upcoming interview:</p>
            
            <table style="${tableStyle}">
              <tr>
                <td style="${tdLabelStyle}">Date</td>
                <td style="${tdValueStyle}">${dateStr}</td>
              </tr>
              <tr>
                <td style="${tdLabelStyle}">Time</td>
                <td style="${tdValueStyle}">${timeStr}</td>
              </tr>
              <tr>
                <td style="${tdLabelStyle}">Duration</td>
                <td style="${tdValueStyle}">${duration} minutes</td>
              </tr>
              ${meetingUrl ? `
              <tr>
                <td style="${tdLabelStyle}; border-bottom: none;">Location</td>
                <td style="${tdValueStyle}; border-bottom: none;">
                  <a href="${meetingUrl}" style="color: #3b82f6; text-decoration: none;">Google Meet ↗</a>
                </td>
              </tr>` : ''}
            </table>
            
            <center>
              ${meetingUrl 
                ? `<a href="${meetingUrl}" style="${btnStyle('linear-gradient(135deg, #0ea5e9, #8b5cf6)', '0 8px 25px -5px rgba(139, 92, 246, 0.6)')}; font-size: 18px; padding: 18px 42px;">Crush Your Interview ↗</a>` 
                : `<a href="${APP_URL}/candidate/interviews" style="${btnStyle('linear-gradient(135deg, #3b82f6, #4f46e5)', '0 8px 25px -5px rgba(79, 70, 229, 0.6)')}; font-size: 18px; padding: 18px 42px;">View Details</a>`}
            </center>
            
            <p style="margin-top: 40px; font-size: 14px; color: #6b7280; text-align: center;">Take a deep breath. You've got this. 💯</p>
          </div>
          <div style="${footerStyle}">Sent securely by ${APP_NAME}</div>
        </div>
      </div>
    `,
    text: `Hi ${candidateName}, your interview for ${jobTitle} at ${company} is scheduled for ${dateStr} at ${timeStr} (${duration} min).${meetingUrl ? ` Join here: ${meetingUrl}` : ''}`,
  });
}

// ─── 3. Offer Letter Sent ─────────────────────────────────────────────────────
export async function sendOfferLetterEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
  offerDetails?: {
    salary?: string;
    startDate?: string;
    message?: string;
  } | null;
}): Promise<void> {
  const { candidateName, candidateEmail, jobTitle, company, offerDetails } = params;
  const salary = offerDetails?.salary;
  const startDate = offerDetails?.startDate;
  const message = offerDetails?.message;

  await sendMail({
    to: candidateEmail,
    subject: `🎉 Job Offer: ${jobTitle} at ${company}`,
    html: `
      <div style="${baseStyle}">
        <div style="${cardStyle}">
          <div style="${gradientHeader('linear-gradient(90deg, #fbbf24, #f59e0b)')}"></div>
          <div style="${bodyStyle}">
            <h1 style="${h1Style}; color: #fcd34d;">Official Offer. 🏆</h1>
            <p style="${h2Style}">${APP_NAME} Recruitment</p>
            
            <p>Hi <strong style="color: #f9fafb;">${candidateName}</strong>,</p>
            <p>Congratulations! <strong style="color: #f9fafb;">${company}</strong> is incredibly excited to extend an official job offer to you for the role of <strong style="color: #f9fafb;">${jobTitle}</strong>.</p>
            
            ${(salary || startDate) ? `
            <table style="${tableStyle}">
              ${salary ? `
              <tr>
                <td style="${tdLabelStyle}">Compensation</td>
                <td style="${tdValueStyle}; color: #10b981;">${salary}</td>
              </tr>` : ''}
              ${startDate ? `
              <tr>
                <td style="${tdLabelStyle}; border-bottom: none;">Start Date</td>
                <td style="${tdValueStyle}; border-bottom: none;">${startDate}</td>
              </tr>` : ''}
            </table>` : ''}
            
            ${message ? `
            <div style="background: #111827; border-left: 4px solid #fbbf24; border-radius: 0 12px 12px 0; padding: 24px; margin: 32px 0;">
              <p style="margin: 0; color: #d1d5db; font-size: 15px; font-style: italic; line-height: 1.6;">"${message}"</p>
            </div>` : ''}
            
            <center>
              <a href="${APP_URL}/candidate/applications" style="${btnStyle('linear-gradient(135deg, #f59e0b, #d97706)', '0 4px 14px 0 rgba(245, 158, 11, 0.39)')}">Review Your Offer</a>
            </center>
          </div>
          <div style="${footerStyle}">Sent securely by ${APP_NAME} • Congratulations!</div>
        </div>
      </div>
    `,
    text: `Hi ${candidateName}, you've received a job offer for ${jobTitle} at ${company}. Log in to ${APP_URL}/candidate/applications to respond.`,
  });
}

// ─── 4. Hired ───────────────────────────────────────────────────────────────
export async function sendHiredEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
}): Promise<void> {
  const { candidateName, candidateEmail, jobTitle, company } = params;
  await sendMail({
    to: candidateEmail,
    subject: `Welcome to the team! 🎉 You're hired for ${jobTitle} at ${company}`,
    html: `
      <div style="${baseStyle}">
        <div style="${cardStyle}">
          <div style="${gradientHeader('linear-gradient(90deg, #10b981, #059669)')}"></div>
          <div style="${bodyStyle}">
            <h1 style="${h1Style}; color: #34d399;">You're Hired. 🚀</h1>
            <p style="${h2Style}">${APP_NAME} Recruitment</p>
            
            <p>Hi <strong style="color: #f9fafb;">${candidateName}</strong>,</p>
            <p>It is official. We are absolutely thrilled to inform you that you have been hired as the new <strong style="color: #f9fafb;">${jobTitle}</strong> at <strong style="color: #f9fafb;">${company}</strong>!</p>
            <p>Your recruiter will be in touch shortly with onboarding details, but take a moment to celebrate. You've earned this.</p>
            
            <center>
              <a href="${APP_URL}/candidate/applications" style="${btnStyle('linear-gradient(135deg, #10b981, #059669)', '0 4px 14px 0 rgba(16, 185, 129, 0.39)')}">Access Dashboard</a>
            </center>
          </div>
          <div style="${footerStyle}">Sent securely by ${APP_NAME} • Welcome to the team!</div>
        </div>
      </div>
    `,
    text: `Hi ${candidateName}, you're hired! Welcome to the team as ${jobTitle} at ${company}. Your recruiter will be in touch shortly.`,
  });
}

// ─── 5. Rejected ────────────────────────────────────────────────────────────
export async function sendRejectedEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
}): Promise<void> {
  const { candidateName, candidateEmail, jobTitle, company } = params;
  await sendMail({
    to: candidateEmail,
    subject: `Update on your application for ${jobTitle} at ${company}`,
    html: `
      <div style="${baseStyle}">
        <div style="${cardStyle}">
          <div style="${gradientHeader('linear-gradient(90deg, #4b5563, #6b7280)')}"></div>
          <div style="${bodyStyle}">
            <h1 style="${h1Style}; color: #d1d5db;">Status Update.</h1>
            <p style="${h2Style}">${APP_NAME} Recruitment</p>
            
            <p>Hi <strong style="color: #f9fafb;">${candidateName}</strong>,</p>
            <p>Thank you for taking the time to apply and interview for the <strong style="color: #f9fafb;">${jobTitle}</strong> position at <strong style="color: #f9fafb;">${company}</strong>.</p>
            <p>While we were genuinely impressed by your background and experience, we have decided to move forward with another candidate for this specific role.</p>
            <p>We deeply appreciate your interest in joining our team and wish you the absolute best of luck in your continued job search. We'll keep your profile in mind for future opportunities.</p>
          </div>
          <div style="${footerStyle}">Sent securely by ${APP_NAME}</div>
        </div>
      </div>
    `,
    text: `Hi ${candidateName}, thank you for applying for ${jobTitle} at ${company}. We have decided to move forward with another candidate. We wish you the best of luck in your job search.`,
  });
}
