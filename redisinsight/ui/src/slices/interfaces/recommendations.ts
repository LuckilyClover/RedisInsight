import { Vote } from 'uiSrc/constants/recommendations'
import { Nullable } from 'uiSrc/utils'

export interface IRecommendation {
  id: string
  name: string
  read: boolean
  hide: boolean
  tutorial: string
  vote: Nullable<Vote>
  params: IRecommendationParams
}

export interface IRecommendations {
  recommendations: IRecommendation[]
  totalUnread: number
}

export interface StateRecommendations {
  data: IRecommendations,
  loading: boolean,
  error: string,
  isContentVisible: boolean,
  isHighlighted: boolean,
}

export interface IRecommendationContent {
  type?: string
  value?: any
  parameter?: any
}

export interface IRecommendationsStatic {
  [key: string]: {
    id: string
    title: string
    liveTitle?: string
    telemetryEvent?: string
    redisStack?: boolean
    tutorial?: string
    content?: IRecommendationContent[]
    contentSSO?: IRecommendationContent[]
  }
}

export interface IRecommendationParams {
  keys: string[]
}
