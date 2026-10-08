import { settingsFile } from './fileModels/settings'
import { depElementsDescription, depLndDescription } from './manifest/i18n'
import { sdk } from './sdk'

// LND is the only supported lightning backend, and peerswapd cannot run
// without one. The floor is the first LND whose gRPC is TLS passthrough with a
// certificate covering the bridge address peerswapd dials.
const lnd = sdk.Dependency.required('lnd', {
  description: depLndDescription,
  metadata: {
    title: 'LND',
    icon: 'https://raw.githubusercontent.com/Start9Labs/lnd-startos/f17336a10769efd8782a347662848c50c6270349/icon.svg',
  },
  versionRange: '>=0.21.1-beta:1',
  kind: 'running',
  healthChecks: ['lnd'],
})

// Both of the elements package's checks are required, not just its RPC
// ready-check: peerswapd's elements client loops on `getblockchaininfo` until
// verificationprogress reaches 1 and does not open its own gRPC listener
// before then, so an elements node that answers RPC but is still syncing
// leaves peerswapd hanging mid-startup. Gating on `sync-progress` too holds
// PeerSwap in the dependency-waiting state — which names the Liquid Sync
// check — instead of letting it start and report its daemon as unhealthy for
// the hours the sidechain takes to download.
const elements = sdk.Dependency.optional('elements', {
  description: depElementsDescription,
  metadata: {
    title: 'Elements (Liquid)',
    icon: 'https://raw.githubusercontent.com/Start9-Community/elements-startos/master/icon.svg',
  },
  versionRange: '>=23.2.1',
  kind: 'running',
  healthChecks: ['elementsd', 'sync-progress'],
  enabled: async ({ effects }) =>
    (await settingsFile.read((s) => s.liquidEnabled).const(effects)) ?? false,
})

export const dependencies = sdk.Dependencies.of()
  .addDependency(lnd)
  .addDependency(elements)
