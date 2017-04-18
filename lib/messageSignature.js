'use strict'

const Crypto = require('crypto')
const Querystring = require('querystring')

/**
 * This method returns a signature for a request as a Base64-encoded string
 * @param  {String}  path    The relative URL path for the request
 * @param  {Object}  request The POST body
 * @param  {Integer} nonce   A unique, incrementing integer
 * @return {String}          The request signature
 */
module.exports = function (path, request, nonce, secret) {
  let message = Querystring.stringify(request)
  secret = new Buffer(secret, 'base64')
  let hash = Crypto.createHash('sha256')
  let hmac = Crypto.createHmac('sha512', secret)

  let hashDigest = hash.update(nonce + message).digest('binary')
  return hmac.update(path + hashDigest, 'binary').digest('base64')
}
