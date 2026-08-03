// Shared constants and helpers used across the package codebase.
import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

/** Web UI port served by peerswap-web (psweb). */
export const uiPort = 1984

/**
 * peerswapd gRPC listen address inside the subcontainer. psweb and pscli
 * connect to this to drive peerswapd. Upstream default is localhost:42069.
 */
export const peerswapdHost = 'localhost'
export const peerswapdPort = 42069
export const peerswapdRpcHost = `${peerswapdHost}:${peerswapdPort}`

/**
 * Data directory for peerswapd + psweb on the `main` volume. Holds
 * peerswap.conf, policy.conf, pswebconfig.json and peerswapd's swap database.
 * Mounted into the subcontainer at /root/.peerswap (psweb/peerswapd default
 * when running as root).
 */
export const dataDirMountpoint = '/root/.peerswap'

/** Mountpoint for the (read-only) LND dependency volume. */
export const lndMountpoint = '/mnt/lnd'

/** Mountpoint for the (read-only) elements dependency volume (Liquid). */
export const elementsMountpoint = '/mnt/elements'

// --- Paths LND exposes inside its mounted volume (StartOS 0.4 lnd package) ---
// LND nests the admin macaroon under the active network:
//   <mount>/data/chain/bitcoin/<network>/admin.macaroon
// We discover <network> at runtime rather than assume mainnet — see
// resolveLndMacaroonPath() in reconcileConfig.ts.
export const lndChainDir = `${lndMountpoint}/data/chain/bitcoin`
/** Fallback when the chain dir can't be read yet (LND still initializing). */
export const lndMacaroonPath = `${lndChainDir}/mainnet/admin.macaroon`
export const lndCertPath = `${lndMountpoint}/tls.cert`

// --- elements dependency contract ---
//
// Documented in elements-startos's README § The Dependency Contract. The
// `elements` package is not an npm dependency, so — as albyhub does for Core
// Lightning — its host id and port are referenced by literal here, and its
// manifest shape is declared as a type for `mountDependency`'s generic.
export const elementsRpcHostId = 'rpc'
export const elementsRpcPort = 7041
export const elementsCookiePath = `${elementsMountpoint}/liquidv1/.cookie`
export const elementsRpcWallet = 'peerswap'

export type ElementsManifest = T.SDKManifest & {
  id: 'elements'
  volumes: ['main']
}

export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  mountpoint: dataDirMountpoint,
  readonly: false,
  subpath: null,
  type: 'directory',
})
