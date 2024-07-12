import karin from 'node-karin'
import Profile from '../model/profile.js'
import { MysUtil } from '#MysTool/mys'

const reg = MysUtil.reg.zzz
export const profile_Refresh = karin.command(
  new RegExp(`^${reg}(全部面板更新|更新全部面板|获取游戏角色详情|更新面板|面板更新)\\s*((18|[1-9])[0-9]{8})?$`, 'i'),
  async (e) => {
    const img = await new Profile(e).refresh()
    if (img) e.reply(img)
    return true
  },
  { name: '更新绝区零角色面板', priority: 200 }
)

export const profile_List = karin.command(
  new RegExp(`^${reg}面板(列表)?\\s*((18|[1-9])[0-9]{8})?$`, 'i'),
  async (e) => {
    const img = await new Profile(e).list()
    if (img) e.reply(img)
    return true
  },
  { name: '绝区零角色面板列表', priority: 200 }
)

export const profile__detail = karin.handler(
  'mys.zzz.profile',
  async ({ e, profile, uid }) => {
    const img = await new Profile(e).detail(uid, profile)
    if (img) e.reply(img)
    return true
  },
  { name: '绝区零角色面板详情', priority: 200 }
)