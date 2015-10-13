'use strict'
/* eslint-disable no-cond-assign */

var tagExpr = /^<!-- ?\{(?:([a-z0-9]+): ?)?(.*)\} ?-->$/

module.exports = function attributes (md) {
  md.core.ruler.push('curly_attributes', curlyAttrs)
}

function curlyAttrs (state) {
  var tokens = state.tokens
  var crumbs = []
  var omissions = []
  var lastParent, parent, m

  tokens.forEach(function (token, i) {
    // Save breadcrumbs so html_block will pick it up
    if (token.type.match(/_(open|start)$/)) crumbs.push(token)
    else if (token.type.match(/_(close|end)$/)) lastParent = crumbs.pop()

    // "# Hello\n<!--{.classname}-->"
    // ...sequence of [heading_open, inline, heading_cose, html_block]
    if (token.type === 'html_block') {
      m = token.content.match(tagExpr)
      if (!m) return

      parent = findParent(crumbs, lastParent, m[1])
      if (parent && applyToToken(parent, m[2])) {
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
      parent = findParent(crumbs, tokens[i - 1], m[1])
      if (parent && applyToToken(parent, m[2])) {
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

/*
 * List of tag -> token type mappings.
 */

var dict = {
  li: 'list_item_open',
  ul: 'bullet_list_open',
  p: 'paragraph_open',
  ol: 'ordered_list_open',
  blockquote: 'blockquote_open',
  h1: 'heading_open',
  h2: 'heading_open',
  h3: 'heading_open',
  h4: 'heading_open',
  h5: 'heading_open',
  h6: 'heading_open'
}

/**
 * Private: given a list of tokens `list` and `lastParent`, find the one that matches `tag`.
 */

function findParent (list, lastParent, tag) {
  if (!tag) return lastParent

  var target = dict[tag.toLowerCase()]
  var token
  var len = list.length
  for (var i = len; i >= 0; i--) {
    token = len === i ? lastParent : list[i]
    if (token.type === target) return token
  }
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
