# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **`pscli` takes exactly one global flag, `--rpchost`, before the subcommand.** There is no `--configfile`; passing one makes every call fail.
- **`startos-settings.json` is the source of truth and neither binary reads it.** The `reconcile-config` oneshot projects it onto `peerswap.conf` and `pswebconfig.json` before peerswapd starts. That indirection is required because psweb's `SavePS()` rewrites `peerswap.conf` itself — regenerating each start is what stops the running config drifting. Merge, don't overwrite, `pswebconfig.json`: psweb's own fields (autoswap, telegram, colours) must survive.
- **Enabling Liquid gates on the elements package's `sync-progress` check, not just `elementsd`.** peerswapd's elements client blocks until `verificationprogress` reaches 1 and never opens its own gRPC listener before then, so gating on RPC readiness alone leaves the daemon hanging for the hours the sidechain takes to sync.
- **Dependency addresses come from `sdk.host.getBridgeAddress`**, never a `<pkg>.startos:<port>` literal — that DNS form is retired, and LND's StartOS-issued certificate covers the bridge address, not the hostname.
- **Liquid enabled without available credentials starts Bitcoin-only and warns**, rather than failing. Keep that fallback — elements may still be coming up when the oneshot runs.
