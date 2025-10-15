import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { listSports, type Sport } from '@/services/sports'
import { listClubs, type Club } from '@/services/clubs'
import { listTeams, type Team } from '@/services/teams'
import { TeamsTable } from './components/TeamsTable'
import { TeamFormDialog } from './components/TeamFormDialog'
import { AssignRolesPanel } from './components/AssignRolesPanel'

export default function TeamsPage() {
  usePageTitle('Teams Management')
  
  const { toast } = useToast()
  const [sports, setSports] = useState<Sport[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null)
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([])
  
  // Dialogs
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [assignRolesTeam, setAssignRolesTeam] = useState<Team | null>(null)

  // Cargar catálogos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Filtrar clubs por deporte
  useEffect(() => {
    if (selectedSportId) {
      setFilteredClubs(clubs.filter(club => club.sport_id === selectedSportId))
      setSelectedClubId(null) // Reset club selection
    } else {
      setFilteredClubs(clubs)
    }
  }, [selectedSportId, clubs])

  // Cargar equipos cuando cambian los filtros
  useEffect(() => {
    loadTeams()
  }, [selectedClubId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [sportsResult, clubsResult] = await Promise.all([
        listSports(),
        listClubs()
      ])

      if (sportsResult.error) throw sportsResult.error
      if (clubsResult.error) throw clubsResult.error

      setSports(sportsResult.data || [])
      setClubs(clubsResult.data || [])
      setFilteredClubs(clubsResult.data || [])
      
      await loadTeams()
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: `Error al cargar datos: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTeams = async () => {
    try {
      const result = await listTeams({ 
        clubId: selectedClubId || undefined 
      })
      
      if (result.error) throw result.error
      setTeams(result.data || [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error al cargar equipos: ${err.message}`,
        variant: "destructive"
      })
    }
  }

  const handleTeamSaved = () => {
    loadTeams()
    setShowTeamForm(false)
    setEditingTeam(null)
  }

  const handleTeamDeleted = () => {
    loadTeams()
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setShowTeamForm(true)
  }

  const handleAssignRoles = (team: Team) => {
    setAssignRolesTeam(team)
  }

  const getClubName = (clubId: number) => {
    return clubs.find(club => club.id === clubId)?.name || 'Club desconocido'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <Button onClick={loadInitialData} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Equipos</h1>
        <Button onClick={() => setShowTeamForm(true)}>
          Nuevo Equipo
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Deporte</label>
            <Select 
              value={selectedSportId?.toString() || "all"} 
              onValueChange={(value) => setSelectedSportId(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los deportes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los deportes</SelectItem>
                {sports.map(sport => (
                  <SelectItem key={sport.id} value={sport.id.toString()}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Club</label>
            <Select 
              value={selectedClubId?.toString() || "all"} 
              onValueChange={(value) => setSelectedClubId(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los clubes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clubes</SelectItem>
                {filteredClubs.map(club => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de equipos */}
      <TeamsTable 
        teams={teams}
        getClubName={getClubName}
        onEdit={handleEditTeam}
        onDelete={handleTeamDeleted}
        onAssignRoles={handleAssignRoles}
      />

      {/* Dialogs */}
      <TeamFormDialog
        open={showTeamForm}
        onClose={() => {
          setShowTeamForm(false)
          setEditingTeam(null)
        }}
        onSave={handleTeamSaved}
        team={editingTeam}
        clubs={filteredClubs.length > 0 ? filteredClubs : clubs}
      />

      <AssignRolesPanel
        teamId={assignRolesTeam?.id || 0}
        teamName={assignRolesTeam?.name || ''}
        open={!!assignRolesTeam}
        onClose={() => setAssignRolesTeam(null)}
      />
    </div>
  )
}