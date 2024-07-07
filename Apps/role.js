import karin from 'node-karin'
import { MysUtil } from '#MysTool/mys'
import Role from '../model/role.js'

const reg = MysUtil.reg.zzz
export const role = karin.command(
  new RegExp(`^${reg}?(角色|查询(代理人|角色)|(代理人|角色)查询)((10|13|15|17)[0-9]{8}|[1-9][0-9]{7})*$`, 'i'),
  async (e) => {
    const img = await new Role(e).roleList()
    if (img) e.reply(img)
    return true
  },
  { name: '绝区零角色信息查询', priority: 200 }
)
