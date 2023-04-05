import { AxiosError } from 'axios'
import { cloneDeep, set } from 'lodash'
import { Vote } from 'uiSrc/constants/recommendations'
import { apiService } from 'uiSrc/services'
import { addErrorNotification } from 'uiSrc/slices/app/notifications'
import reducer, {
  initialState,
  getRecommendations,
  getRecommendationsSuccess,
  getRecommendationsFailure,
  setIsHighlighted,
  setIsContentVisible,
  readRecommendations,
  fetchRecommendationsAction,
  readRecommendationsAction,
  recommendationsSelector,
  setRecommendationVoteSuccess,
  setRecommendationVoteError,
  putLiveRecommendationVote,
  setRecommendationVote,
  setTotalUnread,
} from 'uiSrc/slices/recommendations/recommendations'
import { cleanup, initialStateDefault, mockStore, mockedStore } from 'uiSrc/utils/test-utils'

let store: typeof mockedStore

const mockId = 'id'
const mockName = 'name'
const mockVote = Vote.Like
const mockRecommendations = {
  recommendations: [{ id: mockId, name: mockName, read: false, vote: null }],
  totalUnread: 1,
}
const mockRecommendationVoted = cloneDeep(mockRecommendations)
set(mockRecommendationVoted, 'recommendations[0].vote', mockVote)

beforeEach(() => {
  cleanup()
  store = cloneDeep(mockedStore)
  store.clearActions()
})

