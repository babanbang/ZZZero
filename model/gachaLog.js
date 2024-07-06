import { MysInfo, MysUtil } from '#MysTool/mys'
import { Character, Weapon, Bangboo } from '#MysTool/profile'
import { Base, Cfg, Data, PluginName } from '#MysTool/utils'
import { common } from 'node-karin'
import lodash from 'lodash'
import moment from 'moment'
import { PoolDetail } from '../resources/gachaPool/pool.js'

const pool = [
  { type: 2001, typeName: "角色" },
  { type: 2002, typeName: "音擎" },
  { type: 1001, typeName: "常驻" },
  { type: 5001, typeName: "邦布" }
]

export default class Role extends Base {
  constructor (e) {
    super(e, 'zzz')
    this.model = 'gacha/log'
    this.mysInfo = new MysInfo(e, this.game)
  }

  GachaPath (type) {
    return Data.gamePath(this.game) + `GachaData/${this.uid}/${type}.json`
  }

  GachaUserPath (uid = '') {
    return Data.gamePath(this.game) + `GachaData/${uid || this.uid}/user.json`
  }

  getIcon (name, type = "role") {
    if (type === "role" || type === "代理人") {
      let char = Character.get(name, this.game)
      return char?.face || ""
    } else if (type === "weapon" || type === "音擎") {
      let weapon = Weapon.get(name, this.game)
      return weapon?.icon || ""
    } else if (type === "邦布") {
      let bangboo = Bangboo.get(name, this.game)
      return bangboo?.icon || ""
    }
    return ""
  }

  async checkPermission (user_id) {
    const { uid, type } = await MysInfo.getMainUid(this.e, this.game)
    if (['ck', 'sk', 'all'].includes(type)) {
      return { uid, check: true }
    }

    const GachaUser = Data.readJSON(this.GachaUserPath(uid), { root: true, def: { master: [], ban: [] } })
    if (GachaUser.master.some(item => item == user_id)) {
      return { uid, check: true }
    }

    return { uid, check: false }
  }

  async getLog (p = false) {
    if (!p) {
      const { uid, check } = await this.checkPermission(this.e.user_id)
      if (!check) {
        this.e.reply(`请先更新抽卡记录或绑定ck/sk后再尝试查询UID:${uid}的抽卡记录！`)
        return false
      }
      this.uid = uid
    }

    const pools = p || this.getPools(this.e.msg)

    const gachaData = []
    pools.forEach(({ type, typeName }) => {
      const { list } = this.readJson(type)
      if (list.length > 0) {
        gachaData.push({ ...this.analyse(list, type), type, typeName })
      }
    })
    if (gachaData.length === 0) {
      this.e.reply(`UID：${this.uid}暂无抽卡记录，请先更新抽卡记录后查询！`)
      return false
    }

    return await this.renderImg({ uid: this.uid, gachaData })
  }

  async upLogBysk () {
    this.mysInfo = await MysInfo.init({ e: this.e, game: this.game, UidType: 'sk' })
    if (!this.mysInfo?.ckInfo?.sk) {
      return false
    }

    const authkeyrow = await this.mysInfo.getData('authKey', {
      auth_appid: 'webview_gacha',
      cacheCd: 3600,
      option: { nolog: true }
    }, false)

    if (!authkeyrow?.data?.authkey) {
      this.e.reply(`uid:${this.mysInfo.uid},authkey获取失败：` + (authkeyrow?.message?.includes?.("登录失效") ? "请重新绑定stoken" : authkeyrow?.message))
      return false
    }

    this.e.reply(`正在更新UID:${this.mysInfo.uid}的抽卡记录，请稍后...`)

    return await this.upLog({
      uid: this.mysInfo.uid,
      authkey: encodeURIComponent(authkeyrow.data.authkey),
      region: MysUtil.getRegion(this.mysInfo.uid, this.game)
    })
  }

