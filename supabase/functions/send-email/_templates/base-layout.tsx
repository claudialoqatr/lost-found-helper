import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const BaseLayout = ({ preview, children }: BaseLayoutProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo/Header */}
        <Section style={logoSection}>
          <Text style={logoText}>LOQATR</Text>
        </Section>
        
        {/* Content */}
        {children}
        
        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} LOQATR. All rights reserved.
          </Text>
          <Text style={footerSubtext}>
            Helping you protect what matters most.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default BaseLayout;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '560px',
};

const logoSection = {
  padding: '32px 40px 24px',
  borderBottom: '1px solid #e6ebf1',
};

const logoText = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#0ea5e9',
  margin: '0',
  letterSpacing: '-0.5px',
};

const footer = {
  padding: '24px 40px',
  borderTop: '1px solid #e6ebf1',
};

const footerText = {
  fontSize: '12px',
  color: '#8898aa',
  margin: '0 0 4px',
};

const footerSubtext = {
  fontSize: '12px',
  color: '#8898aa',
  margin: '0',
};
