'use strict'

const Request = require('request')

const messageSignature = require('./lib/messageSignature')

/**
 * KrakenClient connects to the Kraken.com API
 * @param {String} key    API Key
 * @param {String} secret API Secret
 * @param {String} [otp]  Two-factor password (optional) (also, doesn't work)
 */

module.exports = class KrakenApi {
  constructor (key, secret, otp) {
    this.config = {
      url: 'https://api.kraken.com',
      version: '0',
      key: key,
      secret: secret,
      otp: otp,
      timeoutMS: 5000
    }
  }

  /**
   * This method makes a public or private API request.
   * @param  {String}   method   The API method (public or private)
   * @param  {Object}   params   Arguments to pass to the api call
   * @param  {Function} callback A callback function to be executed when the request is complete
   * @return {Object}            The request object
   */
  api (method, params) {
    let methods = {
      public: ['Time', 'Assets', 'AssetPairs', 'Ticker', 'Depth', 'Trades', 'Spread', 'OHLC'],
      private: ['Balance', 'TradeBalance', 'OpenOrders', 'ClosedOrders', 'QueryOrders', 'TradesHistory', 'QueryTrades', 'OpenPositions', 'Ledgers', 'QueryLedgers', 'TradeVolume', 'AddOrder', 'CancelOrder', 'DepositMethods', 'DepositAddresses', 'DepositStatus', 'WithdrawInfo', 'Withdraw', 'WithdrawStatus', 'WithdrawCancel']
    }
    if (methods.public.indexOf(method) !== -1) {
      return this.publicMethod(method, params)
    } else if (methods.private.indexOf(method) !== -1) {
      return this.privateMethod(method, params)
    } else {
      throw new Error(method + ' is not a valid API method.')
    }
  }

  /**
   * This method makes a public API request.
   * @param  {String}   method   The API method (public or private)
   * @param  {Object}   params   Arguments to pass to the api call
   * @param  {Function} callback A callback function to be executed when the request is complete
   * @return {Object}            The request object
   */
  publicMethod (method, params) {
    params = params || {}

    let path = '/' + this.config.version + '/public/' + method
    let url = this.config.url + path

    return this.rawRequest(url, {}, params)
  }

  /**
   * This method makes a private API request.
   * @param  {String}   method   The API method (public or private)
   * @param  {Object}   params   Arguments to pass to the api call
   * @param  {Function} callback A callback function to be executed when the request is complete
   * @return {Object}            The request object
   */
  privateMethod (method, params) {
    params = params || {}

    let path = '/' + this.config.version + '/private/' + method
    let url = this.config.url + path

    if (!params.nonce) {
      params.nonce = new Date() * 1000 // spoof microsecond
    }

    if (this.config.otp !== undefined) {
      params.otp = this.config.otp
    }

    let signature = messageSignature(path, params, params.nonce, this.config.secret)

    let headers = {
      'API-Key': this.config.key,
      'API-Sign': signature
    }

    return this.rawRequest(url, headers, params)
  }

  /**
   * This method sends the actual HTTP request
   * @param  {String}   url      The URL to make the request
   * @param  {Object}   headers  Request headers
   * @param  {Object}   params   POST body
   * @param  {Function} callback A callback function to call when the request is complete
   * @return {Object}            The request object
   */
  rawRequest (url, headers, params, callback) {
    return new Promise((resolve, reject) => {
      // Set custom User-Agent string
      headers['User-Agent'] = 'Kraken-Rx Node.js API Client'

      let options = {
        url: url,
        method: 'POST',
        headers: headers,
        form: params,
        timeout: this.config.timeoutMS
      }

      Request.post(options, function (error, response, body) {
        let data

        if (error) {
          reject(new Error('Error in server response: ' + JSON.stringify(error)))
        }
        try {
          data = JSON.parse(body)
        } catch (e) {
          reject(new Error('Could not understand response from server: ' + body))
        }

        // If any errors occured, Kraken will give back an array with error strings under
        // the key "error". We should then propagate back the error message as a proper error.
        if (data.error && data.error.length) {
          let krakenError = null
          data.error.forEach(function (element) {
            if (element.charAt(0) === 'E') {
              krakenError = element.substr(1)
              return false
            }
          })
          if (krakenError) {
            reject(new Error('Kraken API returned error: ' + krakenError))
          }
        } else {
          resolve(data)
        }
      })
    })
  }
}