  async upLog (params) {
    const msgs = []
    this.uid = params.uid

    this.mysInfo.isTask = true
    this.mysInfo.setMysApi({ uid: this.uid, server: params.region }, { log: false })

    const gacha = {}
    for (const { type, typeName } of pool) {
      this.type = type
      this.typeName = typeName
      const { list, ids } = this.readJson(type)
      const { data = [], err = '', frequently = false, List = '' } = await this.getAllLog(params.authkey, ids)

      if (err) {
        msgs.push(err)
      } else if (!frequently) {
        /** 数据合并 */
        let num = data.length
        if (num > 0) {
          gacha[type] = data.concat(List || list)
        }
        msgs.push(`[${this.typeName}]记录获取成功，更新${num}条`)
      }
    }
    msgs.push(`\n抽卡记录更新完成，您还可回复\n【#zzz全部记录】统计全部抽卡数据\n【#zzz武器记录】统计武器池数据\n【#zzz角色统计】按卡池统计数据\n【#zzz导出记录】导出记录数据`)

    if (!this.uid) {
      this.e.reply('抽卡记录暂无数据，请等待有数据后再尝试更新！')
      return false
    }

    const user = await Data.readJSON(this.GachaUserPath(), { root: true, def: { master: [], ban: [] } })
    if (!user.master.some(item => item == this.e.user_id)) {
      user.master.push(String(this.e.user_id))
      lodash.pull(user.ban, String(this.e.user_id))
      Data.writeJSON(this.GachaUserPath(), user, { root: true })
    }

    const data = {}
    lodash.forEach(gacha, (val, key) => {
      Data.writeJSON(this.GachaPath(key), val, { root: true })
      data[key] = { ...this.analyse(val, key), ...pool.find(item => item.type == key) }
    })

    const sendMsg = [msgs.join('\n')]
    const img = await this.getLog(pool)
    if (img) sendMsg.push(img)

    return common.makeForward(sendMsg)
  }

  async exportJson () {
    this.uid = await this.checkPermission(this.e.user_id)
    if (!this.uid) {
      this.e.reply(`请先更新抽卡记录或绑定ck/sk后再尝试导出UID:${uid}的抽卡记录！`)
      return false
    }

    const list = []
    const tmpId = {}
    pool.forEach(({ type, typeName }) => {
      const gacha = this.readJson(type).list.reverse()
      gacha.forEach(v => {
        let id = v.id
        if (!id) {
          id = moment(v.time).format('x') + '000000'
          v.id = id
        } else {
          if (id.length == 13) {
            v.id = `${id}000000`
          }
        }

        if (tmpId[id]) {
          let newId = `${id}00000${tmpId[id].length}`
          tmpId[id].push(newId)
          v.id = newId
        } else {
          tmpId[id] = [id]
        }

        list.push(v)
      })
    })

    const uigfData = {
      info: {
        uid: this.uid,
        lang: list[0].lang,
        export_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        export_timestamp: moment().format('X'),
        export_app: PluginName,
        export_app_version: Cfg.package.version,
        srgf_version: 'v1.0',
        region_time_zone: moment(list[0].time).utcOffset() / 60
      },
      list: lodash.orderBy(list, ['id', 'asc'])
    }

    const save = `${Data.gamePath(this.game)}GachaData/${this.uid}.json`
    const savePath = Data.writeJSON(save, uigfData, { temp: true })

    logger.mark(`${this.e.logFnc} 导出成功${this.uid}.json`)
    this.e.reply(`导出成功：${this.uid}.json，共${list.length}条`)

    try {
      if (this.e.isGroup) {
        await this.e.bot.UploadGroupFile(this.e.group_id, savePath, `${this.uid}.json`)
      } else {
        await this.e.bot.UploadPrivateFile(this.e.user_id, savePath, `${this.uid}.json`)
      }
    } catch (err) { }

    Data.delFile(save, { temp: true })
  }

  /**@param {Map} ids  */
  async getAllLog (authkey, ids, page = 1, endId = 0) {
    const res = await this.mysInfo.getData('gacha', {
      gacha_type: this.type, page, end_id: endId, authkey,
    })

    if (res?.retcode != 0) {
      if (res?.retcode == -110) return { frequently: true }
      logger.error(`[UID:${this.uid}] 获取${this.typeName}记录失败`)
      return { err: `获取${this.typeName}记录失败` }
    }

    if (!res?.data?.list || res.data.list.length <= 0) {
      logger.mark(`[UID:${this.uid}] 获取${this.typeName}记录完成，共${Number(page) - 1}页`)
      return {}
    }

    /** 获取到uid后重新查询本地记录 */
    let List = ''
    if (!this.uid && ids.size === 0) {
      ({ list: List, ids } = this.readJson(this.type, res.data.list[0].uid))
    }

    let data = []
    for (let val of res.data.list) {
      if (ids.get(String(val.id))) {
        logger.mark(`[UID:${this.uid}] 获取${this.typeName}记录完成，暂无新记录`)
        return { data }
      } else {
        data.push(val)
        endId = val.id
      }
    }
    page++

    /** 延迟下防止武器记录获取失败 */
    await common.sleep(1000)

    const ret = await this.getAllLog(authkey, ids, page, endId)
    data = data.concat(ret.data || [])

    return { data, err: ret.err, List }
  }

