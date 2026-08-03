# syntax=docker/dockerfile:1
#
# Multi-stage, multi-arch build for the PeerSwap StartOS package:
#   Stage 1: psweb from Impa10r/peerswap-web, plus peerswapd + pscli from
#            ElementsProject/peerswap
#   Stage 2: slim runtime with the three binaries
#
# StartOS builds this once per target arch under buildx and passes the build
# platform, so no explicit cross-compilation flags are needed.

# peerswap-web's go.mod requires an exact peerswap module revision
# (v0.2.98-0.20250508215139-95695806541d). peerswapd and pscli are pinned to
# that same commit so the daemon and the UI in this image speak the same gRPC
# contract; a moving branch would let them drift apart between builds.
ARG PEERSWAP_COMMIT=95695806541dd7376c035e47ad9cb396bb72763e
ARG PSWEB_VERSION=v5.0.4
ARG GO_VERSION=1.23

# ---------------------------------------------------------------------------
# Stage 1 — build psweb + peerswapd + pscli (all via `go install` -> /go/bin)
#
# Mirrors the upstream build recipes:
#   peerswap-web  `make install-lnd`  -> `go install ./cmd/psweb`  (LND is the
#     default build; `-tags cln` is the CLN variant, so no tags here)
#   peerswap      `make lnd-release`  -> `go install` peerswapd + pscli
# ---------------------------------------------------------------------------
FROM golang:${GO_VERSION}-bookworm AS builder
ARG PEERSWAP_COMMIT
ARG PSWEB_VERSION
RUN apt-get update && apt-get install -y --no-install-recommends git make ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# psweb (peerswap-web) — LND flavor (default)
WORKDIR /src/peerswap-web
RUN git clone --depth 1 --branch ${PSWEB_VERSION} \
  https://github.com/Impa10r/peerswap-web.git . \
  && make install-lnd

# peerswapd + pscli (standalone LND daemon), at the commit psweb links against
WORKDIR /src/peerswap
RUN git init -q . \
  && git remote add origin https://github.com/ElementsProject/peerswap.git \
  && git fetch --depth 1 -q origin ${PEERSWAP_COMMIT} \
  && git checkout -q FETCH_HEAD \
  && make lnd-release

# ---------------------------------------------------------------------------
# Stage 2 — runtime
# ---------------------------------------------------------------------------
FROM debian:bookworm-slim AS final

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# go install drops psweb, peerswapd and pscli into /go/bin
COPY --from=builder /go/bin/peerswapd /usr/local/bin/peerswapd
COPY --from=builder /go/bin/pscli /usr/local/bin/pscli
COPY --from=builder /go/bin/psweb /usr/local/bin/psweb

# StartOS runs daemons as root and invokes each command directly rather than
# through the image entrypoint, so none is set. peerswapd and psweb default
# their data dir to /root/.peerswap, the `main` volume mountpoint (see utils.ts).
WORKDIR /root
