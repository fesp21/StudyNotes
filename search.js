var _ = require('underscore')
var async = require('async')
var model = require('./models')
var util = require('./util')

// Weights
var EXACT_MATCH = 1000
var WORD_MATCH = 100

var MAX_RESULTS = 8

exports.autocomplete = function (query, cb) {
  var results = []

  query = query.trim()

  async.parallel([
    function(cb) {
      model.Course
        .find({ name: exports.regexForQuery(query) })
        .limit(10)
        .sort('-hits')
        .exec(function(err, courses){
          if (err) { cb(err); return }
          courses.forEach(function(course) {
            results.push({
              weight: exports.weight(course, query),
              model: course
            })
          })
          cb(null)
        })
    },

    function(cb) {
      model.Note
        .find({ name: exports.regexForQuery(query) })
        .limit(10)
        .sort('-hits')
        .exec(function(err, notes) {
          if (err) { cb(err); return }
          notes.forEach(function (note){
            results.push({
              weight: exports.weight(note, query),
              model: note
            })
          })
          cb(null)
        })
    }

  ], function(err) {

    // Sort results by weight
    results = _.sortBy(results, function (result) {
      return -1 * result.weight
    })

    // Return small number of results
    results.splice(MAX_RESULTS)

    // Only return necessary information
    results = _.map(results, function (result, i) {
      return {
        desc: result.model.searchDesc,
        name: exports.highlight(result.model.name, query),
        position: i + 1,
        type: result.model.constructor.modelName,
        url: result.model.url,
        weight: result.weight
      }
    })

    cb(null, results)
  })
}

/**
 * Given a search query, returns a regular expression that matches
 * strings with words that start with the words in the query.
 *
 * Example:
 *
 *   regexForQuery('Hist')  // matches 'AP History', 'History'
 *   regexForQuery('Eng Lit')  // matches 'English Literature'
 *
 * @param  {String} q search query
 * @return {RegExp}
 */
exports.regexForQuery = function (query) {
  var tokens = query.split(' ')
    , str = '(^|\\s)[^a-z]*' + util.escapeRegExp(tokens[0])

  for(var i = 1, len = tokens.length; i < len; i++) {
    str += '.*\\s[^a-z]*' + util.escapeRegExp(tokens[i])
  }

  return new RegExp(str, 'i')
}


/**
 * Calculate the weight of a result, for a given query
 * @param  {Object} result
 * @param  {String} query
 * @return {Number} weight
 */
exports.weight = function (result, query){
  var weight = 0
  var words = query.split(' ')

  // Model-specific weights
  switch (result.constructor.modelName) {
    case 'Course':
      weight += 10
      break
    case 'Note':
      weight += 0
      break
  }

  // Exact match
  if (result.name.toLowerCase() === query.toLowerCase()) {
    weight += EXACT_MATCH
  }

  // Word match
  words.forEach(function (word){
    var re = new RegExp('(^|\\s)' + util.escapeRegExp(word) + '($|\\s)', 'i')
    if (re.test(result.name)) {
      weight += WORD_MATCH
    }
  })

  return weight
}

/**
 * Highlights occurances of the words in `query` in a given string `str` by
 * surrounding occurrances with a <strong> tag.
 *
 * @param  {String} str   String to search over
 * @param  {String} query Query string
 * @return {String} HTML string containing highlights
 */

exports.highlight = function (str, query) {
  var tokens = query.split(' ')
  var reStr = ''

  tokens.forEach(function (token, i){
    if (i != 0) {
      reStr += '|'
    }
    reStr += '((^|\\s)[^a-z]*' + util.escapeRegExp(tokens[i]) + ')'
  })

  str = str.replace(new RegExp(reStr, 'gi'), '<strong>$&</strong>')

  return str
}