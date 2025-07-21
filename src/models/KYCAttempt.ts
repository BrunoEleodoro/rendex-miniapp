import mongoose, { Document, Model } from 'mongoose';

export interface IKYCAttempt extends Document {
  _id: string;
  userId: string;
  aveniaKycId: string;
  levelName: string;
  status: 'pending' | 'completed' | 'failed';
  result: 'approved' | 'rejected' | '';
  resultMessage: string;
  retryable: boolean;
  submissionData?: any;
  kycUrl?: string;
  webhookReceived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const kycAttemptSchema = new mongoose.Schema<IKYCAttempt>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  aveniaKycId: {
    type: String,
    required: true,
    unique: true,
  },
  levelName: {
    type: String,
    default: 'level-1',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  result: {
    type: String,
    enum: ['approved', 'rejected', ''],
    default: '',
  },
  resultMessage: {
    type: String,
    default: '',
  },
  retryable: {
    type: Boolean,
    default: false,
  },
  submissionData: {
    type: mongoose.Schema.Types.Mixed,
  },
  kycUrl: String,
  webhookReceived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
kycAttemptSchema.index({ userId: 1 });
kycAttemptSchema.index({ aveniaKycId: 1 });
kycAttemptSchema.index({ status: 1 });

const KYCAttempt: Model<IKYCAttempt> = mongoose.models.KYCAttempt || mongoose.model<IKYCAttempt>('KYCAttempt', kycAttemptSchema);

export default KYCAttempt;