'use strict'
/* eslint-disable no-cond-assign */

var tagExpr = /^<!-- ?\{(.*)\} ?-->$/

module.exports = function attributes (md) {
  md.core.ruler.push('curly_attributes', curlyAttrs)
}

function curlyAttrs (state) {
  var tokens = state.tokens
  var crumbs = []
  var omissions = []
  var lastParent, m

  tokens.forEach(function (token, i) {
    // Save breadcrumbs so html_block will pick it up
    if (token.type.match(/_(open|start)$/)) crumbs.push(token)
    else if (token.type.match(/_(close|end)$/)) lastParent = crumbs.pop()

    // "# Hello\n<!--{.classname}-->"
    // ...sequence of [heading_open, inline, heading_cose, html_block]
    if (token.type === 'html_block') {
      m = token.content.match(tagExpr)
      if (!m) return

      if (applyToToken(lastParent, m[1])) {
        omissions.unshift(i)
      }
    }

    // "# Hello <!--{.classname} -->"
    // { type: 'inline', children: { ..., '<!--{...}-->' } }
    if (token.type === 'inline') {
      var lastChild = token.children[token.children.length - 1]
      m = lastChild && lastChild.content.match(tagExpr)
      if (!m) return

      // Remove the comment, then remove the extra space
      if (applyToToken(tokens[i - 1], m[1])) {
        token.children.pop()
        trimRight(token.children[token.children.length - 1], 'content')
      }
    }
  })

  // Remove <!--...--> html_block tokens
  omissions.forEach(function (idx) {
    tokens = tokens.splice(idx, 1)
  })
}

/**
 * Private: trim the right
 */

function trimRight (obj, attr) {
  obj[attr] = obj[attr].replace(/\s*$/, '')
}

/**
 * Private: apply tag to token
 *
 *     applyToToken(token, '.classname')
 */

function applyToToken (token, attrs) {
  var m
  var todo = []

  while (attrs.length > 0) {
    if (m = attrs.match(/^\s*\.([a-zA-Z0-9\-\_]+)/)) {
      todo.push([ 'class', m[1], { append: true } ])
      shift()
    } else if (m = attrs.match(/^\s*\#([a-zA-Z0-9\-\_]+)/)) {
      todo.push([ 'id', m[1] ])
      shift()
    } else if (m = attrs.match(/^\s*([a-zA-Z0-9\-\_]+)="([^"]*)"/)) {
      todo.push([ m[1], m[2] ])
      shift()
    } else if (m = attrs.match(/^\s*([a-zA-Z0-9\-\_]+)='([^']*)'/)) {
      todo.push([ m[1], m[2] ])
      shift()
    } else if (m = attrs.match(/^\s*([a-zA-Z0-9\-\_]+)=([^ ]*)/)) {
      todo.push([ m[1], m[2] ])
      shift()
    } else if (m = attrs.match(/^\s+/)) {
      shift()
    } else {
      return
    }
  }

  todo.forEach(function (args) { setAttr.apply(this, [token].concat(args)) })
  return true

  function shift () {
    attrs = attrs.substr(m[0].length)
  }
}

/**
 * Private: sets an attribute `attr` to `value` in a token. If `options.append`
 * is true, append to the old value instead of overwriting it.
 */

function setAttr (token, attr, value, options) {
  var idx = token.attrIndex(attr)

  if (idx === -1) {
    token.attrPush([ attr, value ])
  } else if (options && options.append) {
    token.attrs[idx][1] =
      token.attrs[idx][1] + ' ' + value
  } else {
    token.attrs[idx][1] = value
  }
}