  readJson (type, uid = '') {
    if (uid) this.uid = uid

    const ids = new Map()
    if (!this.uid) return { list: [], ids }

    const logJson = Data.readJSON(this.GachaPath(type), { root: true, def: [] })
    logJson.forEach(val => {
      if (val.id) ids.set(String(val.id), val.id)
    })

    return { list: logJson, ids }
  }

  /** 统计计算记录 */
  analyse (gacha, type) {
    const fiveLog = []
    const fourLog = []
    let fiveNum = 0
    let fourNum = 0
    let fiveLogNum = 0
    let fourLogNum = 0
    let noFiveNum = 0
    let noFourNum = 0
    let wai = 0 // 歪
    let weaponNum = 0
    let weaponFourNum = 0
    let allNum = gacha.length
    let bigNum = 0

    for (const val of gacha) {
      if (val.rank_type == 3) {
        fourNum++
        if (noFourNum == 0) {
          noFourNum = fourLogNum
        }
        fourLogNum = 0
        if (fourLog[val.name]) {
          fourLog[val.name]++
        } else {
          fourLog[val.name] = 1
        }
        if (val.item_type == "音擎") {
          weaponFourNum++
        }
      }
      fourLogNum++

      if (val.rank_type == 4) {
        fiveNum++
        if (fiveLog.length > 0) {
          if (fiveLog[fiveLog.length - 1].nums === 4) {
            fiveLog.push({
              ...fiveLog[fiveLog.length - 1],
              nums: [fiveLogNum]
            })
          } else {
            fiveLog[fiveLog.length - 1].nums.push(fiveLogNum)
          }
        } else {
          noFiveNum = fiveLogNum
        }

        fiveLogNum = 0
        let isUp = false
        // 歪了多少个
        if (val.item_type != "角色") {
          weaponNum++
        }

        if (this.checkIsUp(val, type)) {
          isUp = true
        } else {
          wai++
        }

        if (fiveLog[fiveLog.length - 1]?.name !== val.name || fiveLog[fiveLog.length - 1]?.nums === 4) {
          fiveLog.push({
            name: val.name,
            icon: this.getIcon(val.name, val.item_type),
            item_type: val.item_type,
            nums: [],
            isUp
          })
        }

      }
      fiveLogNum++
    }

    if (fiveLog.length > 0) {
      fiveLog[fiveLog.length - 1].nums.push(fiveLogNum)

      // 删除未知五星
      for (let i in fiveLog) {
        if (fiveLog[i].name == "未知") {
          allNum = allNum - fiveLog[i].nums.reduce((a, b) => a + b)
          fiveLog.splice(i, 1)
          fiveNum--
        } else {
          // 上一个五星是不是常驻
          let lastKey = Number(i) + 1
          if (fiveLog[lastKey] && !fiveLog[lastKey].isUp) {
            fiveLog[i].minimum = true
            bigNum++
          } else {
            fiveLog[i].minimum = false
          }
        }
      }
    } else {
      // 没有五星
      noFiveNum = allNum
    }

    // 四星最多
    let four = []
    for (let i in fourLog) {
      four.push({
        name: i,
        num: fourLog[i]
      })
    }
    four = four.sort((a, b) => { return b.num - a.num })

    if (four.length <= 0) {
      four.push({ name: "无", num: 0 })
    }

    let fiveAvg = 0
    let fourAvg = 0
    if (fiveNum > 0) {
      fiveAvg = Math.round((allNum - noFiveNum) / fiveNum)
    }
    if (fourNum > 0) {
      fourAvg = Math.round((allNum - noFourNum) / fourNum)
    }
    // 有效抽卡
    let isvalidNum = 0

    if (fiveNum > 0 && fiveNum > wai) {
      if (fiveLog.length > 0 && !fiveLog[0].isUp) {
        isvalidNum = Math.round((allNum - noFiveNum - fiveLog[0].nums[0]) / (fiveNum - wai))
      } else {
        isvalidNum = Math.round((allNum - noFiveNum) / (fiveNum - wai))
      }
    }

    // 小保底不歪概率
    let noWaiRate = 0
    if (fiveNum > 0) {
      noWaiRate = (fiveNum - bigNum - wai) / (fiveNum - bigNum)
      noWaiRate = (noWaiRate * 100).toFixed(1)
    }

    //最非，最欧
    let maxValue = '-'
    let minValue = '-'

    const filteredFiveLog = fiveLog.filter(item => item.nums.length > 0)
    if (filteredFiveLog.length > 0) {
      maxValue = Math.max(...filteredFiveLog.map(item => Math.max(...item.nums)))
      minValue = Math.min(...filteredFiveLog.map(item => Math.min(...item.nums)))
    }

    let upYs = isvalidNum * 160
    if (upYs >= 10000) {
      upYs = (upYs / 10000).toFixed(2) + "w"
    } else {
      upYs = upYs.toFixed(0)
    }

    let line = []
    // 常驻池
    if ([1001, 5001].includes(Number(type))) {
      line = [[
        { lable: "S级平均", num: fiveAvg, unit: "抽" },
        { lable: "A级平均", num: fourAvg, unit: "抽" },
        { lable: "A级最多", num: four[0].num, unit: four[0].name.slice(0, 4) },
      ], [
        { lable: "最非", num: maxValue, unit: "抽" },
        { lable: "最欧", num: minValue, unit: "抽" },
        { lable: `S级${Number(type) === 1001 ? '音擎' : '邦布'}`, num: weaponNum, unit: "个" },
        { lable: "<strong>S级</strong>/A级", num: `<strong>${fiveNum}</strong>/${fiveNum}`, unit: "" },
      ]]
    } else {
      line = [[
        { lable: "S级平均", num: fiveAvg, unit: "抽" },
        { lable: "小保底不歪", num: noWaiRate + "%", unit: "" },
        { lable: "最非", num: maxValue, unit: "抽" }
      ], [
        { lable: "UP平均", num: isvalidNum, unit: "抽" },
        { lable: "UP花费", num: upYs, unit: "" },
        { lable: "最欧", num: minValue, unit: "抽" },
        { lable: "<strong>限定</strong>/S级", num: `<strong>${fiveNum - wai}</strong>/${fiveNum}`, unit: "" },
      ]]
    }

    return {
      allNum,
      noFiveNum,
      noFourNum,
      firstTime: gacha[gacha.length - 1]?.time.substring(0, 16),
      lastTime: gacha[0]?.time.substring(0, 16),
      fiveLog,
      fiveAvg,
      line,
      max: type == 12 ? 80 : 90
    }
  }

  checkIsUp (role, type) {
    if ([1, 2].includes(Number(type))) return false
    const logTime = new Date(role.time).getTime()

    return PoolDetail.some(item => {
      if (
        !item.char5.includes(role.name) &&
        !item.weapon5.includes(role.name)
      ) return false

      let start = new Date(item.from).getTime()
      let end = new Date(item.to).getTime()
      return logTime >= start && logTime <= end
    })
  }

  getPools (msg = '') {
    if (/全部/g.test(msg)) return pool

    const types = msg.match(/up|抽卡|角色|抽奖|常驻|武器|音擎|邦布/g) || ['角色']
    const pools = types.map(type => {
      switch (type) {
        case "up":
        case "抽卡":
        case "角色":
        case "抽奖":
          return { type: 2001, typeName: "角色" }
        case "常驻":
          return { type: 1001, typeName: "常驻" }
        case "音擎":
        case "武器":
          return { type: 2002, typeName: "音擎" }
        case "邦布":
          return { type: 5001, typeName: "邦布" }
      }

      return { type: 2001, typeName: "角色" }
    })

    const orderPool = lodash.keyBy(pool, 'type')
    return lodash.sortBy(lodash.uniqBy(pools, 'type'), item => orderPool[item.type].type)
  }
}