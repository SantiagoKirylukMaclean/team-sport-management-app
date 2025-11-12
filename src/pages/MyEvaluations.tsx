import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { 
  getEvaluationStructure, 
  getPlayerEvaluations,
  type CategoryWithCriteria,
  type EvaluationWithScores
} from '@/services/evaluations'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

const MyEvaluations: React.FC = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [evaluationStructure, setEvaluationStructure] = useState<CategoryWithCriteria[]>([])
  const [evaluations, setEvaluations] = useState<EvaluationWithScores[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get current user's player ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (playerError) throw playerError

      const [structure, evaluationsData] = await Promise.all([
        getEvaluationStructure(),
        getPlayerEvaluations(playerData.id)
      ])

      setEvaluationStructure(structure)
      setEvaluations(evaluationsData)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error loading evaluations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getProgressionData = () => {
    if (evaluations.length < 2) return []

    const latestEval = evaluations[0]
    const previousEval = evaluations[1]

    // Compare individual criteria
    return latestEval.scores.map(latestScore => {
      const criterion = evaluationStructure[0]?.criteria.find(c => c.id === latestScore.criterion_id)
      if (!criterion) return null

      const previousScore = previousEval.scores.find(s => s.criterion_id === latestScore.criterion_id)
      
      const latestPercentage = Math.round((latestScore.score / criterion.max_score) * 100)
      const previousPercentage = previousScore 
        ? Math.round((previousScore.score / criterion.max_score) * 100)
        : 0
      
      return {
        category: criterion.name,
        latest: latestPercentage,
        previous: previousPercentage,
        change: latestPercentage - previousPercentage
      }
    }).filter(Boolean) as { category: string; latest: number; previous: number; change: number }[]
  }

  const getRadarData = () => {
    if (evaluations.length === 0) return []

    const latestEval = evaluations[0]
    
    // Get individual criterion scores for radar
    return latestEval.scores.map(score => {
      const criterion = evaluationStructure[0]?.criteria.find(c => c.id === score.criterion_id)
      if (!criterion) return null
      
      return {
        category: criterion.name.length > 15 ? criterion.name.substring(0, 15) + '...' : criterion.name,
        score: (score.score / criterion.max_score) * 100,
        fullMark: 100
      }
    }).filter(Boolean) as { category: string; score: number; fullMark: number }[]
  }

  const getTimelineData = () => {
    return evaluations.slice().reverse().map(evaluation => {
      const dataPoint: any = {
        date: new Date(evaluation.evaluation_date).toLocaleDateString('es-ES', { 
          month: 'short', 
          day: 'numeric' 
        })
      }

      // Add individual criterion scores
      evaluation.scores.forEach(score => {
        const criterion = evaluationStructure[0]?.criteria.find(c => c.id === score.criterion_id)
        if (criterion) {
          dataPoint[criterion.name] = (score.score / criterion.max_score) * 100
        }
      })

      return dataPoint
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (evaluations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 text-lg">
              Aún no tienes evaluaciones registradas.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Tu entrenador podrá evaluar tu progreso próximamente.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestEvaluation = evaluations[0]
  const progressionData = getProgressionData()
  const radarData = getRadarData()
  const timelineData = getTimelineData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
        <p className="text-slate-600 mt-1">
          Seguimiento de tu desarrollo y progreso
        </p>
      </div>

      {/* Hero Section with Large Radar Chart */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Tu Perfil de Habilidades</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Última evaluación: {new Date(latestEvaluation.evaluation_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {Math.round(radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length)}
              </div>
              <div className="text-xs text-slate-500">Promedio General</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Large Radar Chart */}
            <div className="lg:col-span-2 h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Radar
                    name="Tu Puntuación"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Individual Scores with Icons */}
            <div className="space-y-2">
              {latestEvaluation.scores.map(score => {
                const criterion = evaluationStructure[0]?.criteria.find(c => c.id === score.criterion_id)
                if (!criterion) return null
                const percentage = (score.score / criterion.max_score) * 100
                const color = percentage >= 80 ? 'bg-green-500' : 
                             percentage >= 60 ? 'bg-blue-500' : 
                             percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                
                return (
                  <div key={score.id} className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                      {score.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">
                        {criterion.name}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                        <div
                          className={`${color} h-1.5 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {latestEvaluation.notes && (
            <div className="mt-6 p-4 bg-white border-l-4 border-blue-500 rounded-lg shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-1">💬 Observaciones del Entrenador:</p>
              <p className="text-sm text-slate-600">{latestEvaluation.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progression with Comparison Radar */}
      {progressionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tu Evolución</CardTitle>
            <p className="text-sm text-slate-600">Comparación con tu evaluación anterior</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparison Radar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={progressionData.map(item => ({
                    category: item.category.split(' ')[0],
                    actual: item.latest,
                    anterior: item.previous
                  }))}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: '#475569', fontSize: 11 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Evaluación Actual"
                      dataKey="actual"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Evaluación Anterior"
                      dataKey="anterior"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Progress Cards */}
              <div className="grid grid-cols-2 gap-3">
                {progressionData.map(item => {
                  const isPositive = item.change > 0
                  const isNegative = item.change < 0
                  const bgColor = isPositive ? 'bg-green-50 border-green-200' : 
                                 isNegative ? 'bg-red-50 border-red-200' : 
                                 'bg-slate-50 border-slate-200'
                  
                  return (
                    <div
                      key={item.category}
                      className={`p-3 border-2 rounded-xl ${bgColor} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700 leading-tight">
                          {item.category}
                        </span>
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : isNegative ? (
                          <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                        ) : (
                          <Minus className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{item.latest}</span>
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                      <div className={`text-xs font-semibold mt-1 ${
                        isPositive ? 'text-green-600' : 
                        isNegative ? 'text-red-600' : 
                        'text-slate-400'
                      }`}>
                        {item.change > 0 ? '+' : ''}{item.change}% vs anterior
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Chart */}
      {timelineData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tu Trayectoria</CardTitle>
            <p className="text-sm text-slate-600">Evolución de tus habilidades a lo largo del tiempo</p>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#cbd5e1"
                    label={{ value: 'Puntuación (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  {latestEvaluation.scores.slice(0, 5).map((score, index) => {
                    const criterion = evaluationStructure[0]?.criteria.find(c => c.id === score.criterion_id)
                    if (!criterion) return null
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                    return (
                      <Line
                        key={criterion.id}
                        type="monotone"
                        dataKey={criterion.name}
                        stroke={colors[index]}
                        strokeWidth={3}
                        dot={{ fill: colors[index], r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Historial Detallado</h2>
        {evaluations.map(evaluation => (
          <Card key={evaluation.id}>
            <CardHeader>
              <CardTitle>
                {new Date(evaluation.evaluation_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardTitle>
              <p className="text-sm text-slate-500">
                Evaluado por: {evaluation.coach?.display_name || 'Entrenador'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {evaluationStructure.map(category => {
                const categoryScores = evaluation.scores.filter(s =>
                  category.criteria.some(c => c.id === s.criterion_id)
                )
                
                if (categoryScores.length === 0) return null

                return (
                  <div key={category.id}>
                    <h4 className="font-semibold mb-3">{category.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categoryScores.map(score => {
                        const criterion = category.criteria.find(c => c.id === score.criterion_id)
                        if (!criterion) return null
                        
                        return (
                          <div
                            key={score.id}
                            className={`p-3 rounded-lg border ${getScoreColor(score.score, criterion.max_score)}`}
                          >
                            <div className="text-xs font-medium mb-1">{criterion.name}</div>
                            <div className="text-2xl font-bold mb-2">
                              {score.score}<span className="text-sm">/{criterion.max_score}</span>
                            </div>
                            {score.example_video_url && (
                              <a 
                                href={score.example_video_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                📹 Ver video
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
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-1">Observaciones:</p>
                  <p className="text-sm text-slate-600">{evaluation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default MyEvaluations
