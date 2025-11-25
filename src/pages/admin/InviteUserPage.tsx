import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { AlertCircle, UserPlus, Loader2, AlertTriangle } from 'lucide-react'
import { TeamMultiSelect } from '@/components/ui/team-multi-select'
import { InvitationResult } from '@/components/ui/invitation-result'
import { createInvitation } from '@/services/invites'
import {
  mapInvitationError,
  getErrorToastMessage,
  getSuccessToastMessage,
  getLoadingToastMessage
} from '@/lib/invitation-error-handling'
import type { InviteUserRequest, InviteUserResponse } from '@/types/db'

// Enhanced validation schema with detailed error messages
const inviteSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g., user@example.com)')
    .max(255, 'Email address is too long (maximum 255 characters)'),
  display_name: z
    .string()
    .max(100, 'Display name must be less than 100 characters')
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || val.length >= 2,
      'Display name must be at least 2 characters when provided'
    ),
  role: z.enum(['coach', 'admin'], {
    required_error: 'Please select a role for the user',
    invalid_type_error: 'Role must be either coach or admin',
  }),
  teamIds: z
    .array(z.number().int().positive())
    .min(1, 'At least one team must be selected')
    .max(50, 'Too many teams selected (maximum 50 teams)'),
  redirectTo: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || z.string().url().safeParse(val).success,
      'Please enter a valid URL (e.g., https://example.com/dashboard)'
    ),
})

type InviteFormData = z.infer<typeof inviteSchema>

export default function InviteUserPage() {
  usePageTitle('Invite User')

  const [invitationResult, setInvitationResult] = useState<InviteUserResponse | null>(null)
  const [invitationError, setInvitationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempts, setSubmitAttempts] = useState(0)

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      display_name: '',
      role: undefined,
      teamIds: [],
      redirectTo: '',
    },
  })

  const onSubmit = async (data: InviteFormData) => {
    try {
      setIsSubmitting(true)
      setInvitationError(null)
      setSubmitAttempts(prev => prev + 1)

      // Show loading toast for long operations
      const loadingMessage = getLoadingToastMessage('create')
      const loadingToast = toast(loadingMessage)

      // Transform form data to API request format
      const request: InviteUserRequest = {
        email: data.email.trim().toLowerCase(),
        display_name: data.display_name?.trim() || undefined,
        role: data.role,
        teamIds: data.teamIds,
        redirectTo: data.redirectTo?.trim() || `${window.location.origin}/set-password`,
      }

      const result = await createInvitation(request)

      // Dismiss loading toast
      loadingToast.dismiss()

      if (result.error) {
        throw result.error
      }

      // Show success result
      setInvitationResult(result.data)

      // Enhanced success toast with more details
      const successMessage = getSuccessToastMessage(data.email, data.role)
      toast(successMessage)

      // Reset form validation state
      form.clearErrors()

    } catch (error: any) {
      console.error('Error creating invitation:', error)

      // Map error to user-friendly format
      const mappedError = mapInvitationError(error)

      // Set error for InvitationResult component to display
      setInvitationError(mappedError.message)

      // Show error toast with retry information
      const errorToastMessage = getErrorToastMessage(mappedError, submitAttempts)
      toast(errorToastMessage)

      // Add form-level errors for specific validation issues
      if (mappedError.code === 'EMAIL_ERROR') {
        form.setError('email', {
          type: 'server',
          message: 'Please check the email address and try again.'
        })
      } else if (mappedError.code === 'TEAM_ERROR') {
        form.setError('teamIds', {
          type: 'server',
          message: 'Please select valid teams and try again.'
        })
      } else if (mappedError.code === 'ROLE_ERROR') {
        form.setError('role', {
          type: 'server',
          message: 'Please select a valid role and try again.'
        })
      }

    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewInvitation = () => {
    setInvitationResult(null)
    setInvitationError(null)
    setSubmitAttempts(0)
    form.reset()
    form.clearErrors()
  }

  // Show result if invitation was created successfully or if there was an error
  if (invitationResult || invitationError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite User</h1>
          <p className="text-muted-foreground">
            Invite coaches and admins to join teams
          </p>
        </div>
        <InvitationResult
          actionLink={invitationResult?.action_link}
          error={invitationError || undefined}
          onClose={handleNewInvitation}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite User</h1>
        <p className="text-muted-foreground">
          Invite coaches and admins to join teams
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="user@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The email address of the person you want to invite
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display Name Field */}
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional display name for the user
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role Selection */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The role that will be assigned to the user
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Selection */}
              <FormField
                control={form.control}
                name="teamIds"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Teams *</FormLabel>
                    <FormControl>
                      <TeamMultiSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select teams to assign..."
                      />
                    </FormControl>
                    <FormDescription>
                      Select one or more teams that the user will be assigned to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Redirect URL Field */}
              <FormField
                control={form.control}
                name="redirectTo"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Redirect URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://yourapp.com/dashboard"
                        type="url"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional URL to redirect the user after they complete registration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset()
                    form.clearErrors()
                    setSubmitAttempts(0)
                  }}
                  disabled={isSubmitting}
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                  className="min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Invitation
                    </>
                  )}
                </Button>
              </div>

              {/* Form validation summary */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Please fix the following errors:
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <li key={field} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span className="capitalize">{field.replace(/([A-Z])/g, ' $1')}: {error?.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Retry information for failed attempts */}
              {submitAttempts > 1 && submitAttempts < 3 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Attempt {submitAttempts} of 3. If you continue to experience issues, please contact support.
                    </span>
                  </div>
                </div>
              )}

              {/* Too many attempts warning */}
              {submitAttempts >= 3 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Multiple attempts failed. Please refresh the page or contact support if the problem persists.
                    </span>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• The system generates a one-time recovery link</li>
                <li>• Share this link through any communication channel</li>
                <li>• When clicked, the invitee sets their password</li>
                <li>• They are automatically assigned to the selected teams with the specified role</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}