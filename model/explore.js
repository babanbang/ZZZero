import { Base, Cfg } from '#MysTool/utils'
import { MysInfo, MysUtil } from '#MysTool/mys'
import { Player, Character, Bangboo, Format } from '#MysTool/profile'

export default class Explore extends Base {
  constructor (e) {
    super(e, 'zzz')
    this.model = 'explore/explore'
    this.lable = Cfg.getdefSet('lable', this.game)
  }

  async get () {
    const mysInfo = await MysInfo.init({ e: this.e, game: this.game, apis: 'index' })
    if (!mysInfo?.uid) return false

    const index = await mysInfo.getData('index')

    if (index?.retcode !== 0) {
      return false
    }

    const exploreInfo = { version: this.lable.version }
    const player = new Player(mysInfo.uid, this.game)

    if (index.data?.stats?.world_level_name) {
      player.setBasicData({
        world_level: index.data.stats.world_level_name
      }, true)
    }

    if (!player.name || !player.level) {
      const ret = await mysInfo.getData('getUserGameRolesByCookie')
      if (ret?.retcode !== 0) {
        player.setBasicData({
          ...(ret.data?.list || []).find(v => v.game_uid === mysInfo.uid)
        }, true)
      }
    }

    exploreInfo.role = {
      ...player.getData('name,level,world_level'),
      region: MysUtil.RegionName(mysInfo.uid, this.game),
    }

    exploreInfo.avatars = index.data.avatar_list.filter(i => i.is_chosen)
    if (exploreInfo.avatars.length < 9) {
      exploreInfo.avatars = index.data.avatar_list.splice(0, 9)
    }

    exploreInfo.avatars.forEach(avatar => {
      const char = Character.get(avatar.id, this.game)
      if (char) {
        avatar.icon = char.face
        avatar.element = char.element
        avatar.weaponType = char.weaponType
      }
    })

    exploreInfo.buddys = index.data.buddy_list.map((buddy) => {
      return {
        ...buddy,
        icon: Bangboo.get(buddy.id, this.game)?.icon
      }
    })

    const stats = index.data.stats
    exploreInfo.explores = {
      line: [],
      other: [
        { lable: '活跃天数', num: stats.active_days, extra: Math.floor((new Date() - new Date('2024-07-04')) / (1000 * 60 * 60 * 24)) + 1 },
        { lable: '代理人数', num: stats.avatar_num, extra: this.lable.avatar },
        { lable: '式舆防卫战', num: stats.cur_period_zone_layer_count || '-' },
        { lable: '邦布数', num: stats.buddy_num, extra: this.lable.buddy }
      ]
    }

    return await this.renderImg(exploreInfo)
  }
}
