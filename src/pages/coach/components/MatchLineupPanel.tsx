import { MatchFieldLineup } from './MatchFieldLineup'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: number
  teamId: number
}

export function MatchLineupPanel({ open, onOpenChange, matchId, teamId }: Props) {
  // Siempre mostrar la vista de cancha
  return (
    <MatchFieldLineup
      open={open}
      onOpenChange={onOpenChange}
      matchId={matchId}
      teamId={teamId}
    />
  )
}
