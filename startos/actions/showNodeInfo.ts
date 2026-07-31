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
          return res.exitCode === 0
            ? String(res.stdout).trim()
            : i18n('Unavailable')
        }

        const value: T.ActionResultMember[] = [
          single(i18n('PeerSwap Peers'), await run('listpeers')),
          single(i18n('Active Swaps'), await run('listactiveswaps')),
        ]

        if (liquidEnabled) {
          value.push(
            single(i18n('Liquid Balance'), await run('lbtc-getbalance')),
            single(i18n('Liquid Address'), await run('lbtc-getaddress'), true),
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
