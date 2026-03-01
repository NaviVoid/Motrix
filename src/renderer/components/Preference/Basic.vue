<template>
  <el-container class="content panel" direction="vertical">
    <el-header class="panel-header" height="84">
      <h4 class="hidden-xs-only">{{ title }}</h4>
      <mo-subnav-switcher
        :title="title"
        :subnavs="subnavs"
        class="hidden-sm-and-up"
      />
    </el-header>
    <el-main class="panel-content">
      <el-form
        class="form-preference"
        ref="basicForm"
        label-position="right"
        size="small"
        :model="form"
        :rules="rules"
      >
        <el-form-item
          :label="`${$t('preferences.appearance')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            <mo-theme-switcher
              v-model="form.theme"
              @change="handleThemeChange"
              ref="themeSwitcher"
            />
          </el-col>
          <el-col v-if="showHideAppMenuOption" class="form-item-sub" :span="16">
            <el-checkbox v-model="form.hideAppMenu">
              {{ $t('preferences.hide-app-menu') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="16">
            <el-checkbox v-model="form.autoHideWindow">
              {{ $t('preferences.auto-hide-window') }}
            </el-checkbox>
          </el-col>
          <el-col v-if="isMac" class="form-item-sub" :span="16">
            <el-checkbox v-model="form.traySpeedometer">
              {{ $t('preferences.tray-speedometer') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="16">
            <el-checkbox v-model="form.showProgressBar">
              {{ $t('preferences.show-progress-bar') }}
            </el-checkbox>
          </el-col>
        </el-form-item>
        <el-form-item
          v-if="isMac"
          :label="`${$t('preferences.run-mode')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            <el-select v-model="form.runMode">
              <el-option
                v-for="item in runModes"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.language')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="16">
            <el-select
              v-model="form.locale"
              :placeholder="$t('preferences.change-language')">
              <el-option
                v-for="item in locales"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.startup')}: `"
          :label-width="formLabelWidth"
        >
          <el-col
            class="form-item-sub"
            :span="24"
            v-if="!isLinux"
          >
            <el-checkbox v-model="form.openAtLogin">
              {{ $t('preferences.open-at-login') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.keepWindowState">
              {{ $t('preferences.keep-window-state') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.resumeAllWhenAppLaunched">
              {{ $t('preferences.auto-resume-all') }}
            </el-checkbox>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.default-dir')}: `"
          :label-width="formLabelWidth"
        >
          <el-input placeholder="" v-model="form.dir" :readonly="isMas">
            <template #prepend>
              <mo-history-directory
                @selected="handleHistoryDirectorySelected"
              />
            </template>
            <template #append>
              <mo-select-directory
                v-if="isRenderer"
                @selected="handleNativeDirectorySelected"
              />
            </template>
          </el-input>
          <div class="el-form-item__info" v-if="isMas" style="margin-top: 8px;">
            {{ $t('preferences.mas-default-dir-tips') }}
          </div>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.transfer-settings')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            {{ $t('preferences.transfer-speed-upload') }}
            <el-input-number
              v-model="maxOverallUploadLimitParsed"
              controls-position="right"
              :min="0"
              :max="65535"
              :step="1"
              :label="$t('preferences.transfer-speed-download')"
              >
            </el-input-number>
            <el-select
              style="width: 100px;"
              v-model="uploadUnit"
              @change="handleUploadChange">
              <el-option
                v-for="item in speedUnits"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            {{ $t('preferences.transfer-speed-download') }}
            <el-input-number
              v-model="maxOverallDownloadLimitParsed"
              controls-position="right"
              :min="0"
              :max="65535"
              :step="1"
              :label="$t('preferences.transfer-speed-download')">
            </el-input-number>
            <el-select
              style="width: 100px;"
              v-model="downloadUnit"
              @change="handleDownloadChange">
              <el-option
                v-for="item in speedUnits"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.bt-settings')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.btSaveMetadata">
              {{ $t('preferences.bt-save-metadata') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox
              v-model="form.btAutoDownloadContent"
            >
              {{ $t('preferences.bt-auto-download-content') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox
              v-model="form.btForceEncryption"
            >
              {{ $t('preferences.bt-force-encryption') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-switch
              v-model="form.keepSeeding"
              :active-text="$t('preferences.keep-seeding')"
              @change="onKeepSeedingChange"
            >
            </el-switch>
          </el-col>
          <el-col class="form-item-sub" :span="24" v-if="!form.keepSeeding">
            {{ $t('preferences.seed-ratio') }}
            <el-input-number
              v-model="form.seedRatio"
              controls-position="right"
              :min="1"
              :max="100"
              :step="0.1"
              :label="$t('preferences.seed-ratio')">
            </el-input-number>
          </el-col>
          <el-col class="form-item-sub" :span="24" v-if="!form.keepSeeding">
            {{ $t('preferences.seed-time') }}
            ({{ $t('preferences.seed-time-unit') }})
            <el-input-number
              v-model="form.seedTime"
              controls-position="right"
              :min="60"
              :max="525600"
              :step="1"
              :label="$t('preferences.seed-time')">
            </el-input-number>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.task-manage')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            {{ $t('preferences.max-concurrent-downloads') }}
            <el-input-number
              v-model="form.maxConcurrentDownloads"
              controls-position="right"
              :min="1"
              :max="maxConcurrentDownloads"
              :label="$t('preferences.max-concurrent-downloads')">
            </el-input-number>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            {{ $t('preferences.max-connection-per-server') }}
            <el-input-number
              v-model="form.maxConnectionPerServer"
              controls-position="right"
              :min="1"
              :max="form.engineMaxConnectionPerServer"
              :label="$t('preferences.max-connection-per-server')">
            </el-input-number>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.continue">
              {{ $t('preferences.continue') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.newTaskShowDownloading">
              {{ $t('preferences.new-task-show-downloading') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.taskNotification">
              {{ $t('preferences.task-completed-notify') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.noConfirmBeforeDeleteTask">
              {{ $t('preferences.no-confirm-before-delete-task') }}
            </el-checkbox>
          </el-col>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button
          type="primary"
          @click="submitForm('basicForm')"
        >
          {{ $t('preferences.save') }}
        </el-button>
        <el-button
          @click="resetForm('basicForm')"
        >
          {{ $t('preferences.discard') }}
        </el-button>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
  import { ref, computed, getCurrentInstance } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { onBeforeRouteLeave } from 'vue-router'
  import is from 'electron-is'
  import { storeToRefs } from 'pinia'
  import { useAppStore } from '@/store/app'
  import { usePreferenceStore } from '@/store/preference'
  import { cloneDeep, extend, isEmpty } from 'lodash'
  import MoSubnavSwitcher from '@/components/Subnav/SubnavSwitcher.vue'
  import MoHistoryDirectory from '@/components/Preference/HistoryDirectory.vue'
  import MoSelectDirectory from '@/components/Native/SelectDirectory.vue'
  import MoThemeSwitcher from '@/components/Preference/ThemeSwitcher.vue'
  import { availableLanguages, getLanguage } from '@shared/locales'
  import { getLocaleManager } from '@/components/Locale'
  import {
    calcFormLabelWidth,
    changedConfig,
    checkIsNeedRestart,
    convertLineToComma,
    diffConfig,
    extractSpeedUnit
  } from '@shared/utils'
  import {
    APP_RUN_MODE,
    EMPTY_STRING,
    ENGINE_MAX_CONCURRENT_DOWNLOADS,
    ENGINE_RPC_PORT
  } from '@shared/constants'
  import { reduceTrackerString } from '@shared/utils/tracker'

  defineOptions({ name: 'mo-preference-basic' })

  const { t } = useI18n()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const preferenceStore = usePreferenceStore()
  const appStore = useAppStore()
  const { config } = storeToRefs(preferenceStore)

  const initForm = (cfg: any) => {
    const {
      autoHideWindow,
      btForceEncryption,
      btSaveMetadata,
      dir,
      engineMaxConnectionPerServer,
      followMetalink,
      followTorrent,
      hideAppMenu,
      keepSeeding,
      keepWindowState,
      locale,
      maxConcurrentDownloads,
      maxConnectionPerServer,
      maxOverallDownloadLimit,
      maxOverallUploadLimit,
      newTaskShowDownloading,
      noConfirmBeforeDeleteTask,
      openAtLogin,
      pauseMetadata,
      resumeAllWhenAppLaunched,
      runMode,
      seedRatio,
      seedTime,
      showProgressBar,
      taskNotification,
      theme,
      traySpeedometer
    } = cfg

    const btAutoDownloadContent = followTorrent &&
      followMetalink &&
      !pauseMetadata

    const result = {
      autoHideWindow,
      btAutoDownloadContent,
      btForceEncryption,
      btSaveMetadata,
      continue: cfg.continue,
      dir,
      engineMaxConnectionPerServer,
      followMetalink,
      followTorrent,
      hideAppMenu,
      keepSeeding,
      keepWindowState,
      locale,
      maxConcurrentDownloads,
      maxConnectionPerServer,
      maxOverallDownloadLimit,
      maxOverallUploadLimit,
      newTaskShowDownloading,
      noConfirmBeforeDeleteTask,
      openAtLogin,
      pauseMetadata,
      resumeAllWhenAppLaunched,
      runMode,
      seedRatio,
      seedTime,
      showProgressBar,
      taskNotification,
      theme,
      traySpeedometer
    }
    return result
  }

  const formOriginalInit = initForm(preferenceStore.config)
  let formInit: any = {}
  formInit = initForm(extend(formInit, formOriginalInit, changedConfig.basic))

  const form = ref<any>(formInit)
  const formLabelWidth = ref(calcFormLabelWidth(preferenceStore.config.locale))
  const formOriginal = ref<any>(formOriginalInit)
  const locales = ref(availableLanguages)
  const rules = ref({})

  const basicForm = ref<any>(null)
  const themeSwitcher = ref<any>(null)

  const isRenderer = computed(() => is.renderer())
  const isMac = computed(() => is.macOS())
  const isMas = computed(() => is.mas())
  const isLinux = computed(() => is.linux())

  const title = computed(() => t('preferences.basic'))

  const maxConcurrentDownloads = computed(() => ENGINE_MAX_CONCURRENT_DOWNLOADS)

  const downloadUnit = computed({
    get () {
      const { maxOverallDownloadLimit } = form.value
      return extractSpeedUnit(maxOverallDownloadLimit)
    },
    set (_value: string) {
      // setter needed for v-model binding; actual update handled in handleDownloadChange
    }
  })

  const uploadUnit = computed({
    get () {
      const { maxOverallUploadLimit } = form.value
      return extractSpeedUnit(maxOverallUploadLimit)
    },
    set (_value: string) {
      // setter needed for v-model binding; actual update handled in handleUploadChange
    }
  })

  const maxOverallDownloadLimitParsed = computed({
    get () {
      return parseInt(form.value.maxOverallDownloadLimit)
    },
    set (value: number) {
      const limit = value > 0 ? `${value}${downloadUnit.value}` : 0
      form.value.maxOverallDownloadLimit = limit
    }
  })

  const maxOverallUploadLimitParsed = computed({
    get () {
      return parseInt(form.value.maxOverallUploadLimit)
    },
    set (value: number) {
      const limit = value > 0 ? `${value}${uploadUnit.value}` : 0
      form.value.maxOverallUploadLimit = limit
    }
  })

  const runModes = computed(() => {
    let result = [
      {
        label: t('preferences.run-mode-standard'),
        value: APP_RUN_MODE.STANDARD
      },
      {
        label: t('preferences.run-mode-tray'),
        value: APP_RUN_MODE.TRAY
      }
    ]

    if (isMac.value) {
      result = [
        ...result,
        {
          label: t('preferences.run-mode-hide-tray'),
          value: APP_RUN_MODE.HIDE_TRAY
        }
      ]
    }

    return result
  })

  const speedUnits = computed(() => {
    return [
      {
        label: 'KB/s',
        value: 'K'
      },
      {
        label: 'MB/s',
        value: 'M'
      }
    ]
  })

  const subnavs = computed(() => {
    return [
      {
        key: 'basic',
        title: t('preferences.basic'),
        route: '/preference/basic'
      },
      {
        key: 'advanced',
        title: t('preferences.advanced'),
        route: '/preference/advanced'
      },
      {
        key: 'lab',
        title: t('preferences.lab'),
        route: '/preference/lab'
      }
    ]
  })

  const showHideAppMenuOption = computed(() => is.windows() || is.linux())

  const rpcDefaultPort = computed(() => ENGINE_RPC_PORT)

  function handleLocaleChange (locale: string) {
    const lng = getLanguage(locale)
    getLocaleManager().changeLanguage(lng)
  }

  function handleThemeChange (theme: string) {
    form.value.theme = theme
  }

  function handleDownloadChange (value: string) {
    const speedLimit = parseInt(form.value.maxOverallDownloadLimit, 10)
    downloadUnit.value = value
    const limit = speedLimit > 0 ? `${speedLimit}${value}` : 0
    form.value.maxOverallDownloadLimit = limit
  }

  function handleUploadChange (value: string) {
    const speedLimit = parseInt(form.value.maxOverallUploadLimit, 10)
    uploadUnit.value = value
    const limit = speedLimit > 0 ? `${speedLimit}${value}` : 0
    form.value.maxOverallUploadLimit = limit
  }

  function onKeepSeedingChange (enable: boolean) {
    form.value.seedRatio = enable ? 0 : 1
    form.value.seedTime = enable ? 525600 : 60
  }

  function handleHistoryDirectorySelected (dir: string) {
    form.value.dir = dir
  }

  function handleNativeDirectorySelected (dir: string) {
    form.value.dir = dir
    preferenceStore.recordHistoryDirectory(dir)
  }

  function onDirectorySelected (dir: string) {
    form.value.dir = dir
  }

  function syncFormConfig () {
    preferenceStore.fetchPreference()
      .then((cfg: any) => {
        form.value = initForm(cfg)
        formOriginal.value = cloneDeep(form.value)
      })
  }

  function submitForm (formName: string) {
    basicForm.value.validate((valid: boolean) => {
      if (!valid) {
        console.error('[Motrix] preference form valid:', valid)
        return false
      }

      const data: any = {
        ...diffConfig(formOriginal.value, form.value),
        ...changedConfig.advanced
      }

      const {
        autoHideWindow,
        btAutoDownloadContent,
        btTracker,
        rpcListenPort
      } = data

      if ('btAutoDownloadContent' in data) {
        data.followTorrent = btAutoDownloadContent
        data.followMetalink = btAutoDownloadContent
        data.pauseMetadata = !btAutoDownloadContent
      }

      if (btTracker) {
        data.btTracker = reduceTrackerString(convertLineToComma(btTracker))
      }

      if (rpcListenPort === EMPTY_STRING) {
        data.rpcListenPort = rpcDefaultPort.value
      }

      console.log('[Motrix] preference changed data:', data)

      preferenceStore.save(data)
        .then(() => {
          appStore.fetchEngineOptions()
          syncFormConfig()
          $msg.success(t('preferences.save-success-message'))
        })
        .catch(() => {
          $msg.success(t('preferences.save-fail-message'))
        })

      changedConfig.basic = {}
      changedConfig.advanced = {}

      if (isRenderer.value) {
        if ('autoHideWindow' in data) {
          window.electronAPI.sendCommand('application:auto-hide-window', autoHideWindow)
        }

        if (checkIsNeedRestart(data)) {
          window.electronAPI.sendCommand('application:relaunch')
        }
      }
    })
  }

  function resetForm (formName: string) {
    syncFormConfig()
  }

  onBeforeRouteLeave((to, from, next) => {
    changedConfig.basic = diffConfig(formOriginal.value, form.value)
    if (to.path === '/preference/advanced') {
      next()
    } else {
      if (isEmpty(changedConfig.basic) && isEmpty(changedConfig.advanced)) {
        next()
      } else {
        window.electronAPI.showMessageBox({
          type: 'warning',
          title: t('preferences.not-saved'),
          message: t('preferences.not-saved-confirm'),
          buttons: [t('app.yes'), t('app.no')],
          cancelId: 1
        }).then(({ response }: any) => {
          if (response === 0) {
            changedConfig.basic = {}
            changedConfig.advanced = {}
            next()
          }
        })
      }
    }
  })
</script>
