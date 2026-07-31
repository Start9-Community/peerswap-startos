import {
  gRPCHostId as lndGrpcHostId,
  gRPCPort as lndGrpcPort,
} from 'lnd-startos/startos/interfaces'
import { manifest as lndManifest } from 'lnd-startos/startos/manifest'
import { settingsFile } from './fileModels/settings'
import { i18n } from './i18n'
import { reconcileConfig } from './reconcileConfig'
import { sdk } from './sdk'
import {
  dataDirMountpoint,
  ElementsManifest,
  elementsMountpoint,
  elementsRpcHostId,
  elementsRpcPort,
  lndMountpoint,
  mainMounts,
  peerswapdPort,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting PeerSwap!'))

  const settings =
    (await settingsFile.read().const(effects)) ?? settingsFile.validate({})

  // Always mount the `main` volume (rw) for peerswapd/psweb data, plus the LND
  // dependency volume (ro) for the macaroon + tls.cert.
  let mounts = mainMounts.mountDependency<typeof lndManifest>({
    dependencyId: 'lnd',
    mountpoint: lndMountpoint,
    readonly: true,
    subpath: null,
    volumeId: 'main',
  })

  // LND's gRPC over the LXC bridge. LND's StartOS-issued certificate covers the
  // bridge address, so the mounted tls.cert validates against it; the old
  // `lnd.startos:10009` DNS form is retired and would fail that check.
  const lndAddress = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'lnd',
      hostId: lndGrpcHostId,
      internalPort: lndGrpcPort,
    })
    .const()
  if (!lndAddress) {
    throw new Error(
      i18n(
        'LND is not yet reachable on the internal network. Ensure LND is installed and running.',
      ),
    )
  }

  // Mount the elements (Liquid) volume read-only, and resolve its RPC address,
  // only when the user enabled Liquid swaps.
  let elementsAddress: string | null = null
  if (settings.liquidEnabled) {
    mounts = mounts.mountDependency<ElementsManifest>({
      dependencyId: 'elements',
      mountpoint: elementsMountpoint,
      readonly: true,
      subpath: null,
      volumeId: 'main',
    })

    elementsAddress = await sdk.host
      .getBridgeAddress(effects, {
        packageId: 'elements',
        hostId: elementsRpcHostId,
        internalPort: elementsRpcPort,
      })
      .const()
  }

  const peerswapSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'peerswap' },
    mounts,
    'peerswap-sub',
  )

  /**
   * ======================== Daemons ========================
   */
  return sdk.Daemons.of(effects)
    .addOneshot('reconcile-config', {
      subcontainer: peerswapSub,
      // Rewrite peerswap.conf + pswebconfig.json from StartOS-managed settings
      // BEFORE peerswapd starts: peerswapd reads a config we fully own, and
      // although psweb's SavePS() may later rewrite peerswap.conf, peerswapd
      // has already started against the correct file by then.
      exec: {
        fn: async () => {
          await reconcileConfig(effects, settings, peerswapSub, {
            lndAddress,
            elementsAddress,
          })
          return null
        },
      },
      requires: [],
    })
    .addDaemon('peerswapd', {
      subcontainer: peerswapSub,
      exec: {
        command: [
          'peerswapd',
          `--configfile=${dataDirMountpoint}/peerswap.conf`,
        ],
      },
      ready: {
        display: i18n('PeerSwap Daemon'),
        // peerswapd is healthy once its gRPC port is listening. pscli and psweb
        // connect to this same port.
        gracePeriod: 60_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, peerswapdPort, {
            successMessage: i18n('The PeerSwap daemon is ready'),
            errorMessage: i18n('The PeerSwap daemon is not ready'),
          }),
      },
      requires: ['reconcile-config'],
    })
    .addDaemon('psweb', {
      subcontainer: peerswapSub,
      // psweb serves the web UI and talks to the already-running peerswapd.
      exec: {
        command: ['psweb', `-datadir=${dataDirMountpoint}`],
      },
      ready: {
        display: i18n('Web Interface'),
        gracePeriod: 30_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['peerswapd'],
    })
})
