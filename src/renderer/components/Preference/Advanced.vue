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
        ref="advancedForm"
        label-position="right"
        size="small"
        :model="form"
        :rules="rules"
      >
        <el-form-item
          :label="`${$t('preferences.auto-update')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.autoCheckUpdate">
              {{ $t('preferences.auto-check-update') }}
            </el-checkbox>
            <div
              class="el-form-item__info"
              style="margin-top: 8px;"
              v-if="form.lastCheckUpdateTime !== 0"
            >
              {{
                $t('preferences.last-check-update-time') + ': ' +
                (
                  form.lastCheckUpdateTime !== 0 ?
                    new Date(form.lastCheckUpdateTime).toLocaleString() :
                    new Date().toLocaleString()
                )
              }}
              <span class="action-link" @click.prevent="onCheckUpdateClick">
                {{ $t('app.check-updates-now') }}
              </span>
            </div>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.proxy')}: `"
          :label-width="formLabelWidth"
        >
          <el-switch
            v-model="form.proxy.enable"
            :active-text="$t('preferences.enable-proxy')"
            @change="onProxyEnableChange"
            >
          </el-switch>
        </el-form-item>
        <el-form-item
          :label-width="formLabelWidth"
          v-if="form.proxy.enable"
          style="margin-top: -16px;"
        >
          <el-col
            class="form-item-sub"
            :xs="24"
            :sm="20"
            :md="16"
            :lg="16"
          >
            <el-input
              placeholder="[http://][USER:PASSWORD@]HOST[:PORT]"
              @change="onProxyServerChange"
              v-model="form.proxy.server">
            </el-input>
          </el-col>
          <el-col
            class="form-item-sub"
            :xs="24"
            :sm="24"
            :md="20"
            :lg="20"
          >
            <el-input
              type="textarea"
              rows="2"
              auto-complete="off"
              @change="handleProxyBypassChange"
              :placeholder="`${$t('preferences.proxy-bypass-input-tips')}`"
              v-model="form.proxy.bypass">
            </el-input>
          </el-col>
          <el-col
            class="form-item-sub"
            :xs="24"
            :sm="24"
            :md="20"
            :lg="20"
          >
            <el-select
              class="proxy-scope"
              v-model="form.proxy.scope"
              multiple
            >
              <el-option
                v-for="item in proxyScopeOptions"
                :key="item"
                :label="$t(`preferences.proxy-scope-${item}`)"
                :value="item"
              />
            </el-select>
            <div class="el-form-item__info" style="margin-top: 8px;">
              <a target="_blank" href="https://github.com/agalwood/Motrix/wiki/Proxy" rel="noopener noreferrer">
                {{ $t('preferences.proxy-tips') }}
                <mo-icon name="link" width="12" height="12" />
              </a>
            </div>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.bt-tracker')}: `"
          :label-width="formLabelWidth"
        >
          <div class="form-item-sub bt-tracker">
            <el-row :gutter="10" style="line-height: 0;">
              <el-col :span="20">
                <div class="track-source">
                  <el-select
                    class="select-track-source"
                    v-model="form.trackerSource"
                    allow-create
                    filterable
                    multiple
                  >
                    <el-option-group
                      v-for="group in trackerSourceOptions"
                      :key="group.label"
                      :label="group.label"
                    >
                      <el-option
                        v-for="item in group.options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      >
                        <span style="float: left">{{ item.label }}</span>
                        <span style="float: right; margin-right: 24px">
                          <el-tag
                            type="success"
                            size="small"
                            v-if="item.cdn"
                          >
                            CDN
                          </el-tag>
                        </span>
                      </el-option>
                    </el-option-group>
                  </el-select>
                </div>
              </el-col>
              <el-col :span="3">
                <div class="sync-tracker">
                  <el-tooltip
                    class="item"
                    effect="dark"
                    :content="$t('preferences.sync-tracker-tips')"
                    placement="bottom"
                  >
                    <el-button
                      @click="syncTrackerFromSource"
                      class="sync-tracker-btn"
                    >
                      <mo-icon
                        name="refresh"
                        width="12"
                        height="12"
                        :spin="true"
                        v-if="trackerSyncing"
                      />
                      <mo-icon name="sync" width="12" height="12" v-else />
                    </el-button>
                  </el-tooltip>
                </div>
              </el-col>
            </el-row>
            <el-input
              type="textarea"
              rows="3"
              auto-complete="off"
              :placeholder="`${$t('preferences.bt-tracker-input-tips')}`"
              v-model="form.btTracker">
            </el-input>
            <div class="el-form-item__info" style="margin-top: 8px;">
              {{ $t('preferences.bt-tracker-tips') }}
              <a target="_blank" href="https://github.com/ngosang/trackerslist" rel="noopener noreferrer">
                ngosang/trackerslist
                <mo-icon name="link" width="12" height="12" />
              </a>
              <a target="_blank" href="https://github.com/XIU2/TrackersListCollection" rel="noopener noreferrer">
                XIU2/TrackersListCollection
                <mo-icon name="link" width="12" height="12" />
              </a>
            </div>
          </div>
          <div class="form-item-sub">
            <el-checkbox v-model="form.autoSyncTracker">
              {{ $t('preferences.auto-sync-tracker') }}
            </el-checkbox>
            <div class="el-form-item__info" style="margin-top: 8px;" v-if="form.lastSyncTrackerTime > 0">
              {{ new Date(form.lastSyncTrackerTime).toLocaleString() }}
            </div>
          </div>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.rpc')}: `"
          :label-width="formLabelWidth"
        >
          <el-row style="margin-bottom: 8px;">
            <el-col
              class="form-item-sub"
              :xs="24"
              :sm="18"
              :md="10"
              :lg="10"
            >
              {{ $t('preferences.rpc-listen-port') }}
              <el-input
                :placeholder="rpcDefaultPort"
                :maxlength="8"
                v-model="form.rpcListenPort"
                @change="onRpcListenPortChange"
              >
                <template #append>
                  <i @click.prevent="onRpcPortDiceClick">
                    <mo-icon name="dice" width="12" height="12" />
                  </i>
                </template>
              </el-input>
            </el-col>
          </el-row>
          <el-row style="margin-bottom: 8px;">
            <el-col
              class="form-item-sub"
              :xs="24"
              :sm="18"
              :md="18"
              :lg="18"
            >
              {{ $t('preferences.rpc-secret') }}
              <el-input
                :show-password="hideRpcSecret"
                placeholder="RPC Secret"
                :maxlength="64"
                v-model="form.rpcSecret"
              >
                <template #append>
                  <i @click.prevent="onRpcSecretDiceClick">
                    <mo-icon name="dice" width="12" height="12" />
                  </i>
                </template>
              </el-input>
              <div class="el-form-item__info" style="margin-top: 8px;">
                <a target="_blank" href="https://github.com/agalwood/Motrix/wiki/RPC" rel="noopener noreferrer">
                  {{ $t('preferences.rpc-secret-tips') }}
                  <mo-icon name="link" width="12" height="12" />
                </a>
              </div>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.port')}: `"
          :label-width="formLabelWidth"
        >
          <el-row style="margin-bottom: 8px;">
            <el-col
              class="form-item-sub"
              :xs="24"
              :sm="18"
              :md="12"
              :lg="12"
            >
              <el-switch
                v-model="form.enableUpnp"
                active-text="UPnP/NAT-PMP"
                >
              </el-switch>
            </el-col>
          </el-row>
          <el-row style="margin-bottom: 8px;">
            <el-col class="form-item-sub"
              :xs="24"
              :sm="18"
              :md="10"
              :lg="10"
            >
              {{ $t('preferences.bt-port') }}
              <el-input
                placeholder="BT Port"
                :maxlength="8"
                v-model="form.listenPort"
              >
                <template #append>
                  <i @click.prevent="onBtPortDiceClick">
                    <mo-icon name="dice" width="12" height="12" />
                  </i>
                </template>
              </el-input>
            </el-col>
          </el-row>
          <el-row>
            <el-col
              class="form-item-sub"
              :xs="24"
              :sm="18"
              :md="10"
              :lg="10"
            >
              {{ $t('preferences.dht-port') }}
              <el-input
                placeholder="DHT Port"
                :maxlength="8"
                v-model="form.dhtListenPort"
              >
                <template #append>
                  <i @click.prevent="onDhtPortDiceClick">
                    <mo-icon name="dice" width="12" height="12" />
                  </i>
                </template>
              </el-input>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.download-protocol')}: `"
          :label-width="formLabelWidth"
        >
          {{ $t('preferences.protocols-default-client') }}
          <el-col class="form-item-sub" :span="24">
            <el-switch
              v-model="form.protocols.magnet"
              :active-text="$t('preferences.protocols-magnet')"
              @change="(val) => onProtocolsChange('magnet', val)"
              >
            </el-switch>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-switch
              v-model="form.protocols.thunder"
              :active-text="$t('preferences.protocols-thunder')"
              @change="(val) => onProtocolsChange('thunder', val)"
              >
            </el-switch>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.user-agent')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            {{ $t('preferences.mock-user-agent') }}
            <el-input
              type="textarea"
              rows="2"
              auto-complete="off"
              placeholder="User-Agent"
              v-model="form.userAgent">
            </el-input>
            <el-button-group class="ua-group">
              <el-button @click="() => changeUA('aria2')">Aria2</el-button>
              <el-button @click="() => changeUA('transmission')">Transmission</el-button>
              <el-button @click="() => changeUA('chrome')">Chrome</el-button>
              <el-button @click="() => changeUA('du')">du</el-button>
            </el-button-group>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.developer')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            {{ $t('preferences.aria2-conf-path') }}
            <el-input placeholder="" disabled v-model="aria2ConfPath">
              <template #append>
                <mo-show-in-folder
                  v-if="isRenderer"
                  :path="aria2ConfPath"
                />
              </template>
            </el-input>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            {{ $t('preferences.download-session-path') }}
            <el-input placeholder="" disabled v-model="sessionPath">
              <template #append>
                <mo-show-in-folder
                  v-if="isRenderer"
                  :path="sessionPath"
                />
              </template>
            </el-input>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            {{ $t('preferences.app-log-path') }}
            <el-row :gutter="16">
              <el-col :span="18">
                <el-input placeholder="" disabled v-model="logPath">
                  <template #append>
                    <mo-show-in-folder
                    v-if="isRenderer"
                    :path="logPath"
                    />
                  </template>
                </el-input>
              </el-col>
              <el-col :span="6">
                <el-select v-model="form.logLevel">
                  <el-option
                    v-for="item in logLevels"
                    :key="item"
                    :label="item"
                    :value="item">
                  </el-option>
                </el-select>
              </el-col>
            </el-row>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-button plain type="warning" @click="() => onSessionResetClick()">
              {{ $t('preferences.session-reset') }}
            </el-button>
            <el-button plain type="danger" @click="() => onFactoryResetClick()">
              {{ $t('preferences.factory-reset') }}
            </el-button>
          </el-col>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button
          type="primary"
          @click="submitForm('advancedForm')"
        >
          {{ $t('preferences.save') }}
        </el-button>
        <el-button
          @click="resetForm('advancedForm')"
        >
          {{ $t('preferences.discard') }}
        </el-button>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
  import { ref, computed, watch, getCurrentInstance } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { onBeforeRouteLeave } from 'vue-router'
  import is from 'electron-is'
  import { storeToRefs } from 'pinia'
  import { useAppStore } from '@/store/app'
  import { usePreferenceStore } from '@/store/preference'
  import { useTaskStore } from '@/store/task'
  import { cloneDeep, extend, isEmpty } from 'lodash'
  import randomize from 'randomatic'
  import MoShowInFolder from '@/components/Native/ShowInFolder.vue'
  import MoSubnavSwitcher from '@/components/Subnav/SubnavSwitcher.vue'
  import userAgentMap from '@shared/ua'
  import {
    EMPTY_STRING,
    ENGINE_RPC_PORT,
    LOG_LEVELS,
    TRACKER_SOURCE_OPTIONS,
    PROXY_SCOPE_OPTIONS
  } from '@shared/constants'
  import {
    buildRpcUrl,
    calcFormLabelWidth,
    changedConfig,
    checkIsNeedRestart,
    convertCommaToLine,
    convertLineToComma,
    diffConfig,
    generateRandomInt
  } from '@shared/utils'
  import { convertTrackerDataToLine, reduceTrackerString } from '@shared/utils/tracker'
  import '@/components/Icons/dice'
  import '@/components/Icons/sync'
  import '@/components/Icons/refresh'
  import { getLanguage } from '@shared/locales'
  import { getLocaleManager } from '@/components/Locale'

  defineOptions({ name: 'mo-preference-advanced' })

  const { t } = useI18n()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const preferenceStore = usePreferenceStore()
  const appStore = useAppStore()
  const taskStore = useTaskStore()
  const { config } = storeToRefs(preferenceStore)

  const aria2ConfPath = computed(() => config.value.aria2ConfPath)
  const logPath = computed(() => config.value.logPath)
  const sessionPath = computed(() => config.value.sessionPath)

  const initForm = (cfg: any) => {
    const {
      autoCheckUpdate,
      autoSyncTracker,
      btTracker,
      dhtListenPort,
      enableUpnp,
      hideAppMenu,
      lastCheckUpdateTime,
      lastSyncTrackerTime,
      listenPort,
      logLevel,
      protocols,
      proxy,
      rpcListenPort,
      rpcSecret,
      trackerSource,
      useProxy,
      userAgent
    } = cfg
    const result = {
      autoCheckUpdate,
      autoSyncTracker,
      btTracker: convertCommaToLine(btTracker),
      dhtListenPort,
      enableUpnp,
      hideAppMenu,
      lastCheckUpdateTime,
      lastSyncTrackerTime,
      listenPort,
      logLevel,
      proxy: cloneDeep(proxy),
      protocols: { ...protocols },
      rpcListenPort,
      rpcSecret,
      trackerSource,
      useProxy,
      userAgent
    }
    return result
  }

  const formOriginalInit = initForm(preferenceStore.config)
  let formInit: any = {}
  formInit = initForm(extend(formInit, formOriginalInit, changedConfig.advanced))

  const form = ref<any>(formInit)
  const formLabelWidth = ref(calcFormLabelWidth(preferenceStore.config.locale))
  const formOriginal = ref<any>(formOriginalInit)
  const hideRpcSecret = ref(true)
  const proxyScopeOptions = ref(PROXY_SCOPE_OPTIONS)
  const rules = ref({})
  const trackerSourceOptions = ref(TRACKER_SOURCE_OPTIONS)
  const trackerSyncing = ref(false)

  const advancedForm = ref<any>(null)

  const isRenderer = computed(() => is.renderer())

  const title = computed(() => t('preferences.advanced'))

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

  const rpcDefaultPort = computed(() => ENGINE_RPC_PORT)

  const logLevels = computed(() => LOG_LEVELS)

  watch(() => form.value.rpcListenPort, (val: any) => {
    const url = buildRpcUrl({
      port: form.value.rpcListenPort,
      secret: val
    })
    navigator.clipboard.writeText(url)
  })

  watch(() => form.value.rpcSecret, (val: any) => {
    const url = buildRpcUrl({
      port: form.value.rpcListenPort,
      secret: val
    })
    navigator.clipboard.writeText(url)
  })

  function handleLocaleChange (locale: string) {
    const lng = getLanguage(locale)
    getLocaleManager().changeLanguage(lng)
  }

  function onCheckUpdateClick () {
    window.electronAPI.sendCommand('application:check-for-updates')
    $msg.info(t('app.checking-for-updates'))
    preferenceStore.fetchPreference()
      .then((cfg: any) => {
        const { lastCheckUpdateTime } = cfg
        form.value.lastCheckUpdateTime = lastCheckUpdateTime
      })
  }

  function syncTrackerFromSource () {
    trackerSyncing.value = true
    const { trackerSource } = form.value
    preferenceStore.fetchBtTracker(trackerSource)
      .then((data: any) => {
        const tracker = convertTrackerDataToLine(data)
        form.value.lastSyncTrackerTime = Date.now()
        form.value.btTracker = tracker
        trackerSyncing.value = false
      })
      .catch((_: any) => {
        trackerSyncing.value = false
      })
  }

  function onProtocolsChange (protocol: string, enabled: boolean) {
    const { protocols } = form.value
    form.value.protocols = {
      ...protocols,
      [protocol]: enabled
    }
  }

  function onProxyEnableChange (enable: boolean) {
    form.value.proxy = {
      ...form.value.proxy,
      enable
    }
  }

  function onProxyServerChange (server: string) {
    form.value.proxy = {
      ...form.value.proxy,
      server
    }
  }

  function handleProxyBypassChange (bypass: string) {
    form.value.proxy = {
      ...form.value.proxy,
      bypass: convertLineToComma(bypass)
    }
  }

  function onProxyScopeChange (scope: string[]) {
    form.value.proxy = {
      ...form.value.proxy,
      scope: [...scope]
    }
  }

  function changeUA (type: string) {
    const ua = userAgentMap[type]
    if (!ua) {
      return
    }
    form.value.userAgent = ua
  }

  function onBtPortDiceClick () {
    const port = generateRandomInt(20000, 24999)
    form.value.listenPort = port
  }

  function onDhtPortDiceClick () {
    const port = generateRandomInt(25000, 29999)
    form.value.dhtListenPort = port
  }

  function onRpcListenPortChange (value: any) {
    console.log('onRpcListenPortChange===>', value)
    if (EMPTY_STRING === value) {
      form.value.rpcListenPort = rpcDefaultPort.value
    }
  }

  function onRpcPortDiceClick () {
    const port = generateRandomInt(ENGINE_RPC_PORT, 20000)
    form.value.rpcListenPort = port
  }

  function onRpcSecretDiceClick () {
    hideRpcSecret.value = false
    const rpcSecret = randomize('Aa0', 16)
    form.value.rpcSecret = rpcSecret

    setTimeout(() => {
      hideRpcSecret.value = true
    }, 2000)
  }

  function onSessionResetClick () {
    window.electronAPI.showMessageBox({
      type: 'warning',
      title: t('preferences.session-reset'),
      message: t('preferences.session-reset-confirm'),
      buttons: [t('app.yes'), t('app.no')],
      cancelId: 1
    }).then(({ response }: any) => {
      if (response === 0) {
        taskStore.purgeTaskRecord()
        taskStore.pauseAllTask()
          .then(() => {
            window.electronAPI.sendCommand('application:reset-session')
          })
      }
    })
  }

  function onFactoryResetClick () {
    window.electronAPI.showMessageBox({
      type: 'warning',
      title: t('preferences.factory-reset'),
      message: t('preferences.factory-reset-confirm'),
      buttons: [t('app.yes'), t('app.no')],
      cancelId: 1
    }).then(({ response }: any) => {
      if (response === 0) {
        window.electronAPI.sendCommand('application:factory-reset')
      }
    })
  }

  function syncFormConfig () {
    preferenceStore.fetchPreference()
      .then((cfg: any) => {
        form.value = initForm(cfg)
        formOriginal.value = cloneDeep(form.value)
      })
  }

  function submitForm (formName: string) {
    advancedForm.value.validate((valid: boolean) => {
      if (!valid) {
        console.error('[Motrix] preference form valid:', valid)
        return false
      }

      const data: any = {
        ...diffConfig(formOriginal.value, form.value),
        ...changedConfig.basic
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
        .catch((_e: any) => {
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
    changedConfig.advanced = diffConfig(formOriginal.value, form.value)
    if (to.path === '/preference/basic') {
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

<style lang="scss">
.proxy-scope {
  width: 100%;
}
.bt-tracker {
  position: relative;
  .sync-tracker-btn {
    line-height: 0;
  }
  .track-source {
    margin-bottom: 16px;
    .select-track-source {
      width: 100%;
    }
    .el-select__tags {
      overflow-x: auto;
    }
  }
}
.ua-group {
  margin-top: 8px;
}
</style>
