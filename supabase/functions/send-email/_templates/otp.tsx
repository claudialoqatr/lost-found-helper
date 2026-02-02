import {
  Heading,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1'
import * as React from 'https://esm.sh/react@18.3.1'
import { BaseLayout } from './base-layout.tsx'

interface OtpEmailProps {
  token: string;
  email_action_type: string;
}

export const OtpEmail = ({ token, email_action_type }: OtpEmailProps) => {
  const isLogin = email_action_type === 'magiclink' || email_action_type === 'email';
  const title = isLogin ? 'Your Login Code' : 'Your Verification Code';
  const preview = isLogin 
    ? `Your LOQATR login code is ${token}` 
    : `Your LOQATR verification code is ${token}`;

  return (
    <BaseLayout preview={preview}>
      <Section style={content}>
        <Heading style={h1}>{title}</Heading>
        
        <Text style={paragraph}>
          Use the code below to {isLogin ? 'sign in to' : 'verify'} your LOQATR account:
        </Text>
        
        <Section style={codeContainer}>
          <Text style={codeText}>{token}</Text>
        </Section>
        
        <Text style={paragraph}>
          This code will expire in <strong>10 minutes</strong>.
        </Text>
        
        <Text style={smallText}>
          If you didn't request this code, someone may be trying to access your account. 
          You can safely ignore this email if you didn't initiate this request.
        </Text>
      </Section>
    </BaseLayout>
  );
};

export default OtpEmail;

const content = {
  padding: '32px 40px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px',
};

const paragraph = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const codeContainer = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const codeText = {
  fontSize: '36px',
  fontWeight: '700',
  fontFamily: 'monospace',
  letterSpacing: '8px',
  color: '#0ea5e9',
  margin: '0',
};

const smallText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '24px 0 0',
};
