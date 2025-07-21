# RendeX Avenia API Connection Flow

This document explains how the KYC button connects to the Avenia API and the complete user flow.

## 🚀 **User Journey: Welcome to KYC Complete**

### **1. Welcome Screen (`/welcome`)**
```
[Get Started with the KYC] → Opens Avenia Login Modal
```

**What happens:**
- User clicks "Get Started with the KYC" button
- `WelcomeScreen` checks if user is already logged in via `localStorage`
- If not logged in: Opens `AveniaLoginModal`
- If logged in: Navigates directly to `/avenia` page

**Code Location:** `/src/components/screens/welcome-screen.tsx:54`

### **2. Avenia Login Process**
```
Email + Password → Avenia API → Email Token → Access Tokens → User Session
```

**API Calls:**
1. `POST /api/avenia/auth/login` - Send email/password, triggers email token
2. `POST /api/avenia/auth/validate-login` - Validate email token, get access tokens

**What happens:**
- User enters Avenia account credentials
- System sends login request to Avenia API
- Avenia sends email token to user's email
- User enters email token
- System validates token and receives access/refresh tokens
- User session is created and stored in localStorage

**Code Locations:** 
- Modal: `/src/components/avenia/AveniaLoginModal.tsx`
- API Routes: `/src/app/api/avenia/auth/`

### **3. KYC Process (`/avenia`)**
```
KYC Initiation → Avenia Web SDK → Identity Verification → Webhook → Status Update
```

**API Calls:**
1. `POST /api/avenia/kyc/initiate` - Create KYC URL and database record
2. Webhook: `POST /api/avenia/webhooks` - Receive KYC completion status

**What happens:**
- User lands on Avenia integration page
- `KYCFlow` component calls `/api/avenia/kyc/initiate`
- Avenia returns Web SDK URL for identity verification
- User completes KYC in new window/tab
- Avenia sends webhook to update status
- Real-time updates via Server-Sent Events (SSE)

**Code Locations:**
- Component: `/src/components/avenia/KYCFlow.tsx`
- API Routes: `/src/app/api/avenia/kyc/` and `/src/app/api/avenia/webhooks/`

### **4. Dashboard Integration (`/dashboard`)**
```
User Status Check → Conditional Feature Access → Avenia Connection Status
```

**What happens:**
- Dashboard checks user KYC status from localStorage
- Features (Invest/Withdraw) redirect to `/avenia` if KYC not completed
- Avenia connection status card shows current verification state
- Real-time updates when KYC status changes

**Code Location:** `/src/components/screens/dashboard-screen.tsx:26`

## 🔧 **API Integration Points**

### **Authentication Flow**
```typescript
// 1. Login initiation
POST /api/avenia/auth/login
Body: { email: string, password: string }
Response: { message: "Email token sent" }

// 2. Token validation  
POST /api/avenia/auth/validate-login
Body: { email: string, emailToken: string }
Response: { user: User, success: boolean }
```

### **KYC Flow**
```typescript
// 1. KYC initiation
POST /api/avenia/kyc/initiate
Body: { userId: string, subaccountId?: string }
Response: { kycUrl: string, success: boolean }

// 2. Webhook status update
POST /api/avenia/webhooks
Body: { type: "KYC_COMPLETED", data: { attempt: {...} } }
Response: { success: boolean }
```

### **Real-Time Updates**
```typescript
// Server-Sent Events for live status updates
GET /api/avenia/events/[userId]
Response: EventStream with real-time KYC and payment updates
```

## 📊 **Database Integration**

### **User Session Storage**
```typescript
// localStorage key: 'avenia_user'
interface User {
  id: string;
  email: string;
  kycStatus: 'not_started' | 'in_progress' | 'completed' | 'rejected';
}
```

### **MongoDB Collections**
- `users` - User accounts with Avenia tokens
- `kycattempts` - KYC verification attempts and status
- `transactions` - PIX payments and conversions
- `subaccounts` - User subaccounts for organization

## 🎯 **Key Integration Features**

### **1. Automatic Redirects**
- Welcome → Avenia login if not authenticated
- Dashboard features → Avenia if KYC not completed
- Analysis screen → Auto-advance based on KYC status

### **2. Real-Time Status Updates**
- SSE connections for live KYC status changes
- Webhook processing for immediate database updates
- UI components update automatically via `useRealTimeUpdates` hook

### **3. State Persistence**
- User session persisted in localStorage
- URL state management for navigation flow
- Automatic session restoration on page refresh

## 🔍 **Debugging & Monitoring**

### **Console Logs to Monitor**
```bash
# User authentication
[WelcomeScreen] Starting KYC process
[AveniaLoginModal] Login successful

# KYC process  
[KYCFlow] Starting KYC process for user: 123
[KYCFlow] Real-time KYC update received

# API responses
[AveniaService] KYC initiated successfully
[API:Webhook] KYC webhook processed successfully
```

### **Network Requests to Check**
1. **POST** `/api/avenia/auth/login` - Initial login
2. **POST** `/api/avenia/auth/validate-login` - Token validation  
3. **POST** `/api/avenia/kyc/initiate` - KYC start
4. **GET** `/api/avenia/events/[userId]` - SSE connection
5. **POST** `/api/avenia/webhooks` - Status updates

## 🚨 **Common Issues & Solutions**

### **"User not authenticated" Error**
- Check localStorage for 'avenia_user' key
- Verify Avenia API credentials in `.env.local`
- Check token expiration in database

### **KYC Not Starting**
- Verify webhook endpoint is accessible
- Check Avenia dashboard webhook configuration
- Monitor console for API errors

### **Real-time Updates Not Working**
- Check SSE connection in browser Network tab
- Verify Server-Sent Events endpoint responds
- Check webhook processing logs

## 📝 **Environment Setup**

Required environment variables:
```bash
AVENIA_API_BASE_URL=https://api.sandbox.avenia.io:10952
AVENIA_EMAIL=your.email@provider.com
AVENIA_PASSWORD=your-avenia-password
AVENIA_ENCRYPTION_KEY=your-32-character-encryption-key
MONGODB_URI=your-mongodb-connection-string
```

The API connection is now fully integrated and provides a seamless KYC experience from welcome screen to dashboard! 🎉