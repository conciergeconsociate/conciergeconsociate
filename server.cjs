const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, contactInfo } = req.body;
    
    // Simple professional email template
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .content { padding: 40px 20px; }
          .footer { padding: 20px; background-color: #f3f4f6; font-size: 12px; color: #6b7280; text-align: center; }
          img { max-width: 100%; height: auto; }
          a { color: #2563eb; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            ${html}
          </div>
          
          <div class="footer">
            <p>
              ${(Array.isArray(contactInfo?.address) ? contactInfo.address.join('<br>') : (contactInfo?.address || '').replace(/\n/g, '<br>'))}
            </p>
            <p>
              ${contactInfo?.emails ? contactInfo.emails.join(' | ') : ''}<br>
              ${contactInfo?.phones ? contactInfo.phones.join(' | ') : ''}
            </p>
            <p>&copy; ${new Date().getFullYear()} Concierge Consociate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const recipients = Array.isArray(to) ? to : [to];

    // Send to each recipient individually to maintain privacy
    const results = [];
    const errors = [];

    // Simple sequential sending to avoid rate limits and ensure privacy
    for (const recipient of recipients) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Concierge <onboarding@resend.dev>',
          to: recipient,
          subject: subject,
          html: fullHtml,
        });
        
        if (error) {
          console.error(`Failed to send to ${recipient}:`, error);
          errors.push({ recipient, error });
        } else {
          results.push({ recipient, data });
        }
      } catch (e) {
        console.error(`Exception sending to ${recipient}:`, e);
        errors.push({ recipient, error: e.message });
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return res.status(400).json({ error: "Failed to send emails", details: errors });
    }

    res.status(200).json({ data: results, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
