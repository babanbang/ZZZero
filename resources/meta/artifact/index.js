import { Meta } from '#MysTool/profile'
import { Data } from '#MysTool/utils'
import lodash from 'lodash'
import artiBuffs from './calc.js'
import { artiSetAbbr, aliasCfg, artiAbbr } from './alias.js'
import { usefulAttr } from './artis-mark.js'
const Path = import.meta.url

const metaData = Data.readJSON('meta.json', { Path })
const setMeta = Meta.create('zzz', 'artiSet')
const artiMeta = Meta.create('zzz', 'arti')

