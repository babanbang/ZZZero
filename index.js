import { MysUtil } from '#MysTool/mys'
import { Cfg, getDir, PluginName, Data } from '#MysTool/utils'
import './model/mys/ApiMap.js'

MysUtil.addGames('zzz', '绝区零')

const dir = getDir(import.meta.url)
Cfg.initCfg('/lib/components', 'zzz')

logger.info(`${PluginName}-${dir.name}初始化~`)

/** 初始化数据目录 */
for (const path of ['LedgerData', 'GachaData', 'PlayerData']) {
  Data.createDir(`${dir.name}/${path}/`, { root: true })
}

/** 初始化资源 */
for (const type of ['bangboo', 'character', 'weapon']) {
  await import(`file://${dir.path}/resources/meta/${type}/index.js`)
}
