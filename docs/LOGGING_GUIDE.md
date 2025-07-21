# RendeX Avenia Integration - Comprehensive Logging Guide

This document outlines all the logging implemented throughout the Avenia integration to help you monitor user activities and system behavior in real-time.

## 📊 Log Structure

All logs follow a consistent format:
```
[Component/Layer] RequestID/UserID - Message with context
```

### Log Prefixes
- `[MongoDB]` - Database connection and operations
- `[AveniaClient]` - Direct API calls to Avenia
- `[AveniaService]` - Business logic layer
- `[API:*]` - Next.js API route handlers
- `[useAvenia]` - Frontend React hooks
- `[Component]` - UI component interactions

## 🔍 Monitoring User Journeys

### 1. User Authentication Flow

**Login Initiation:**
```bash
[useAvenia] Starting login process for: user@example.com
[API:Login] login-123456789-abc123 - Starting login request
[API:Login] login-123456789-abc123 - Received login request for email: user@example.com
[AveniaService] Starting authentication process for user: user@example.com
[AveniaClient] Initiating login for email: user@example.com
[AveniaClient] POST /v2/auth/login
[AveniaClient] Login initiated successfully, email token sent to: user@example.com
[MongoDB] Looking up user in database: user@example.com
[MongoDB] Creating new user record for: user@example.com  # If new user
[API:Login] login-123456789-abc123 - Login successful for: user@example.com (1250ms)
```

**Token Validation:**
```bash
[useAvenia] Starting login validation for: user@example.com with token: 123456
[API:ValidateLogin] validate-123456789-def456 - Starting login validation request
[AveniaClient] Validating login for email: user@example.com with token: 123456
[AveniaClient] Login validation successful, received tokens for: user@example.com
[AveniaService] Encrypting and storing tokens for user: 507f1f77bcf86cd799439011
[API:ValidateLogin] validate-123456789-def456 - Validation successful for user: 507f1f77bcf86cd799439011 (850ms)
[AveniaIntegration] Login successful, saving user data
```

### 2. KYC Verification Flow

**KYC Initiation:**
```bash
[KYCFlow] Starting KYC process for user: 507f1f77bcf86cd799439011
[useAvenia] Initiating KYC for user: 507f1f77bcf86cd799439011
[API:KYCInitiate] kyc-init-123456789-ghi789 - Starting KYC initiation request
[AveniaService] Initiating KYC for user: 507f1f77bcf86cd799439011
[AveniaClient] Initiating KYC Web SDK for main account
[AveniaClient] KYC Web SDK initiated successfully, URL: https://in.sumsub.com/websdk/...
[AveniaService] KYC attempt record created with ID: 507f1f77bcf86cd799439012
[KYCFlow] KYC URL received: https://in.sumsub.com/websdk/...
[KYCFlow] Opening KYC window for user: 507f1f77bcf86cd799439011
[KYCFlow] KYC window opened successfully for user: 507f1f77bcf86cd799439011
```

**KYC Webhook Processing:**
```bash
[API:Webhook] webhook-123456789-jkl012 - Received webhook request
[API:Webhook] webhook-123456789-jkl012 - Webhook type: KYC_COMPLETED
[AveniaService] Received KYC webhook: {"type":"KYC_COMPLETED","data":{"attempt":{"id":"kyc123","status":"COMPLETED","result":"APPROVED"}}}
[AveniaService] Processing KYC webhook for attempt ID: kyc123
[AveniaService] Found KYC attempt: 507f1f77bcf86cd799439012 for user: 507f1f77bcf86cd799439011
[AveniaService] KYC attempt updated - Status: pending → completed, Result:  → approved
[AveniaService] KYC APPROVED for user: 507f1f77bcf86cd799439011 (user@example.com)
[AveniaService] User KYC status updated: in_progress → completed for user: 507f1f77bcf86cd799439011
```

### 3. PIX Payment Flow

**Payment Creation:**
```bash
[useAvenia] Creating PIX payment for user: 507f1f77bcf86cd799439011, amount: 100 BRLA
[API:PixPayment] pix-pay-123456789-mno345 - PIX payment request for user: 507f1f77bcf86cd799439011
[AveniaService] Creating PIX payment for user: 507f1f77bcf86cd799439011, amount: 100 BRLA
[AveniaClient] Getting PIX to BRLA quote for amount: 100 BRLA
[AveniaClient] PIX quote received - Input: 102.50 BRL, Output: 100 BRLA, Rate: 0.975
[AveniaClient] Creating ticket with beneficiary wallet: 00000000-0000-0000-0000-000000000000
[AveniaClient] Ticket created successfully - ID: ticket123, PIX code generated
[AveniaService] Transaction record saved with ID: 507f1f77bcf86cd799439013
[useAvenia] PIX payment created successfully for user: 507f1f77bcf86cd799439011, ticket: ticket123
```

**Payment Webhook Processing:**
```bash
[API:Webhook] webhook-123456789-pqr678 - Received webhook request
[API:Webhook] webhook-123456789-pqr678 - Webhook type: TICKET_PAID
[AveniaService] Processing transaction webhook for ticket ID: ticket123
[AveniaService] Transaction status updated: unpaid → paid for ticket: ticket123
[AveniaIntegration] PIX payment completed successfully for user: 507f1f77bcf86cd799439011
```

### 4. Balance and Currency Operations

