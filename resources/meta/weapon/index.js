import { Meta } from '#MysTool/profile'
import { Data } from '#MysTool/utils'
import lodash from 'lodash'
import { abbr, aliasCfg } from './alias.js'
const Path = import.meta.url

const data = Data.readJSON('data.json', { Path })
const meta = Meta.create('sr', 'weapon')

