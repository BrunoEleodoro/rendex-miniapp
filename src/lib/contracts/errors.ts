/**
 * Contract operation error types and utilities
 */

export class ContractError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'ContractError'
  }
}

export const CONTRACT_ERRORS = {
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  EVM_WALLET_REQUIRED: 'EVM_WALLET_REQUIRED',
  NETWORK_SWITCH_FAILED: 'NETWORK_SWITCH_FAILED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export function createContractError(code: keyof typeof CONTRACT_ERRORS, message: string, cause?: Error): ContractError {
  return new ContractError(message, CONTRACT_ERRORS[code], cause)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ContractError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
} 