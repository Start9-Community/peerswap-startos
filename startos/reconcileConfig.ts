import { SubContainer, T } from '@start9labs/start-sdk'
import { PeerswapConf, peerswapConfFile } from './fileModels/peerswapConf'
import { pswebConfigFile } from './fileModels/pswebConfig'
import { Settings } from './fileModels/settings'
import {
  elementsCookiePath,
  elementsRpcPort,
  elementsRpcWallet,
  lndCertPath,
  lndChainDir,
  lndMacaroonPath as lndMacaroonPathDefault,
  peerswapdRpcHost,
  uiPort,
} from './utils'

/** Addresses resolved from the StartOS bridge before the oneshot runs. */
export type ResolvedHosts = {
  lndAddress: string
  elementsAddress: string | null
}

/** What peerswapd and psweb each need to reach elementsd, as separate keys. */
type ElementsTarget = {
  host: string
  port: string
  user: string
  pass: string
}

/**
 * Resolve LND's admin macaroon path by discovering the active network from the
 * mounted LND volume, instead of assuming mainnet. LND nests the macaroon under
 * `<chainDir>/<network>/admin.macaroon`; whichever network LND actually runs is
 * the one directory present. We prefer mainnet when several exist, then fall
 * back to the mainnet path if the dir isn't readable yet (LND still
 * initializing — a later reconcile will fix it).
 */
async function resolveLndMacaroonPath(sub: SubContainer<any>): Promise<string> {
  const preferred = ['mainnet', 'signet', 'testnet', 'testnet4', 'regtest']
  try {
    const ls = await sub.exec(['ls', lndChainDir])
    if (ls.exitCode !== 0) return lndMacaroonPathDefault
    const entries = String(ls.stdout).split('\n').filter(Boolean)
    const ordered = [
      ...preferred.filter((n) => entries.includes(n)),
      ...entries.filter((n) => !preferred.includes(n)),
    ]
    for (const net of ordered) {
      const candidate = `${lndChainDir}/${net}/admin.macaroon`
      if ((await sub.exec(['test', '-f', candidate])).exitCode === 0)
        return candidate
    }
  } catch {
    // chain dir not present/readable yet
  }
  return lndMacaroonPathDefault
}

/**
 * Read the elementsd RPC cookie from the mounted `elements` dependency volume
 * and pair it with the resolved bridge address. Its contents are
 * `__cookie__:<password>`; we split on the first `:`.
 *
 * Returns null when Liquid is enabled but the credentials aren't available yet
 * (elements still starting); callers then fall back to Bitcoin-only so the
 * daemon never crashes on a missing credential.
 *
 * The read goes through `SubContainer.exec` because dependency volumes are
 * mounted into the SUBCONTAINER's rootfs, not the package's JS runtime
 * container.
 */
async function resolveElements(
  sub: SubContainer<any>,
  address: string | null,
): Promise<ElementsTarget | null> {
  if (!address) return null
  try {
    const res = await sub.exec(['cat', elementsCookiePath])
    if (res.exitCode !== 0) return null
    const raw = String(res.stdout).trim()
    const sep = raw.indexOf(':')
    if (sep === -1) return null

    const portSep = address.lastIndexOf(':')
    return {
      host: `http://${portSep === -1 ? address : address.slice(0, portSep)}`,
      port:
        portSep === -1 ? String(elementsRpcPort) : address.slice(portSep + 1),
      user: raw.slice(0, sep),
      pass: raw.slice(sep + 1),
    }
  } catch {
    return null
  }
}

/**
 * Reconcile the upstream config files from StartOS-managed settings. Runs as a
 * `reconcile-config` oneshot before peerswapd starts, and is idempotent.
 */
export async function reconcileConfig(
  effects: T.Effects,
  settings: Settings,
  sub: SubContainer<any>,
  hosts: ResolvedHosts,
): Promise<void> {
  const elements = settings.liquidEnabled
    ? await resolveElements(sub, hosts.elementsAddress)
    : null

  if (settings.liquidEnabled && !elements) {
    console.warn(
      'reconcile-config: Liquid is enabled but the elements RPC address or ' +
        'cookie is not yet available; starting Bitcoin-only for now.',
    )
  }

  const conf: PeerswapConf = {
    host: peerswapdRpcHost,
    'lnd.host': hosts.lndAddress,
    'lnd.macaroonpath': await resolveLndMacaroonPath(sub),
    'lnd.tlscertpath': lndCertPath,
    bitcoinswaps: 'true',
  }
  if (elements) {
    conf['elementsd.rpchost'] = elements.host
    conf['elementsd.rpcport'] = elements.port
    conf['elementsd.rpcuser'] = elements.user
    conf['elementsd.rpcpass'] = elements.pass
    conf['elementsd.rpcwallet'] = elementsRpcWallet
    conf['elementsd.liquidswaps'] = 'true'
  }
  await peerswapConfFile.write(effects, conf)

  // Pin the psweb-managed JSON to the StartOS-owned values. Merge so psweb's
  // own fields (autoswap, telegram, color scheme, ...) are preserved.
  await pswebConfigFile.merge(effects, {
    AllowSwapRequests: settings.allowSwapRequests,
    RpcHost: peerswapdRpcHost,
    ListenPort: String(uiPort),
    BitcoinSwaps: true,
    LocalMempool: settings.localMempoolUrl,
    ...(elements
      ? {
          ElementsHost: elements.host,
          ElementsPort: elements.port,
          ElementsUser: elements.user,
          ElementsPass: elements.pass,
          ElementsWallet: elementsRpcWallet,
        }
      : {}),
  })
}
