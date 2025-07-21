import mongoose, { Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  _id: string;
  userId: string;
  aveniaTicketId: string;
  type: 'pix_to_brla' | 'brla_to_usdc' | 'brla_to_usdt' | 'transfer_to_subaccount' | 'external_transfer';
  status: 'unpaid' | 'processing' | 'paid' | 'failed' | 'partial_failed';
  inputCurrency: string;
  inputAmount: string;
  inputPaymentMethod: string;
  outputCurrency: string;
  outputAmount: string;
  outputPaymentMethod: string;
  markupAmount?: string;
  markupCurrency?: string;
  appliedFees: Array<{
    type: string;
    amount: string;
    currency: string;
    description: string;
  }>;
  basePrice: string;
  pairName: string;
  brCode?: string; // PIX payment code
  expiresAt?: Date;
  reason?: string;
  failureReason?: string;
  webhookReceived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new mongoose.Schema<ITransaction>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  aveniaTicketId: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['pix_to_brla', 'brla_to_usdc', 'brla_to_usdt', 'transfer_to_subaccount', 'external_transfer'],
    required: true,
  },
  status: {
    type: String,
    enum: ['unpaid', 'processing', 'paid', 'failed', 'partial_failed'],
    default: 'unpaid',
  },
  inputCurrency: {
    type: String,
    required: true,
  },
  inputAmount: {
    type: String,
    required: true,
  },
  inputPaymentMethod: {
    type: String,
    required: true,
  },
  outputCurrency: {
    type: String,
    required: true,
  },
  outputAmount: {
    type: String,
    required: true,
  },
  outputPaymentMethod: {
    type: String,
    required: true,
  },
  markupAmount: String,
  markupCurrency: String,
  appliedFees: [{
    type: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  }],
  basePrice: {
    type: String,
    required: true,
  },
  pairName: {
    type: String,
    required: true,
  },
  brCode: String,
  expiresAt: Date,
  reason: String,
  failureReason: String,
  webhookReceived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
transactionSchema.index({ userId: 1 });
transactionSchema.index({ aveniaTicketId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;