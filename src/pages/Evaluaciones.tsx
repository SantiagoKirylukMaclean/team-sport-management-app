import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import MyEvaluations from './MyEvaluations'
import CoachEvaluationsList from './coach/CoachEvaluationsList'
import { Loader2 } from 'lucide-react'

const Evaluaciones: React.FC = () => {
    const { role, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (role === 'coach' || role === 'admin') {
        return <CoachEvaluationsList />
    }

    return <MyEvaluations />
}

export default Evaluaciones
