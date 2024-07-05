import { MysInfo } from "#MysTool/mys"
import { User } from "#MysTool/user"
import { Base } from "#MysTool/utils"
import lodash from "lodash"
import moment from "moment"
import { common } from "node-karin"

export default class DailyNote extends Base {
  constructor (e = {}) {
    super(e, 'zzz')
    this.model = 'dailyNote/note'
    this.week = [
      '星期日',
      '星期一',
      '星期二',
      '星期三',
      '星期四',
      '星期五',
      '星期六'
    ]
  }

  async get () {
    const sendMsg = []
    this.e.reply('正在查询中，请稍等...', { at: true })

    const _reply = this.e.reply
    this.e.reply = (msg) => sendMsg.push(msg)

    sendMsg.push(...await this.getNoteImgs(this.e.user_id))

    if (sendMsg.length > 2) {
      this.e.bot.sendForwardMessage(this.e.contact, common.makeForward(sendMsg))
    } else {
      _reply(sendMsg)
    }
    return true
  }

  async dailyNoteTask () {

  }

  async getNoteImgs (user_id) {
    const ImgList = []

    const user = await User.create(user_id, this.game)
    const mysInfo = new MysInfo(this.e, this.game)

    const uids = user.getUidList(this.game, { type: 'all' })
    for (const uid of uids) {
      const mys = user.getUidData({ game: this.game, uid })
      mysInfo.setMysApi(mys)

      // if (mys.sk && !mysInfo.hoyolab) {
      //   const noteData = await this.getWidgetData(mysInfo)
      //   if (noteData?.retcode == 0) {
      //     ImgList.push(await this.renderImg({ uid, ...this.dealData(noteData.data) }))
      //     continue
      //   }
      // }

      if (mys.ck) {
        const noteData = await mysInfo.getData('dailyNote')
        if (noteData?.retcode == 0) {
          ImgList.push(await this.renderImg({ uid, ...this.dealData(noteData.data) }))
        }
        continue
      }

      ImgList.push('请先绑定cookie')
    }

    return ImgList
  }

  /**@param {MysInfo} mysInfo  */
  async getWidgetData (mysInfo, task = false) {
    const User = await this.getUserData(mysInfo)
    const noteData = await mysInfo.getData('widget', { useSK: true }, !task)

    if (User.main) {
      let retry = 0
      let ret = await this.changeRole(mysInfo, User.main)
      while (ret?.retcode === 1003 && retry < 3) {
        ret = await this.changeRole(mysInfo, User.main)
        retry++
      }
    }

    return noteData
  }

  /**@param {MysInfo} mysInfo  */
  async getUserData (mysInfo) {
    const Roles = await mysInfo.getData('getUserGameRolesByStoken', { option: { nolog: true } }, false)

    if (Roles?.data?.list?.length > 0) {
      const RoleList = Roles.data.list.filter(role => role.game_biz == mysInfo.game_biz)

      if (RoleList.length > 0) {
        if (RoleList.length === 1) return { data: RoleList[0] }

        const main = RoleList.find(role => role.is_chosen) || RoleList[0]
        if (main.game_uid === mysInfo.mysApi.uid) return { data: main }

        const data = RoleList.find(role => role.game_uid == mysInfo.mysApi.uid)
        if (!await this.changeRole(mysInfo, data)) {
          logger.error(`切换小组件查询UID:${mysInfo.mysApi.uid}失败`)
          return { data }
        }

        return { data, main }
      }
    }
    return {}
  }

  /**@param {MysInfo} mysInfo  */
  async changeRole (mysInfo, data) {
    await common.sleep(lodash.random(200, 500))
    const ret = await mysInfo.getData('getActionTicket', { option: { nolog: true } }, false)
    if (!ret?.data?.ticket) return false

    await common.sleep(lodash.random(1000, 1500))
    const res = await mysInfo.getData('changeGameRole', {
      action_ticket: ret.data.ticket,
      game_biz: data.game_biz,
      game_uid: data.game_uid,
      region: data.region,
      option: { nolog: true }
    }, false)

    return res?.retcode == 0
  }

  dealData (data) {
    const ImgData = {}
    const nowDay = moment(new Date()).format('DD')

    if (data.energy.restore > 0) {
      let resinMaxTime = new Date().getTime() + data.energy.restore * 1000
      let maxDate = new Date(resinMaxTime)

      resinMaxTime = moment(maxDate).format('HH:mm')
      ImgData.resinMaxTimeMb2 = this.dateTime(maxDate) + moment(maxDate).format('hh:mm')

      if (moment(maxDate).format('DD') !== nowDay) {
        ImgData.resinMaxTimeMb2Day = '明天'
        resinMaxTime = `明天 ${resinMaxTime}`
      } else {
        ImgData.resinMaxTimeMb2Day = '今天'
        resinMaxTime = ` ${resinMaxTime}`
      }
      ImgData.resinMaxTime = resinMaxTime
    }

    ImgData.sale_state = /Doing/.test(data.vhs_sale.sale_state) ? '正在营业' : '未营业'
    ImgData.card_sign = /Done/.test(data.card_sign) ? '已完成' : '未完成'

    return {
      ...data,
      ...ImgData,
      dayMb2: moment(new Date()).format('yyyy年MM月DD日 HH:mm') + ' ' + this.week[new Date().getDay()],
    }
  }

  dateTime (time) {
    return moment(time).format('HH') < 6
      ? '凌晨'
      : moment(time).format('HH') < 12
        ? '上午'
        : moment(time).format(
          'HH') < 17.5
          ? '下午'
          : moment(time).format('HH') < 19.5
            ? '傍晚'
            : moment(time).format('HH') < 22
              ? '晚上'
              : '深夜'
  }
}