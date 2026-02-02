import { baseLayout } from './base-layout.ts';

interface EmailChangeEmailProps {
  confirmUrl: string;
  newEmail?: string;
}

export function emailChangeEmail({ confirmUrl, newEmail }: EmailChangeEmailProps): string {
  const emailInfo = newEmail ? ` to ${newEmail}` : '';
  
  const content = `
    <div style="padding: 32px 40px;">
      <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.3; margin: 0 0 24px;">Confirm Email Change</h1>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        You requested to change your LOQATR account email${emailInfo}.
      </p>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Please click the button below to confirm this change:
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${confirmUrl}" style="background-color: #0ea5e9; border-radius: 8px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 12px 32px;">
          Confirm New Email
        </a>
      </div>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        This link will expire in <strong>24 hours</strong>.
      </p>
      
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
        If you didn't request this email change, please ignore this email and consider 
        changing your password as a security precaution.
      </p>
    </div>
  `;

  return baseLayout({
    preview: 'Confirm your new email address for LOQATR',
    content,
  });
}
