<p align="center">
  <img src="icon.png" alt="PeerSwap Logo" width="21%">
</p>

# PeerSwap on StartOS

> Everything not listed in this document should behave the same as upstream
> PeerSwap. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[PeerSwap](https://github.com/ElementsProject/peerswap) rebalances Lightning channels by swapping between on-chain and off-chain funds with a peer — in Bitcoin, or in Liquid L-BTC. This package runs the daemon and its web interface against the LND on the same server, and owns their configuration files so nothing can drift them.

- **Upstream repo:** <https://github.com/ElementsProject/peerswap>
- **Wrapper repo:** <https://github.com/Start9-Community/peerswap-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One image, built here, running two daemons.

| Property      | Value                               |
| ------------- | ----------------------------------- |
| Image         | Built from this repo's `Dockerfile` |
| Architectures | x86_64, aarch64                     |
| Command       | The daemon, then the web server     |

| Subcontainer   | Purpose                                               |
| -------------- | ----------------------------------------------------- |
| `peerswap-sub` | Both daemons and the oneshot — the one to `attach` to |

**The two daemons share a container**, because the web interface drives the daemon over its local gRPC port rather than over the network. The daemon starts first and the web server waits for it.

A oneshot runs before either: it rewrites both configuration files from the settings this package owns.

## Volume and Data Layout

One volume, plus read-only views of the dependencies'.

| Volume                | Mount Point       | Purpose                              |
| --------------------- | ----------------- | ------------------------------------ |
| `main`                | `/root/.peerswap` | The swap database and the config     |
| LND's `main` (ro)     | `/mnt/lnd`        | LND's certificate and admin macaroon |
| Elements' `main` (ro) | `/mnt/elements`   | The Liquid node's RPC cookie         |

| Path                    | Written by  | Holds                          |
| ----------------------- | ----------- | ------------------------------ |
| `peerswap.conf`         | The oneshot | What the daemon reads at start |
| `pswebconfig.json`      | Both        | The web interface's settings   |
| `startos-settings.json` | Actions     | What StartOS owns              |
| _swap database_         | The daemon  | The record of every swap       |

**The Elements mount only exists when Liquid is enabled**; with it off, nothing about Liquid is mounted, configured, or depended on.

## File Models

Three models, and the split between them is the design.

| File                    | Format | Modelled                | Written by                  |
| ----------------------- | ------ | ----------------------- | --------------------------- |
| `startos-settings.json` | JSON   | Yes — `FileHelper.json` | Actions                     |
| `peerswap.conf`         | INI    | Yes                     | The oneshot                 |
| `pswebconfig.json`      | JSON   | Yes                     | The oneshot, and the web UI |

**The settings file is the source of truth, and neither binary reads it.** It holds three things — whether Liquid is on, whether incoming swap requests are accepted, and an optional local block-explorer URL — and the oneshot projects it onto the two files the binaries actually read, on every start.

That indirection exists because **the web interface rewrites `peerswap.conf` itself** when settings are saved in it. Regenerating from the settings file each start means neither that nor a hand-edit can leave the running configuration somewhere StartOS does not know about. The web interface's own fields that StartOS does not own — auto-swap, notifications, colour scheme — are merged rather than overwritten.

Three values are resolved at start rather than stored:

- **LND's gRPC address**, over the internal bridge. The certificate on the mount covers that address; the retired DNS form would fail validation.
- **LND's macaroon path**, discovered by looking at which network directory actually exists on the mount rather than assuming mainnet — with the mainnet path as a fallback while LND is still initializing.
- **The Liquid node's RPC address and cookie**, read off the Elements mount.

**If Liquid is enabled but its credentials are not available yet, the daemon starts Bitcoin-only** and logs why, rather than failing to start on a missing credential.

## Dependencies

Two, one always required and one conditional.

| Dependency | Required             | Health checks required       | Mounted                              | Why                   |
| ---------- | -------------------- | ---------------------------- | ------------------------------------ | --------------------- |
| LND        | Yes                  | `lnd`                        | `main`, read-only at `/mnt/lnd`      | The node it swaps for |
| Elements   | Only if Liquid is on | `elementsd`, `sync-progress` | `main`, read-only at `/mnt/elements` | The Liquid backend    |

**This package uses LND's admin macaroon.** Swaps move funds, so control of this service is control of your channels' balance.

**Elements is gated on being synced, not just running**, and that is deliberate. PeerSwap's Liquid client loops on the node's chain info until verification completes and does not open its own listener before then — so an Elements that answers RPC while still downloading would leave the daemon hanging mid-startup. Requiring the sync check holds PeerSwap in the dependency-waiting state, naming the check it is waiting on, instead of showing a service that started and then went unhealthy for however many hours the sidechain takes.

**LND is unconditional.** The daemon has no other backend, so the package refuses to start without a reachable LND rather than coming up broken.

## Network Access and Interfaces

One interface.

| Interface | Id   | Type | Port | Description                |
| --------- | ---- | ---- | ---- | -------------------------- |
| Web UI    | `ui` | ui   | 1984 | The PeerSwap web interface |

Bound on the `main` MultiHost over HTTP and not masked.

**The web interface has no login.** Anyone who can reach the address can initiate swaps, which move real funds — so the address is the credential, and it should not be published anywhere you would not publish a wallet.

The daemon's gRPC port is internal to the service and is not exported. Swap negotiation with peers happens over Lightning's own messaging, not over any port this package binds.

## Installation and First-Run Flow

Install seeds the settings with **both switches off**: no Liquid, and no incoming swap requests. Nothing else is configured and there is no task.

**LND must be running and healthy** before PeerSwap will start — it is a hard dependency, and the start fails with a clear message rather than half-working if LND is not yet reachable.

Once running, the daemon is ready to initiate swaps with peers who also run PeerSwap. **Accepting swaps that peers initiate is a separate, opt-in decision**, which is why it defaults to off.

Enabling Liquid is likewise opt-in and adds a dependency; expect to wait for the Elements node to finish syncing before PeerSwap starts again.

## Actions

Four actions.

### Enable Liquid Swaps

Turns L-BTC swaps on or off.

- **What it changes:** the setting, and through it the Elements dependency, the mount, and the Liquid keys in both configuration files.
- **Cost:** the service restarts, and with Liquid on it will not start until Elements is running **and synced**.
- **Repeat safety:** idempotent, pre-filled with the current value.
- Turning it off returns the daemon to Bitcoin-only and drops the dependency.

### Allow Incoming Swap Requests

Controls whether peers may initiate swaps against your node.

- **What it changes:** the setting, and through it the web interface's configuration.
- **Cost:** the service restarts.
- **Off by default, deliberately.** PeerSwap is beta software that moves real funds; the action carries that warning, and it is not decorative.
- Turning it off does not affect swaps **you** initiate.

### Swap Status

Reports your PeerSwap-enabled peers, the swaps currently in flight, and — when Liquid is on — the Liquid balance and a deposit address.

- **Requires the service to be running**, since it queries the daemon over its local gRPC port from a temporary container.
- **Read-only.** It changes nothing.
- Individual queries that fail are reported as unavailable rather than failing the whole action.

### Set Local Mempool URL

Points the web interface's transaction links at your own block explorer instead of the public default.

- **What it changes:** the explorer URL in the settings, and through it the web interface's configuration.
- **Cost:** the service restarts.
- **Repeat safety:** idempotent, pre-filled. Leaving it blank returns to the public default.

## Tasks

None. This package raises no tasks, so the service is never held on a prompt and its ordinary controls are always available.

## Health Checks

Two checks, one per daemon.

| Check       | Displayed as      | Method                  | Grace |
| ----------- | ----------------- | ----------------------- | ----- |
| `peerswapd` | "PeerSwap Daemon" | Port 42069 is listening | 60s   |
| `psweb`     | "Web Interface"   | Port 1984 is listening  | 30s   |

The web server waits for the daemon, so a failing daemon shows as the interface never starting rather than as two independent failures.

**Neither says anything about swaps.** A peer that will not swap, a failed swap, or an Elements node that stopped answering all show green checks; those are visible in the interface and in the service logs.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. That is the swap database, both generated configuration files, and the StartOS settings.

**There is no wallet here.** PeerSwap holds no keys of its own: the Bitcoin side is LND's and the Liquid side is the Elements node's wallet. What the backup preserves is the record of swaps and your settings.

A restored instance comes back with both switches as they were and re-resolves LND's address, the macaroon path, and any Liquid credentials on the new server. It needs LND present and healthy before it will start.

## Limitations and Differences

1. **The web interface has no authentication.** Reaching it is enough to move funds.
2. **LND's admin macaroon is required**, and no other Lightning backend is supported.
3. **PeerSwap is beta software that moves real funds**, and the package's defaults reflect that — incoming requests off, Liquid off.
4. **Enabling Liquid can block startup for hours** the first time, while the Elements node syncs.
5. **Configuration is regenerated at every start.** Edits made directly to `peerswap.conf`, and to the StartOS-owned fields of the web interface's config, do not survive a restart.
6. **The Liquid wallet name is fixed** by the package.
7. **Mainnet Lightning**, with the macaroon path discovered from LND rather than assumed.

---

## Quick Reference for AI Consumers

```yaml
package_id: peerswap
image: built from ./Dockerfile
architectures:
  - x86_64
  - aarch64
subcontainers:
  - peerswap-sub # both daemons plus the reconcile oneshot
volumes:
  main: /root/.peerswap # swap db + generated configs; LND ro at /mnt/lnd, elements ro at /mnt/elements
file_models:
  - startos-settings.json # the source of truth; neither binary reads it
  - peerswap.conf # regenerated from settings every start
  - pswebconfig.json # StartOS-owned fields pinned, psweb's own fields merged
startos_managed_env_vars: [] # everything is config files
dependencies:
  - lnd # required, kind: running, healthChecks: [lnd], admin macaroon
  - elements # only while Liquid is enabled; healthChecks: [elementsd, sync-progress]
interfaces:
  ui: { type: ui, port: 1984 } # no authentication of any kind
actions:
  - enable-liquid-swaps
  - allow-swap-requests
  - show-node-info # displayed "Swap Status"; only-running, read-only
  - set-mempool-url
tasks: []
health_checks:
  - peerswapd # displayed "PeerSwap Daemon"; gRPC port 42069, internal only
  - psweb # displayed "Web Interface"
```
