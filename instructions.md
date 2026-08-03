# PeerSwap

PeerSwap is beta software, and every swap moves real funds on-chain
irreversibly. Start with small amounts, and only swap with peers you trust.

## Documentation

- [PeerSwap](https://www.peerswap.dev/) — what PeerSwap is and how swaps work.
- [PeerSwap daemon repository](https://github.com/ElementsProject/peerswap) —
  the protocol and the daemon's own documentation.
- [PeerSwap Web repository](https://github.com/Impa10r/peerswap-web) — the web
  interface you will actually use day to day.

## What you get on StartOS

- The **PeerSwap Web** interface, for initiating swaps, reviewing swap history,
  and managing which peers you swap with.
- An automatic connection to your **LND** node — PeerSwap reads LND's macaroon
  and certificate over the StartOS internal network, so there is nothing to
  copy or paste.
- **Bitcoin swaps out of the box**, and **Liquid (L-BTC) swaps** if you also run
  the Elements (Liquid) service.

## Getting set up

You need **LND** installed and running before PeerSwap will start.

1. Start PeerSwap. It connects to LND and comes up in Bitcoin-only mode.
2. Open the **Web UI** interface. You will land on the PeerSwap dashboard,
   listing your channels and any peers that also run PeerSwap.
3. Decide whether to allow peers to swap with you — see **Allow Incoming Swap
   Requests** below. It is off until you turn it on.
4. Try a small swap first, from the web interface, with a peer you trust.

### Adding Liquid swaps

1. Install and start the **Elements (Liquid)** service and let it finish
   syncing. It downloads the whole Liquid sidechain, which takes hours and a
   large amount of disk — read its instructions before starting.
2. Once its **Liquid Sync** health check is green, run PeerSwap's **Enable
   Liquid Swaps** action.

PeerSwap then depends on Elements being both running _and_ fully synced, and
L-BTC becomes selectable alongside BTC when you create a swap. If you enable
Liquid before Elements has finished syncing, PeerSwap will wait rather than
start — PeerSwap itself refuses to come up against a partially synced Liquid
node. Turn Liquid back off if you want Bitcoin-only swaps in the meantime.

## Using PeerSwap

### Actions

- **Enable Liquid Swaps** — turns L-BTC swaps on or off. Turning it on makes
  the Elements (Liquid) service a requirement for PeerSwap to run.
- **Allow Incoming Swap Requests** — off by default. Turn it on only if you want
  peers to be able to start swaps with you. You can always start swaps yourself
  either way.
- **Set Local Mempool URL** — point transaction links in the web interface at
  your own mempool or block explorer instead of the public default.
- **Swap Status** — lists your PeerSwap-enabled peers and active swaps, and your
  Liquid balance and a deposit address when Liquid is on.

### Settings are managed for you

`peerswap.conf` and the StartOS-owned parts of `pswebconfig.json` are rewritten
from the Actions above every time the service starts, so editing those files by
hand will not stick. Everything else in the web interface — autoswap, premium
rates, Telegram notifications, colour scheme — is yours and persists normally.

## Limitations

- **LND only.** PeerSwap also works with Core Lightning upstream, but that is
  not available in this package.
- Your Lightning funds live in LND and your Liquid funds live in the Elements
  service. PeerSwap's backup covers its swap history and settings, not the
  funds — back those services up separately.
