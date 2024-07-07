import karin from 'node-karin'
import { MysUtil } from '#MysTool/mys'
import Explore from '../model/explore.js'

const reg = MysUtil.reg.zzz
export const explore = karin.command(
  new RegExp(`^${reg}(查询|(探险|探索)(度)?)((10|13|15|17)[0-9]{8}|[1-9][0-9]{7})*$|^${reg}?uid(\\+|\\s)*((10|13|15|17)[0-9]{8}|[1-9][0-9]{7})$|^#((10|13|15|17)[0-9]{8}|[1-9][0-9]{7})`, 'i'),
  async (e) => {
    const img = await new Explore(e).get()
    if (img) e.reply(img)
    return true
  },
  { name: '绝区零探索查询', priority: 200 }
)
