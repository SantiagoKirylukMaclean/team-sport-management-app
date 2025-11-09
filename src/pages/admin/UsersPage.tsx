import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Edit,
  Key,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { AppRole } from '@/types/db';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: AppRole;
  created_at: string;
}

interface TeamOption {
  id: number;
  name: string;
  club_id: number;
  club_name: string;
  sport_name: string;
}

interface ClubOption {
  id: number;
  name: string;
  sport_name: string;
}

interface PlayerOption {
  id: number;
  full_name: string;
  jersey_number: number | null;
  team_id: number;
  team_name: string;
  club_name: string;
  sport_name: string;
  user_id: string | null;
}

interface SportOption {
  id: number;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [loading, setLoading] = useState(true);
  
  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<AppRole>('player');
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<number[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  
  // Filter options for player selection
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  
  // Data options
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [sports, setSports] = useState<SportOption[]>([]);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadUsers();
    loadTeams();
    loadClubs();
    loadPlayers();
    loadSports();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('error', 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          club_id,
          clubs!inner(
            name,
            sports!inner(name)
          )
        `)
        .order('name');

      if (error) throw error;
      
      const teamsData: TeamOption[] = (data || []).map((team: any) => ({
        id: team.id,
        name: team.name,
        club_id: team.club_id,
        club_name: team.clubs.name,
        sport_name: team.clubs.sports.name
      }));
      
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select(`
          id,
          name,
          sports!inner(name)
        `)
        .order('name');

      if (error) throw error;
      
      const clubsData: ClubOption[] = (data || []).map((club: any) => ({
        id: club.id,
        name: club.name,
        sport_name: club.sports.name
      }));
      
      setClubs(clubsData);
    } catch (error) {
      console.error('Error loading clubs:', error);
    }
  };

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          full_name,
          jersey_number,
          team_id,
          user_id,
          teams!inner(
            name,
            clubs!inner(
              name,
              sports!inner(name)
            )
          )
        `)
        .order('full_name');

      if (error) throw error;
      
      const playersData: PlayerOption[] = (data || []).map((player: any) => ({
        id: player.id,
        full_name: player.full_name,
        jersey_number: player.jersey_number,
        team_id: player.team_id,
        team_name: player.teams.name,
        club_name: player.teams.clubs.name,
        sport_name: player.teams.clubs.sports.name,
        user_id: player.user_id
      }));
      
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const loadSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSports(data || []);
    } catch (error) {
      console.error('Error loading sports:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setSelectedTeams([]);
    setSelectedClubs([]);
    setSelectedPlayer(null);
    setSelectedSport(null);
    setSelectedClub(null);
    setSelectedTeam(null);
    setShowEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);

      // Update user role
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: editRole })
        .eq('id', selectedUser.id);

      if (roleError) throw roleError;

      // Clear existing team assignments
      const { error: deleteError } = await supabase
        .from('user_team_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      if (deleteError) throw deleteError;

      // Handle role-specific assignments
      if (editRole === 'coach' && selectedTeams.length > 0) {
        // Assign coach to selected teams
        const teamAssignments = selectedTeams.map(teamId => ({
          user_id: selectedUser.id,
          team_id: teamId,
          role: 'coach' as const
        }));

        const { error: insertError } = await supabase
          .from('user_team_roles')
          .insert(teamAssignments);

        if (insertError) throw insertError;
      } else if (editRole === 'admin' && selectedClubs.length > 0) {
        // Assign admin to all teams in selected clubs
        const clubTeams = teams.filter(t => selectedClubs.includes(t.club_id));
        const teamAssignments = clubTeams.map(team => ({
          user_id: selectedUser.id,
          team_id: team.id,
          role: 'admin' as const
        }));

        if (teamAssignments.length > 0) {
          const { error: insertError } = await supabase
            .from('user_team_roles')
            .insert(teamAssignments);

          if (insertError) throw insertError;
        }
      } else if (editRole === 'player' && selectedPlayer) {
        // Link player to user
        const { error: playerError } = await supabase
          .from('players')
          .update({ user_id: selectedUser.id })
          .eq('id', selectedPlayer);

        if (playerError) throw playerError;

        // Also assign player role to the team
        const player = players.find(p => p.id === selectedPlayer);
        if (player) {
          const { error: insertError } = await supabase
            .from('user_team_roles')
            .insert({
              user_id: selectedUser.id,
              team_id: player.team_id,
              role: 'player'
            });

          if (insertError) throw insertError;
        }
      }

      // Reload data
      await loadUsers();
      await loadPlayers();
      
      showMessage('success', 'Usuario actualizado correctamente');
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating user:', error);
      showMessage('error', 'Error al actualizar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      showMessage('success', `Email de recuperación enviado a ${email}`);
    } catch (error) {
      console.error('Error sending password reset:', error);
      showMessage('error', 'Error al enviar email de recuperación');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleTeamSelection = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const toggleClubSelection = (clubId: number) => {
    setSelectedClubs(prev => 
      prev.includes(clubId) 
        ? prev.filter(id => id !== clubId)
        : [...prev, clubId]
    );
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'admin': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'coach': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'player': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'coach': return 'Coach';
      case 'player': return 'Player';
      default: return role;
    }
  };

  // Filter players based on sport/club/team selection
  const getFilteredPlayers = () => {
    let filtered = players.filter(p => !p.user_id); // Only unlinked players

    if (selectedSport) {
      const sport = sports.find(s => s.id === selectedSport);
      if (sport) {
        filtered = filtered.filter(p => p.sport_name === sport.name);
      }
    }

    if (selectedClub) {
      const club = clubs.find(c => c.id === selectedClub);
      if (club) {
        filtered = filtered.filter(p => p.club_name === club.name);
      }
    }

    if (selectedTeam) {
      filtered = filtered.filter(p => p.team_id === selectedTeam);
    }

    return filtered;
  };

  // Get clubs filtered by sport
  const getFilteredClubs = () => {
    if (!selectedSport) return clubs;
    const sport = sports.find(s => s.id === selectedSport);
    return sport ? clubs.filter(c => c.sport_name === sport.name) : clubs;
  };

  // Get teams filtered by club
  const getFilteredTeams = () => {
    if (!selectedClub) return teams;
    return teams.filter(t => t.club_id === selectedClub);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Administra usuarios, roles y permisos del sistema
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg border flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-500' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AppRole | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
            <SelectItem value="player">Player</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fecha de Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.display_name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        disabled={actionLoading}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => user.email && handleSendPasswordReset(user.email)}
                        disabled={actionLoading || !user.email}
                      >
                        <Key className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Usuario: {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rol del Usuario</label>
              <Select value={editRole} onValueChange={(value) => setEditRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Coach: Team Selection */}
            {editRole === 'coach' && (
              <div>
                <label className="text-sm font-medium mb-3 block">Equipos Asignados</label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona los equipos que este coach podrá gestionar
                </p>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={() => toggleTeamSelection(team.id)}
                      />
                      <label
                        htmlFor={`team-${team.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {team.name} - {team.club_name} ({team.sport_name})
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedTeams.length} {selectedTeams.length === 1 ? 'equipo seleccionado' : 'equipos seleccionados'}
                </p>
              </div>
            )}

            {/* Admin: Club Selection */}
            {editRole === 'admin' && (
              <div>
                <label className="text-sm font-medium mb-3 block">Clubs Asignados</label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona los clubs que este admin podrá gestionar (tendrá acceso a todos los equipos del club)
                </p>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {clubs.map((club) => (
                    <div key={club.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`club-${club.id}`}
                        checked={selectedClubs.includes(club.id)}
                        onCheckedChange={() => toggleClubSelection(club.id)}
                      />
                      <label
                        htmlFor={`club-${club.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {club.name} ({club.sport_name})
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedClubs.length} {selectedClubs.length === 1 ? 'club seleccionado' : 'clubs seleccionados'}
                </p>
              </div>
            )}

            {/* Player: Player Selection with Filters */}
            {editRole === 'player' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-3 block">Vincular con Jugador</label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona el jugador que representa este usuario
                  </p>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Deporte</label>
                    <Select 
                      value={selectedSport?.toString() || 'all'} 
                      onValueChange={(value) => {
                        setSelectedSport(value === 'all' ? null : parseInt(value));
                        setSelectedClub(null);
                        setSelectedTeam(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los deportes</SelectItem>
                        {sports.map((sport) => (
                          <SelectItem key={sport.id} value={sport.id.toString()}>
                            {sport.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Club</label>
                    <Select 
                      value={selectedClub?.toString() || 'all'} 
                      onValueChange={(value) => {
                        setSelectedClub(value === 'all' ? null : parseInt(value));
                        setSelectedTeam(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los clubs</SelectItem>
                        {getFilteredClubs().map((club) => (
                          <SelectItem key={club.id} value={club.id.toString()}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Equipo</label>
                    <Select 
                      value={selectedTeam?.toString() || 'all'} 
                      onValueChange={(value) => setSelectedTeam(value === 'all' ? null : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los equipos</SelectItem>
                        {getFilteredTeams().map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Player List */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Jugadores disponibles ({getFilteredPlayers().length})
                  </label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                    {getFilteredPlayers().length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay jugadores disponibles con los filtros seleccionados
                      </p>
                    ) : (
                      getFilteredPlayers().map((player) => (
                        <div key={player.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`player-${player.id}`}
                            checked={selectedPlayer === player.id}
                            onCheckedChange={(checked) => setSelectedPlayer(checked ? player.id : null)}
                          />
                          <label
                            htmlFor={`player-${player.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {player.full_name}
                            {player.jersey_number && ` #${player.jersey_number}`}
                            {' - '}
                            {player.team_name} ({player.club_name})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveUser}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
