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

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## Inspecting a running install

To run a command inside a service's container (read its generated config, grep app logs), use `start-cli package attach <id> -n <subcontainer-name> -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts`, e.g. `-n web`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers". A service with more than one subcontainer requires a selector; with none given, `attach` falls back to an interactive picker that panics in a non-TTY shell — that's the missing selector, not a TTY requirement.

## This repo

- **Package id is `peerswap`.** peerswapd + pscli + psweb in one image, against
  the `lnd` package and optionally the `elements` (Liquid) package. All three
  binaries share the `peerswap-sub` subcontainer.
- **Two upstreams, one pinned pair.** `peerswap-web`'s `go.mod` requires an exact
  `ElementsProject/peerswap` module revision, and `PEERSWAP_COMMIT` pins the
  daemon to it. Never point it at a branch, and never bump one upstream without
  re-deriving the other — see `UPDATING.md`.
- **`pscli` takes exactly one global flag, `--rpchost`, before the subcommand.**
  There is no `--configfile`; passing one makes every call fail.
- **Enabling Liquid gates on the elements package's `sync-progress` check, not
  just `elementsd`.** peerswapd's elements client blocks until
  `verificationprogress` reaches 1 and never opens its own gRPC listener before
  then, so gating on RPC readiness alone leaves the daemon hanging for the hours
  the sidechain takes to sync.
- **Dependency addresses come from `sdk.host.getBridgeAddress`**, never a
  `<pkg>.startos:<port>` literal — that DNS form is retired, and LND's
  StartOS-issued certificate covers the bridge address, not the hostname.
