# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **`pscli` takes exactly one global flag, `--rpchost`, before the subcommand.** There is no `--configfile`; passing one makes every call fail.
- **`startos-settings.json` is the source of truth and neither binary reads it.** The `reconcile-config` oneshot projects it onto `peerswap.conf` and `pswebconfig.json` before peerswapd starts. That indirection is required because psweb's `SavePS()` rewrites `peerswap.conf` itself — regenerating each start is what stops the running config drifting. Merge, don't overwrite, `pswebconfig.json`: psweb's own fields (autoswap, telegram, colours) must survive.
- **Enabling Liquid gates on the elements package's `sync-progress` check, not just `elementsd`.** peerswapd's elements client blocks until `verificationprogress` reaches 1 and never opens its own gRPC listener before then, so gating on RPC readiness alone leaves the daemon hanging for the hours the sidechain takes to sync.
- **Dependency addresses come from `sdk.host.getBridgeAddress`**, never a `<pkg>.startos:<port>` literal — that DNS form is retired, and LND's StartOS-issued certificate covers the bridge address, not the hostname.
- **Liquid enabled without available credentials starts Bitcoin-only and warns**, rather than failing. Keep that fallback — elements may still be coming up when the oneshot runs.
