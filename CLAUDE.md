# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Brazilian Fintech Mobile Application** called **RendeX** built with React Native/Flutter and focused on digital banking and investment services. The app features Brazilian Real (R$) transactions, PIX payments, investment products, and comprehensive account security features.

## Key Features Observed

### Authentication & Security
- **Face ID Authentication**: Biometric login with facial recognition
- **Custom PIN Creation**: 4-digit PIN setup for account security
- **Multi-layered Security**: Face ID recommended, with PIN as alternative
- **Account Verification**: KYC (Know Your Customer) process implementation

### Core Banking Features
- **PIX Integration**: Brazil's instant payment system
- **QR Code Payments**: Generate and scan QR codes for transactions
- **Withdrawals**: Cash withdrawal functionality with CPF verification
- **Balance Management**: Real-time balance tracking with percentage growth indicators
- **Investment Platform**: "PIX INVEST" feature for investment products

### User Experience
- **Onboarding Flow**: Multi-step account setup process
- **Notification System**: Account activity tracking and feature updates
- **Gamification**: Streak tracking and earnings visualization
- **Responsive Design**: Mobile-first interface with cloud-themed UI

### Payment & Transaction Features
- **Amount Input**: Flexible transaction amount entry
- **CPF Integration**: Brazilian tax ID verification for transactions
- **Transaction Confirmation**: Multi-step payment confirmation process
- **Real-time Processing**: Instant payment confirmations

## Technical Architecture

### Mobile Development
- **Cross-platform Framework**: React Native or Flutter implementation
- **Brazilian Localization**: Portuguese language support, R$ currency formatting
- **PIX SDK Integration**: Official PIX payment system integration
- **Biometric APIs**: Face ID and fingerprint authentication
- **QR Code Libraries**: Camera integration for payment scanning

### Security Implementation
- **Biometric Authentication**: Platform-specific Face ID/Touch ID APIs
- **PIN Encryption**: Secure PIN storage and validation
- **Session Management**: Secure token-based authentication
- **Data Protection**: Encrypted storage for sensitive financial data

### Financial Services Integration
- **PIX Network**: Central Bank of Brazil instant payment integration
- **Banking APIs**: Traditional banking service connections
- **Investment Platform**: Securities and fund management integration
- **Regulatory Compliance**: Brazilian financial regulation adherence

## UI/UX Design Patterns

### Visual Identity
- **Flying Pig Mascot**: Cute pink pig with wings as brand character
- **Cloud Theme**: Light blue backgrounds with cloud imagery
- **Lighthouse Imagery**: Success states featuring lighthouse illustrations
- **Modern Card Design**: Clean, rounded interface elements

### Color Scheme
- **Primary Blue**: #4A90E2 (buttons and primary actions)
- **Light Blue**: #87CEEB (backgrounds and secondary elements)
- **Success Green**: #32CD32 (positive indicators and confirmations)
- **White/Light Gray**: Clean backgrounds and card surfaces

### Interactive Elements
- **Floating Action Buttons**: Primary CTAs with rounded corners
- **Progress Indicators**: Loading states and process completion
- **Modal Overlays**: Transaction confirmations and security prompts
- **Tab Navigation**: Bottom navigation for main app sections

## Development Commands

### Core Development
- `npm run dev` or `yarn dev` - Start development server
- `npm run build` or `yarn build` - Create production build
- `npm run start` or `yarn start` - Start production server
- `npm run test` - Run test suite

### Mobile Development
- `npx react-native run-android` - Run on Android device/emulator
- `npx react-native run-ios` - Run on iOS device/simulator
- `npm run android` - Android development build
- `npm run ios` - iOS development build

## Environment Configuration

### Required Variables
- `PIX_API_KEY`: Brazilian PIX integration credentials
- `CENTRAL_BANK_API_URL`: Central Bank of Brazil API endpoint
- `ENCRYPTION_KEY`: Data encryption for sensitive information
- `BIOMETRIC_CONFIG`: Face ID/Touch ID configuration

### Brazilian Market Variables
- `CPF_VALIDATION_SERVICE`: Brazilian tax ID verification
- `BACEN_INTEGRATION`: Central Bank integration settings
- `FEBRABAN_COMPLIANCE`: Banking federation compliance settings
- `REAL_CURRENCY_API`: Brazilian Real exchange rate services

## Regulatory Compliance

### Brazilian Financial Regulations
- **LGPD Compliance**: Brazilian General Data Protection Law
- **Central Bank Regulations**: Monetary authority requirements
- **PIX Regulations**: Instant payment system compliance
- **Anti-Money Laundering**: AML/KYC implementation requirements

### Security Standards
- **PCI DSS**: Payment card industry data security
- **ISO 27001**: Information security management
- **OWASP Mobile**: Mobile application security guidelines
- **Biometric Standards**: FIDO Alliance authentication standards

## Testing in Production

### Mobile Testing
1. **Device Testing**: iOS and Android compatibility
2. **PIX Integration**: Test with Brazilian banking partners
3. **Biometric Testing**: Face ID/Touch ID functionality verification
4. **Network Testing**: Offline capability and sync

### Financial Testing
1. **Transaction Testing**: Small amount PIX transfers
2. **Security Testing**: Penetration testing for financial data
3. **Compliance Testing**: Regulatory requirement verification
4. **Load Testing**: High-volume transaction processing

## Package Management

This project likely uses **npm** or **yarn** for dependency management, with specific focus on:
- Brazilian payment integrations
- Biometric authentication libraries  
- Mobile-specific financial security packages
- React Native/Flutter ecosystem dependencies