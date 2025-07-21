import crypto from 'crypto';
import {
  AveniaKYCData,
  AveniaKYCAttempt,
  AveniaKYCWebSDKResponse,
  AveniaQuote,
  AveniaTicketRequest,
  AveniaTicketResponse,
  AveniaTicketStatus,
  AveniaBalances,
  AveniaSubaccountRequest,
  AveniaSubaccountResponse,
} from './types';

export class AveniaClient {
  private baseUrl: string;
  private apiKey: string;
  private privateKey: string;

  constructor(apiKey: string) {
    this.baseUrl = process.env.AVENIA_API_BASE_URL || 'https://api.avenia.io:8443';
    this.apiKey = apiKey;
    this.privateKey = process.env.AVENIA_PRIVATE_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('API key is required for Avenia client');
    }
    
    if (!this.privateKey) {
      throw new Error('Private key is required for Avenia client signature authentication');
    }
    
    console.log(`[AveniaClient] Initialized with API key: ${this.apiKey.substring(0, 20)}...`);
    console.log(`[AveniaClient] Private key loaded: ${this.privateKey.substring(0, 50)}...`);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const requestUri = endpoint;
    const body = options.body as string || '';
    const timestamp = Math.floor(Date.now()).toString(); // Current timestamp in milliseconds
    
    console.log(`[AveniaClient] ${method} ${endpoint}`);
    console.log(`[AveniaClient] Full URL: ${url}`);
    console.log(`[AveniaClient] Timestamp: ${timestamp}`);
    
