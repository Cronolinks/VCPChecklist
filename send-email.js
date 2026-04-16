const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { to, subject, html } = payload;

  if (!to || !subject || !html) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: to, subject, html' }) };
  }

  // Validate environment variables
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in Netlify environment variables.' })
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: parseInt(SMTP_PORT || '587') === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.sendMail({
      from: SMTP_FROM || `VCP Suporte Montagem <${SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: 'E-mail enviado com sucesso!' })
    };
  } catch (err) {
    console.error('SMTP send error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: `Falha no envio SMTP: ${err.message}` })
    };
  }
};
