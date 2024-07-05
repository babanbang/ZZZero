import { Meta } from '#MysTool/profile'
import { Data } from '#MysTool/utils'
import lodash from 'lodash'
import { abbr, aliasCfg } from './alias.js'
const Path = import.meta.url

const types = '防护,击破,强攻,强攻,支援'.split(',')
const data = Data.readJSON('data.json', { Path })
const meta = Meta.create('zzz', 'weapon')

meta.addData([{ id: 'allweapons', data }])
meta.addData(data)
meta.addAlias(aliasCfg)
meta.addAbbr(abbr)