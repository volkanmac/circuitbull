/**
 * Verify SES SMTP + send a test mail to SES_NOTIFY_TO
 * Usage: node scripts/test-ses.mjs
 */
import "dotenv/config";
import nodemailer from "nodemailer";

const host = process.env.SES_HOST || "email-smtp.eu-central-1.amazonaws.com";
const port = Number(process.env.SES_PORT || 465);
const user = process.env.SES_USER;
const pass = process.env.SES_PASS;
const from = process.env.SES_FROM || "volkan@volls.us";
const to = process.env.SES_NOTIFY_TO || "volkan@volls.us";

if (!user || !pass) {
  console.error("SES_USER / SES_PASS missing in .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

await transporter.verify();
console.log("SMTP OK", host, port);

const info = await transporter.sendMail({
  from: `Circuitbull CRM <${from}>`,
  to,
  subject: "[Circuitbull] SES test",
  text: `SES SMTP test from Circuitbull at ${new Date().toISOString()}`,
});
console.log("SENT", info.messageId);
