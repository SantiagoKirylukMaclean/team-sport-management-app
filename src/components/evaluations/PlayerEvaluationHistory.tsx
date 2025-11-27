import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Trash2, Video } from 'lucide-react'
import {
    getEvaluationStructure,
    getPlayerEvaluations,
    deleteEvaluation,
    type CategoryWithCriteria,
    type EvaluationWithScores
} from '@/services/evaluations'

interface PlayerEvaluationHistoryProps {
    playerId: number
}

const PlayerEvaluationHistory: React.FC<PlayerEvaluationHistoryProps> = ({ playerId }) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [evaluationStructure, setEvaluationStructure] = useState<CategoryWithCriteria[]>([])
    const [evaluations, setEvaluations] = useState<EvaluationWithScores[]>([])

    useEffect(() => {
        loadData()
    }, [playerId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [structure, evals] = await Promise.all([
                getEvaluationStructure(),
                getPlayerEvaluations(playerId)
            ])
            setEvaluationStructure(structure)
            setEvaluations(evals)
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

    const handleDeleteEvaluation = async (evaluationId: string) => {
        if (!confirm('Are you sure you want to delete this evaluation?')) return

        try {
            await deleteEvaluation(evaluationId)
            toast({
                title: 'Success',
                description: 'Evaluation deleted'
            })
            // Reload evaluations
            const evals = await getPlayerEvaluations(playerId)
            setEvaluations(evals)
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

    const calculateEvaluationStats = (evaluation: EvaluationWithScores) => {
        if (evaluation.scores.length === 0) {
            return { totalScore: 0, maxTotalScore: 0, percentage: 0, categoryStats: [] }
        }

        let totalScore = 0
        let maxTotalScore = 0
        const categoryStats = evaluationStructure.map(category => {
            const categoryScores = evaluation.scores.filter(s =>
                category.criteria.some(c => c.id === s.criterion_id)
            )

            if (categoryScores.length === 0) return null

            const catScore = categoryScores.reduce((sum, s) => sum + s.score, 0)
            const catMaxScore = categoryScores.reduce((sum, s) => {
                const criterion = category.criteria.find(c => c.id === s.criterion_id)
                return sum + (criterion?.max_score || 0)
            }, 0)

            totalScore += catScore
            maxTotalScore += catMaxScore

            return {
                categoryName: category.name,
                score: catScore,
                maxScore: catMaxScore,
                percentage: catMaxScore > 0 ? (catScore / catMaxScore) * 100 : 0
            }
        }).filter(Boolean) as Array<{
            categoryName: string
            score: number
            maxScore: number
            percentage: number
        }>

        const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0

        return { totalScore, maxTotalScore, percentage, categoryStats }
    }

    const getPercentageColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600'
        if (percentage >= 60) return 'text-blue-600'
        if (percentage >= 40) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getPercentageBgColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-500'
        if (percentage >= 60) return 'bg-blue-500'
        if (percentage >= 40) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (evaluations.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay evaluaciones registradas para este jugador.
            </div>
        )
    }

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {evaluations.map(evaluation => {
                const stats = calculateEvaluationStats(evaluation)

                return (
                    <Card key={evaluation.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {new Date(evaluation.evaluation_date).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Evaluado por: {evaluation.coach?.display_name || 'Entrenador'}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                    onClick={() => handleDeleteEvaluation(evaluation.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Overall Score Summary */}
                            {stats.maxTotalScore > 0 && (
                                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Puntuación General
                                            </p>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-2xl font-bold">
                                                    {stats.totalScore}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    / {stats.maxTotalScore} pts
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={`${getPercentageColor(stats.percentage)} text-lg font-bold px-3 py-1`}>
                                                {stats.percentage.toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Overall Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                        <div
                                            className={`${getPercentageBgColor(stats.percentage)} h-2.5 rounded-full transition-all duration-300`}
                                            style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Category Summaries */}
                            {stats.categoryStats.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {stats.categoryStats.map((catStat, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-muted/30 p-3 rounded-md border border-muted"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                                                    {catStat.categoryName}
                                                </p>
                                                <span className={`text-sm font-bold ${getPercentageColor(catStat.percentage)}`}>
                                                    {catStat.percentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-1 mb-1.5">
                                                <span className="text-lg font-bold">
                                                    {catStat.score}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    / {catStat.maxScore}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`${getPercentageBgColor(catStat.percentage)} h-1.5 rounded-full transition-all duration-300`}
                                                    style={{ width: `${Math.min(catStat.percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Detailed Scores by Category */}
                        {evaluationStructure.map(category => {
                            const categoryScores = evaluation.scores.filter(s =>
                                category.criteria.some(c => c.id === s.criterion_id)
                            )

                            if (categoryScores.length === 0) return null

                            return (
                                <div key={category.id} className="space-y-2">
                                    <h4 className="font-semibold text-sm text-primary/80 uppercase tracking-wider">
                                        {category.name}
                                    </h4>
                                    <div className="grid gap-2">
                                        {categoryScores.map(score => {
                                            const criterion = category.criteria.find(c => c.id === score.criterion_id)
                                            if (!criterion) return null

                                            return (
                                                <div
                                                    key={score.id}
                                                    className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                                                >
                                                    <div className="flex-1 min-w-0 mr-4">
                                                        <div className="text-sm font-medium truncate" title={criterion.name}>
                                                            {criterion.name}
                                                        </div>
                                                        {score.notes && (
                                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                                {score.notes}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {score.example_video_url && (
                                                            <a
                                                                href={score.example_video_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 hover:text-blue-700"
                                                                title="Ver video"
                                                            >
                                                                <Video className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                        <div className={`px-2 py-1 rounded text-xs font-bold ${getScoreColor(score.score, criterion.max_score)}`}>
                                                            {score.score}/{criterion.max_score}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}

                        {evaluation.notes && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm italic">
                                "{evaluation.notes}"
                            </div>
                        )}
                    </CardContent>
                </Card>
                )
            })}
        </div>
    )
}

export default PlayerEvaluationHistory
