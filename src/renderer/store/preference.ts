import { defineStore } from 'pinia'
import { isEmpty } from 'lodash'

import api from '@/api'
import {
  getLangDirection,
  pushItemToFixedLengthArray,
  removeArrayItem
} from '@shared/utils'
import { fetchBtTrackerFromSource } from '@shared/utils/tracker'
import { MAX_NUM_OF_DIRECTORIES } from '@shared/constants'

interface PreferenceState {
  engineMode: string
  config: Record<string, any>
}

export const usePreferenceStore = defineStore('preference', {
  state: (): PreferenceState => ({
    engineMode: 'MAX',
    config: {}
  }),
  getters: {
    theme: (state): string | undefined => state.config.theme,
    locale: (state): string | undefined => state.config.locale,
    direction: (state): string => getLangDirection(state.config.locale)
  },
  actions: {
    fetchPreference (): Promise<Record<string, any>> {
      return api.fetchPreference()
        .then((config: Record<string, any>) => {
          this.updatePreference(config)
          return config
        })
    },
    save (config: Record<string, any>): Promise<void> | undefined {
      // Cross-store call: save session in task store
      // Use dynamic import to avoid circular dependency at module load time
      import('@/store/task').then(({ useTaskStore }) => {
        const taskStore = useTaskStore()
        taskStore.saveSession()
      })

      if (isEmpty(config)) {
        return
      }

      this.updatePreference(config)
      return api.savePreference(config)
    },
    recordHistoryDirectory (directory: string): void {
      const { historyDirectories = [], favoriteDirectories = [] } = this.config
      const all = new Set<string>([...historyDirectories, ...favoriteDirectories])
      if (all.has(directory)) {
        return
      }

      this.addHistoryDirectory(directory)
    },
    addHistoryDirectory (directory: string): void {
      const { historyDirectories = [] } = this.config
      const history = pushItemToFixedLengthArray(
        historyDirectories,
        MAX_NUM_OF_DIRECTORIES,
        directory
      )

      this.save({ historyDirectories: history })
    },
    favoriteDirectory (directory: string): void {
      const { historyDirectories = [], favoriteDirectories = [] } = this.config
      if (favoriteDirectories.includes(directory) ||
        favoriteDirectories.length >= MAX_NUM_OF_DIRECTORIES
      ) {
        return
      }

      const favorite = pushItemToFixedLengthArray(
        favoriteDirectories,
        MAX_NUM_OF_DIRECTORIES,
        directory
      )
      const history = removeArrayItem(historyDirectories, directory)

      this.save({
        historyDirectories: history,
        favoriteDirectories: favorite
      })
    },
    cancelFavoriteDirectory (directory: string): void {
      const { historyDirectories = [], favoriteDirectories = [] } = this.config
      if (historyDirectories.includes(directory)) {
        return
      }

      const favorite = removeArrayItem(favoriteDirectories, directory)
      const history = pushItemToFixedLengthArray(
        historyDirectories,
        MAX_NUM_OF_DIRECTORIES,
        directory
      )

      this.save({
        historyDirectories: history,
        favoriteDirectories: favorite
      })
    },
    removeDirectory (directory: string): void {
      const { historyDirectories = [], favoriteDirectories = [] } = this.config

      const favorite = removeArrayItem(favoriteDirectories, directory)
      const history = removeArrayItem(historyDirectories, directory)

      this.save({
        historyDirectories: history,
        favoriteDirectories: favorite
      })
    },
    updateAppTheme (theme: string): void {
      this.updatePreference({ theme })
    },
    updateAppLocale (locale: string): void {
      this.updatePreference({ locale })
    },
    updatePreference (config: Record<string, any>): void {
      this.config = { ...this.config, ...config }
    },
    fetchBtTracker (trackerSource: string[] = []): Promise<any> {
      const { proxy = { enable: false } } = this.config
      console.log('fetchBtTracker', trackerSource, proxy)
      return fetchBtTrackerFromSource(trackerSource, proxy)
    },
    toggleEngineMode (): void {
    }
  }
})
