import { useIntelligence } from '@/hooks/use-intelligence'
import { buildCampusTwin } from '../../shared/campus-twin'

export function useCampusTwin(scenario: string, minute: number) {
  const state = useIntelligence()
  return {
    ...state,
    twin: state.data ? buildCampusTwin(state.data, { scenario, minute }) : null,
  }
}
