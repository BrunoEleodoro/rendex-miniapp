# RendeX + Avenia Integration Setup Guide

This guide walks you through setting up the complete Avenia integration in your Next.js RendeX application.

## 🚀 Quick Setup

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

Update your `.env.local` with the following:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rendex
# Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/rendex

# Avenia API Configuration
AVENIA_API_BASE_URL=https://api.sandbox.avenia.io:10952
AVENIA_EMAIL=your.email@provider.com
AVENIA_PASSWORD=UseAStrongPassword123!
AVENIA_ENCRYPTION_KEY=your-32-character-encryption-key-here

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 2. Install Dependencies

Dependencies are already installed via pnpm:
- `mongoose` - MongoDB ODM
- `crypto-js` - Encryption for tokens

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Recommended)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get your connection string
3. Update `MONGODB_URI` in `.env.local`

### 4. Set Up Avenia Webhook Endpoint

Your webhook endpoint is ready at: `/api/avenia/webhooks`

**For Development (using ngrok):**
```bash
# Install ngrok
npm install -g ngrok

# In a separate terminal, expose your local server
ngrok http 3000

# Use the HTTPS URL for Avenia webhook configuration
# Example: https://abc123.ngrok.io/api/avenia/webhooks
```

### 5. Configure Avenia Webhooks

In your Avenia dashboard, set up webhooks for:
- **KYC Events**: Point to `https://yourdomain.com/api/avenia/webhooks`
- **Transaction Events**: Same endpoint
- **Event Types**: KYC status changes, ticket status updates

## 🧩 Integration Usage

### Basic Integration

Add the Avenia integration to any page:

```tsx
import { AveniaIntegration } from '../components/avenia/AveniaIntegration';

export default function MyPage() {
  return (
    <div>
      <h1>RendeX Financial Services</h1>
      <AveniaIntegration />
    </div>
  );
}
```

### Custom Integration

For more control, use individual components:

```tsx
import { useState } from 'react';
import { AveniaLoginModal } from '../components/avenia/AveniaLoginModal';
import { KYCFlow } from '../components/avenia/KYCFlow';
import { BalanceCard } from '../components/avenia/BalanceCard';
import { PIXPaymentModal } from '../components/avenia/PIXPaymentModal';

export default function CustomIntegration() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div>
      {!user ? (
        <AveniaLoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={setUser}
        />
      ) : user.kycStatus !== 'completed' ? (
        <KYCFlow
          userId={user.id}
          onKYCComplete={() => {/* handle completion */}}
        />
      ) : (
        <BalanceCard
          userId={user.id}
          onPixPayment={() => {/* handle PIX payment */}}
          onConvert={(currency) => {/* handle conversion */}}
        />
      )}
    </div>
  );
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/avenia/auth/login` - Initiate login (sends email token)
- `POST /api/avenia/auth/validate-login` - Validate email token and get user

### KYC
- `POST /api/avenia/kyc/initiate` - Start KYC process, returns verification URL

### Transactions
- `POST /api/avenia/transactions/pix-payment` - Create PIX payment
- `POST /api/avenia/transactions/convert` - Convert BRLA to USDC/USDT

### Data
- `GET /api/avenia/balances?userId=123` - Get user balances
- `GET /api/avenia/user/[userId]` - Get user transactions and subaccounts

### Webhooks
- `POST /api/avenia/webhooks` - Handle Avenia webhooks
- `GET /api/avenia/webhooks` - Webhook verification endpoint

## 💡 Complete User Flow (Webhook-First Architecture)

### 1. User Authentication
```javascript
// User clicks "Connect Avenia Account"
const response = await fetch('/api/avenia/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// User enters email token
const user = await fetch('/api/avenia/auth/validate-login', {
  method: 'POST',
  body: JSON.stringify({ email, emailToken })
});
```

### 2. KYC Verification (Webhook-Based)
```javascript
// Initiate KYC and get verification URL
const response = await fetch('/api/avenia/kyc/initiate', {
  method: 'POST',
  body: JSON.stringify({ userId })
});

const { kycUrl } = await response.json();

// Open KYC URL in new window
window.open(kycUrl, '_blank');

// ✅ NO POLLING NEEDED - Webhook updates database automatically
// User completes KYC → Avenia sends webhook → Database updated → UI refreshed
// User is redirected to /kyc/success page
```

