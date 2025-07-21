# Avenia API Integration Guide for RendeX

This guide provides a comprehensive implementation plan for integrating Avenia's financial services into the RendeX Brazilian fintech mobile application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Authentication Flow](#authentication-flow)
5. [KYC Implementation](#kyc-implementation)
6. [PIX to BRLA Integration](#pix-to-brla-integration)
7. [Currency Conversion](#currency-conversion)
8. [Subaccount Management](#subaccount-management)
9. [Webhook Integration](#webhook-integration)
10. [Error Handling](#error-handling)
11. [Implementation Checklist](#implementation-checklist)

## Overview

Avenia provides a comprehensive API for Brazilian financial services, enabling:

- **PIX Integration**: Instant Brazilian payments
- **Stablecoin Support**: BRLA, USDC, USDT conversion
- **KYC Compliance**: Brazilian regulatory compliance
- **Subaccount Management**: Client account segregation
- **Blockchain Integration**: On-chain transfers

### Core Use Cases for RendeX

1. **PIX to Stablecoin**: Convert Brazilian Real via PIX to BRLA stablecoin
2. **Stablecoin Conversion**: Exchange BRLA for USDC/USDT
3. **Investment Management**: Subaccount creation for investment products
4. **External Transfers**: Send tokens to external wallets

## Prerequisites

### Environment Variables

```bash
# Avenia API Configuration
AVENIA_API_BASE_URL=https://api.sandbox.avenia.io:10952
AVENIA_EMAIL=your.email@provider.com
AVENIA_PASSWORD=UseAStrongPassword123!

# Optional: API Keys for enhanced security
AVENIA_API_KEY=your_api_key_here

# Brazilian Compliance
CPF_VALIDATION_SERVICE=your_cpf_service
BACEN_INTEGRATION=your_bacen_config
```

### Required Dependencies

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.0",
    "react-native-keychain": "^8.1.0",
    "react-native-qrcode-scanner": "^1.5.5",
    "react-native-permissions": "^3.8.0",
    "axios": "^1.4.0",
    "react-native-biometrics": "^3.0.0"
  }
}
```

## Architecture

### Service Layer Structure

```
src/
├── services/
│   ├── avenia/
│   │   ├── AveniaClient.ts
│   │   ├── AuthService.ts
│   │   ├── KYCService.ts
│   │   ├── TransactionService.ts
│   │   ├── SubaccountService.ts
│   │   └── WebhookService.ts
│   ├── storage/
│   │   └── SecureStorage.ts
│   └── validation/
│       └── CPFValidator.ts
├── types/
│   └── avenia.ts
└── hooks/
    └── useAvenia.ts
```

## Authentication Flow

### 1. Initial Login

```typescript
// services/avenia/AuthService.ts
export class AveniaAuthService {
  private baseUrl = process.env.AVENIA_API_BASE_URL;

  async login(email: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 200) {
        // Email token will be sent to email
        await this.handleEmailTokenFlow(email);
      }
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async validateLogin(email: string, emailToken: string): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/v2/auth/validate-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, emailToken }),
    });

    const tokens = await response.json();
    await SecureStorage.setTokens(tokens);
    return tokens;
  }
}
```

### 2. Secure Token Storage

```typescript
// services/storage/SecureStorage.ts
import Keychain from 'react-native-keychain';

export class SecureStorage {
  static async setTokens(tokens: AuthTokens): Promise<void> {
    await Keychain.setInternetCredentials(
      'avenia_tokens',
      'user',
      JSON.stringify(tokens)
    );
  }

  static async getTokens(): Promise<AuthTokens | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('avenia_tokens');
      return credentials ? JSON.parse(credentials.password) : null;
    } catch {
      return null;
    }
  }
}
```

## KYC Implementation

### 1. Web SDK Integration (Recommended)

```typescript
// services/avenia/KYCService.ts
export class AveniaKYCService {
  async initiateWebSDKKYC(subAccountId?: string): Promise<string> {
    const tokens = await SecureStorage.getTokens();
    const url = subAccountId 
      ? `${this.baseUrl}/v2/kyc/level-1/web-sdk?subAccountId=${subAccountId}`
      : `${this.baseUrl}/v2/kyc/level-1/web-sdk`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const { url: kycUrl } = await response.json();
    return kycUrl;
  }
}
```

### 2. API-Based KYC

```typescript
interface KYCData {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  countryOfDocument: string; // ISO Alpha-3 (e.g., "BRA")
  documentType: 'ID' | 'Passport' | "Driver's License";
  documentNumber: string;
  countryOfTaxId: string; // ISO Alpha-3
  taxIdNumber: string; // CPF for Brazil
  email?: string;
  phone?: string;
  country: string; // ISO Alpha-3
  state: string; // ISO Alpha-3 state code
  city: string;
  zipCode: string;
  streetAddress: string;
}

