/* eslint-env mocha */
'use strict'

const Chai = require('chai')
Chai.should()

describe('messageSignature', () => {
  const messageSignature = require('../../lib/messageSignature')

  it('should return an hashed message', () => {
    messageSignature('/', {}, 1, '').should.be.a('string')
  })
})
