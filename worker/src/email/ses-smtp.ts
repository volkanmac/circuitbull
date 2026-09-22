/**
 * Minimal SMTPS (implicit TLS) client for AWS SES via Cloudflare sockets.
 */
import { connect } from "cloudflare:sockets";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

function encodeSubject(subject: string) {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
}

async function readResponse(reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder) {
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // Multi-line SMTP responses end when a line matches /^\d{3} /
    const lines = buf.split(/\r?\n/).filter((l) => l.length);
    if (!lines.length) continue;
    const last = lines[lines.length - 1];
    if (/^\d{3} /.test(last)) return { code: Number(last.slice(0, 3)), raw: buf };
  }
  throw new Error(`SMTP connection closed: ${buf}`);
}

async function expect(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  ok: number | number[]
) {
  const allowed = Array.isArray(ok) ? ok : [ok];
  const res = await readResponse(reader, decoder);
  if (!allowed.includes(res.code)) {
    throw new Error(`SMTP expected ${allowed.join("|")}, got ${res.code}: ${res.raw.trim()}`);
  }
  return res;
}

async function write(writer: WritableStreamDefaultWriter<Uint8Array>, encoder: TextEncoder, line: string) {
  await writer.write(encoder.encode(line + "\r\n"));
}

export async function sendSmtpMail(cfg: SmtpConfig, msg: MailMessage) {
  const socket = connect(
    {
      hostname: cfg.host,
      port: cfg.port,
    },
    {
      secureTransport: "on",
      allowHalfOpen: false,
    }
  );

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();

  try {
    await expect(reader, decoder, 220);
    await write(writer, encoder, `EHLO circuitbull.com`);
    await expect(reader, decoder, 250);

    await write(writer, encoder, "AUTH LOGIN");
    await expect(reader, decoder, 334);
    await write(writer, encoder, btoa(cfg.user));
    await expect(reader, decoder, 334);
    await write(writer, encoder, btoa(cfg.pass));
    await expect(reader, decoder, 235);

    await write(writer, encoder, `MAIL FROM:<${cfg.from}>`);
    await expect(reader, decoder, 250);
    await write(writer, encoder, `RCPT TO:<${msg.to}>`);
    await expect(reader, decoder, 250);
    await write(writer, encoder, "DATA");
    await expect(reader, decoder, 354);

    const headers = [
      `From: Circuitbull CRM <${cfg.from}>`,
      `To: <${msg.to}>`,
      msg.replyTo ? `Reply-To: <${msg.replyTo}>` : null,
      `Subject: ${encodeSubject(msg.subject)}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      msg.text.replace(/\r?\n/g, "\r\n"),
      ".",
    ]
      .filter((x) => x !== null)
      .join("\r\n");

    await writer.write(encoder.encode(headers + "\r\n"));
    await expect(reader, decoder, 250);
    await write(writer, encoder, "QUIT");
    try {
      await expect(reader, decoder, 221);
    } catch {
      /* ignore quit race */
    }
  } finally {
    try {
      writer.releaseLock();
      reader.releaseLock();
      socket.close();
    } catch {
      /* ignore */
    }
  }
}
