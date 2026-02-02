// Base layout HTML template for LOQATR emails

export interface BaseLayoutProps {
  preview: string;
  content: string;
}

export function baseLayout({ preview, content }: BaseLayoutProps): string {
  const year = new Date().getFullYear();
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>${preview}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      background-color: #f6f9fc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; margin: 0; padding: 20px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; max-width: 560px; width: 100%;">
    <!-- Logo/Header -->
    <tr>
      <td style="padding: 32px 40px 24px; border-bottom: 1px solid #e6ebf1;">
        <span style="font-size: 28px; font-weight: 700; color: #0ea5e9; margin: 0; letter-spacing: -0.5px;">LOQATR</span>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td>
        ${content}
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid #e6ebf1;">
        <p style="font-size: 12px; color: #8898aa; margin: 0 0 4px;">© ${year} LOQATR. All rights reserved.</p>
        <p style="font-size: 12px; color: #8898aa; margin: 0;">Helping you protect what matters most.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
