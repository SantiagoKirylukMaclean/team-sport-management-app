/**
 * Enhanced error handling utilities for the invitation system
 * Provides consistent error messages and user feedback
 */

export interface InvitationError {
  message: string
  details?: string
  code?: string
  isRetryable: boolean
  userAction?: string
}

/**
 * Maps service errors to user-friendly invitation errors
 */
export function mapInvitationError(error: any): InvitationError {
  if (!error) {
    return {
      message: 'An unknown error occurred',
      isRetryable: true,
      userAction: 'Please try again'
    }
  }

  const errorMessage = error.message || error.toString()
  const errorCode = error.code || 'UNKNOWN_ERROR'
  const errorDetails = error.details || ''

  // Authentication and authorization errors
  if (errorCode === 'AUTH_ERROR' || errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
    return {
      message: 'Authentication required',
      details: 'Please log in again to continue',
      code: errorCode,
      isRetryable: false,
      userAction: 'Log in again'
    }
  }

  if (errorCode === 'UNAUTHORIZED_ERROR' || errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
    return {
      message: 'Insufficient permissions',
      details: 'You do not have permission to create invitations. Please contact your administrator.',
      code: errorCode,
      isRetryable: false,
      userAction: 'Contact administrator'
    }
  }

  // Network and connectivity errors
  if (errorCode === 'NETWORK_ERROR' || errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      message: 'Network connection error',
      details: 'Please check your internet connection and try again.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Check connection and retry'
    }
  }

  if (errorCode === 'TIMEOUT_ERROR' || errorMessage.includes('timeout')) {
    return {
      message: 'Request timed out',
      details: 'The server took too long to respond. This may be due to high server load.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Wait a moment and try again'
    }
  }

  // Validation errors - specific errors first
  if (errorCode === 'EMAIL_ERROR' || errorMessage.includes('email')) {
    return {
      message: 'Email address issue',
      details: 'Please verify the email address is correct and the user does not already exist.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Check email address'
    }
  }

  if (errorCode === 'VALIDATION_ERROR' || errorMessage.includes('validation')) {
    return {
      message: 'Invalid data provided',
      details: 'Please check all form fields and ensure they are filled correctly.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Check form data and retry'
    }
  }

  if (errorCode === 'TEAM_ERROR' || errorMessage.includes('team')) {
    return {
      message: 'Team selection issue',
      details: 'One or more selected teams may no longer exist or be accessible.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Refresh page and reselect teams'
    }
  }

  if (errorCode === 'ROLE_ERROR' || errorMessage.includes('role')) {
    return {
      message: 'Invalid role selection',
      details: 'The selected role is not valid for invitations.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Select a valid role'
    }
  }

  // Server and system errors
  if (errorCode === 'EDGE_FUNCTION_ERROR' || errorMessage.includes('function')) {
    return {
      message: 'Server processing error',
      details: 'There was an issue processing your request on the server.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Try again in a few moments'
    }
  }

  if (errorCode === 'DATABASE_ERROR' || errorMessage.includes('database')) {
    return {
      message: 'Database error',
      details: 'There was an issue saving the invitation data.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Try again later'
    }
  }

  // Parse and data errors
  if (errorCode === 'PARSE_ERROR' || errorMessage.includes('JSON') || errorMessage.includes('parse')) {
    return {
      message: 'Data processing error',
      details: 'There was an issue processing the server response.',
      code: errorCode,
      isRetryable: true,
      userAction: 'Refresh page and try again'
    }
  }

  // Default fallback
  return {
    message: 'Invitation creation failed',
    details: errorDetails || errorMessage || 'An unexpected error occurred while creating the invitation.',
    code: errorCode,
    isRetryable: true,
    userAction: 'Try again or contact support if the problem persists'
  }
}

/**
 * Determines if an error should allow retry based on attempt count and error type
 */
export function shouldRetryInvitation(error: InvitationError, attemptCount: number): boolean {
  if (!error.isRetryable) {
    return false
  }

  // Limit retries based on error type
  const maxRetries = getMaxRetries(error.code)
  return attemptCount < maxRetries
}

/**
 * Gets maximum retry attempts based on error type
 */
function getMaxRetries(errorCode?: string): number {
  switch (errorCode) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT_ERROR':
      return 3
    case 'VALIDATION_ERROR':
    case 'EMAIL_ERROR':
    case 'TEAM_ERROR':
    case 'ROLE_ERROR':
      return 2
    case 'EDGE_FUNCTION_ERROR':
    case 'DATABASE_ERROR':
      return 2
    default:
      return 3
  }
}

/**
 * Generates user-friendly error messages for toast notifications
 */
export function getErrorToastMessage(error: InvitationError, attemptCount: number = 1): {
  title: string
  description: string
  variant: 'destructive' | 'default'
} {
  const canRetry = shouldRetryInvitation(error, attemptCount)
  const retryText = canRetry ? ' You can try again.' : ''
  
  return {
    title: `❌ ${error.message}`,
    description: `${error.details || error.message}${retryText}`,
    variant: 'destructive'
  }
}

/**
 * Generates success toast messages for invitation creation
 */
export function getSuccessToastMessage(email: string, role: string): {
  title: string
  description: string
  variant: 'default'
} {
  return {
    title: '✅ Invitation created successfully',
    description: `Invitation link generated for ${email} with ${role} role. The link is ready to share.`,
    variant: 'default'
  }
}

/**
 * Generates loading toast messages for invitation operations
 */
export function getLoadingToastMessage(operation: 'create' | 'cancel' | 'load'): {
  title: string
  description: string
} {
  switch (operation) {
    case 'create':
      return {
        title: 'Creating invitation...',
        description: 'Please wait while we generate the invitation link.'
      }
    case 'cancel':
      return {
        title: 'Cancelling invitation...',
        description: 'Please wait while we cancel the invitation.'
      }
    case 'load':
      return {
        title: 'Loading invitations...',
        description: 'Please wait while we fetch the invitation data.'
      }
    default:
      return {
        title: 'Processing...',
        description: 'Please wait while we process your request.'
      }
  }
}