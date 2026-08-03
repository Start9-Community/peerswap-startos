import { settingsFile } from '../fileModels/settings'
import { sdk } from '../sdk'

/**
 * Seed StartOS-managed settings with safe defaults: Liquid off, incoming swap
 * requests off (peerswap is beta and moves real funds). Runs on every lifecycle
 * event so an update or restore that predates a field still gets its default.
 */
export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (!kind) return
  await settingsFile.merge(effects, {})
})
