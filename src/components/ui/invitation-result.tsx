import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Copy, CheckCircle, AlertCircle, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react'

interface InvitationResultProps {
  actionLink?: string
  error?: string
  onClose: () => void
  onRetry?: () => void
}

export function InvitationResult({ actionLink, error, onClose, onRetry }: InvitationResultProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async () => {
    if (!actionLink) return

    try {
      setCopyError(null)
      
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available')
      }

      await navigator.clipboard.writeText(actionLink)
      setCopied(true)
      
      toast({
        title: '✅ Link copied successfully!',
        description: 'The invitation link has been copied to your clipboard and is ready to share.',
      })
      
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setCopyError(errorMessage)
      
      toast({
        title: '❌ Copy failed',
        description: 'Failed to copy the link automatically. Please copy it manually using Ctrl+C (Cmd+C on Mac).',
        variant: 'destructive',
      })
      
      // Auto-select the text for manual copying
      const input = document.querySelector('input[readonly]') as HTMLInputElement
      if (input) {
        input.select()
        input.focus()
      }
    }
  }

  const handleTestLink = () => {
    if (!actionLink) return

    try {
      window.open(actionLink, '_blank', 'noopener,noreferrer')
      toast({
        title: 'Link opened',
        description: 'The invitation link has been opened in a new tab for testing.',
      })
    } catch (err) {
      toast({
        title: 'Failed to open link',
        description: 'Could not open the link automatically. Please copy and paste it into your browser.',
        variant: 'destructive',
      })
    }
  }

  // Error state
  if (error) {
    const isRetryable = !error.includes('unauthorized') && !error.includes('permission')
    
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Invitation Creation Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-red-700 mb-3">
              {isRetryable 
                ? 'There was an error creating the invitation. Please review the error details below and try again.'
                : 'The invitation could not be created due to insufficient permissions or authorization issues.'
              }
            </p>
            <div className="bg-red-100 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800 font-medium mb-2">Error Details:</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            
            {isRetryable && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Troubleshooting tips:</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Verify that all selected teams are still valid</li>
                  <li>• Ensure the email address is correct</li>
                  <li>• Try refreshing the page if the error persists</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            {isRetryable && onRetry && (
              <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              {isRetryable ? 'Back to Form' : 'Close'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (actionLink) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Invitation Created Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-green-700 mb-3">
              The invitation link has been generated successfully. Share this link with the invitee through any communication channel (WhatsApp, Slack, email, etc.).
            </p>
            
            {/* Link display and copy functionality */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={actionLink}
                  readOnly
                  className="font-mono text-xs bg-white text-gray-900 border-green-200 focus:border-green-300 select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-green-200 hover:bg-green-100"
                  title={copied ? "Copied!" : "Copy to clipboard"}
                  disabled={copied}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={handleTestLink}
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-green-200 hover:bg-green-100"
                  title="Test link in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Copy error display */}
              {copyError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Copy failed: {copyError}</span>
                  </div>
                  <p className="mt-1 text-xs">
                    Please select the link above and use Ctrl+C (Cmd+C on Mac) to copy manually.
                  </p>
                </div>
              )}
              
              {/* Success feedback for copy */}
              {copied && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Link copied successfully! Ready to share.</span>
                  </div>
                </div>
              )}
              
              {/* Instructions for sharing */}
              <div className="bg-green-100 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800 font-medium mb-2">Sharing Instructions:</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• This is a one-time use link that expires after the user sets their password</li>
                  <li>• The invitee will be automatically assigned to the selected teams with the specified role</li>
                  <li>• You can share this link through any secure communication channel</li>
                  <li>• The link will redirect the user to set up their password and complete registration</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button onClick={onClose} variant="outline">
              Create Another Invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // This shouldn't happen, but just in case
  return null
}