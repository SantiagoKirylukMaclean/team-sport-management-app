import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createMatch, updateMatch, type Match } from '@/services/matches'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: number
  match?: Match | null
  onSuccess: () => void
}

export function MatchFormDialog({ open, onOpenChange, teamId, match, onSuccess }: Props) {
  const { toast } = useToast()
  const [opponent, setOpponent] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Actualizar los campos cuando cambia el match o se abre el diálogo
  useEffect(() => {
    if (open) {
      setOpponent(match?.opponent || '')
      setMatchDate(match?.match_date || '')
      setLocation(match?.location || '')
      setNotes(match?.notes || '')
    }
  }, [open, match])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!opponent.trim() || !matchDate) {
      toast({ title: 'Error', description: 'Oponente y fecha son obligatorios', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      if (match) {
        const { error } = await updateMatch(match.id, {
          opponent: opponent.trim(),
          match_date: matchDate,
          location: location.trim() || null,
          notes: notes.trim() || null,
        })
        if (error) throw error
        toast({ title: 'Éxito', description: 'Partido actualizado' })
      } else {
        const { error } = await createMatch({
          team_id: teamId,
          opponent: opponent.trim(),
          match_date: matchDate,
          location: location.trim() || null,
          notes: notes.trim() || null,
        })
        if (error) throw error
        toast({ title: 'Éxito', description: 'Partido creado' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al guardar partido', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{match ? 'Editar Partido' : 'Nuevo Partido'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="opponent">Oponente *</Label>
            <Input
              id="opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="match_date">Fecha *</Label>
            <Input
              id="match_date"
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Lugar</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
