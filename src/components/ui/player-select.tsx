import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown, Loader2, User, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getUnlinkedPlayers, type PlayerWithTeam } from '@/services/players'

interface PlayerSelectProps {
  value?: number
  onChange: (playerId: number | undefined) => void
  teamId?: number
  placeholder?: string
  disabled?: boolean
}

export function PlayerSelect({
  value,
  onChange,
  teamId,
  placeholder = 'Select a player...',
  disabled = false,
}: PlayerSelectProps) {
  const [open, setOpen] = useState(false)
  const [players, setPlayers] = useState<PlayerWithTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPlayers()
  }, [teamId])

  const loadPlayers = async () => {
    setLoading(true)
    setError(null)

    const result = await getUnlinkedPlayers(teamId)

    if (result.error) {
      setError(result.error.message)
      setPlayers([])
    } else {
      setPlayers(result.data)
    }

    setLoading(false)
  }

  const selectedPlayer = players.find((p) => p.id === value)

  const getPlayerDisplay = (player: PlayerWithTeam) => {
    const parts = []
    
    if (player.jersey_number) {
      parts.push(`${player.full_name} #${player.jersey_number}`)
    } else {
      parts.push(player.full_name)
    }
    
    if (player.teams?.name) {
      parts.push(player.teams.name)
    }
    
    if (player.teams?.clubs?.name) {
      parts.push(player.teams.clubs.name)
    }
    
    if (player.teams?.clubs?.sports?.name) {
      parts.push(player.teams.clubs.sports.name)
    }
    
    return parts.join(' • ')
  }

  const getPlayerSearchText = (player: PlayerWithTeam) => {
    return [
      player.full_name,
      player.jersey_number?.toString(),
      player.teams?.name,
      player.teams?.clubs?.name,
      player.teams?.clubs?.sports?.name,
    ].filter(Boolean).join(' ').toLowerCase()
  }

  const filteredPlayers = players.filter((player) => {
    if (!searchQuery) return true
    const searchText = getPlayerSearchText(player)
    return searchText.includes(searchQuery.toLowerCase())
  })

  const handleSelect = (playerId: number) => {
    onChange(playerId)
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading players...
            </>
          ) : selectedPlayer ? (
            <>
              <User className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{getPlayerDisplay(selectedPlayer)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search by name, team, club or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Players List */}
          <div className="max-h-[400px] overflow-y-auto">
            {error ? (
              <div className="py-6 text-center text-sm text-red-600">
                {error}
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="py-6 text-center text-sm">
                No players found.
                <p className="mt-1 text-xs text-muted-foreground">
                  {searchQuery ? 'Try a different search term.' : 'All players already have accounts.'}
                </p>
              </div>
            ) : (
              <div className="p-1">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelect(player.id)}
                    className={cn(
                      'w-full flex items-start gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer',
                      value === player.id && 'bg-accent'
                    )}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        value === player.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.full_name}</span>
                        {player.jersey_number && (
                          <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                            #{player.jersey_number}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        {player.teams?.clubs?.sports?.name && (
                          <>
                            <span>{player.teams.clubs.sports.name}</span>
                            <span>›</span>
                          </>
                        )}
                        {player.teams?.clubs?.name && (
                          <>
                            <span>{player.teams.clubs.name}</span>
                            <span>›</span>
                          </>
                        )}
                        {player.teams?.name && (
                          <span>{player.teams.name}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
