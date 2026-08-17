import { sdk } from '../sdk'
import { allowSwapRequests } from './allowSwapRequests'
import { enableLiquidSwaps } from './enableLiquidSwaps'
import { setMempoolUrl } from './setMempoolUrl'
import { showNodeInfo } from './showNodeInfo'

export const actions = sdk.Actions.of()
  .addAction(enableLiquidSwaps)
  .addAction(allowSwapRequests)
  .addAction(setMempoolUrl)
  .addAction(showNodeInfo)
  .addAction(setMempoolUrl)
  .addAction(showNodeInfo)
