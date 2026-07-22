import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

export function emailConfigurado() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

export async function enviarEmail({
  para,
  assunto,
  html,
  anexos,
}: {
  para: string;
  assunto: string;
  html: string;
  anexos?: { filename: string; path: string }[];
}) {
  if (!emailConfigurado()) {
    throw new Error("Servidor de e-mail não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env");
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({ from: `Metha Offshore <${SMTP_FROM}>`, to: para, subject: assunto, html, attachments: anexos });
}
