import { baseLayout } from './base-layout.ts';

interface PasswordResetEmailProps {
  resetUrl: string;
}

export function passwordResetEmail({ resetUrl }: PasswordResetEmailProps): string {
  const content = `
    <div style="padding: 32px 40px;">
      <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.3; margin: 0 0 24px;">Reset Your Password</h1>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        We received a request to reset the password for your LOQATR account. 
        Click the button below to create a new password:
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #0ea5e9; border-radius: 8px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 12px 32px;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        This link will expire in <strong>1 hour</strong> for security reasons.
      </p>
      
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
        If you didn't request a password reset, you can safely ignore this email. 
        Your password will remain unchanged.
      </p>
      
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="color: #92400e; font-size: 13px; line-height: 1.5; margin: 0;">
          🔒 Security tip: Never share this link with anyone. LOQATR will never ask 
          for your password via email or phone.
        </p>
      </div>
    </div>
  `;

  return baseLayout({
    preview: 'Reset your LOQATR password',
    content,
  });
}
