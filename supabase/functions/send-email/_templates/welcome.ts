import { baseLayout } from './base-layout.ts';

interface WelcomeEmailProps {
  userName?: string;
  confirmUrl: string;
}

export function welcomeEmail({ userName, confirmUrl }: WelcomeEmailProps): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  
  const content = `
    <div style="padding: 32px 40px;">
      <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.3; margin: 0 0 24px;">Welcome to LOQATR!</h1>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        ${greeting}
      </p>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Thanks for signing up! You're just one step away from protecting your belongings 
        with smart QR tags that help finders return your lost items.
      </p>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Please confirm your email address to activate your account:
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${confirmUrl}" style="background-color: #0ea5e9; border-radius: 8px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 12px 32px;">
          Confirm Email Address
        </a>
      </div>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Once confirmed, you'll be able to:
      </p>
      
      <ul style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px; padding-left: 24px;">
        <li style="margin-bottom: 8px;">Claim and personalize your LOQATR tags</li>
        <li style="margin-bottom: 8px;">Set up contact preferences for finders</li>
        <li style="margin-bottom: 8px;">Receive notifications when your items are found</li>
      </ul>
      
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
        If you didn't create an account with LOQATR, you can safely ignore this email.
      </p>
    </div>
  `;

  return baseLayout({
    preview: 'Welcome to LOQATR - Confirm your email to get started',
    content,
  });
}
