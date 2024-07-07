import { ApiTool, MysTool } from "#MysTool/mys"

ApiTool.setApiMap('zzz', function (data) {
  return {
    /** 首页 */
    index: {
      url: `${MysTool.record_api}event/game_record_zzz/api/zzz/index`,
      query: `role_id=${this.uid}&server=${this.server}`
    },
    /** 角色详情 */
    avatar_info: {
      url: `${MysTool.record_api}event/game_record_zzz/api/zzz/avatar/info`,
      query: `id_list[]=${data.id_list?.join?.('&id_list[]=') || ''}&need_wiki=true&role_id=${this.uid}&server=${this.server}`
    },
    /** 邦布 */
    buddy: {
      url: `${MysTool.record_api}event/game_record_zzz/api/zzz/buddy/info`,
      query: `role_id=${this.uid}&server=${this.server}`
    },
    /** 抽卡记录 */
    gacha: {
      url: `${MysTool.nap_gacha_api}common/gacha_record/api/getGachaLog`,
      query: `authkey_ver=1&lang=zh-cn&authkey=${data.authkey}&gacha_type=${data.gacha_type}&page=${data.page}&size=20&end_id=${data.end_id}&game_biz=${this.game_biz}`,
      HeaderType: 'noHeader'
    },
    /** 电量 */
    dailyNote: {
      url: `${MysTool.record_api}event/game_record_zzz/api/zzz/note`,
      query: `role_id=${this.uid}&server=${this.server}`
    },
  }
}, 'mys')

ApiTool.setApiMap('zzz', function (data) {
  return {
    /** 首页 */
    index: {
      url: `${MysTool.os_act_nap_api}event/game_record_zzz/api/zzz/index`,
      query: `role_id=${this.uid}&server=${this.server}`
    },
    /** 角色详情 */
    avatar_info: {
      url: `${MysTool.os_act_nap_api}event/game_record_zzz/api/zzz/avatar/info`,
      query: `id_list[]=${data.id_list}&need_wiki=true&role_id=${this.uid}&server=${this.server}`
    },
    /** 邦布 */
    buddy: {
      url: `${MysTool.os_act_nap_api}event/game_record_zzz/api/zzz/buddy/info`,
      query: `role_id=${this.uid}&server=${this.server}`
    },
    /** 抽卡记录 */
    gacha: {
      url: `${MysTool.os_nap_gacha_api}common/gacha_record/api/getGachaLog`,
      query: `authkey_ver=1&lang=zh-cn&authkey=${data.authkey}&gacha_type=${data.gacha_type}&page=${data.page}&size=20&end_id=${data.end_id}&game_biz=${this.game_biz}`,
      HeaderType: 'noHeader'
    },
    /** 电量 */
    dailyNote: {
      url: `${MysTool.os_act_nap_api}event/game_record_zzz/api/zzz/note`,
      query: `role_id=${this.uid}&server=${this.server}`
    },
  }
}, 'hoyolab')