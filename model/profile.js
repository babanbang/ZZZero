import { Base, Data } from '#MysTool/utils'
import { Player, Character, Weapon, Meta } from '#MysTool/profile'
import { MysInfo } from '#MysTool/mys'
import lodash from 'lodash'
import moment from 'moment'

export default class Profile extends Base {
  constructor (e) {
    super(e, 'zzz')
    this.model = 'profile/detail'
  }

  async refresh () {
    this.model = 'profile/list'
    const uid = this.e.MysUid || await new MysInfo(this.e).getUid()
    if (!uid) {
      this.e.reply('请先绑定绝区零UID~')
      return false
    }

    const mys = await MysInfo.getMysUserByUid(uid, this.game)
    if (!mys) {
      this.e.reply(`UID：${uid} 未绑定cookie，请绑定cookie后再试!`)
      return false
    }

    const mysInfo = new MysInfo(this.e, this.game)
    mysInfo.setMysApi({ ...mys, uid, game: this.game, self: true })

    const allIds = Meta.getData(this.game, 'char', 'allcharsids')
    const info = await mysInfo.getData('avatar_info', { id_list: allIds.data, cacheCd: 300 })
    if (info?.retcode !== 0) return false

    if (info.data?.avatar_list?.length > 0) {
      info.data.UpdateTime = moment().format('MM-DD HH:mm')
      Data.writeJSON(`${Data.gamePath(this.game)}MysPlayerData/${uid}.json`, info.data, { root: true })

      const ret = {}
      info.data.avatar_list.forEach(avatar => {
        let char = Character.get(avatar.id, this.game)
        if (char) ret[char.name] = true
      })
      if (!lodash.isEmpty(ret)) {
        return await this.list(ret)
      }
    }

    this.e._isReplyed || this.e.reply('获取角色面板数据失败')
    return false
  }

  async list (newChar = {}) {
    this.model = 'profile/list'
    const uid = this.e.MysUid || await new MysInfo(this.e).getUid()
    if (!uid) {
      this.e.reply('请先绑定绝区零UID~')
      return false
    }

    const player = Player.create(this.e.MysUid, this.game)

    const chars = []
    const profiles = Data.readJSON(`${Data.gamePath(this.game)}MysPlayerData/${uid}.json`, { root: true })
    profiles.avatar_list.forEach(profile => {
      const char = Character.get(profile.id, this.game)
      if (char) {
        const imgs = char.getImgs()
        chars.push({
          ...char.getData('id,name,abbr,elem,star'),
          face: imgs.qFace || imgs.face,
          level: profile.level || 1,
          cons: profile.rank,
          isNew: newChar?.[char.name]
        })
      }
    })
    if (lodash.isEmpty(chars)) {
      this.e._isReplyed || this.e.reply('请先更新角色面板数据~')
      return false
    }

    return await this.renderImg({
      uid,
      elem: this.game,
      avatars: lodash.sortBy(chars, ['isNew', 'star', 'id', 'level']),
      updateTime: profiles.UpdateTime,
      hasNew: lodash.isObject(newChar) && !lodash.isEmpty(newChar),
      servName: '米游社'
    })
  }

  async detail (uid, profile) {
    const data = Data.readJSON(`${Data.gamePath(this.game)}MysPlayerData/${uid}.json`, { root: true })

    const avatar_info = data?.avatar_list?.find?.(i => i.id == profile.id)
    if (!avatar_info) {
      this.e.reply(`未获取到${profile.name}的面板信息，请确保你拥有此角色再更新面板`)
      return false
    }

    /**@type {import('#MysTool/profile').Character} */
    const char = profile.char
    const avatar = {
      ...char.getData('name,abbr,star,element,weaponType,imgs'),
      ...Data.getData(avatar_info, 'level,rank,camp_name:camp_name_mi18n')
    }

    avatar.skills = {}
    avatar.talentTree = -1
    avatar_info.skills.forEach(skill => {
      const item = {
        level: skill.level,
        max: 12
      }
      if (skill.skill_type != 5) {
        if (avatar.rank >= 5) item.max += 4
        if (avatar.rank >= 3) item.max += 2
        avatar.skills[skill.skill_type] = item
      } else {
        avatar.talentTree = Number(skill.level) - 2 + Math.floor((Number(skill.level) - 1) / 2)
        avatar.skills[skill.skill_type] = {
          level: skill.level,
          max: 7
        }
      }
    })
    avatar.skills = [0, 2, 6, 1, 3, 5].map(id => {
      return { id, ...avatar.skills[id] }
    })

    avatar.attr = avatar_info.properties.map(p => {
      return {
        name: p.property_name,
        value: p.final
      }
    })

    if (avatar_info.weapon?.name) {
      const weapon = avatar_info.weapon
      avatar.weapon = {
        ...Data.getData(weapon, 'name,level,rarity,star,icon,desc_title:talent_title'),
        professionName: this.ProfessionToName(weapon.profession),
        attr: [
          ...this.setPropertie(weapon.main_properties),
          ...this.setPropertie(weapon.properties)
        ]
      }
      avatar.weapon.desc = weapon.talent_content.replace(/<color=([^>]*)>([^<]*)<\/color>/g, '<span style="color: $1;">$2</span>')
      const w = Weapon.get(avatar_info.weapon.name, this.game)
      if (w?.icon) {
        delete avatar.weapon.icon
        avatar.weapon.image = w.icon
      }
    }

    if (avatar_info.equip.length > 0) {
      avatar.artis = {}
      avatar.artisbuff = {}
      avatar_info.equip.forEach(equip => {
        if (!avatar.artisbuff[equip.equip_suit.name]) {
          avatar.artisbuff[equip.equip_suit.name] = {
            name: equip.equip_suit.name,
            active: equip.equip_suit.own >= 2,
            desc: ['desc1', 'desc2'].map((desc, idx) => {
              return {
                desc: equip.equip_suit[desc].replace(/<color=([^>]*)>([^<]*)<\/color>/g, '<span style="color: $1;">$2</span>'),
                active: equip.equip_suit.own >= ((idx + 1) * 2)
              }
            })
          }
        }

        avatar.artis[equip.equipment_type] = {
          // name: equip.name.replace(/\[\d+\]$/, ''),
          name: equip.name,
          ...Data.getData(equip, 'level,rarity,icon'),
          main: this.setPropertie(equip.main_properties)[0],
          attr: this.setPropertie(equip.properties)
        }
      })
    }

    return await this.renderImg({
      avatar, uid
    }, { nowk: true })
  }

  ProfessionToName (profession) {
    return [
      '强攻', '击破', '异常', '支援', '防护'
    ][Number(profession) - 1]
  }

  setPropertie (data) {
    if (Array.isArray(data)) {
      return data.map(d => this.setPropertie(d))
    }
    return {
      // name: data.property_name.replace(/^基础/, ''),
      name: data.property_name,
      value: data.base
    }
  }
}
