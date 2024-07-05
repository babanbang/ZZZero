import { Meta, CharCfg } from '#MysTool/profile'
import { Data } from '#MysTool/utils'
import lodash from 'lodash'
import { alias, abbr } from './alias.js'
import { wifeCfg } from './extra.js'

const data = Data.readJSON('data.json', { Path: import.meta.url })
const meta = Meta.create('zzz', 'char')

const name = []
lodash.forEach(data, (ds) => {
  name.push(ds.name)
})
meta.addData([{ id: 'allchars', name }])
meta.addData(data)
meta.addAlias(alias)

lodash.forEach(data, (ds) => {
  abbr[ds.name] = abbr[ds.name] || ds.name
})
meta.addAbbr(abbr)

// 老婆设置同样设置到gs下，通用数据
const gsMeta = Meta.create('gs', 'char')
const { wifeData = {} } = gsMeta.getMeta()
lodash.forEach(wifeCfg, (txt, type) => {
  wifeData[type] = wifeData[type] || {}
  Data.eachStr(txt, (name) => {
    let id = meta.getId(name)
    if (id) {
      wifeData[type][id] = true
    }
  })
})
gsMeta.addMeta({ wifeData })
// CharCfg.initCfg('zzz')