describe('recommendations slice', () => {
  describe('reducer, actions and selectors', () => {
    it('should return the initial state on first run', () => {
      // Arrange
      const nextState = initialState

      // Act
      const result = reducer(undefined, {})

      // Assert
      expect(result).toEqual(nextState)
    })

    describe('getRecommendations', () => {
      it('should properly set loading: true', () => {
        // Arrange
        const state = {
          ...initialState,
          loading: true,
          error: '',
        }

        // Act
        const nextState = reducer(initialState, getRecommendations())

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: nextState,
        })
        expect(recommendationsSelector(rootState)).toEqual(state)
      })
    })

    describe('getRecommendationsFailure', () => {
      it('should properly set error', () => {
        // Arrange
        const error = 'Some error'
        const state = {
          ...initialState,
          error,
          loading: false,
        }

        // Act
        const nextState = reducer(initialState, getRecommendationsFailure(error))

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: nextState,
        })
        expect(recommendationsSelector(rootState)).toEqual(state)
      })
    })

    describe('getRecommendationsSuccess', () => {
      it('should properly set loading: true', () => {
        const payload = mockRecommendations
        // Arrange
        const state = {
          ...initialState,
          loading: false,
          data: mockRecommendations
        }

        // Act
        const nextState = reducer(initialState, getRecommendationsSuccess(payload))

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: nextState,
        })
        expect(recommendationsSelector(rootState)).toEqual(state)
      })
    })

    describe('setIsContentVisible', () => {
      it('should properly isContentVisible', () => {
        // Arrange
        const state = {
          ...initialState,
          isContentVisible: true,
          isHighlighted: false,
        }

        // Act
        const nextState = reducer(initialState, setIsContentVisible(true))

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: nextState,
        })
        expect(recommendationsSelector(rootState)).toEqual(state)
      })
    })

    describe('setTotalUnread', () => {
      it('should properly set total unread', () => {
        // Arrange
        const data = 10
        const state = {
          ...initialState,
          isHighlighted: true,
          data: {
            ...initialState.data,
            totalUnread: data
          }
        }

        // Act
        const nextState = reducer(initialState, setTotalUnread(data))

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: nextState,
        })
        expect(recommendationsSelector(rootState)).toEqual(state)
      })
    })

    describe('readRecommendations', () => {
      it('should properly set totalUnread', () => {
        // Arrange
        const state = {
          ...initialState,
          data: { ...initialState.data, totalUnread: 0 },
          loading: false,
          error: '',
        }

        // Act
        const nextState = reducer(initialState, readRecommendations(0))

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: nextState,
        })
        expect(recommendationsSelector(rootState)).toEqual(state)
      })
    })

    describe('setRecommendationVoteSuccess', () => {
      it('should properly set data', () => {
        const payload = mockRecommendationVoted.recommendations[0]
        // Arrange
        const state = {
          ...initialState,
          loading: false,
          data: mockRecommendationVoted
        }

        // Act
        const initialStateWithRecs = {
          ...initialState,
          data: mockRecommendations
        }
        const nextState = reducer(initialStateWithRecs, setRecommendationVoteSuccess(payload))

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: nextState,
        })
        expect(recommendationsSelector(rootState)).toEqual(state)
      })
    })

    describe('setRecommendationVoteError', () => {
      it('should properly set an error', () => {
        const error = 'Some error'
        const state = {
          ...initialState,
          error,
          loading: false,
        }

        // Act
        const nextState = reducer(initialState, setRecommendationVoteError(error))

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: nextState,
        })
        expect(recommendationsSelector(rootState)).toEqual(state)
      })
    })
  })

  // thunks
  describe('thunks', () => {
    describe('fetchRecommendationsAction', () => {
      it('succeed to fetch recommendations data', async () => {
        const data = {
          recommendations: [],
          totalUnread: 0,
        }
        const responsePayload = { data, status: 200 }

        apiService.get = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(
          fetchRecommendationsAction('instanceId')
        )

        // Assert
        const expectedActions = [
          getRecommendations(),
          getRecommendationsSuccess(data),
        ]

        expect(store.getActions()).toEqual(expectedActions)
      })

      it('succeed to fetch recommendations data and set highlighting', async () => {
        const data = mockRecommendations
        const responsePayload = { data, status: 200 }

        apiService.get = jest.fn().mockResolvedValue(responsePayload)

        const state = {
          ...initialStateDefault.recommendations,
          isContentVisible: false,
        }

        // Assert
        const rootState = Object.assign(initialStateDefault, {
          recommendations: state,
        })

        const tempStore = mockStore(rootState)

        // Act
        await tempStore.dispatch<any>(
          fetchRecommendationsAction('instanceId')
        )

        // Assert
        const expectedActions = [
          getRecommendations(),
          setIsHighlighted(true),
          getRecommendationsSuccess(data),
        ]

        expect(tempStore.getActions()).toEqual(expectedActions)
      })

      it('failed to fetch recommendations data', async () => {
        const errorMessage = 'Something was wrong!'
        const responsePayload = {
          response: {
            status: 500,
            data: { message: errorMessage },
          },
        }

        apiService.get = jest.fn().mockRejectedValue(responsePayload)

        // Act
        await store.dispatch<any>(
          fetchRecommendationsAction('instanceId')
        )

        // Assert
        const expectedActions = [
          getRecommendations(),
          addErrorNotification(responsePayload as AxiosError),
          getRecommendationsFailure(errorMessage)
        ]

        expect(store.getActions()).toEqual(expectedActions)
      })
    })

    describe('readRecommendationsAction', () => {
      it('succeed to read recommendations', async () => {
        const data = {
          recommendations: [],
          totalUnread: 0,
        }
        const responsePayload = { data, status: 200 }

        apiService.patch = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(
          readRecommendationsAction('instanceId')
        )

        // Assert
        const expectedActions = [
          readRecommendations(data.totalUnread),
          setIsHighlighted(false),
        ]

        expect(store.getActions()).toEqual(expectedActions)
      })

      it('failed to read recommendations', async () => {
        const errorMessage = 'Something was wrong!'
        const responsePayload = {
          response: {
            status: 500,
            data: { message: errorMessage },
          },
        }

        apiService.patch = jest.fn().mockRejectedValue(responsePayload)

        // Act
        await store.dispatch<any>(
          readRecommendationsAction('instanceId')
        )

        expect(store.getActions()).toEqual([])
      })
    })

    describe('putLiveRecommendationVote', () => {
      it('succeed to put recommendation vote', async () => {
        // const data = mockRecommendations
        const data = mockRecommendationVoted.recommendations[0]
        const responsePayload = { data, status: 200 }

        apiService.patch = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(
          putLiveRecommendationVote(mockId,mockVote, mockName)
        )

        // Assert
        const expectedActions = [
          setRecommendationVote(),
          setRecommendationVoteSuccess(data),
        ]

        expect(store.getActions()).toEqual(expectedActions)
      })

      it('failed to put recommendation vote', async () => {
        const errorMessage = 'Something was wrong!'
        const responsePayload = {
          response: {
            status: 500,
            data: { message: errorMessage },
          },
        }

        apiService.patch = jest.fn().mockRejectedValue(responsePayload)

        // Act
        await store.dispatch<any>(
          putLiveRecommendationVote(mockId, mockVote, mockName)
        )

        // Assert
        const expectedActions = [
          setRecommendationVote(),
          addErrorNotification(responsePayload as AxiosError),
          setRecommendationVoteError(errorMessage)
        ]

        expect(store.getActions()).toEqual(expectedActions)
      })
    })
  })
})
