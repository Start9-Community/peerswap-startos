# Updating the upstream version

This package builds two upstreams from source in its `Dockerfile`:

- **peerswap-web** ([Impa10r/peerswap-web](https://github.com/Impa10r/peerswap-web)) —
  the `psweb` web UI. Its release is what the package version tracks.
- **peerswap** ([ElementsProject/peerswap](https://github.com/ElementsProject/peerswap)) —
  the `peerswapd` daemon and the `pscli` client.

## The two pins move together

`peerswap-web`'s `go.mod` requires an exact `peerswap` module revision. The
`PEERSWAP_COMMIT` build arg is pinned to that same commit so `peerswapd` and
`psweb` in one image always speak the same gRPC contract — **do not** point it
at a branch, and do not bump one upstream without re-deriving the other.

## Determining the upstream versions

```sh
# the peerswap-web release to build
gh release view -R Impa10r/peerswap-web --json tagName -q .tagName

# the peerswap revision that release requires
gh api "repos/Impa10r/peerswap-web/contents/go.mod?ref=<tag>" --jq .content \
  | base64 -d | grep elementsproject/peerswap
```

The `go.mod` line looks like
`github.com/elementsproject/peerswap v0.2.98-0.20250508215139-95695806541d`; the
trailing 12 hex characters are the short commit. Expand it to the full sha:

```sh
gh api repos/ElementsProject/peerswap/commits/<short-sha> --jq .sha
```

Check whether that release's `go.mod` also enables
`replace github.com/elementsproject/peerswap => ../peerswap`. When it does, the
`psweb` build resolves the daemon from the sibling checkout rather than the
module proxy, so the two clone steps in the `Dockerfile` must be reordered to
put `peerswap` in place first.

## Applying the bump

1. Set `PSWEB_VERSION` and `PEERSWAP_COMMIT` in the `Dockerfile`.
2. Bump `startos/versions/current.ts` to `<peerswap-web version>:<revision>` and
   write release notes for all five locales.
3. `npm run check`, then `make x86` and install on a real StartOS box — the
   daemon/UI pairing is exactly what a mismatched pin breaks, and it only
   surfaces at runtime.
