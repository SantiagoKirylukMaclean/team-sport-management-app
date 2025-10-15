import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronDown, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { listTeams, type Team } from '@/services/teams'
import { listClubs, type Club } from '@/services/clubs'
import { listSports, type Sport } from '@/services/sports'

interface TeamOption {
  id: number
  name: string
  clubName: string
  sportName: string
  displayName: string
  clubId: number
  sportId: number
}

interface TeamMultiSelectProps {
  value: number[]
  onChange: (teamIds: number[]) => void
  placeholder?: string
  className?: string
  sportFilter?: number
  clubFilter?: number
}

export function TeamMultiSelect({
  value,
  onChange,
  placeholder = "Select teams...",
  className,
  sportFilter,
  clubFilter
}: TeamMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeamData()
  }, [sportFilter, clubFilter])

  const loadTeamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all data in parallel
      const [teamsResult, clubsResult, sportsResult] = await Promise.all([
        listTeams({ from: 0, to: 999 }), // Get all teams
        listClubs({ from: 0, to: 999 }), // Get all clubs
        listSports({ from: 0, to: 999 }) // Get all sports
      ])

      if (teamsResult.error) throw teamsResult.error
      if (clubsResult.error) throw clubsResult.error
      if (sportsResult.error) throw sportsResult.error

      const teamsData = teamsResult.data || []
      const clubsData = clubsResult.data || []
      const sportsData = sportsResult.data || []

      // Create lookup maps
      const clubsMap = new Map(clubsData.map((club: Club) => [club.id, club]))
      const sportsMap = new Map(sportsData.map((sport: Sport) => [sport.id, sport]))

      // Transform teams with hierarchical display names and additional metadata
      const teamOptions: TeamOption[] = teamsData.map((team: Team) => {
        const club = clubsMap.get(team.club_id)
        const sport = club ? sportsMap.get(club.sport_id) : null
        
        const clubName = club?.name || 'Unknown Club'
        const sportName = sport?.name || 'Unknown Sport'
        const displayName = `${sportName} > ${clubName} > ${team.name}`

        return {
          id: team.id,
          name: team.name,
          clubName,
          sportName,
          displayName,
          clubId: team.club_id,
          sportId: club?.sport_id || 0
        }
      })

      // Apply filters if provided
      let filteredTeams = teamOptions
      if (sportFilter) {
        filteredTeams = filteredTeams.filter(team => team.sportId === sportFilter)
      }
      if (clubFilter) {
        filteredTeams = filteredTeams.filter(team => team.clubId === clubFilter)
      }

      // Sort by sport, then club, then team name
      filteredTeams.sort((a, b) => {
        if (a.sportName !== b.sportName) {
          return a.sportName.localeCompare(b.sportName)
        }
        if (a.clubName !== b.clubName) {
          return a.clubName.localeCompare(b.clubName)
        }
        return a.name.localeCompare(b.name)
      })

      setTeams(filteredTeams)
    } catch (err) {
      console.error('Error loading team data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  // Validate that all selected team IDs exist and are accessible (Requirement 5.3)
  const validationResult = useMemo(() => {
    const availableTeamIds = new Set(teams.map(team => team.id))
    const invalidTeamIds = value.filter(id => !availableTeamIds.has(id))
    const validTeamIds = value.filter(id => availableTeamIds.has(id))
    
    return {
      isValid: invalidTeamIds.length === 0,
      invalidTeamIds,
      validTeamIds,
      hasInvalidTeams: invalidTeamIds.length > 0
    }
  }, [teams, value])

  const selectedTeams = teams.filter(team => value.includes(team.id))

  const handleSelect = (teamId: number) => {
    const newValue = value.includes(teamId)
      ? value.filter(id => id !== teamId)
      : [...value, teamId]
    onChange(newValue)
  }

  const handleRemove = (teamId: number) => {
    onChange(value.filter(id => id !== teamId))
  }

  // Clean up invalid team IDs when teams data changes
  useEffect(() => {
    if (!loading && validationResult.hasInvalidTeams) {
      // Automatically remove invalid team IDs
      onChange(validationResult.validTeamIds)
    }
  }, [loading, validationResult.hasInvalidTeams, validationResult.validTeamIds, onChange])

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4 border rounded-md bg-muted/50", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Loading teams...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("p-4 border rounded-md border-destructive bg-red-50", className)}>
        <div className="flex items-center gap-2 text-sm text-destructive mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Failed to load teams</span>
        </div>
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <Button 
          onClick={loadTeamData} 
          variant="outline" 
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              validationResult.hasInvalidTeams && "border-destructive"
            )}
          >
            {selectedTeams.length === 0 ? (
              placeholder
            ) : (
              `${selectedTeams.length} team${selectedTeams.length === 1 ? '' : 's'} selected`
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search teams by name, club, or sport..." />
            <CommandEmpty>
              {teams.length === 0 ? "No teams available." : "No teams found matching your search."}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={`${team.displayName} ${team.name} ${team.clubName} ${team.sportName}`}
                  onSelect={() => handleSelect(team.id)}
                  className="flex items-start gap-2 py-3"
                >
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      value.includes(team.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="font-medium text-sm">{team.name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-medium">{team.sportName}</span>
                      <span>•</span>
                      <span>{team.clubName}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Validation error display */}
      {validationResult.hasInvalidTeams && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {validationResult.invalidTeamIds.length} invalid team{validationResult.invalidTeamIds.length === 1 ? '' : 's'} removed
          </span>
        </div>
      )}

      {/* Selected teams display */}
      {selectedTeams.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Selected Teams ({selectedTeams.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTeams.map((team) => (
              <Badge
                key={team.id}
                variant="secondary"
                className="text-xs px-2 py-1 flex items-center gap-1"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{team.name}</span>
                  <span className="text-xs opacity-70">
                    {team.sportName} • {team.clubName}
                  </span>
                </div>
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-secondary-foreground/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRemove(team.id)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleRemove(team.id)}
                  aria-label={`Remove ${team.name}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Minimum selection requirement */}
      {value.length === 0 && (
        <div className="text-sm text-muted-foreground">
          At least one team must be selected
        </div>
      )}
    </div>
  )
}