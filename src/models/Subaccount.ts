import mongoose, { Document, Model } from 'mongoose';

export interface ISubaccount extends Document {
  _id: string;
  userId: string; // Main user who owns this subaccount
  aveniaSubaccountId: string;
  name: string;
  accountType: 'INDIVIDUAL' | 'BUSINESS';
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  kycAttemptId?: string;
  balances: {
    BRLA?: string;
    USDC?: string;
    USDT?: string;
    USDM?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subaccountSchema = new mongoose.Schema<ISubaccount>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  aveniaSubaccountId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    enum: ['INDIVIDUAL', 'BUSINESS'],
    default: 'INDIVIDUAL',
  },
  kycStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'rejected'],
    default: 'not_started',
  },
  kycAttemptId: String,
  balances: {
    BRLA: {
      type: String,
      default: '0',
    },
    USDC: {
      type: String,
      default: '0',
    },
    USDT: {
      type: String,
      default: '0',
    },
    USDM: {
      type: String,
      default: '0',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
subaccountSchema.index({ userId: 1 });
subaccountSchema.index({ aveniaSubaccountId: 1 });
subaccountSchema.index({ kycStatus: 1 });

const Subaccount: Model<ISubaccount> = mongoose.models.Subaccount || mongoose.model<ISubaccount>('Subaccount', subaccountSchema);

export default Subaccount;