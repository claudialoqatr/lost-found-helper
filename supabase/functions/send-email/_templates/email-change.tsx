import {
  Button,
  Heading,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1'
import * as React from 'https://esm.sh/react@18.3.1'
import { BaseLayout } from './base-layout.tsx'

interface EmailChangeProps {
  confirmUrl: string;
  newEmail?: string;
}

export const EmailChangeEmail = ({ confirmUrl, newEmail }: EmailChangeProps) => (
  <BaseLayout preview="Confirm your new email address for LOQATR">
    <Section style={content}>
      <Heading style={h1}>Confirm Email Change</Heading>
      
      <Text style={paragraph}>
        You requested to change your LOQATR account email
        {newEmail ? ` to ${newEmail}` : ''}.
      </Text>
      
      <Text style={paragraph}>
        Please click the button below to confirm this change:
      </Text>
      
      <Section style={buttonContainer}>
        <Button style={button} href={confirmUrl}>
          Confirm New Email
        </Button>
      </Section>
      
      <Text style={paragraph}>
        This link will expire in <strong>24 hours</strong>.
      </Text>
      
      <Text style={smallText}>
        If you didn't request this email change, please ignore this email and consider 
        changing your password as a security precaution.
      </Text>
    </Section>
  </BaseLayout>
);

export default EmailChangeEmail;

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
