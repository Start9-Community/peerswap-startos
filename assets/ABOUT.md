PeerSwap is a peer-to-peer asset swap plugin/daemon for the Lightning Network. It lets node operators rebalance their Lightning channels by atomically swapping off-chain Lightning liquidity for on-chain Bitcoin — and optionally Liquid (L-BTC) — directly with their channel peers, without a trusted third party or a centralized service.

This package runs PeerSwap natively on StartOS:

- **peerswapd** — the PeerSwap daemon, connected to your LND node over its internal gRPC endpoint using the mounted macaroon and TLS certificate.
- **PeerSwap Web (psweb)** — a web UI for managing swaps.

**Bitcoin-only by default.** Liquid (L-BTC) swaps are optional and require the separate Elements (Liquid) service to be installed; enable them from the service Actions. When Elements is absent, PeerSwap performs Bitcoin-only swaps with no errors.

**⚠️ PeerSwap is BETA software that moves real funds.** Incoming swap requests are disabled by default. Only enable them, and only swap with peers you trust, once you understand the risks.

### Dependency contracts

Both dependencies are reached over the StartOS internal bridge, resolved with `sdk.host.getBridgeAddress` rather than by hostname.

- **LND** — its volume is mounted read-only at `/mnt/lnd` for `tls.cert` and the admin macaroon, whose network subdirectory is discovered at runtime rather than assumed to be mainnet.
- **Elements (Liquid)** — when Liquid swaps are enabled, its volume is mounted read-only at `/mnt/elements` and the elementsd RPC cookie is read from `/mnt/elements/liquidv1/.cookie` (`__cookie__:<password>`, split on the first `:`). PeerSwap uses the `peerswap` wallet that package pre-creates. The full contract is documented in elements-startos's README.
