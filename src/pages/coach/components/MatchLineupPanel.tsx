import { MatchLineupAndResults } from './MatchLineupAndResults'
import { type Match } from '@/services/matches'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: Match
  teamId: number
}

export function MatchLineupPanel({ open, onOpenChange, match, teamId }: Props) {
  return (
    <MatchLineupAndResults
      open={open}
      onOpenChange={onOpenChange}
      match={match}
      teamId={teamId}
    />
  )
}
