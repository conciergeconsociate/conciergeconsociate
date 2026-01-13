-- Add master_template to system_emails
INSERT INTO system_emails (key, name, subject, html_body)
VALUES (
  'master_template',
  'Master Email Template',
  'Master Template',
  '<!doctype html> 
<html lang="en"> 
  <head> 
    <meta charset="utf-8" /> 
    <meta name="viewport" content="width=device-width, initial-scale=1" /> 
    <meta http-equiv="x-ua-compatible" content="ie=edge" /> 
    <title>{{ .EmailTitle }}</title> 
 
    <style> 
      :root { color-scheme: light; supported-color-schemes: light; } 
      body { margin:0; padding:0; background:#f7f7f7; } 
      table { border-collapse:collapse; } 
      a { text-decoration:none; } 
      @media only screen and (max-width: 600px) { 
        .container { width:100% !important; } 
        .p-24 { padding:16px !important; } 
        .brand-title { font-size:20px !important; } 
        .h1 { font-size:22px !important; } 
        .logo { width:120px !important; } 
      } 
    </style> 
  </head> 
 
  <body style="margin:0; padding:0; background:#f7f7f7;"> 
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"> 
      <tr> 
        <td align="center"> 
 
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background:#ffffff; margin:24px 0; border:1px solid #eaeaea; border-radius:8px; overflow:hidden;"> 
 
            <!-- Header --> 
            <tr> 
              <td style="background:#1B2A62; padding:20px; text-align:center;"> 
 
                <img  
                  src="https://i.imgur.com/yrvXJs8.png" 
                  alt="Consociate Concierge Logo" 
                  width="130" 
                  class="logo" 
                  style="display:block; margin:0 auto 10px; max-width:130px;" 
                /> 
 
                <div class="brand-title" style="font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:700; color:#ffffff;"> 
                  Consociate Concierge 
                </div> 
 
              </td> 
            </tr> 
 
            <!-- BODY WRAPPER --> 
            <tr> 
              <td class="p-24" style="padding:24px;"> 
                <table role="presentation" width="100%"> 
 
                  <!-- 🔁 DYNAMIC EMAIL CONTENT START --> 
                  <!-- Inject title, text, buttons, links here --> 
                  {{ .EmailBody }} 
                  <!-- 🔁 DYNAMIC EMAIL CONTENT END --> 
 
                </table> 
              </td> 
            </tr> 
 
            <!-- Footer --> 
            <tr> 
              <td style="background:#fafafa; padding:16px; border-top:1px solid #eaeaea;"> 
                <table role="presentation" width="100%"> 
                  <tr> 
                    <td style="font-family:Arial, Helvetica, sans-serif; font-size:12px; text-align:center; color:#6b6b6b;"> 
                      © {{ .CurrentYear }} Consociate Concierge • All rights reserved 
                    </td> 
                  </tr> 
                </table> 
              </td> 
            </tr> 
 
          </table> 
 
        </td> 
      </tr> 
    </table> 
  </body> 
</html>'
) ON CONFLICT (key) DO NOTHING;
