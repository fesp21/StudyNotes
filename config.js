var util = require('./util')

exports.isProd = process.browser
  ? !/^local/.test(window.location.hostname)
  : (process.env.NODE_ENV === 'production')

exports.ports = {
  site: exports.isProd ? 7300 : 4000,
  liveupdater: exports.isProd ? 7301 : 4001,
  admin: 4002
}

exports.siteHost = exports.isProd
  ? 'www.apstudynotes.org'
  : 'localhost:' + exports.ports.site

exports.siteOrigin = '//' + exports.siteHost

exports.secureSiteOrigin = (exports.isProd
  ? 'https:'
  : 'http:'
) + exports.siteOrigin

exports.cdnOrigin = exports.isProd
  ? '//cdn.apstudynotes.org'
  : '/cdn'

exports.secureCdnOrigin = (exports.isProd ? 'https:' : '') + exports.cdnOrigin

util.extend(exports, require('./config-' + (process.browser ? 'browser' : 'node')))