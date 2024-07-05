import karin from 'node-karin'
import { MysUtil } from '#MysTool/mys'
import DailyNote from '../model/dailyNote.js'
import '../index.js'
const reg = MysUtil.reg.zzz

export const dailyNote = karin.command(
  new RegExp(`^${reg}(查询)?(体力|电量)$`, 'i'),
  async (e) => await new DailyNote(e).get(),
  { name: '绝区零电量查询', priority: 200 }
)

export const dailyNoteAll = karin.handler(
  'mys.zzz.dailyNote',
  async (e) => await new DailyNote(e).getNoteImgs(this.e.user_id),
  { priority: 200 }
)

// export const Task = karin.task(
//   '星铁体力推送任务',
//   Cfg.getConfig('cron', 'sr').dailyNoteTask || '0 * * * * ?',
//   () => {
//     new DailyNote().dailyNoteTask()
//     return true
//   }
// )
