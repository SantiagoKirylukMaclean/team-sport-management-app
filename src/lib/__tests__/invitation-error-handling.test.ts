import { describe, it, expect } from 'vitest'
import {
  mapInvitationError,
  shouldRetryInvitation,
  getErrorToastMessage,
  getSuccessToastMessage,
  getLoadingToastMessage
} from '../invitation-error-handling'

describe('Invitation Error Handling', () => {
  describe('mapInvitationError', () => {
    it('should map authentication errors correctly', () => {
      const error = { message: 'unauthorized', code: 'AUTH_ERROR' }
      const result = mapInvitationError(error)
      
      expect(result.message).toBe('Authentication required')
      expect(result.isRetryable).toBe(false)
      expect(result.userAction).toBe('Log in again')
    })

    it('should map network errors correctly', () => {
      const error = { message: 'network error', code: 'NETWORK_ERROR' }
      const result = mapInvitationError(error)
      
      expect(result.message).toBe('Network connection error')
      expect(result.isRetryable).toBe(true)
      expect(result.userAction).toBe('Check connection and retry')
    })

    it('should map email validation errors correctly', () => {
      const error = { message: 'email validation failed', code: 'EMAIL_ERROR' }
      const result = mapInvitationError(error)
      
      expect(result.message).toBe('Email address issue')
      expect(result.isRetryable).toBe(true)
      expect(result.userAction).toBe('Check email address')
    })

    it('should map general validation errors correctly', () => {
      const error = { message: 'validation failed', code: 'VALIDATION_ERROR' }
      const result = mapInvitationError(error)
      
      expect(result.message).toBe('Invalid data provided')
      expect(result.isRetryable).toBe(true)
      expect(result.userAction).toBe('Check form data and retry')
    })

    it('should handle unknown errors with fallback', () => {
      const error = { message: 'some unknown error' }
      const result = mapInvitationError(error)
      
      expect(result.message).toBe('Invitation creation failed')
      expect(result.isRetryable).toBe(true)
      expect(result.userAction).toBe('Try again or contact support if the problem persists')
    })
  })

  describe('shouldRetryInvitation', () => {
    it('should not allow retry for non-retryable errors', () => {
      const error = { message: 'Auth error', isRetryable: false }
      const result = shouldRetryInvitation(error, 1)
      
      expect(result).toBe(false)
    })

    it('should allow retry for retryable errors within limit', () => {
      const error = { message: 'Network error', isRetryable: true, code: 'NETWORK_ERROR' }
      const result = shouldRetryInvitation(error, 2)
      
      expect(result).toBe(true)
    })

    it('should not allow retry when attempt count exceeds limit', () => {
      const error = { message: 'Network error', isRetryable: true, code: 'NETWORK_ERROR' }
      const result = shouldRetryInvitation(error, 5)
      
      expect(result).toBe(false)
    })
  })

  describe('getErrorToastMessage', () => {
    it('should generate error toast with retry information', () => {
      const error = { message: 'Network error', details: 'Connection failed', isRetryable: true, code: 'NETWORK_ERROR' }
      const result = getErrorToastMessage(error, 1)
      
      expect(result.title).toBe('❌ Network error')
      expect(result.description).toContain('Connection failed')
      expect(result.description).toContain('You can try again')
      expect(result.variant).toBe('destructive')
    })

    it('should generate error toast without retry for non-retryable errors', () => {
      const error = { message: 'Auth error', details: 'Not authorized', isRetryable: false }
      const result = getErrorToastMessage(error, 1)
      
      expect(result.title).toBe('❌ Auth error')
      expect(result.description).not.toContain('You can try again')
    })
  })

  describe('getSuccessToastMessage', () => {
    it('should generate success toast message', () => {
      const result = getSuccessToastMessage('test@example.com', 'coach')
      
      expect(result.title).toBe('✅ Invitation created successfully')
      expect(result.description).toContain('test@example.com')
      expect(result.description).toContain('coach')
      expect(result.variant).toBe('default')
    })
  })

  describe('getLoadingToastMessage', () => {
    it('should generate loading toast for create operation', () => {
      const result = getLoadingToastMessage('create')
      
      expect(result.title).toBe('Creating invitation...')
      expect(result.description).toContain('generate the invitation link')
    })

    it('should generate loading toast for cancel operation', () => {
      const result = getLoadingToastMessage('cancel')
      
      expect(result.title).toBe('Cancelling invitation...')
      expect(result.description).toContain('cancel the invitation')
    })
  })
})