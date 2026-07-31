<p align="center">
  <img src="icon.svg" alt="PeerSwap Logo" width="21%">
</p>

# PeerSwap on StartOS

> **Upstream docs:** <https://www.peerswap.dev/>
>
> Everything not listed in this document should behave the same as upstream
> PeerSwap and PeerSwap Web. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable.

PeerSwap is a peer-to-peer Lightning channel-balancing tool. It atomically swaps
off-chain Lightning liquidity for on-chain Bitcoin — and optionally Liquid
L-BTC — directly with your channel peers. This package runs it natively on
StartOS against the LND package. Upstream repositories:
[`ElementsProject/peerswap`](https://github.com/ElementsProject/peerswap) (the
daemon) and [`Impa10r/peerswap-web`](https://github.com/Impa10r/peerswap-web)
(the web UI).

> ⚠️ **PeerSwap is BETA software that moves real funds.** Incoming swap requests
> are off by default.

This README documents the package architecture for developers and LLMs. End-user
docs are in [`instructions.md`](instructions.md).

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Image         | custom multi-stage `Dockerfile`, built from both upstream sources |
| Architectures | x86_64, aarch64                                                   |
| Binaries      | `peerswapd`, `pscli`, `psweb`                                     |
| Entrypoint    | none; StartOS invokes each daemon command directly                |

`peerswapd` and `pscli` are pinned to the exact `ElementsProject/peerswap`
commit that `peerswap-web`'s `go.mod` requires, so the daemon and the UI in one
image always speak the same gRPC contract. See [`UPDATING.md`](UPDATING.md).

---

## Volume and Data Layout

| Volume                     | Mount Point       | Mode | Purpose                                                                                              |
| -------------------------- | ----------------- | ---- | ---------------------------------------------------------------------------------------------------- |
| `main`                     | `/root/.peerswap` | rw   | peerswapd swap database, `peerswap.conf`, `pswebconfig.json`, `policy.conf`, `startos-settings.json` |
| `lnd` (dep)                | `/mnt/lnd`        | ro   | LND admin macaroon + `tls.cert`                                                                      |
| `elements` (dep, optional) | `/mnt/elements`   | ro   | elementsd RPC cookie, mounted only when Liquid swaps are enabled                                     |

`startos-settings.json` is this package's own state — the single source of truth
for everything the user controls through Actions. It is not read by either
upstream binary.

---

## Installation and First-Run Flow

There is no upstream setup wizard, and no credential for the user to enter:
PeerSwap reaches LND over the StartOS internal network using LND's own mounted
macaroon and certificate.

1. `seedFiles` writes `startos-settings.json` with safe defaults — Liquid off,
   incoming swap requests off.
2. `main.ts` resolves LND's gRPC bridge address and, when Liquid is enabled,
   the Elements RPC bridge address.
3. The `reconcile-config` oneshot rewrites `peerswap.conf` and
   `pswebconfig.json` from those settings **before** `peerswapd` starts.
4. `peerswapd` starts, then `psweb` once the daemon's gRPC port is listening.

---

## Configuration Management

| StartOS-Managed                                                                                                                               | Upstream-Managed                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `peerswap.conf` in full; and in `pswebconfig.json`: `AllowSwapRequests`, `RpcHost`, `ListenPort`, `BitcoinSwaps`, `LocalMempool`, `Elements*` | Every other `pswebconfig.json` field — autoswap, Telegram, colour scheme, peg-in bookkeeping |

`reconcile-config` **writes** `peerswap.conf` (so a hand-edit or psweb's own
`SavePS()` cannot drift the running daemon) and **merges** `pswebconfig.json`
(so psweb's own fields survive). Because the oneshot runs before `peerswapd`,
the daemon has already read a config StartOS fully owns by the time psweb could
rewrite it.

Both dependency addresses are resolved with `sdk.host.getBridgeAddress` rather
than a hostname literal. LND's StartOS-issued certificate covers the bridge
address, which is what makes the mounted `tls.cert` validate without any ALPN or
cert-extraction workaround.

---

## Network Access and Interfaces

| Interface | Host id | Port | Type | Purpose         |
| --------- | ------- | ---- | ---- | --------------- |
| Web UI    | `main`  | 1984 | `ui` | PeerSwap Web UI |

This is an ordinary StartOS interface: the **user** decides where it is
reachable. `peerswapd`'s own gRPC port (42069) is deliberately **not** bound —
only `psweb` and `pscli`, inside the same container, talk to it.

---

## Actions (StartOS UI)

| Action                           | Id                    | Visibility | Availability | Inputs               | Outputs                                                                                     |
| -------------------------------- | --------------------- | ---------- | ------------ | -------------------- | ------------------------------------------------------------------------------------------- |
| **Enable Liquid Swaps**          | `enable-liquid-swaps` | enabled    | any status   | toggle               | gates the `elements` running dependency and the volume mount                                |
| **Allow Incoming Swap Requests** | `allow-swap-requests` | enabled    | any status   | toggle (default off) | writes `AllowSwapRequests`                                                                  |
| **Set Local Mempool URL**        | `set-mempool-url`     | enabled    | any status   | optional URL         | writes `LocalMempool`                                                                       |
| **Swap Status**                  | `show-node-info`      | enabled    | only running | none                 | PeerSwap peers, active swaps, and — when Liquid is on — L-BTC balance and a deposit address |

`Swap Status` shells out to `pscli`, which takes exactly one global flag,
`--rpchost`, and it must precede the subcommand.

---

## Backups and Restore

`main` volume only — the swap database, `policy.conf`, `pswebconfig.json`, and
this package's settings. Lightning funds live in LND and Liquid wallet state
lives in the Elements service; back those up separately.

---

## Health Checks

| Check           | Id          | Method               | Grace period |
| --------------- | ----------- | -------------------- | ------------ |
| PeerSwap Daemon | `peerswapd` | port 42069 listening | 60 s         |
| Web Interface   | `psweb`     | port 1984 listening  | 30 s         |

The `reconcile-config` oneshot must complete before `peerswapd` starts, and
`peerswapd` before `psweb`.

---

## Dependencies

- **lnd** — required, `running`. Gates on LND's `lnd` health check. Its `main`
  volume is mounted read-only at `/mnt/lnd` for the admin macaroon and
  `tls.cert`; the macaroon's network subdirectory is discovered at runtime
  rather than assumed to be mainnet. The minimum version is declared in
  `startos/dependencies.ts`.
- **elements** — optional, becomes `running` only once the user enables Liquid
  swaps. Gates on **both** of the Elements package's health checks —
  `elementsd` (RPC readiness) **and** `sync-progress` (full Liquid sync).
  Upstream's elements client polls `getblockchaininfo` until
  `verificationprogress` reaches 1 and does not open peerswapd's own gRPC
  listener until it does, so an Elements node that answers RPC while still
  syncing hangs peerswapd mid-startup; gating on both keeps PeerSwap in the
  dependency-waiting state instead. Its `main` volume is mounted read-only at
  `/mnt/elements` for the RPC cookie. The contract is documented in
  elements-startos's README § The Dependency Contract.

---

## Limitations and Differences

1. **LND backend only.** PeerSwap also supports Core Lightning, but there it is
   a `lightningd` plugin and would need a plugin-allowlist change in
   `cln-startos`. Not wired up here.
2. **Liquid requires the separate Elements (Liquid) package.** Without it,
   PeerSwap performs Bitcoin-only swaps and reports no Liquid errors.
3. **`peerswap.conf` is rewritten on every start.** Hand edits do not survive.
4. **PeerSwap is beta software that moves real funds**, so incoming swap
   requests default to off and must be enabled deliberately.

---

## What Is Unchanged from Upstream

- `peerswapd`, `pscli`, and `psweb` are upstream builds with no patches.
- The whole PeerSwap Web UI — swap history, peer management, autoswap,
  premium rates, Telegram notifications, colour scheme — behaves exactly as
  upstream documents, and every setting it owns persists across restarts.
- The swap protocol, its CSV timeouts, and the on-disk swap database format are
  stock.

---

## Contributing

See [`AGENTS.md`](AGENTS.md).

---

## Quick Reference for AI Consumers

```yaml
package_id: peerswap
title: PeerSwap
architectures: [x86_64, aarch64]
binaries: [peerswapd, pscli, psweb]
volumes:
  main: /root/.peerswap
mounts:
  lnd: { path: /mnt/lnd, readonly: true }
  elements: { path: /mnt/elements, readonly: true, when: liquid_enabled }
ports:
  ui: 1984
  peerswapd_grpc: 42069 # internal only, not bound
interfaces:
  ui:
    host_id: main
    type: ui
    port: 1984
dependencies:
  lnd: { kind: running, health_checks: [lnd], required: true }
  elements:
    { kind: running, health_checks: [elementsd], required: when_liquid_enabled }
dependency_address_resolution: sdk.host.getBridgeAddress
health_checks: [peerswapd, psweb]
actions:
  - enable-liquid-swaps
  - allow-swap-requests
  - set-mempool-url
  - show-node-info
startos_managed_env_vars: []
safety_defaults:
  allow_swap_requests: false
  liquid_enabled: false
```
