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
    // ...sequence of [heading_open, inline, heading_close, html_block]
    if (token.type === 'html_block') {
      m = token.content.match(tagExpr)
      if (!m) return

      parent = findParent(crumbs.concat([ lastParent ]), m[1])
      if (parent && applyToToken(parent, m[2])) {
        omissions.unshift(i)
      }
    }

    // "# Hello <!--{.classname} -->"
    // { type: 'inline', children: { ..., '<!--{...}-->' } }
    if (token.type === 'inline') {
      curlyInline(token.children, crumbs, tokens[i - 1])
    }
  })

  // Remove <!--...--> html_block tokens
  omissions.forEach(function (idx) {
    tokens = tokens.splice(idx, 1)
  })
}

/**
 * Internal: Run through inline and stuff
 */

function curlyInline (children, crumbs, previous) {
  var subcrumbs = []
  var lastText, lastOpen, m, parent

  // Keep a list of sub-tokens to be removed
  var omissions = []

  children.forEach(function (child, i) {
    if (child.type.match(/_open$/)) subcrumbs.push(child)
    else if (child.type.match(/_close$/)) lastOpen = subcrumbs.pop()

    if (m = child.content.match(tagExpr)) {
      // Remove the comment, then remove the extra space
      var myCrumbs = crumbs.concat([ previous ]).concat(subcrumbs)
      if (lastOpen) myCrumbs.push(lastOpen)

      parent = findParent(myCrumbs, m[1])
      if (parent && applyToToken(parent, m[2])) {
        omissions.push(i)
        if (lastText) trimRight(lastText, 'content')
      }
    }
    if (child.type === 'text') lastText = child
  })

  // Remove them in a separate step so we don't
  omissions.reverse().forEach(function (idx) {
    children.splice(idx, 1)
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
  h6: 'heading_open',
  a: 'link_open',
  em: 'em_open',
  strong: 'strong_open',
  code: 'code_inline',
  s: 's_open'
}

/**
 * Private: given a list of tokens `list` and `lastParent`, find the one that matches `tag`.
 */

function findParent (list, tag) {
  if (!tag) return list[list.length - 1]

  var target = dict[tag.toLowerCase()]
  var token
  var len = list.length
  for (var i = len - 1; i >= 0; i--) {
    token = list[i]
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
