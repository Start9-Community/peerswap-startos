export const DEFAULT_LANG = 'en_US'

const dict = {
  'Active Swaps': 0,
  'Allow Incoming Swap Requests': 1,
  'Allow your channel peers to initiate swaps with your node. When off, you can still initiate swaps yourself.': 2,
  'Control whether peers may initiate swaps with your node (default off)': 3,
  'Enable L-BTC (Liquid) swaps. This requires the Elements (Liquid) service to be installed and running. When disabled, PeerSwap performs Bitcoin-only swaps.': 4,
  'Enable Liquid Swaps': 5,
  'Enabling Liquid adds a running dependency on the Elements (Liquid) service. Make sure it is installed first.': 6,
  'LND is not yet reachable on the internal network. Ensure LND is installed and running.': 7,
  'Liquid Address': 8,
  'Liquid Balance': 9,
  'List your PeerSwap-enabled peers and active swaps, plus your Liquid balance and a deposit address when Liquid is enabled': 10,
  'Local Mempool URL': 11,
  'Optional base URL of a local mempool/block explorer (e.g. a self-hosted mempool). Leave blank to use the public default.': 12,
  'PeerSwap Daemon': 13,
  'PeerSwap Peers': 14,
  'PeerSwap is BETA software that moves real funds. Enabling this lets peers initiate swaps against your node.': 15,
  'PeerSwap is BETA software that moves real funds. Only allow incoming swap requests from peers you trust. Off by default for safety.': 16,
  'Point PeerSwap Web at a local mempool/explorer for transaction links': 17,
  'Set Local Mempool URL': 18,
  'Starting PeerSwap!': 19,
  'Swap Status': 20,
  'The PeerSwap Web management interface': 21,
  'The PeerSwap daemon is not ready': 22,
  'The PeerSwap daemon is ready': 23,
  'The web interface is not ready': 24,
  'The web interface is ready': 25,
  'Toggle Liquid (L-BTC) swap support, gating the Elements dependency': 26,
  Unavailable: 27,
  'Web Interface': 28,
  'Web UI': 29,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