async submitKYCData(kycData: KYCData, subAccountId?: string): Promise<string> {
  const url = subAccountId 
    ? `${this.baseUrl}/v2/kyc/level-1/api?subAccountId=${subAccountId}`
    : `${this.baseUrl}/v2/kyc/level-1/api`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(kycData),
  });

  const { id } = await response.json();
  return id; // KYC attempt ID
}
```

### 3. KYC Status Tracking

```typescript
async checkKYCStatus(kycAttemptId: string, subAccountId?: string): Promise<KYCAttempt> {
  const url = subAccountId
    ? `${this.baseUrl}/v2/kyc/attempts/${kycAttemptId}?subAccountId=${subAccountId}`
    : `${this.baseUrl}/v2/kyc/attempts/${kycAttemptId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
    },
  });

  return response.json();
}
```

## PIX to BRLA Integration

### 1. Quote Generation

```typescript
// services/avenia/TransactionService.ts
export class AveniaTransactionService {
  async getPixToBRLAQuote(outputAmount: number): Promise<Quote> {
    const params = new URLSearchParams({
      inputCurrency: 'BRL',
      inputPaymentMethod: 'PIX',
      outputAmount: outputAmount.toString(),
      outputCurrency: 'BRLA',
      outputPaymentMethod: 'INTERNAL',
      inputThirdParty: 'false',
      outputThirdParty: 'false',
    });

    const response = await fetch(
      `${this.baseUrl}/v2/account/quote/fixed-rate?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      }
    );

    return response.json();
  }
}
```

### 2. Ticket Creation (PIX Payment)

```typescript
async createPixTicket(quoteToken: string): Promise<PixTicket> {
  const response = await fetch(`${this.baseUrl}/v2/account/tickets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quoteToken,
      ticketBlockchainOutput: {
        beneficiaryWalletId: '00000000-0000-0000-0000-000000000000', // Main account
      },
    }),
  });

  return response.json();
}
```

### 3. PIX Payment Integration with RendeX UI

```typescript
// components/PIXPaymentScreen.tsx
import { useAvenia } from '../hooks/useAvenia';

export const PIXPaymentScreen = () => {
  const { createPixPayment, checkTicketStatus } = useAvenia();
  const [brCode, setBrCode] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');

  const handlePixPayment = async (amount: number) => {
    try {
      // 1. Get quote (valid for 15 seconds)
      const quote = await getPixToBRLAQuote(amount);
      
      // 2. Create ticket
      const ticket = await createPixTicket(quote.quoteToken);
      
      // 3. Display PIX QR Code
      setBrCode(ticket.brCode);
      setTicketId(ticket.id);
      
      // 4. Poll for payment completion
      await pollTicketStatus(ticket.id);
    } catch (error) {
      console.error('PIX payment failed:', error);
    }
  };

  const pollTicketStatus = async (ticketId: string) => {
    const interval = setInterval(async () => {
      const status = await checkTicketStatus(ticketId);
      if (status.ticket.status === 'PAID') {
        clearInterval(interval);
        // Navigate to success screen
        navigation.navigate('PaymentSuccess');
      }
    }, 2000);
  };

  return (
    <View>
      <QRCodeDisplay value={brCode} />
      <Text>Scan QR Code to complete PIX payment</Text>
    </View>
  );
};
```

## Currency Conversion

### 1. BRLA to USDC/USDT

```typescript
async convertBRLAToStablecoin(
  outputAmount: number,
  outputCurrency: 'USDC' | 'USDT'
): Promise<Quote> {
  const params = new URLSearchParams({
    inputCurrency: 'BRLA',
    inputPaymentMethod: 'INTERNAL',
    outputAmount: outputAmount.toString(),
    outputCurrency,
    outputPaymentMethod: 'INTERNAL',
    inputThirdParty: 'false',
    outputThirdParty: 'false',
    blockchainSendMethod: 'PERMIT',
  });

  const response = await fetch(
    `${this.baseUrl}/v2/account/quote/fixed-rate?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    }
  );

  return response.json();
}
```

## Subaccount Management

### 1. Creating Subaccounts for RendeX Clients

```typescript
// services/avenia/SubaccountService.ts
export class AveniaSubaccountService {
  async createSubaccount(clientName: string): Promise<Subaccount> {
    const response = await fetch(`${this.baseUrl}/v2/account/sub-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountType: 'INDIVIDUAL',
        name: clientName,
      }),
    });

    return response.json();
  }

  async transferToSubaccount(
    subaccountId: string,
    amount: number,
    currency: string
  ): Promise<Transfer> {
    // Implementation for transferring tokens to subaccounts
    // This would use the quote + ticket flow with the subaccount ID
  }
}
```

## Webhook Integration

### 1. Webhook Setup

```typescript
// services/avenia/WebhookService.ts
export class AveniaWebhookService {
  async setupWebhooks(): Promise<void> {
    // Register webhook endpoints for:
    // - TICKET events (payment status updates)
    // - KYC events (verification status)
    // - TRANSFER events (subaccount transfers)
  }

  handleWebhookEvent(event: WebhookEvent): void {
    switch (event.type) {
      case 'TICKET-CREATED':
        this.handleTicketCreated(event);
        break;
      case 'DEPOSIT-PROCESSING':
        this.handleDepositProcessing(event);
        break;
      case 'TICKET-PAID':
        this.handleTicketPaid(event);
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }
  }
}
```

## Error Handling

### 1. Common Error Scenarios

```typescript
export class AveniaErrorHandler {
  static handleError(error: any): void {
    switch (error.status) {
      case 401:
        // Token expired - refresh or re-authenticate
        this.handleAuthenticationError();
        break;
      case 400:
        // Bad request - validate input data
        this.handleValidationError(error);
        break;
      case 429:
        // Rate limit - implement backoff
        this.handleRateLimitError();
        break;
      default:
        console.error('Avenia API error:', error);
    }
  }

  static async handleAuthenticationError(): Promise<void> {
    // Clear stored tokens
    await SecureStorage.clearTokens();
    // Redirect to login screen
    NavigationService.navigate('Login');
  }
}
```

## React Native Integration Hooks

### 1. Custom Hook for Avenia Operations

```typescript
// hooks/useAvenia.ts
export const useAvenia = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const authService = new AveniaAuthService();
  const kycService = new AveniaKYCService();
  const transactionService = new AveniaTransactionService();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.login(email, password);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const initiateKYC = async (subAccountId?: string) => {
    return await kycService.initiateWebSDKKYC(subAccountId);
  };

  const createPixPayment = async (amount: number) => {
    const quote = await transactionService.getPixToBRLAQuote(amount);
    return await transactionService.createPixTicket(quote.quoteToken);
  };

  return {
    isAuthenticated,
    loading,
    login,
    initiateKYC,
    createPixPayment,
    // ... other methods
  };
};
```

## Implementation Checklist

### Phase 1: Authentication & Setup
- [ ] Set up Avenia API credentials in environment
- [ ] Implement secure token storage with react-native-keychain
- [ ] Create authentication service with login flow
- [ ] Add email token validation UI component

### Phase 2: KYC Integration
- [ ] Implement Web SDK KYC flow (recommended)
- [ ] Add fallback API-based KYC for edge cases
- [ ] Create KYC status polling mechanism
- [ ] Integrate with RendeX user onboarding flow

### Phase 3: PIX Payments
- [ ] Implement PIX to BRLA quote generation
- [ ] Create ticket creation and QR code display
- [ ] Add payment status polling
- [ ] Integrate with existing RendeX PIX UI

### Phase 4: Currency Conversion
- [ ] Add BRLA to USDC/USDT conversion
- [ ] Implement conversion UI in RendeX investment section
- [ ] Add balance display for multiple currencies

### Phase 5: Subaccounts
- [ ] Implement subaccount creation for RendeX clients
- [ ] Add subaccount KYC flow
- [ ] Create token transfer functionality
- [ ] Integrate with RendeX client management

### Phase 6: Webhooks & Monitoring
- [ ] Set up webhook endpoints
- [ ] Implement real-time status updates
- [ ] Add transaction monitoring dashboard
- [ ] Create error reporting and alerting

### Phase 7: Security & Compliance
- [ ] Implement CPF validation for Brazilian users
- [ ] Add LGPD compliance measures
- [ ] Set up transaction logging and audit trails
- [ ] Implement rate limiting and retry logic

## Testing Strategy

### 1. Sandbox Environment
- Use Avenia's sandbox environment for all development
- Test PIX payments with simulated responses
- Validate KYC flows with test data

### 2. Integration Tests
- Test complete PIX to BRLA flow
- Verify currency conversion accuracy
- Test subaccount creation and management
- Validate webhook event handling

### 3. Security Testing
- Test token refresh mechanisms
- Validate secure storage implementation
- Test error handling for various scenarios

## Production Deployment

### 1. Environment Configuration
- Switch to production Avenia API endpoints
- Update authentication credentials
- Configure production webhook URLs

### 2. Monitoring
- Set up transaction monitoring
- Implement error tracking
- Add performance monitoring for API calls

### 3. Compliance
- Ensure all KYC flows meet Brazilian regulations
- Validate PIX integration with Central Bank requirements
- Implement proper data retention policies

---

This implementation guide provides a comprehensive roadmap for integrating Avenia's services into RendeX. Follow the phases sequentially and ensure proper testing at each stage before moving to production.