**Balance Fetching:**
```bash
[useAvenia] Fetching balances for user: 507f1f77bcf86cd799439011
[AveniaClient] Fetching account balances
[AveniaClient] Balances retrieved: {BRLA: "150.00", USDC: "0", USDT: "50.25", USDM: "0"}
[BalanceCard] Balances loaded for user: 507f1f77bcf86cd799439011
```

**Currency Conversion:**
```bash
[AveniaIntegration] Conversion requested: BRLA to USDC for user: 507f1f77bcf86cd799439011
[useAvenia] Converting BRLA to USDC for user: 507f1f77bcf86cd799439011, amount: 50
[AveniaClient] Getting BRLA to USDC quote for amount: 50 USDC
[AveniaClient] Conversion quote received - Input: 287.50 BRLA, Output: 50 USDC, Rate: 5.75
```

## 🚨 Error Monitoring

### Common Error Patterns

**Authentication Errors:**
```bash
[API:Login] login-123456789-abc123 - Login failed after 2150ms: Invalid credentials
[AveniaService] Authentication failed for user: user@example.com
[useAvenia] Login error for user@example.com: Invalid credentials
```

**Token Expiration:**
```bash
[AveniaService] Tokens expired for user: 507f1f77bcf86cd799439011 (expired: 2024-01-15T10:30:00.000Z)
[useAvenia] Token validation failed: Avenia tokens expired. Please re-authenticate.
```

**KYC Errors:**
```bash
[AveniaService] KYC REJECTED for user: 507f1f77bcf86cd799439011 (user@example.com)
[KYCFlow] KYC initiation failed for user 507f1f77bcf86cd799439011: Failed to create KYC session
```

**API Rate Limiting:**
```bash
[AveniaClient] API error (429): Rate limit exceeded
[API:PixPayment] pix-pay-123456789-mno345 - PIX payment failed after 5000ms: Rate limit exceeded
```

**Database Connection Issues:**
```bash
[MongoDB] Connection failed: connection timed out
[API:Login] login-123456789-abc123 - Login failed after 10000ms: Database connection failed
```

## 📈 Performance Monitoring

### Response Time Tracking

All API calls include timing information:
```bash
[API:Login] login-123456789-abc123 - Login successful for: user@example.com (1250ms)
[API:ValidateLogin] validate-123456789-def456 - Validation successful (850ms)
[API:KYCInitiate] kyc-init-123456789-ghi789 - KYC initiated successfully (2100ms)
[API:PixPayment] pix-pay-123456789-mno345 - PIX payment created (1800ms)
```

### Database Operation Monitoring

```bash
[MongoDB] Attempting to connect to database...
[MongoDB] Using existing cached connection
[MongoDB] Successfully connected to database
[MongoDB] Database connection established and cached
```

## 🔧 Development & Debugging

### Environment Logging

```bash
[AveniaService] Initializing Avenia service...
[AveniaService] WARNING: Using default encryption key. Please set AVENIA_ENCRYPTION_KEY in production!
[MongoDB] Creating new connection to: mongodb://***:***@cluster.mongodb.net/rendex
```

### Request/Response Logging

**Avenia API Calls:**
```bash
[AveniaClient] POST /v2/auth/login
[AveniaClient] Full URL: https://api.sandbox.avenia.io:10952/v2/auth/login
[AveniaClient] Request body: {"email":"user@example.com","password":"***"}
[AveniaClient] Response status: 200 (1250ms)
[AveniaClient] Response data: {"success":true}
```

**Webhook Processing:**
```bash
[API:Webhook] webhook-123456789-jkl012 - Webhook payload received: {
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

## 🎯 Key Metrics to Monitor

### User Activity Metrics
- Login attempts and success rates
- KYC initiation and completion rates
- PIX payment volumes and success rates
- Currency conversion activity

### System Health Metrics
- API response times
- Database connection health
- Webhook processing success rates
- Error rates by component

### Business Intelligence
- New user registrations
- KYC approval/rejection rates
- Transaction volumes by currency
- User retention through the funnel

## 🛠️ Log Analysis Commands

### Finding User Activity
```bash
# All activity for a specific user
grep "507f1f77bcf86cd799439011" application.log

# All login attempts
grep "\[API:Login\]" application.log

# All webhook processing
grep "\[API:Webhook\]" application.log

# All errors
grep "error\|Error\|failed\|Failed" application.log
```

### Performance Analysis
```bash
# Slow API calls (>2000ms)
grep -E "\([0-9]{4,}ms\)" application.log

# Database connection issues
grep "\[MongoDB\].*failed\|error" application.log

# Avenia API errors
grep "\[AveniaClient\].*error" application.log
```

### User Journey Tracking
```bash
# Complete user journey for specific email
grep "user@example.com" application.log | sort

# KYC completion tracking
grep "KYC.*APPROVED\|REJECTED" application.log

# PIX payment tracking
grep "PIX payment.*successful\|failed" application.log
```

## 🚀 Production Monitoring Setup

### Recommended Log Aggregation
1. **Use structured logging** with JSON format in production
2. **Implement log aggregation** (ELK stack, Datadog, New Relic)
3. **Set up alerts** for critical errors and performance issues
4. **Create dashboards** for key metrics and user flows

### Sample Alert Conditions
- KYC rejection rate > 20%
- API response time > 5 seconds
- Authentication failure rate > 10%
- Database connection failures
- Webhook processing failures

This comprehensive logging system provides complete visibility into every user interaction and system operation, making it easy to monitor, debug, and optimize the Avenia integration.