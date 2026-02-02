import { baseLayout } from './base-layout.ts';

interface OtpEmailProps {
  token: string;
  email_action_type: string;
}

export function otpEmail({ token, email_action_type }: OtpEmailProps): string {
  const isLogin = email_action_type === 'magiclink' || email_action_type === 'email';
  const title = isLogin ? 'Your Login Code' : 'Your Verification Code';
  const preview = isLogin 
    ? `Your LOQATR login code is ${token}` 
    : `Your LOQATR verification code is ${token}`;
  const actionText = isLogin ? 'sign in to' : 'verify';

  const content = `
    <div style="padding: 32px 40px;">
      <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.3; margin: 0 0 24px;">${title}</h1>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Use the code below to ${actionText} your LOQATR account:
      </p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <span style="font-size: 36px; font-weight: 700; font-family: monospace; letter-spacing: 8px; color: #0ea5e9; margin: 0;">${token}</span>
      </div>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        This code will expire in <strong>10 minutes</strong>.
      </p>
      
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
        If you didn't request this code, someone may be trying to access your account. 
        You can safely ignore this email if you didn't initiate this request.
      </p>
    </div>
  `;

  return baseLayout({
    preview,
    content,
  });
}