### 3. PIX Payment (Webhook-Based)
```javascript
// Create PIX payment
const payment = await fetch('/api/avenia/transactions/pix-payment', {
  method: 'POST',
  body: JSON.stringify({ userId, amount: 100 })
});

const { brCode, ticketId } = await payment.json();

// Display QR code for user to scan
// ✅ NO POLLING NEEDED - Webhook notifies when payment is completed
// User pays → Bank confirms → Avenia sends webhook → Database updated → UI refreshed
```

### 4. Currency Conversion (Webhook-Based)
```javascript
// Convert BRLA to USDC
const conversion = await fetch('/api/avenia/transactions/convert', {
  method: 'POST',
  body: JSON.stringify({ 
    userId, 
    amount: 100, 
    outputCurrency: 'USDC' 
  })
});

// ✅ NO POLLING NEEDED - Webhook handles conversion status updates
```

### 5. Real-Time Updates via Webhooks
All status updates are handled automatically via webhooks at `/api/avenia/webhooks`:

```javascript
// KYC Status: PENDING → COMPLETED → APPROVED/REJECTED
// Transaction Status: UNPAID → PROCESSING → PAID/FAILED

// Example webhook payload:
{
  "type": "KYC_COMPLETED",
  "data": {
    "attempt": {
      "id": "kyc123",
      "status": "COMPLETED", 
      "result": "APPROVED"
    }
  }
}
```

## 🔒 Security Features

### Token Encryption
- Avenia access tokens are encrypted using AES encryption
- Encryption key should be 32 characters and stored securely
- Tokens are automatically decrypted when making API calls

### Webhook Verification
- Webhooks are processed securely
- Each webhook updates the database with real-time status
- Failed webhooks are logged for debugging

### User Data Protection
- Personal information is stored securely in MongoDB
- Sensitive data like CPF is encrypted
- LGPD compliance considerations are built-in

## 🐛 Debugging & Troubleshooting

### Common Issues

**1. MongoDB Connection Issues**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"

# Or check your Atlas connection string
```

**2. Webhook Not Receiving Events**
- Verify ngrok is running for development
- Check Avenia webhook configuration
- Look at webhook logs in console

**3. KYC Flow Issues**
- Ensure popup blockers are disabled
- Check that `/kyc/success` page is accessible
- Verify webhook endpoint is receiving KYC events

### Logs to Check
```bash
# Development server logs
npm run dev

# Check MongoDB operations
# Look for "KYC webhook processed" or "Transaction webhook processed"

# Check API responses in browser network tab
```

## 📊 Database Schema

### Collections Created
- `users` - User accounts with Avenia integration
- `kycattempts` - KYC verification attempts
- `transactions` - PIX payments and conversions
- `subaccounts` - User subaccounts for organization

### Key Indexes
- Email uniqueness on users
- KYC attempt ID for quick lookups
- Transaction status for filtering
- User ID for all user-related queries

## 🚀 Production Deployment

### Environment Variables for Production
```bash
# Use production Avenia API
AVENIA_API_BASE_URL=https://api.avenia.io:10952

# Use production MongoDB Atlas
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster.mongodb.net/rendex

# Generate secure encryption key
AVENIA_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Use production webhook URL
# Configure in Avenia dashboard: https://yourdomain.com/api/avenia/webhooks
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] MongoDB production database set up
- [ ] Avenia webhooks pointing to production URL
- [ ] SSL certificate installed (required for webhooks)
- [ ] Error monitoring set up (Sentry, LogRocket, etc.)
- [ ] KYC success page accessible
- [ ] Test complete user flow in production

## 📞 Support

If you encounter any issues:

1. Check the logs for specific error messages
2. Verify all environment variables are set correctly
3. Test API endpoints individually using curl or Postman
4. Check Avenia API documentation for any updates
5. Review webhook payload in the console logs

The integration is designed to be robust and handle edge cases, but please monitor the webhook endpoints and user flows carefully in production.