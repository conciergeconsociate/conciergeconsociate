import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
const FROM_NAME = Deno.env.get("FROM_NAME") ?? "Consociate Concierge";

const MASTER_EMAIL_TEMPLATE = `<!doctype html> 
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
  
                 <!-- SVG Logo -->
                <div style="display:block; margin:0 auto 10px; max-width:130px;">
                  <?xml version="1.0" standalone="no"?> 
                  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" 
                    "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd"> 
                  <svg version="1.0" 
                       xmlns="http://www.w3.org/2000/svg" 
                       width="130" 
                       height="130" 
                       viewBox="0 0 500.000000 500.000000" 
                       preserveAspectRatio="xMidYMid meet"> 
                   
                    <g transform="translate(0.000000,500.000000) scale(0.100000,-0.100000)" 
                       stroke="none"> 
                   
                      <!-- TOP RING --> 
                      <path fill="#f6ae3d" d="M1761 3349 c-251 -49 -473 -208 -598 -428 -61 -106 -58 -98 -35 -104 14 -4 13 -5 -3 -6 -22 -1 -65 -119 -65 -176 l0 -25 155 0 c166 0 162 -1 169 51 2 13 8 37 15 52 6 16 11 32 11 37 0 14 -132 60 -200 70 l-65 9 72 -3 c54 -2 87 -11 137 -34 l65 -31 30 48 c165 268 526 330 791 135 80 -58 83 -67 54 -134 -32 -74 -31 -90 4 -57 101 97 281 97 400 0 49 -40 50 -37 16 57 l-27 72 39 35 c298 265 792 131 888 -241 9 -32 17 -60 18 -62 13 -13 318 -7 318 6 0 81 -81 280 -155 385 -276 388 -853 474 -1207 181 -80 -67 -78 -66 -137 -18 -194 161 -451 228 -690 181z"/> 
                   
                      <!-- BELL DETAILS --> 
                      <path fill="#ffffff" d="M2460 2726 c-14 -7 -50 -19 -80 -26 -70 -16 -97 -29 -80 -40 17 -11 101 0 125 16 20 15 74 18 113 8 44 -12 21 -20 -49 -16 -85 5 -96 -18 -14 -30 30 -4 57 -16 74 -32 23 -22 65 -38 144 -53 25 -5 27 -3 27 29 0 62 -18 98 -49 96 -14 -1 -46 11 -70 26 -52 33 -106 42 -141 22z"/> 
                   
                      <path fill="#ffffff" d="M2482 2579 c3 -29 -1 -33 -39 -46 -34 -12 -48 -24 -70 -63 -15 -27 -30 -47 -33 -45 -3 2 -10 -8 -17 -21 -6 -13 -7 -24 -2 -24 5 0 9 5 9 10 0 6 7 10 16 10 8 0 12 -4 9 -10 -4 -7 52 -10 159 -10 104 0 166 4 166 10 0 6 -6 10 -14 10 -8 0 -12 7 -10 18 8 31 -32 79 -95 112 -60 32 -72 45 -49 52 15 5 1 28 -18 28 -10 0 -13 -10 -12 -31z"/> 
                   
                      <!-- BOTTOM RING --> 
                      <path fill="#f6ae3d" d="M1060 2358 c1 -118 104 -331 224 -465 294 -327 873 -356 1184 -60 l32 31 33 -31 c225 -215 630 -269 932 -124 173 83 323 233 410 411 22 47 75 223 75 251 0 5 -72 9 -159 9 l-160 0 -11 -53 c-65 -315 -457 -498 -755 -353 -72 36 -170 118 -168 142 0 10 13 52 28 92 31 86 27 97 -18 55 -108 -103 -281 -110 -404 -16 l-46 35 7 -29 c4 -15 18 -54 31 -87 29 -72 29 -72 -50 -130 -196 -144 -425 -152 -626 -23 -113 72 -218 215 -235 318 l-6 36 -112 6 c-192 12 -206 11 -206 -15z"/> 
                   
                      <!-- CLAPPER / BASE --> 
                      <path fill="#ffffff" d="M2286 2354 c-11 -28 0 -29 217 -26 189 3 208 5 205 20 -5 26 -412 31 -422 6z"/> 
                   
                    </g> 
                  </svg>
                </div> 
  
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
 </html>`;

async function getMasterTemplate(supabaseClient: any) {
  const { data, error } = await supabaseClient.from("system_emails").select("html_body").eq("key", "master_template").maybeSingle();
  if (error || !data) {
    return MASTER_EMAIL_TEMPLATE;
  }
  return data.html_body;
}

async function applyMasterTemplate(supabaseClient: any, subject: string, body: string) {
  const template = await getMasterTemplate(supabaseClient);
  const currentYear = new Date().getFullYear().toString();
  return template
    .replace(/\{\{\s*[.]EmailTitle\s*\}\}/g, subject)
    .replace(/\{\{\s*[.]EmailBody\s*\}\}/g, body)
    .replace(/\{\{\s*[.]CurrentYear\s*\}\}/g, currentYear);
}

function replacePlaceholders(tpl: string, data: Record<string, any>) {
  return tpl.replace(/\{\{([\w\.]+)\}\}/g, (match, k) => {
    return data[k] !== undefined ? String(data[k]) : match;
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, full_name, phone, role } = await req.json()

    if (!email || !password) {
      throw new Error("Email and password are required")
    }

    const { data: user, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role }
    })

    if (createError) throw createError

    // Upsert into profiles to ensure it exists
    if (user.user) {
      await supabaseClient.from('profiles').upsert({
        id: user.user.id,
        email,
        full_name,
        phone,
        role: role || 'member',
        updated_at: new Date().toISOString()
      })

      // Send invitation email
      if (RESEND_API_KEY) {
        try {
          const { data: template } = await supabaseClient
            .from("system_emails")
            .select("subject, html_body")
            .eq("key", "invite_user")
            .single();

          const origin = req.headers.get("origin") || "https://conciergeconsociate.com";
          const loginUrl = `${origin}/auth`;

          let subject = "You have been invited to Consociate Concierge";
          let htmlContent = `
            <p>Hello ${full_name || "User"},</p>
            <p>You have been invited to join Consociate Concierge.</p>
            <p><strong>Your Login Credentials:</strong></p>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Temporary Password:</strong> ${password}</li>
            </ul>
            <p>Please <a href="${loginUrl}">login here</a> and change your password immediately.</p>
          `;

          if (template) {
            const replaceData = {
              name: full_name || "User",
              email,
              password,
              login_url: loginUrl,
              full_name: full_name || "User",
              phone: phone || ""
            };
            subject = replacePlaceholders(template.subject, replaceData);
            htmlContent = replacePlaceholders(template.html_body, replaceData);
          }

          const finalHtml = await applyMasterTemplate(supabaseClient, subject, htmlContent);

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${FROM_NAME} <${FROM_EMAIL}>`,
              to: email,
              subject,
              html: finalHtml,
            }),
          });
          if (!res.ok) {
            console.error("Resend API error:", await res.text());
          }
        } catch (e) {
          console.error("Failed to send invite email:", e);
        }
      } else {
         console.error("RESEND_API_KEY is not set");
      }
    }

    return new Response(
      JSON.stringify({ user, message: "User created successfully" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
