/* eslint-env mocha */
'use strict'

let KrakenApi = require('../')

before(() => {
  global.module = new KrakenApi({
    key: process.env.KRAKEN_API,
    secret: process.env.KRAKEN_SECRET
  })
})
