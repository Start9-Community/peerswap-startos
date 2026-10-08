import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'peerswap',
  title: 'PeerSwap',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9-Community/peerswap-startos',
  upstreamRepo: 'https://github.com/ElementsProject/peerswap',
  marketingUrl: 'https://www.peerswap.dev/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    peerswap: {
      source: {
        dockerBuild: {},
      },
      arch: ['aarch64', 'x86_64'],
      emulateMissing: false,
    },
  },
})
