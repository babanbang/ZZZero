import { Cfg, MysUtil, Data, GameNames, GamePathType, GameList } from 'karin-plugin-mystool'
import { logger } from 'node-karin'

MysUtil.initGame(GameList.Zzz)
/** 初始化配置 */
Cfg.initCfg(GamePathType.zzz)

const pkg = Cfg.package(GamePathType.zzz)
const name = Data.getGamePath(GamePathType.zzz)
logger.info(`${logger.violet(`[插件:${pkg.version}]`)} ${logger.green(name)}${GameNames.zzz}初始化完成~`)