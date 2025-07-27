# RendeX - Brazilian Fintech Mini App 🐷💰

<div align="center">
  <img src="public/images/flying-pig.png" alt="RendeX Flying Pig Mascot" width="200"/>
  
  <p><em>"With the wind at your back, your earnings go beyond borders"</em></p>
  
  ![Next.js](https://img.shields.io/badge/Next.js-14-black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
  ![Farcaster](https://img.shields.io/badge/Farcaster-Mini%20App-purple)
  ![Polygon](https://img.shields.io/badge/Polygon-Network-8247E5)
  ![PIX](https://img.shields.io/badge/PIX-Brazilian%20Payment-green)
</div>

## 🚀 Project Overview

RendeX is a Brazilian fintech mini-application built on Farcaster that enables:
- **PIX to BRLA conversions** using Avenia's payment infrastructure
- **BRLA token staking** with yield-bearing stBRLA rewards
- **Cross-border DeFi** features for Brazilian users
- **Farcaster social integration** with seamless wallet connectivity

### Key Features
- 🏦 **PIX Integration**: Brazil's instant payment system for BRLA deposits
- 🔒 **BRLA Staking**: Earn rewards by staking BRLA tokens for stBRLA
- 🌐 **Farcaster Native**: Built as a Farcaster mini-app with social features
- 💳 **Multi-Wallet Support**: Wagmi integration with various wallet providers
- 📱 **Mobile-First Design**: Responsive UI optimized for mobile devices

## 📸 Screenshots & UI Gallery

<div align="center">
  <img src="public/images/cloud-bg.png" alt="Cloud Background Theme" width="100"/>
  <img src="public/images/lighthouse-bg.png" alt="Success Lighthouse" width="100"/>
  <img src="public/images/brazil-flag.png" alt="Brazil Flag" width="100"/>
  <img src="public/images/coins-bg.png" alt="Coins Background" width="100"/>
</div>

## 🛠 Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Authentication**: Farcaster SDK + Neynar integration
- **Blockchain**: Polygon network with Wagmi/Viem
- **Payments**: Avenia API for PIX integration
- **UI**: Tailwind CSS with Framer Motion animations
- **State**: React hooks with real-time updates via SSE

## 📋 User Flows & Step-by-Step Documentation

### 🔐 Account Creation Flow

#### New User Journey (No Existing Account)

1. **Welcome Screen** (`/welcome`)
   - Load Farcaster SDK: `sdk.isLoaded`
   - Check authentication status: `useQuickAuth()`
   - Display flying pig mascot with cloud background

2. **Farcaster Authentication**
   - Execute: `FarcasterSignIn.tsx` component
   - Call: `authenticateUser()` from `useQuickAuth`
   - Fetch user data: `GET /api/users?fids=${fid}`

3. **Wallet Connection**
   - Alternative path: `WalletConnect.tsx` for non-Farcaster users
   - Execute: `useAccount()` from Wagmi
   - Create subaccount: `POST /api/avenia/subaccounts/create`

4. **Account Creation**
   ```typescript
   // Function calls in order:
   const handleCreateAccount = async () => {
     // 1. Get Farcaster user data
     const neynarUser = await fetch(`/api/users?fids=${fid}`)
     
     // 2. Create user object
     const farcasterUser = {
       id: `farcaster_${fid}`,
       email: `${username}@farcaster.xyz`,
       walletAddress: connectedWalletAddress,
       subaccountId: username,
       kycStatus: 'not_started'
     }
     
     // 3. Save to localStorage
     localStorage.setItem('rendex_user', JSON.stringify(farcasterUser))
     
     // 4. Sync with backend
     await fetch('/api/farcaster/connect', {
       method: 'POST',
       body: JSON.stringify(userdata)
     })
     
     // 5. Redirect to dashboard
     router.push('/dashboard')
   }
   ```

### 💳 PIX Deposit Flow (PIX → BRLA)

#### Step-by-Step PIX to BRLA Conversion

1. **Initiate Deposit** (`dashboard-screen.tsx:141`)
   ```typescript
   const handleInvest = () => {
     setShowPixModal(true) // Open PIXPaymentModal
   }
   ```

2. **Amount Input** (`PIXPaymentModal.tsx:104`)
   ```typescript
   const handleCreatePayment = async (e) => {
     // 1. Validate amount
     const amountNum = getNumericAmount()
     
     // 2. Create PIX payment
     const payment = await createPixPayment(userId, amountNum, walletAddress)
     
     // 3. Set payment details
     setBrCode(payment.brCode)
     setTicketId(payment.ticketId)
     setStep('payment')
   }
   ```

3. **Avenia API Integration** (`useAvenia.ts`)
   ```typescript
   const createPixPayment = async (userId, amount, walletAddress) => {
     // Function calls in order:
     
     // 1. Create PIX payment request
     const response = await fetch('/api/avenia/pix/deposit', {
       method: 'POST',
       body: JSON.stringify({
         userId,
         amount,
         walletAddress // Optional for external transfers
       })
     })
     
     // 2. Generate QR Code
     await QRCode.toDataURL(payment.brCode)
     
     // 3. Set up real-time webhook listener
     useRealTimeUpdates({
       userId,
       onPaymentUpdate: (update) => {
         if (update.type === 'payment_completed') {
           setStep('success')
         }
       }
     })
     
     return payment
   }
   ```

4. **Payment Processing** (Backend: `/api/avenia/pix/deposit/route.ts`)
   ```typescript
   // Backend processing flow:
   
   // 1. Authenticate with Avenia
   const headers = generateAveniaHeaders(method, uri, body)
   
   // 2. Create PIX payment
   const pixResponse = await aveniaClient.createPixPayment({
     subaccountId: userId,
     amount: amount,
     externalWalletAddress: walletAddress // For direct wallet transfers
   })
   
   // 3. Store transaction record
   await Transaction.create({
     userId,
     ticketId: pixResponse.ticketId,
     amount,
     status: 'pending',
     type: 'pix_deposit'
   })
   
   // 4. Return payment details
   return {
     brCode: pixResponse.brCode,
     ticketId: pixResponse.ticketId,
     expiration: pixResponse.expiration
   }
   ```

5. **Real-time Payment Completion** (Webhook: `/api/avenia/webhooks/route.ts`)
   ```typescript
   // Webhook receives payment confirmation from Avenia
   
   // 1. Verify webhook signature
   const isValid = verifyAveniaWebhook(signature, body)
   
   // 2. Update transaction status
   await Transaction.updateOne(
     { ticketId: webhook.ticketId },
     { status: 'completed', completedAt: new Date() }
   )
   
   // 3. Send real-time update to frontend
   sendSSEUpdate(userId, {
     type: 'payment_completed',
     message: 'PIX payment processed successfully!',
     data: { ticketId: webhook.ticketId }
   })
   ```

### 🔒 BRLA Staking Flow (BRLA → stBRLA)

#### Step-by-Step Staking Process

1. **Open Staking Modal** (`dashboard-screen.tsx:424`)
   ```typescript
   const handleStakeClick = () => {
     setShowStakingModal(true) // Open StakingModal
   }
   ```

2. **Amount Input & Validation** (`StakingModal.tsx:71`)
   ```typescript
   const handleAmountChange = (value) => {
     setAmount(value)
     
     // Validation checks:
     const numAmount = parseFloat(value)
     const maxBalance = parseFloat(brlaBalance)
     
     if (numAmount > maxBalance) {
       setError(`Insufficient BRLA balance. Maximum: ${brlaBalance}`)
     }
   }
   ```

3. **Check Approval Status** (`StakingModal.tsx:158`)
   ```typescript
   const handleContinue = () => {
     // Check if BRLA is approved for staking contract
     if (hasInfiniteApproval) {
       setStep('stake') // Skip approval
     } else {
       setStep('approve') // Need approval first
     }
   }
   ```

4. **BRLA Token Approval** (If needed - `StakingModal.tsx:91`)
   ```typescript
   const handleApprove = async () => {
     setStep('approving')
     
     try {
       // Contract call: approve unlimited BRLA for staking
       await approveInfinite() // Calls BRLA.approve(stakingContract, MAX_UINT256)
       
       // After approval transaction confirms:
       setStep('stake')
       refetchAllowance()
     } catch (error) {
       setError('Approval failed. Please try again.')
       setStep('approve')
     }
   }
   ```

5. **Execute Staking** (`StakingModal.tsx:128`)
   ```typescript
   const handleStake = async () => {
     setStep('staking')
     
     try {
       // Contract interaction sequence:
       
       // 1. Call staking contract
       await stake(amount) // Calls StakedBRLA.deposit(amount)
       
       // 2. Transaction flow:
       // - Transfer BRLA from user to staking contract
       // - Mint equivalent stBRLA to user
       // - User receives yield-bearing stBRLA tokens
       
       setStep('success')
     } catch (error) {
       setError('Staking failed. Please try again.')
       setStep('stake')
     }
   }
   ```

6. **Smart Contract Integration** (`lib/contracts/hooks.ts`)
   ```typescript
   // Contract interaction hooks:
   
   export const useStakeBRLA = () => {
     const { writeContractAsync } = useWriteContract()
     
     const stake = async (amount: string) => {
       // 1. Convert amount to Wei
       const amountWei = parseEther(amount)
       
       // 2. Call staking contract
       return await writeContractAsync({
         address: STAKED_BRLA_CONTRACT_ADDRESS,
         abi: stakedBrlaAbi,
         functionName: 'deposit',
         args: [amountWei]
       })
     }
     
     return { stake, isLoading, hash }
   }
   ```

### 🔓 BRLA Unstaking Flow (stBRLA → BRLA)

#### Step-by-Step Unstaking Process

1. **Open Unstaking Modal** (`dashboard-screen.tsx:434`)
   ```typescript
   const handleUnstakeClick = () => {
     setShowUnstakingModal(true) // Open UnstakingModal
   }
   ```

2. **Amount Input & Balance Check** (`UnstakingModal.tsx:69`)
   ```typescript
   const handleAmountChange = (value) => {
     setAmount(value)
     
     // Validate against stBRLA balance
     if (parseFloat(value) > parseFloat(stBrlaBalance || '0')) {
       setError(`Insufficient stBRLA balance. Maximum: ${stBrlaBalance}`)
     }
   }
   ```

3. **Execute Unstaking** (`UnstakingModal.tsx:85`)
   ```typescript
   const handleUnstake = async () => {
     setStep('unstaking')
     
     try {
       // Contract call sequence:
       
       // 1. Call unstaking function
       await unstake(amount) // Calls StakedBRLA.withdraw(amount)
       
       // 2. Transaction flow:
       // - Burn user's stBRLA tokens
       // - Transfer equivalent BRLA + rewards back to user
       // - User receives original BRLA + earned yield
       
       setStep('success')
     } catch (error) {
       setError('Unstaking failed. Please try again.')
       setStep('input')
     }
   }
   ```

4. **Smart Contract Integration** (`lib/contracts/hooks.ts`)
   ```typescript
   export const useUnstakeBRLA = () => {
     const { writeContractAsync } = useWriteContract()
     
     const unstake = async (amount: string) => {
       // 1. Convert amount to Wei
       const amountWei = parseEther(amount)
       
       // 2. Call unstaking contract
       return await writeContractAsync({
         address: STAKED_BRLA_CONTRACT_ADDRESS,
         abi: stakedBrlaAbi,
         functionName: 'withdraw',
         args: [amountWei]
       })
     }
     
     return { unstake, isLoading, hash }
   }
   ```

## ⚙️ Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# Avenia API Configuration (Required)
AVENIA_API_KEY=your_avenia_api_key_here
AVENIA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_private_key_content_here
-----END PRIVATE KEY-----"
AVENIA_API_BASE_URL=https://api.sandbox.avenia.io:10952

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rendex-miniapp

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Farcaster Configuration
NEYNAR_API_KEY=your_neynar_api_key_here

# Polygon/Blockchain Configuration
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🏗 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── avenia/        # Avenia payment integration
│   │   ├── farcaster/     # Farcaster authentication
│   │   └── webhooks/      # Real-time webhook handlers
│   ├── dashboard/         # Dashboard page
│   ├── welcome/          # Welcome/onboarding page
│   └── layout.tsx        # Root layout
├── components/
│   ├── avenia/           # Avenia-specific components
│   │   ├── PIXPaymentModal.tsx    # PIX payment flow
│   │   ├── BalanceCard.tsx        # Balance display
│   │   └── KYCFlow.tsx           # KYC process (paused)
│   ├── staking/          # Staking components
│   │   ├── StakingModal.tsx      # BRLA staking flow
│   │   └── UnstakingModal.tsx    # stBRLA unstaking flow
│   ├── screens/          # Main screen components
│   │   ├── welcome-screen.tsx    # Welcome/onboarding
│   │   └── dashboard-screen.tsx  # Main dashboard
│   └── ui/               # Reusable UI components
├── lib/
│   ├── avenia/           # Avenia API client
│   ├── contracts/        # Smart contract interactions
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## 📚 API Documentation

### Avenia Integration
- **PIX Deposit**: `POST /api/avenia/pix/deposit`
- **Balances**: `GET /api/avenia/balances/[userId]`
- **Subaccount Creation**: `POST /api/avenia/subaccounts/create`
- **Webhooks**: `POST /api/avenia/webhooks`

### Farcaster Integration
- **User Data**: `GET /api/users?fids=${fid}`
- **Connect**: `POST /api/farcaster/connect`

### Smart Contracts (Polygon)
- **BRLA Token**: ERC-20 token contract
- **stBRLA Staking**: Yield-bearing staking contract
- **Contract Addresses**: Defined in `lib/contracts/contracts.ts`

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run tests
npm run lint            # Run ESLint
npm run typecheck       # TypeScript type checking

# Deployment
npm run deploy:vercel   # Deploy to Vercel
```

## 🌐 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy: `npm run deploy:vercel`

### Environment Variables for Production
Ensure all environment variables are configured in your deployment platform:
- Avenia API credentials
- MongoDB connection string
- NextAuth configuration
- Farcaster/Neynar API keys

## 🛡 Security Features

- **Cryptographic Signatures**: All Avenia API requests signed with RSA-SHA256
- **Real-time Webhooks**: Secure webhook verification for payment confirmations
- **Smart Contract Security**: Tested staking contracts with overflow protection
- **Environment Variables**: Sensitive credentials stored securely

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for the Brazilian DeFi ecosystem</p>
  <p>🐷 <em>"Where pigs fly and earnings soar!"</em> 🚀</p>
</div>

