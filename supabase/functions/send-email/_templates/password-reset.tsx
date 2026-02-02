import {
  Button,
  Heading,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1'
import * as React from 'https://esm.sh/react@18.3.1'
import { BaseLayout } from './base-layout.tsx'

interface PasswordResetEmailProps {
  resetUrl: string;
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => (
  <BaseLayout preview="Reset your LOQATR password">
    <Section style={content}>
      <Heading style={h1}>Reset Your Password</Heading>
      
      <Text style={paragraph}>
        We received a request to reset the password for your LOQATR account. 
        Click the button below to create a new password:
      </Text>
      
      <Section style={buttonContainer}>
        <Button style={button} href={resetUrl}>
          Reset Password
        </Button>
      </Section>
      
      <Text style={paragraph}>
        This link will expire in <strong>1 hour</strong> for security reasons.
      </Text>
      
      <Text style={smallText}>
        If you didn't request a password reset, you can safely ignore this email. 
        Your password will remain unchanged.
      </Text>
      
      <Section style={securityNote}>
        <Text style={securityNoteText}>
          🔒 Security tip: Never share this link with anyone. LOQATR will never ask 
          for your password via email or phone.
        </Text>
      </Section>
    </Section>
  </BaseLayout>
);

export default PasswordResetEmail;

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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const smallText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '24px 0 0',
};

const securityNote = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '24px',
};

const securityNoteText = {
  color: '#92400e',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
};
