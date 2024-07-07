import { Base, Cfg } from '#MysTool/utils'
import { MysInfo, MysUtil } from '#MysTool/mys'
import { Player, Meta, Character } from '#MysTool/profile'

export default class Role extends Base {
  constructor (e) {
    super(e, 'zzz')
    this.model = 'role/rolelist'
    this.lable = Cfg.getdefSet('lable', this.game)
  }

  async roleList () {
    const mysInfo = await MysInfo.init({ e: this.e, game: this.game, apis: 'avatar_info' })
    if (!mysInfo?.uid) return false

    const allIds = Meta.getData(this.game, 'char', 'allcharsids')
    const res = await mysInfo.getData('avatar_info', { id_list: allIds.data })
    if (res?.retcode !== 0) return false

    const player = new Player(mysInfo.uid, this.game)
    if (!player.name || !player.level) {
      const ret = await mysInfo.getData('getUserGameRolesByCookie')
      if (ret?.retcode !== 0) {
        player.setBasicData({
          ...(ret.data?.list || []).find(v => v.game_uid === mysInfo.uid)
        }, true)
      }
    }
    // player.updateMysZZZPlayer(res.data)
    // player.save()
    const avatars = []
    res.data.avatar_list.forEach(avatar => {
      const char = Character.get(avatar.id, this.game)

      if (char) {
        avatars.push({
          ...avatar,
          ...char.getData('name,vertical,element,weaponType'),
        })
      } else {
        avatars.push(avatar)
      }
    })

    return await this.renderImg({
      avatars,
      // avatars: lodash.sortBy(player.getAvatarData(), ['level', 'star', 'cons', 'weapon.star', 'id']).reverse(),
      role: {
        ...player.getData('name,level,world_level'),
        region: MysUtil.RegionName(mysInfo.uid, this.game),
      },
      version: this.lable.version
    }, { Scale: true })
  }
}
