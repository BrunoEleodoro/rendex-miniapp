import { AveniaClient } from './client';
import { IUser } from '../../models/User';
import User from '../../models/User';
import KYCAttempt from '../../models/KYCAttempt';
import Transaction from '../../models/Transaction';
import Subaccount from '../../models/Subaccount';
import connectMongoDB from '../mongodb';

// Import SSE notification function
let notifyUser: (userId: string, data: any) => void = () => {};

// Dynamically import SSE notification function
const initializeNotifyUser = async () => {
  try {
    // Note: sendRealTimeUpdate is no longer exported from route files due to Next.js restrictions
    // For now, we'll use a no-op function
    console.log('[AveniaService] SSE notification temporarily disabled due to Next.js route restrictions');
    console.log('[AveniaService] SSE notification function loaded successfully');
  } catch (error) {
    console.warn('[AveniaService] SSE notifications not available:', error);
    notifyUser = () => {}; // Fallback no-op function
  }
};

// Initialize the notifyUser function
initializeNotifyUser();

export class AveniaService {
  private client: AveniaClient;

  constructor() {
    console.log('[AveniaService] Initializing Avenia service...');
    
    // Get API key and private key from environment
    const apiKey = process.env.AVENIA_API_KEY;
    const privateKey = process.env.AVENIA_PRIVATE_KEY;
    
    if (!apiKey) {
      console.error('[AveniaService] ERROR: Missing AVENIA_API_KEY in environment variables');
      throw new Error('Avenia API key not configured. Please set AVENIA_API_KEY');
    }
    
    if (!privateKey) {
      console.error('[AveniaService] ERROR: Missing AVENIA_PRIVATE_KEY in environment variables');
      throw new Error('Avenia private key not configured. Please set AVENIA_PRIVATE_KEY');
    }
    
    console.log('[AveniaService] Using API key:', apiKey.substring(0, 20) + '...');
    console.log('[AveniaService] Private key configured:', privateKey.substring(0, 50) + '...');
    
    this.client = new AveniaClient(apiKey);
  }

  // Note: Encryption methods removed since we now use API key directly from environment
  // No need to store or encrypt tokens anymore

  async getUserForKYC(userId: string): Promise<IUser> {
    console.log(`[AveniaService] Getting user for KYC: ${userId}`);
    await connectMongoDB();
    
    let user;
    
    // Try to find by ObjectId first, then fall back to username/email
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId format
      user = await User.findById(userId);
    } else {
      // Assume it's username or email
      user = await User.findOne({
        $or: [
          { email: userId },
          { farcasterUsername: userId },
          { id: userId } // Custom ID field
        ]
      });
    }
    
    if (!user) {
      console.error(`[AveniaService] User not found: ${userId}`);
      throw new Error('User not found');
    }

