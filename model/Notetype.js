/*jslint node: true */

var _ = require('underscore')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var Notetype = mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    index: true,
    required: true
  },
  singularName: String,
  shortDesc: String,
  desc: String,
  hasChapters: Boolean
})

Notetype.plugin(plugin.modifyDate)
Notetype.plugin(plugin.createDate)
Notetype.plugin(plugin.slug, { model: 'Notetype' })

module.exports = Notetype