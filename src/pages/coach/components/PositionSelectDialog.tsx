import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Position } from '@/services/positions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  positions: Position[]
  playerName: string
  onConfirm: (positionId: number | null) => void
}

export function PositionSelectDialog({
  open,
  onOpenChange,
  positions,
  playerName,
  onConfirm,
}: Props) {
  const [selectedPosition, setSelectedPosition] = useState<string | undefined>(undefined)

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onConfirm(selectedPosition ? parseInt(selectedPosition) : null)
    setSelectedPosition(undefined)
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedPosition(undefined)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onOpenChange(false)
      }
    }} modal={true}>
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Seleccionar Posición</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Jugador</Label>
            <div className="font-semibold">{playerName}</div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Posición en este cuarto</Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger id="position">
                <SelectValue placeholder="Seleccionar posición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin posición específica</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id.toString()}>
                    {pos.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