    console.log(`[AveniaService] User found for KYC: ${userId} (${user.email}), status: ${user.kycStatus}`);
    return user;
  }

  async initiateKYC(userId: string, subaccountId?: string): Promise<string> {
    console.log(`[AveniaService] Initiating KYC for user: ${userId}${subaccountId ? ` (subaccount: ${subaccountId})` : ''}`);
    const user = await this.getUserForKYC(userId);
    
    // Get KYC Web SDK URL from Avenia
    console.log(`[AveniaService] Requesting KYC Web SDK URL from Avenia for user: ${user.email}`);
    
    try {
      const response = await this.client.initiateWebSDKKYC(subaccountId);
      console.log(`[AveniaService] KYC Web SDK response received successfully`);
      
      // Create KYC attempt record
      console.log(`[AveniaService] Creating KYC attempt record for user: ${userId}`);
      const kycAttempt = new KYCAttempt({
        userId: user._id,
        aveniaKycId: '', // Will be updated when we receive the webhook
        levelName: 'level-1',
        status: 'pending',
        kycUrl: response.url,
        webhookReceived: false,
      });
      await kycAttempt.save();
      console.log(`[AveniaService] KYC attempt record created with ID: ${kycAttempt._id}`);

      // Update user KYC status
      console.log(`[AveniaService] Updating user KYC status to 'in_progress' for user: ${userId}`);
      user.kycStatus = 'in_progress';
      user.kycAttemptId = kycAttempt._id;
      await user.save();

      console.log(`[AveniaService] KYC initiated successfully for user: ${userId}, URL: ${response.url}`);
      return response.url;
      
    } catch (error: any) {
      console.error(`[AveniaService] KYC initiation failed:`, error);
      
      if (error.message.includes('COMPANY accountType currently is unsupported')) {
        console.log(`[AveniaService] COMPANY account detected - KYC Level 1 Web SDK requires INDIVIDUAL account type`);
        console.log(`[AveniaService] Suggestion: Create a subaccount with INDIVIDUAL type first, then initiate KYC on that subaccount`);
        
        // You may want to automatically create an INDIVIDUAL subaccount here
        throw new Error('KYC Level 1 requires INDIVIDUAL account type. Your token appears to be for a COMPANY account. Please create an INDIVIDUAL subaccount first.');
      }
      
      throw error;
    }
  }

  async handleKYCWebhook(webhookData: any): Promise<void> {
    console.log(`[AveniaService] Received KYC webhook:`, JSON.stringify(webhookData, null, 2));
    await connectMongoDB();
    
    // Extract KYC attempt ID from webhook data
    const aveniaKycId = webhookData.data?.attempt?.id;
    if (!aveniaKycId) {
      console.error(`[AveniaService] Invalid KYC webhook data - missing attempt ID:`, webhookData);
      throw new Error('Invalid KYC webhook data');
    }

    console.log(`[AveniaService] Processing KYC webhook for attempt ID: ${aveniaKycId}`);

    // Find KYC attempt by Avenia ID or find the most recent pending attempt
    let kycAttempt = await KYCAttempt.findOne({ aveniaKycId });
    
    if (!kycAttempt) {
      // For Web SDK, we might not have the Avenia KYC ID yet
      // Try to find the most recent pending KYC attempt without an Avenia ID
      console.log(`[AveniaService] KYC attempt not found by Avenia ID: ${aveniaKycId}, searching for pending attempts`);
      
      kycAttempt = await KYCAttempt.findOne({ 
        aveniaKycId: '', 
        status: 'pending',
        webhookReceived: false 
      }).sort({ createdAt: -1 });
      
      if (kycAttempt) {
        console.log(`[AveniaService] Found pending KYC attempt: ${kycAttempt._id}, associating with Avenia ID: ${aveniaKycId}`);
        kycAttempt.aveniaKycId = aveniaKycId;
      } else {
        console.warn(`[AveniaService] No matching KYC attempt found for webhook: ${aveniaKycId}`);
        return;
      }
    }

    console.log(`[AveniaService] Found KYC attempt: ${kycAttempt._id} for user: ${kycAttempt.userId}`);

    // Update KYC attempt with webhook data
    const attemptData = webhookData.data.attempt;
    const oldStatus = kycAttempt.status;
    const oldResult = kycAttempt.result;
    
    kycAttempt.status = attemptData.status.toLowerCase();
    kycAttempt.result = attemptData.result.toLowerCase();
    kycAttempt.resultMessage = attemptData.resultMessage || '';
    kycAttempt.retryable = attemptData.retryable || false;
    kycAttempt.webhookReceived = true;
    await kycAttempt.save();

    console.log(`[AveniaService] KYC attempt updated - Status: ${oldStatus} → ${kycAttempt.status}, Result: ${oldResult} → ${kycAttempt.result}`);

    // Update user KYC status
    const user = await User.findById(kycAttempt.userId);
    if (user) {
      const oldUserStatus = user.kycStatus;
      
      if (attemptData.status === 'COMPLETED') {
        user.kycStatus = attemptData.result === 'APPROVED' ? 'completed' : 'rejected';
        console.log(`[AveniaService] KYC ${attemptData.result === 'APPROVED' ? 'APPROVED' : 'REJECTED'} for user: ${user._id} (${user.email})`);
      }
      
      await user.save();
      console.log(`[AveniaService] User KYC status updated: ${oldUserStatus} → ${user.kycStatus} for user: ${user._id}`);

      // 🔥 Send real-time update to UI
      console.log(`[AveniaService] Sending real-time KYC update to user: ${user._id}`);
      notifyUser(user._id, {
        type: 'kyc_status_update',
        kycStatus: user.kycStatus,
        result: attemptData.result,
        message: attemptData.result === 'APPROVED' 
          ? 'Your identity verification has been approved! 🎉' 
          : 'Your identity verification was not approved. Please try again.',
        data: {
          attemptId: aveniaKycId,
          status: attemptData.status,
          result: attemptData.result,
          resultMessage: attemptData.resultMessage
        }
      });
    } else {
      console.error(`[AveniaService] User not found for KYC attempt: ${kycAttempt.userId}`);
    }

    console.log(`[AveniaService] KYC webhook processed successfully for attempt: ${aveniaKycId}`);
  }

  async createPixPayment(userId: string, outputAmount: number, subaccountId?: string, walletAddress?: string): Promise<{
    ticketId: string;
    brCode: string;
    expiration: string;
  }> {
    console.log(`[AveniaService] Creating PIX payment for user: ${userId}, amount: ${outputAmount} BRLA${subaccountId ? ` (subaccount: ${subaccountId})` : ''}${walletAddress ? ` (external wallet: ${walletAddress})` : ''}`);
    const user = await this.getUserForKYC(userId);
    
    // Step 1: Get quote from Avenia with subaccount
    const userSubaccountId = subaccountId || user.aveniaSubaccountId;
    if (!userSubaccountId) {
      throw new Error('No subaccount ID available for user');
    }
    console.log(`[AveniaService] Getting PIX to BRLA quote for user: ${user.email}, amount: ${outputAmount}, subaccount: ${userSubaccountId}`);
    
    // Determine output payment method based on whether we're sending to external wallet
    const outputPaymentMethod = walletAddress ? 'POLYGON' : 'INTERNAL';
    console.log(`[AveniaService] Using output payment method: ${outputPaymentMethod}${walletAddress ? ` (external: ${walletAddress})` : ' (internal)'}`);
    
    const quote = await this.client.getPixToBRLAQuote(outputAmount, userSubaccountId, outputPaymentMethod);
    console.log(`[AveniaService] Quote received - Will pay ${quote.inputAmount} BRL to get ${quote.outputAmount} BRLA`);
    
    // Step 2: Create ticket with external wallet support
    let beneficiaryWalletId = '00000000-0000-0000-0000-000000000000'; // Default internal wallet
    
    if (walletAddress) {
      // Get or create beneficiary wallet for external transfer
      console.log(`[AveniaService] Getting or creating beneficiary wallet for external address: ${walletAddress}`);
      beneficiaryWalletId = await this.getOrCreateBeneficiaryWallet(userSubaccountId, walletAddress);
      console.log(`[AveniaService] Using beneficiary wallet ID: ${beneficiaryWalletId}`);
    }
    
    console.log(`[AveniaService] Creating Avenia ticket for user: ${userId}, beneficiary: ${beneficiaryWalletId}${walletAddress ? ` (external: ${walletAddress})` : ' (internal)'}`);
    const ticket = await this.client.createTicket({
      quoteToken: quote.quoteToken,
      ticketBlockchainOutput: {
        beneficiaryWalletId,
      },
    });
    console.log(`[AveniaService] Ticket created successfully - ID: ${ticket.id}, has PIX code: ${!!ticket.brCode}`);

    // Step 3: Save transaction to database
    console.log(`[AveniaService] Saving transaction record to database for user: ${userId}`);
    const transaction = new Transaction({
      userId: user._id,
      aveniaTicketId: ticket.id,
      type: walletAddress ? 'pix_to_external_wallet' : 'pix_to_brla',
      status: 'unpaid',
      inputCurrency: quote.inputCurrency,
      inputAmount: quote.inputAmount,
      inputPaymentMethod: quote.inputPaymentMethod,
      outputCurrency: quote.outputCurrency,
      outputAmount: quote.outputAmount,
      outputPaymentMethod: quote.outputPaymentMethod,
      markupAmount: quote.markupAmount,
      markupCurrency: quote.markupCurrency,
      appliedFees: quote.appliedFees,
      basePrice: quote.basePrice,
      pairName: quote.pairName,
      brCode: ticket.brCode,
      expiresAt: ticket.expiration ? new Date(ticket.expiration) : undefined,
      webhookReceived: false,
      externalWalletAddress: walletAddress, // Store external wallet address
    });
    await transaction.save();
    console.log(`[AveniaService] Transaction record saved with ID: ${transaction._id}`);

    console.log(`[AveniaService] PIX payment created successfully for user: ${userId}, ticket: ${ticket.id}`);
    return {
      ticketId: ticket.id,
      brCode: ticket.brCode || '',
      expiration: ticket.expiration || '',
    };
  }

  async handleTransactionWebhook(webhookData: any): Promise<void> {
    console.log(`[AveniaService] Received transaction webhook:`, JSON.stringify(webhookData, null, 2));
    await connectMongoDB();
    
    const ticketId = webhookData.data?.ticket?.id;
    if (!ticketId) {
      console.error(`[AveniaService] Invalid transaction webhook data - missing ticket ID:`, webhookData);
      throw new Error('Invalid transaction webhook data');
    }

    console.log(`[AveniaService] Processing transaction webhook for ticket ID: ${ticketId}`);

    const transaction = await Transaction.findOne({ aveniaTicketId: ticketId });
    if (!transaction) {
      console.warn(`[AveniaService] Transaction not found for webhook ticket: ${ticketId}`);
      return;
    }

    console.log(`[AveniaService] Found transaction: ${transaction._id} for user: ${transaction.userId}`);

    // Update transaction status
    const ticketData = webhookData.data.ticket;
    const oldStatus = transaction.status;
    
    transaction.status = ticketData.status.toLowerCase();
    transaction.reason = ticketData.reason || '';
    transaction.failureReason = ticketData.failureReason || '';
    transaction.webhookReceived = true;
    await transaction.save();

    console.log(`[AveniaService] Transaction status updated: ${oldStatus} → ${transaction.status} for ticket: ${ticketId}`);

    // Log specific status changes for monitoring
    if (transaction.status === 'paid') {
      console.log(`[AveniaService] 🎉 PIX payment COMPLETED for user: ${transaction.userId}, amount: ${transaction.outputAmount} ${transaction.outputCurrency}`);
      
      // 🔥 Send real-time payment success update to UI
      console.log(`[AveniaService] Sending real-time payment success update to user: ${transaction.userId}`);
      notifyUser(transaction.userId, {
        type: 'payment_completed',
        status: 'paid',
        message: `Payment completed! You received ${transaction.outputAmount} ${transaction.outputCurrency} 🎉`,
        data: {
          ticketId,
          amount: transaction.outputAmount,
          currency: transaction.outputCurrency,
          inputAmount: transaction.inputAmount,
          inputCurrency: transaction.inputCurrency,
          transactionId: transaction._id
        }
      });
      
    } else if (transaction.status === 'failed') {
      console.log(`[AveniaService] ❌ PIX payment FAILED for user: ${transaction.userId}, reason: ${transaction.failureReason}`);
      
      // 🔥 Send real-time payment failure update to UI
      console.log(`[AveniaService] Sending real-time payment failure update to user: ${transaction.userId}`);
      notifyUser(transaction.userId, {
        type: 'payment_failed',
        status: 'failed',
        message: `Payment failed: ${transaction.failureReason || 'Unknown error'} ❌`,
        data: {
          ticketId,
          reason: transaction.failureReason,
          transactionId: transaction._id
        }
      });
      
    } else if (transaction.status === 'processing') {
      console.log(`[AveniaService] ⏳ PIX payment PROCESSING for user: ${transaction.userId}, ticket: ${ticketId}`);
      
      // 🔥 Send real-time payment processing update to UI
      console.log(`[AveniaService] Sending real-time payment processing update to user: ${transaction.userId}`);
      notifyUser(transaction.userId, {
        type: 'payment_processing',
        status: 'processing',
        message: 'Your PIX payment is being processed... ⏳',
        data: {
          ticketId,
          transactionId: transaction._id
        }
      });
    }

    console.log(`[AveniaService] Transaction webhook processed successfully for ticket: ${ticketId}`);
  }

  async getUserBalances(userId: string): Promise<any> {
    console.log(`[AveniaService] Getting balances for user: ${userId}`);
    const _user = await this.getUserForKYC(userId);
    return await this.client.getBalances();
  }

  async getSubaccountBalances(subaccountId: string): Promise<any> {
    console.log(`[AveniaService] Getting balances for subaccount: ${subaccountId}`);
    return await this.client.getSubaccountBalances(subaccountId);
  }

  async getPixToBRLAQuote(outputAmount: number, subaccountId: string, outputPaymentMethod: string = 'INTERNAL'): Promise<any> {
    console.log(`[AveniaService] Getting PIX to BRLA quote for amount: ${outputAmount}, subaccount: ${subaccountId}, method: ${outputPaymentMethod}`);
    return await this.client.getPixToBRLAQuote(outputAmount, subaccountId, outputPaymentMethod);
  }

  async createPixTicketForUser(subaccountId: string, quoteToken: string, walletAddress?: string): Promise<any> {
    console.log(`[AveniaService] Creating PIX ticket for subaccount: ${subaccountId}, wallet: ${walletAddress || 'internal'}`);
    
    let beneficiaryWalletId = '00000000-0000-0000-0000-000000000000'; // Default internal wallet
    
    if (walletAddress) {
      // Get or create beneficiary wallet for external transfer
      console.log(`[AveniaService] Getting or creating beneficiary wallet for external address: ${walletAddress}`);
      beneficiaryWalletId = await this.getOrCreateBeneficiaryWallet(subaccountId, walletAddress);
      console.log(`[AveniaService] Using beneficiary wallet ID: ${beneficiaryWalletId}`);
    }
    
    return await this.client.createPixTicket(subaccountId, quoteToken, beneficiaryWalletId);
  }

  async createBeneficiaryWallet(subaccountId: string, walletData: {
    alias: string;
    description: string;
    walletAddress: string;
    walletChain: string;
    walletMemo: string;
  }): Promise<{ id: string }> {
    console.log(`[AveniaService] Creating beneficiary wallet for subaccount: ${subaccountId}`);
    return await this.client.createBeneficiaryWallet(subaccountId, walletData);
  }

  async getOrCreateBeneficiaryWallet(subaccountId: string, walletAddress: string): Promise<string> {
    console.log(`[AveniaService] Getting or creating beneficiary wallet for: ${walletAddress}`);
    
    try {
      // First, check if the wallet already exists
      const existingWallets = await this.client.getBeneficiaryWallets(subaccountId, walletAddress);
      
      if (existingWallets.wallets.length > 0) {
        console.log(`[AveniaService] Found existing beneficiary wallet: ${existingWallets.wallets[0].id}`);
        return existingWallets.wallets[0].id;
      }
      
      // If not found, create a new one
      console.log(`[AveniaService] No existing wallet found, creating new beneficiary wallet`);
      const walletResult = await this.client.createBeneficiaryWallet(subaccountId, {
        alias: `External Wallet ${walletAddress.slice(0, 10)}...`,
        description: `External wallet for PIX deposits: ${walletAddress}`,
        walletAddress,
        walletChain: 'POLYGON', // Force POLYGON network for all external wallets
        walletMemo: 'Auto-created for PIX deposit',
      });
      
      console.log(`[AveniaService] New beneficiary wallet created: ${walletResult.id}`);
      return walletResult.id;
      
    } catch (error: any) {
      console.error(`[AveniaService] Error managing beneficiary wallet:`, error.message);
      throw new Error(`Failed to get or create beneficiary wallet: ${error.message}`);
    }
  }

  async getExternalTransferQuote(
    subaccountId: string,
    outputAmount: number,
    outputCurrency: string,
    walletChain: string
  ): Promise<any> {
    console.log(`[AveniaService] Getting external transfer quote for subaccount: ${subaccountId}`);
    return await this.client.getExternalTransferQuote(subaccountId, outputAmount, outputCurrency, walletChain);
  }

  async sendToExternalWallet(
    subaccountId: string,
    quoteToken: string,
    beneficiaryWalletId: string
  ): Promise<{ ticketId: string }> {
    console.log(`[AveniaService] Sending to external wallet from subaccount: ${subaccountId}`);
    return await this.client.sendToExternalWallet(subaccountId, quoteToken, beneficiaryWalletId);
  }

  async convertBRLAToStablecoin(
    userId: string,
    outputAmount: number,
    outputCurrency: 'USDC' | 'USDT'
  ): Promise<{
    ticketId: string;
  }> {
    console.log(`[AveniaService] Converting BRLA to ${outputCurrency} for user: ${userId}, amount: ${outputAmount}`);
    const user = await this.getUserForKYC(userId);
    
    // Step 1: Get quote
    const quote = await this.client.getBRLAToStablecoinQuote(outputAmount, outputCurrency);
    
    // Step 2: Create ticket
    const ticket = await this.client.createTicket({
      quoteToken: quote.quoteToken,
      ticketBlockchainOutput: {
        beneficiaryWalletId: '00000000-0000-0000-0000-000000000000',
      },
    });

    // Step 3: Save transaction
    const transaction = new Transaction({
      userId: user._id,
      aveniaTicketId: ticket.id,
      type: outputCurrency === 'USDC' ? 'brla_to_usdc' : 'brla_to_usdt',
      status: 'processing',
      inputCurrency: quote.inputCurrency,
      inputAmount: quote.inputAmount,
      inputPaymentMethod: quote.inputPaymentMethod,
      outputCurrency: quote.outputCurrency,
      outputAmount: quote.outputAmount,
      outputPaymentMethod: quote.outputPaymentMethod,
      appliedFees: quote.appliedFees,
      basePrice: quote.basePrice,
      pairName: quote.pairName,
      webhookReceived: false,
    });
    await transaction.save();

    return {
      ticketId: ticket.id,
    };
  }

  async createSubaccount(userId: string, name: string): Promise<{
    subaccountId: string;
  }> {
    console.log(`[AveniaService] Creating subaccount for user: ${userId}, name: ${name}`);
    const user = await this.getUserForKYC(userId);
    
    // Create subaccount in Avenia
    const response = await this.client.createSubaccount({
      accountType: 'INDIVIDUAL',
      name,
    });

    // Save subaccount to database
    const subaccount = new Subaccount({
      userId: user._id,
      aveniaSubaccountId: response.id,
      name,
      accountType: 'INDIVIDUAL',
      kycStatus: 'not_started',
      isActive: true,
    });
    await subaccount.save();

    return {
      subaccountId: response.id,
    };
  }

  async getUserTransactions(userId: string): Promise<any[]> {
    await connectMongoDB();
    
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return transactions;
  }

  async getUserSubaccounts(userId: string): Promise<any[]> {
    console.log(`[AveniaService] Fetching subaccounts for user: ${userId}`);
    await connectMongoDB();
    
    const subaccounts = await Subaccount.find({ userId, isActive: true })
      .sort({ createdAt: -1 });
    
    console.log(`[AveniaService] Found ${subaccounts.length} subaccounts for user: ${userId}`);
    return subaccounts;
  }

  async getUserInfo(userId: string): Promise<any> {
    console.log(`[AveniaService] Fetching user info for: ${userId}`);
    await connectMongoDB();
    
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[AveniaService] User not found: ${userId}`);
      throw new Error('User not found');
    }

    console.log(`[AveniaService] User info retrieved for: ${userId} (${user.email}) - KYC status: ${user.kycStatus}`);
    return user;
  }
}