// Avenia API Types

export interface AveniaAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AveniaLoginRequest {
  email: string;
  password: string;
}

export interface AveniaValidateLoginRequest {
  email: string;
  emailToken: string;
}

export interface AveniaKYCData {
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

export interface AveniaKYCAttempt {
  attempt: {
    id: string;
    levelName: string;
    submissionData: any;
    status: 'PENDING' | 'COMPLETED';
    result: 'APPROVED' | 'REJECTED' | '';
    resultMessage: string;
    retryable: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AveniaKYCWebSDKResponse {
  url: string;
}

export interface AveniaQuote {
  quoteToken: string;
  inputCurrency: string;
  inputPaymentMethod: string;
  inputAmount: string;
  outputCurrency: string;
  outputPaymentMethod: string;
  outputAmount: string;
  markupAmount: string;
  markupCurrency: string;
  inputThirdParty: boolean;
  outputThirdParty: boolean;
  appliedFees: Array<{
    type: string;
    description: string;
    amount: string;
    currency: string;
  }>;
  basePrice: string;
  pairName: string;
  blockchainSendMethod?: string;
}

export interface AveniaTicketRequest {
  quoteToken: string;
  ticketBlockchainOutput: {
    beneficiaryWalletId: string;
  };
}

export interface AveniaTicketResponse {
  id: string;
  brCode?: string;
  expiration?: string;
}

export interface AveniaTicketStatus {
  ticket: {
    id: string;
    workspaceId: string;
    userId: string;
    status: 'UNPAID' | 'PROCESSING' | 'PAID' | 'FAILED' | 'PARTIAL-FAILED';
    reason: string;
    failureReason: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    quote: AveniaQuote;
    rebate?: any;
    brazilianFiatSenderInfo?: any;
    blockchainReceiverInfo?: any;
    brlPixInputInfo?: any;
  };
}

export interface AveniaBalances {
  balances: {
    BRLA: string;
    USDC: string;
    USDT: string;
    USDM: string;
  };
}

export interface AveniaSubaccountRequest {
  accountType: 'INDIVIDUAL' | 'BUSINESS';
  name: string;
}

export interface AveniaSubaccountResponse {
  id: string;
}

export interface AveniaWebhookEvent {
  type: string;
  data: any;
  timestamp: string;
  id: string;
}