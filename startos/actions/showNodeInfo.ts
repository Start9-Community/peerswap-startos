import { T } from '@start9labs/start-sdk'
import { settingsFile } from '../fileModels/settings'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mainMounts, peerswapdRpcHost } from '../utils'

/**
 * `pscli` takes exactly one global flag, `--rpchost`, and it must precede the
 * subcommand. It has no `--configfile`.
 */
const pscli = (...args: string[]) => [
  'pscli',
  `--rpchost=${peerswapdRpcHost}`,
  ...args,
]

export const showNodeInfo = sdk.Action.withoutInput(
  'show-node-info',

  {
    name: i18n('Swap Status'),
    description: i18n(
      'List your PeerSwap-enabled peers and active swaps, plus your Liquid balance and a deposit address when Liquid is enabled',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  },

  async ({ effects }) => {
    const liquidEnabled =
      (await settingsFile.read().once())?.liquidEnabled ?? false

    return sdk.SubContainer.withTemp(
      effects,
      { imageId: 'peerswap' },
      mainMounts,
      'peerswap-info',
      async (subc) => {
        const run = async (...args: string[]) => {
          const res = await subc.exec(pscli(...args))
          return res.exitCode === 0 ? String(res.stdout).trim() : null
        }
        const field = async (key: string, ...args: string[]) => {
          try {
            return String(JSON.parse((await run(...args)) ?? '')[key] ?? '')
          } catch {
            return ''
          }
        }

        const value: T.ActionResultMember[] = [
          multiline(
            i18n('PeerSwap Peers'),
            (await run('listpeers')) ?? i18n('Unavailable'),
          ),
          multiline(
            i18n('Active Swaps'),
            (await run('listactiveswaps')) ?? i18n('Unavailable'),
          ),
        ]

        if (liquidEnabled) {
          const balance = await field('sat_amount', 'lbtc-getbalance')
          const address = await field('address', 'lbtc-getaddress')
          value.push(
            single(
              i18n('Liquid Balance (sats)'),
              balance || i18n('Unavailable'),
            ),
            single(
              i18n('Liquid Address'),
              address || i18n('Unavailable'),
              !!address,
            ),
          )
        }

        return {
          version: '1' as const,
          title: i18n('Swap Status'),
          message: null,
          result: { type: 'group' as const, value },
        }
      },
    )
  },
)

function multiline(name: string, value: string): T.ActionResultMember {
  return {
    type: 'multiline',
    name,
    description: null,
    value,
    copyable: true,
  }
}

function single(name: string, value: string, qr = false): T.ActionResultMember {
  return {
    type: 'single',
    name,
    description: null,
    value,
    copyable: true,
    masked: false,
    qr,
  }
}
