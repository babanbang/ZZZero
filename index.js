import { MysUtil } from '#MysTool/mys'
import { Cfg, getDir } from '#MysTool/utils'
import './model/mys/ApiMap.js'

MysUtil.addGames('zzz', '绝区零')

const dir = getDir(import.meta.url)
Cfg.initCfg('/lib/components', dir.name + '/', 'zzz', '绝区零')

// for (const type of ['artifact', 'character', 'weapon']) {
//   await import(`file://${dir.path}/resources/meta/${type}/index.js`)
// }
