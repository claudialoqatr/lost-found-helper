import {
  Button,
  Heading,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'
import { BaseLayout } from './base-layout.tsx'

interface WelcomeEmailProps {
  userName?: string;
  confirmUrl: string;
}

export const WelcomeEmail = ({ userName, confirmUrl }: WelcomeEmailProps) => (
  <BaseLayout preview="Welcome to LOQATR - Confirm your email to get started">
    <Section style={content}>
      <Heading style={h1}>Welcome to LOQATR!</Heading>
      
      <Text style={paragraph}>
        Hi{userName ? ` ${userName}` : ''},
      </Text>
      
      <Text style={paragraph}>
        Thanks for signing up! You're just one step away from protecting your belongings 
        with smart QR tags that help finders return your lost items.
      </Text>
      
      <Text style={paragraph}>
        Please confirm your email address to activate your account:
      </Text>
      
      <Section style={buttonContainer}>
        <Button style={button} href={confirmUrl}>
          Confirm Email Address
        </Button>
      </Section>
      
      <Text style={paragraph}>
        Once confirmed, you'll be able to:
      </Text>
      
      <ul style={list}>
        <li style={listItem}>Claim and personalize your LOQATR tags</li>
        <li style={listItem}>Set up contact preferences for finders</li>
        <li style={listItem}>Receive notifications when your items are found</li>
      </ul>
      
      <Text style={smallText}>
        If you didn't create an account with LOQATR, you can safely ignore this email.
      </Text>
    </Section>
  </BaseLayout>
);

export default WelcomeEmail;

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

const list = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px',
  paddingLeft: '24px',
};

const listItem = {
  marginBottom: '8px',
};

const smallText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '24px 0 0',
};
