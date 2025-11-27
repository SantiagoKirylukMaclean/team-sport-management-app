import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import {
  getEvaluationStructure,
  getPlayerEvaluations,
  createEvaluation,
  saveEvaluationScores,
  deleteEvaluation,
  type CategoryWithCriteria,
  type EvaluationWithScores
} from '@/services/evaluations'
import { getPlayersByTeam, type PlayerWithTeam } from '@/services/players'
import { listCoachTeams, type Team } from '@/services/teams'

import { useSearchParams } from 'react-router-dom'

// ... existing imports ...

const PlayerEvaluationsPage: React.FC = () => {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [players, setPlayers] = useState<PlayerWithTeam[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')

  const [evaluationStructure, setEvaluationStructure] = useState<CategoryWithCriteria[]>([])
  const [evaluations, setEvaluations] = useState<EvaluationWithScores[]>([])
  const [showNewEvaluation, setShowNewEvaluation] = useState(false)
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTeams()
  }, [])

  // Handle URL params
  useEffect(() => {
    const teamIdParam = searchParams.get('teamId')
    const playerIdParam = searchParams.get('playerId')

    if (teamIdParam) {
      const teamId = parseInt(teamIdParam)
      if (!isNaN(teamId)) {
        setSelectedTeamId(teamId)
      }
    }

    if (playerIdParam) {
      setSelectedPlayerId(playerIdParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedTeamId) {
      loadPlayers()
    } else {
      setPlayers([])
      setSelectedPlayerId('')
    }
  }, [selectedTeamId])

  useEffect(() => {
    if (selectedPlayerId) {
      loadPlayerEvaluations()
    }
  }, [selectedPlayerId])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const [teamsResult, structure] = await Promise.all([
        listCoachTeams(),
        getEvaluationStructure()
      ])

      if (teamsResult.error) {
        throw teamsResult.error
      }

      setTeams(teamsResult.data || [])
      setEvaluationStructure(structure)

      // Auto-select first team if available
      if (teamsResult.data && teamsResult.data.length > 0) {
        setSelectedTeamId(teamsResult.data[0].id)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error loading teams',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPlayers = async () => {
    if (!selectedTeamId) return

    try {
      const result = await getPlayersByTeam(selectedTeamId)

      if (result.error) {
        throw result.error
      }

      setPlayers(result.data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error loading players',
        variant: 'destructive'
      })
    }
  }

  const loadPlayerEvaluations = async () => {
    try {
      const data = await getPlayerEvaluations(parseInt(selectedPlayerId))
      setEvaluations(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error loading evaluations',
        variant: 'destructive'
      })
    }
  }

  const handleCreateEvaluation = async () => {
    if (!selectedPlayerId) {
      toast({
        title: 'Error',
        description: 'Select a player first',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      const evaluationId = await createEvaluation(parseInt(selectedPlayerId), evaluationDate, notes)

      // Save scores
      const scoreEntries = Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .map(([criterionId, score]) => ({
          criterion_id: criterionId,
          score,
          example_video_url: videoUrls[criterionId] || undefined
        }))

      if (scoreEntries.length > 0) {
        await saveEvaluationScores(evaluationId, scoreEntries)
      }

      toast({
        title: 'Success',
        description: 'Evaluation created successfully'
      })
      setShowNewEvaluation(false)
      setScores({})
      setVideoUrls({})
      setNotes('')
      setEvaluationDate(new Date().toISOString().split('T')[0])
      loadPlayerEvaluations()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error creating evaluation',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!confirm('Are you sure you want to delete this evaluation?')) return

    try {
      await deleteEvaluation(evaluationId)
      toast({
        title: 'Success',
        description: 'Evaluation deleted'
      })
      loadPlayerEvaluations()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error deleting evaluation',
        variant: 'destructive'
      })
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-600 bg-green-50'
    if (percentage >= 60) return 'text-blue-600 bg-blue-50'
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Player Evaluations</h1>
      </div>

      {/* Team Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Team</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTeamId?.toString() || ''}
            onValueChange={(value) => setSelectedTeamId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a team..." />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Player Selection */}
      {selectedTeamId && (
        <Card>
          <CardHeader>
            <CardTitle>Select Player</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a player..." />
              </SelectTrigger>
              <SelectContent>
                {players.map(player => (
                  <SelectItem key={player.id} value={player.id.toString()}>
                    {player.full_name} {player.jersey_number ? `- #${player.jersey_number}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedPlayerId && (
        <>
          {/* New Evaluation Button */}
          {!showNewEvaluation && (
            <Button onClick={() => setShowNewEvaluation(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Evaluation
            </Button>
          )}

          {/* New Evaluation Form */}
          {showNewEvaluation && (
            <Card>
              <CardHeader>
                <CardTitle>New Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Evaluation Date</Label>
                  <Input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                  />
                </div>

                {evaluationStructure.map(category => (
                  <div key={category.id} className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-600">{category.description}</p>

                    <div className="grid gap-6">
                      {category.criteria.map(criterion => (
                        <div key={criterion.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Label className="text-base font-semibold">{criterion.name}</Label>
                              <p className="text-sm text-slate-600 mt-1">{criterion.description}</p>
                              {criterion.evaluation_method && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                                  <strong>Cómo evaluar:</strong> {criterion.evaluation_method}
                                </div>
                              )}
                            </div>
                            <div className="w-24">
                              <Label className="text-xs text-slate-500">Puntuación</Label>
                              <Input
                                type="number"
                                min="1"
                                max={criterion.max_score}
                                value={scores[criterion.id] || ''}
                                onChange={(e) => setScores({
                                  ...scores,
                                  [criterion.id]: parseInt(e.target.value) || 0
                                })}
                                placeholder={`1-${criterion.max_score}`}
                                className="text-center text-lg font-bold"
                              />
                              <p className="text-xs text-slate-400 mt-1 text-center">
                                1-2: Muy bajo<br />
                                3-4: Bajo<br />
                                5-6: Aceptable<br />
                                7-8: Bueno<br />
                                9-10: Muy bueno
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-slate-600">Video de ejemplo (opcional)</Label>
                            <Input
                              type="url"
                              value={videoUrls[criterion.id] || ''}
                              onChange={(e) => setVideoUrls({
                                ...videoUrls,
                                [criterion.id]: e.target.value
                              })}
                              placeholder="https://youtube.com/..."
                              className="text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional observations..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateEvaluation} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Evaluation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewEvaluation(false)
                      setScores({})
                      setVideoUrls({})
                      setNotes('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous Evaluations */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Evaluation History</h2>
            {evaluations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  No evaluations yet
                </CardContent>
              </Card>
            ) : (
              evaluations.map(evaluation => (
                <Card key={evaluation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {new Date(evaluation.evaluation_date).toLocaleDateString()}
                        </CardTitle>
                        <p className="text-sm text-slate-500">
                          By: {evaluation.coach?.display_name || 'Unknown'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvaluation(evaluation.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {evaluationStructure.map(category => {
                      const categoryScores = evaluation.scores.filter(s =>
                        category.criteria.some(c => c.id === s.criterion_id)
                      )

                      if (categoryScores.length === 0) return null

                      return (
                        <div key={category.id}>
                          <h4 className="font-semibold mb-2">{category.name}</h4>
                          <div className="grid gap-3">
                            {categoryScores.map(score => {
                              const criterion = category.criteria.find(c => c.id === score.criterion_id)
                              if (!criterion) return null

                              return (
                                <div
                                  key={score.id}
                                  className="border rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{criterion.name}</div>
                                      <div className="text-xs text-slate-500">{criterion.description}</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg ${getScoreColor(score.score, criterion.max_score)}`}>
                                      <div className="text-xl font-bold">
                                        {score.score}/{criterion.max_score}
                                      </div>
                                    </div>
                                  </div>
                                  {score.example_video_url && (
                                    <a
                                      href={score.example_video_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      📹 Ver video de ejemplo
                                    </a>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {evaluation.notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">{evaluation.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PlayerEvaluationsPage