    // Generate signature for authentication
    const signature = this.generateSignature(method, requestUri, body, timestamp);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-API-Timestamp': timestamp,
      'X-API-Signature': signature,
      ...options.headers,
    };

    console.log(`[AveniaClient] Using API key: ${this.apiKey.substring(0, 20)}...`);
    console.log(`[AveniaClient] Using timestamp: ${timestamp}`);
    console.log(`[AveniaClient] Using signature: ${signature.substring(0, 50)}...`);

    if (options.body) {
      console.log(`[AveniaClient] Request body:`, JSON.parse(options.body as string));
    } else {
      console.log(`[AveniaClient] Request body: (no body - empty payload)`);
    }

    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const duration = Date.now() - startTime;

    console.log(`[AveniaClient] Response status: ${response.status} (${duration}ms)`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[AveniaClient] API error (${response.status}):`, errorData);
      throw new Error(`Avenia API error (${response.status}): ${errorData}`);
    }

    const responseData = await response.json();
    console.log(`[AveniaClient] Response data:`, responseData);
    
    return responseData;
  }

  // Authentication signature generation
  private generateSignature(method: string, requestUri: string, body: string, timestamp: string): string {
    console.log(`[AveniaClient] Generating signature for ${method} ${requestUri}`);
    
    // Create string to sign: timestamp + method + request_uri + body (if present)
    const stringToSign = timestamp + method + requestUri + body;
    console.log(`[AveniaClient] String to sign: "${stringToSign}"`);
    
    try {
      // Sign the string with private key
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(stringToSign, 'utf8');
      const signature = sign.sign(this.privateKey, 'base64');
      
      console.log(`[AveniaClient] Signature generated successfully: ${signature.substring(0, 50)}...`);
      return signature;
    } catch (error) {
      console.error(`[AveniaClient] Signature generation failed:`, error);
      throw new Error(`Failed to generate signature: ${error}`);
    }
  }

  // KYC methods
  async initiateWebSDKKYC(subAccountId?: string): Promise<AveniaKYCWebSDKResponse> {
    console.log(`[AveniaClient] Initiating KYC Level 1 Web SDK${subAccountId ? ` for subaccount: ${subAccountId}` : ' for main account'}`);
    console.log(`[AveniaClient] Note: KYC completion deadline is 24 hours from initiation`);
    
    const endpoint = subAccountId 
      ? `/v2/kyc/level-1/web-sdk?subAccountId=${subAccountId}`
      : '/v2/kyc/level-1/web-sdk';
    
    console.log(`[AveniaClient] KYC endpoint: ${endpoint}`);
    console.log(`[AveniaClient] KYC payload: {}` + (subAccountId ? ` (using subAccountId in query params: ${subAccountId})` : ' (no payload body - using main account)'));
    
    const requestOptions = {
      method: 'POST',
      // Note: The cURL example shows no body payload, just headers
    };
    
    console.log(`[AveniaClient] KYC request options:`, requestOptions);
    
    const result = await this.request<AveniaKYCWebSDKResponse>(endpoint, requestOptions);
    
    console.log(`[AveniaClient] KYC Web SDK initiated successfully`);
    console.log(`[AveniaClient] KYC URL: ${result.url}`);
    console.log(`[AveniaClient] User has 24 hours to complete verification`);
    return result;
  }

  async submitKYCData(data: AveniaKYCData, subAccountId?: string): Promise<{ id: string }> {
    console.log(`[AveniaClient] Submitting KYC data for: ${data.fullName}${subAccountId ? ` (subaccount: ${subAccountId})` : ''}`);
    
    const endpoint = subAccountId 
      ? `/v2/kyc/level-1/api?subAccountId=${subAccountId}`
      : '/v2/kyc/level-1/api';
    
    const result = await this.request<{ id: string }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log(`[AveniaClient] KYC data submitted successfully, attempt ID: ${result.id}`);
    return result;
  }

  async checkKYCStatus(kycAttemptId: string, subAccountId?: string): Promise<AveniaKYCAttempt> {
    console.log(`[AveniaClient] Checking KYC status for attempt: ${kycAttemptId}${subAccountId ? ` (subaccount: ${subAccountId})` : ''}`);
    
    const endpoint = subAccountId
      ? `/v2/kyc/attempts/${kycAttemptId}?subAccountId=${subAccountId}`
      : `/v2/kyc/attempts/${kycAttemptId}`;
    
    const result = await this.request<AveniaKYCAttempt>(endpoint);
    
    console.log(`[AveniaClient] KYC status check completed - Status: ${result.attempt.status}, Result: ${result.attempt.result}`);
    return result;
  }

  // Transaction methods

  async getBRLAToStablecoinQuote(
    outputAmount: number,
    outputCurrency: 'USDC' | 'USDT'
  ): Promise<AveniaQuote> {
    console.log(`[AveniaClient] Getting BRLA to ${outputCurrency} quote for amount: ${outputAmount} ${outputCurrency}`);
    
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

    const result = await this.request<AveniaQuote>(`/v2/account/quote/fixed-rate?${params}`);
    
    console.log(`[AveniaClient] Conversion quote received - Input: ${result.inputAmount} BRLA, Output: ${result.outputAmount} ${outputCurrency}, Rate: ${result.basePrice}`);
    return result;
  }

  async createTicket(data: AveniaTicketRequest): Promise<AveniaTicketResponse> {
    console.log(`[AveniaClient] Creating ticket with beneficiary wallet: ${data.ticketBlockchainOutput.beneficiaryWalletId}`);
    
    const result = await this.request<AveniaTicketResponse>('/v2/account/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log(`[AveniaClient] Ticket created successfully - ID: ${result.id}${result.brCode ? ', PIX code generated' : ''}`);
    return result;
  }

  async getTicketStatus(ticketId: string): Promise<AveniaTicketStatus> {
    console.log(`[AveniaClient] Checking ticket status for ID: ${ticketId}`);
    
    const result = await this.request<AveniaTicketStatus>(`/v2/account/tickets/${ticketId}`);
    
    console.log(`[AveniaClient] Ticket status retrieved - Status: ${result.ticket.status}, ID: ${ticketId}`);
    return result;
  }

  async getBalances(): Promise<AveniaBalances> {
    console.log(`[AveniaClient] Fetching account balances`);
    
    const result = await this.request<AveniaBalances>('/v2/account/balances');
    
    console.log(`[AveniaClient] Balances retrieved:`, {
      BRLA: result.balances.BRLA,
      USDC: result.balances.USDC,
      USDT: result.balances.USDT,
      USDM: result.balances.USDM
    });
    return result;
  }

  async getSubaccountBalances(subaccountId: string): Promise<AveniaBalances> {
    console.log(`[AveniaClient] Fetching subaccount balances for: ${subaccountId}`);
    
    const result = await this.request<AveniaBalances>(`/v2/account/balances?subAccountId=${subaccountId}`);
    
    console.log(`[AveniaClient] Subaccount balances retrieved:`, {
      BRLA: result.balances.BRLA,
      USDC: result.balances.USDC,
      USDT: result.balances.USDT,
      USDM: result.balances.USDM
    });
    return result;
  }

  async getPixToBRLAQuote(outputAmount: number, subaccountId: string): Promise<any> {
    console.log(`[AveniaClient] Getting PIX to BRLA quote - Amount: ${outputAmount}, SubAccount: ${subaccountId}`);
    
    const params = new URLSearchParams({
      outputAmount: outputAmount.toString(),
      inputCurrency: 'BRL',
      inputPaymentMethod: 'PIX',
      outputCurrency: 'BRLA',
      outputPaymentMethod: 'INTERNAL',
      inputThirdParty: 'false',
      outputThirdParty: 'false',
      blockchainSendMethod: 'TRANSFER',
      subAccountId: subaccountId
    });

    const result = await this.request<any>(`/v2/account/quote/fixed-rate?${params.toString()}`);
    
    console.log(`[AveniaClient] Quote received:`, {
      inputAmount: result.inputAmount,
      outputAmount: result.outputAmount,
      fees: result.appliedFees?.length || 0,
      quoteToken: result.quoteToken ? 'Present' : 'Missing'
    });
    
    return result;
  }

  async createPixTicket(subaccountId: string, quoteToken: string, beneficiaryWalletAddress?: string): Promise<any> {
    console.log(`[AveniaClient] Creating PIX ticket - SubAccount: ${subaccountId}, Wallet: ${beneficiaryWalletAddress || 'internal'}`);
    
    const ticketData = {
      quoteToken,
      ticketBrlPixInput: {
        remitterId: "",
        additionalData: ""
      },
      ticketBlockchainOutput: {
        beneficiaryWalletId: beneficiaryWalletAddress || "00000000-0000-0000-0000-000000000000"
      },
      ticketBlockchainInput: {
        walletAddress: "0x0000000000000000000000000000000000000000"
      },
      ticketBrlPixOutput: {
        beneficiaryBrlBankAccountId: ""
      }
    };

    const result = await this.request<any>(`/v2/account/tickets?subAccountId=${subaccountId}`, {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
    
    console.log(`[AveniaClient] PIX ticket created:`, {
      id: result.id,
      brCodeLength: result.brCode?.length || 0,
      expiration: result.expiration
    });
    
    return result;
  }

  // Subaccount methods
  async createSubaccount(data: AveniaSubaccountRequest): Promise<AveniaSubaccountResponse> {
    console.log(`[AveniaClient] Creating ${data.accountType} subaccount: "${data.name}"`);
    console.log(`[AveniaClient] Subaccount payload:`, data);
    
    const result = await this.request<AveniaSubaccountResponse>('/v2/account/sub-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log(`[AveniaClient] Subaccount created successfully!`);
    console.log(`[AveniaClient] Subaccount ID: ${result.id}`);
    console.log(`[AveniaClient] Account Type: ${data.accountType}`);
    console.log(`[AveniaClient] Name: "${data.name}"`);
    return result;
  }

  // Beneficiary wallet methods
  async createBeneficiaryWallet(subaccountId: string, walletData: {
    alias: string;
    description: string;
    walletAddress: string;
    walletChain: string;
    walletMemo: string;
  }): Promise<{ id: string }> {
    console.log(`[AveniaClient] Creating beneficiary wallet for subaccount: ${subaccountId}`);
    console.log(`[AveniaClient] Wallet: ${walletData.walletAddress} on ${walletData.walletChain}`);
    
    const result = await this.request<{ id: string }>(`/v2/account/beneficiaries/wallets?subAccountId=${subaccountId}`, {
      method: 'POST',
      body: JSON.stringify(walletData),
    });
    
    console.log(`[AveniaClient] Beneficiary wallet created - ID: ${result.id}`);
    return result;
  }

  async getExternalTransferQuote(
    subaccountId: string,
    outputAmount: number,
    outputCurrency: string,
    walletChain: string
  ): Promise<AveniaQuote> {
    console.log(`[AveniaClient] Getting external transfer quote - ${outputAmount} ${outputCurrency} to ${walletChain}`);
    
    const params = new URLSearchParams({
      inputCurrency: outputCurrency, // Same currency, just transferring
      inputPaymentMethod: 'INTERNAL',
      outputAmount: outputAmount.toString(),
      outputCurrency: outputCurrency,
      outputPaymentMethod: walletChain, // Blockchain network
      inputThirdParty: 'false',
      outputThirdParty: 'false',
      blockchainSendMethod: 'PERMIT',
      subAccountId: subaccountId,
    });

    const result = await this.request<AveniaQuote>(`/v2/account/quote/fixed-rate?${params}`);
    
    console.log(`[AveniaClient] External transfer quote - Input: ${result.inputAmount} ${result.inputCurrency}, Fees: ${result.appliedFees.length} items`);
    return result;
  }

  async sendToExternalWallet(
    subaccountId: string,
    quoteToken: string,
    beneficiaryWalletId: string
  ): Promise<{ ticketId: string }> {
    console.log(`[AveniaClient] Sending to external wallet - beneficiary: ${beneficiaryWalletId}`);
    
    const result = await this.request<AveniaTicketResponse>('/v2/account/tickets', {
      method: 'POST',
      body: JSON.stringify({
        quoteToken,
        ticketBlockchainOutput: {
          beneficiaryWalletId,
        },
      }),
    });
    
    console.log(`[AveniaClient] External transfer ticket created - ID: ${result.id}`);
    return { ticketId: result.id };
  }

  // Utility methods for API key management
  // API key is now set in constructor and doesn't need runtime modification
}