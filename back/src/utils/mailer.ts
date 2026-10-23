import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   ?? "smtp.gmail.com",
  port:   parseInt(process.env.SMTP_PORT ?? "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM ?? '"Seek Immobilier" <noreply@seek.sn>',
    to:   options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
};
