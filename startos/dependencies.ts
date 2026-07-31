import { settingsFile } from './fileModels/settings'
import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const settings = await settingsFile.read().const(effects)

  const deps: Awaited<ReturnType<Parameters<typeof sdk.setupDependencies>[0]>> =
    {
      // LND is the only supported lightning backend, and peerswapd cannot run
      // without one.
      lnd: {
        kind: 'running',
        versionRange: '>=0.20.1-beta',
        healthChecks: ['lnd'],
      },
    }

  // Liquid becomes a running dependency only once the user enables L-BTC swaps.
  //
  // Both of the elements package's checks are required, not just its RPC
  // ready-check: peerswapd's elements client loops on `getblockchaininfo` until
  // verificationprogress reaches 1 and does not open its own gRPC listener
  // before then, so an elements node that answers RPC but is still syncing
  // leaves peerswapd hanging mid-startup. Gating on `sync-progress` too holds
  // PeerSwap in the dependency-waiting state — which names the Liquid Sync
  // check — instead of letting it start and report its daemon as unhealthy for
  // the hours the sidechain takes to download.
  if (settings?.liquidEnabled) {
    deps.elements = {
      kind: 'running',
      versionRange: '>=23.2.1',
      healthChecks: ['elementsd', 'sync-progress'],
    }
  }

  return deps
})
