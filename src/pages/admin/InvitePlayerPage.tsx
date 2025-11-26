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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { AlertCircle, UserPlus, Loader2 } from 'lucide-react'
import { PlayerSelect } from '@/components/ui/player-select'
import { InvitationResult } from '@/components/ui/invitation-result'
import { createInvitation } from '@/services/invites'
import { getPlayer } from '@/services/players'
import type { InviteUserRequest, InviteUserResponse } from '@/types/db'

// Simplified validation schema - just player and email
const invitePlayerSchema = z.object({
  playerId: z
    .number({
      required_error: 'Please select a player',
      invalid_type_error: 'Please select a valid player',
    })
    .int()
    .positive('Please select a valid player'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .max(255, 'Email address is too long (maximum 255 characters)'),
  redirectTo: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || z.string().url().safeParse(val).success,
      'Please enter a valid URL'
    ),
})

type InvitePlayerFormData = z.infer<typeof invitePlayerSchema>

export default function InvitePlayerPage() {
  usePageTitle('Invite Player')

  const [invitationResult, setInvitationResult] = useState<InviteUserResponse | null>(null)
  const [invitationError, setInvitationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<InvitePlayerFormData>({
    resolver: zodResolver(invitePlayerSchema),
    defaultValues: {
      playerId: undefined,
      email: '',
      redirectTo: '',
    },
  })

  const onSubmit = async (data: InvitePlayerFormData) => {
    try {
      setIsSubmitting(true)
      setInvitationError(null)

      // Get player details to get team_id
      const playerResult = await getPlayer(data.playerId)

      if (playerResult.error || !playerResult.data) {
        throw new Error('Failed to fetch player details')
      }

      const player = playerResult.data

      // Create invitation request
      const request: InviteUserRequest = {
        email: data.email.trim().toLowerCase(),
        display_name: player.full_name,
        role: 'player',
        teamIds: [player.team_id],
        playerId: data.playerId,
        redirectTo: data.redirectTo?.trim() || `${window.location.origin}/set-password`,
      }

      const result = await createInvitation(request)

      if (result.error) {
        throw result.error
      }

      // Show success result
      setInvitationResult(result.data)

      toast({
        title: 'Invitation created!',
        description: `${player.full_name} can now use the link to create their account.`,
      })

      form.clearErrors()

    } catch (error: any) {
      console.error('Error creating player invitation:', error)

      const errorMessage = error?.message || 'Failed to create invitation. Please try again.'
      setInvitationError(errorMessage)

      toast({
        title: 'Failed to create invitation',
        description: errorMessage,
        variant: 'destructive',
      })

    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewInvitation = () => {
    setInvitationResult(null)
    setInvitationError(null)
    form.reset()
    form.clearErrors()
  }

  // Show result if invitation was created successfully or if there was an error
  if (invitationResult || invitationError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Player</h1>
          <p className="text-muted-foreground">
            Link players to their accounts
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
        <h1 className="text-3xl font-bold tracking-tight">Invite Player</h1>
        <p className="text-muted-foreground">
          Link players to their accounts so they can access their stats and information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Player Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Player Selection */}
              <FormField
                control={form.control}
                name="playerId"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Player *</FormLabel>
                    <FormControl>
                      <PlayerSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search and select a player..."
                      />
                    </FormControl>
                    <FormDescription>
                      Search by player name, team, club or sport. Only players without accounts are shown.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="player@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The email address where the player will receive their invitation link
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
                    <FormLabel>Redirect URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://yourapp.com/player/dashboard"
                        type="url"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      URL to redirect the player after they complete registration
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
                  onClick={() => form.reset()}
                  disabled={isSubmitting}
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
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
              <p className="font-medium mb-1">How player invitations work:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Search and select a player from your roster who doesn't have an account yet</li>
                <li>• Enter their email address to send them an invitation link</li>
                <li>• When they click the link and set their password, they'll be automatically linked to their player profile</li>
                <li>• They'll be able to see their stats, matches, and training information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
