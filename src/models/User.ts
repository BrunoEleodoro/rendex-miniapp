import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  farcasterFid?: number;
  farcasterUsername?: string;
  farcasterDisplayName?: string;
  farcasterPfpUrl?: string;
  walletAddress?: string;
  aveniaTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  personalInfo?: {
    fullName?: string;
    dateOfBirth?: string;
    cpf?: string;
    phone?: string;
    address?: {
      country: string;
      state: string;
      city: string;
      zipCode: string;
      streetAddress: string;
    };
  };
  aveniaAccountId?: string;
  aveniaSubaccountId?: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  kycAttemptId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  farcasterFid: {
    type: Number,
    sparse: true,
  },
  farcasterUsername: {
    type: String,
    sparse: true,
  },
  farcasterDisplayName: {
    type: String,
    sparse: true,
  },
  farcasterPfpUrl: {
    type: String,
    sparse: true,
  },
  walletAddress: {
    type: String,
    sparse: true,
  },
  aveniaTokens: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
  },
  personalInfo: {
    fullName: String,
    dateOfBirth: String,
    cpf: String,
    phone: String,
    address: {
      country: String,
      state: String,
      city: String,
      zipCode: String,
      streetAddress: String,
    },
  },
  aveniaAccountId: String,
  aveniaSubaccountId: String,
  kycStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'rejected'],
    default: 'not_started',
  },
  kycAttemptId: String,
}, {
  timestamps: true,
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ farcasterFid: 1 });
userSchema.index({ farcasterUsername: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ aveniaSubaccountId: 1 });
userSchema.index({ kycStatus: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;