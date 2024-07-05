import { Meta } from '#MysTool/profile'
import { Data } from '#MysTool/utils'

const meta = Meta.create('zzz', 'bangboo')
meta.addData(Data.readJSON('data.json', { Path: import.meta.url }))