'use strict'
/* eslint-disable no-cond-assign */

var tagExpr = /^<!-- ?\{(?:([a-z0-9]+)(\^[0-9]*)?: ?)?(.*)\} ?-->\n?$/

module.exports = function attributes (md) {
  md.core.ruler.push('curly_attributes', curlyAttrs)
}

/*
 * List of tag -> token type mappings.
 */

var opening = {
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
  s: 's_open',
  tr: 'tr_open',
  td: 'td_open',
  tbody: 'tbody_open',
  thead: 'thead_open',
  table: 'table_open',
  hr: 'hr'
}

var selfClosingBlock = {
  hr: true
}
var selfClosingInline = {
  image: true
}

/**
 * ...
 */

function curlyAttrs (state) {
  var tokens = state.tokens
  var omissions = []
  var parent, m
  var stack = { len: 0, contents: [] }

  tokens.forEach(function (token, i) {
    // Save breadcrumbs so html_block will pick it up
    if (token.type.match(/_(open|start)$/)) {
      stack.contents.splice(stack.len)
      stack.contents.push(token)
      stack.len++
    } else if (token.type.match(/_(close|end)$/)) {
      stack.len--
    } else if (selfClosingBlock[token.type]) {
      stack.contents.push(token)
    }

    // "# Hello\n<!--{.classname}-->"
    // ...sequence of [heading_open, inline, heading_close, html_block]
    if (token.type === 'html_block') {
      m = token.content.match(tagExpr)
      if (!m) return

      parent = findParent(stack.contents, m[1], m[2])
      if (parent && applyToToken(parent, m[3])) {
        omissions.unshift(i)
      }
    }

    // "# Hello <!--{.classname} -->"
    // { type: 'inline', children: { ..., '<!--{...}-->' } }
    if (token.type === 'inline') {
      stack.contents.push(tokens[i - 1]) /* ? */
      stack.len++
      curlyInline(token.children, stack)
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

function curlyInline (children, stack) {
  var lastText, m, parent

  // Keep a list of sub-tokens to be removed
  var omissions = []

  children.forEach(function (child, i) {
    if (child.type.match(/_open$/)) {
      stack.contents.splice(stack.len)
      stack.contents.push(child)
      stack.len++
    } else if (child.type.match(/_close$/)) {
      stack.len--
    } else if (selfClosingInline[child.type]) {
      stack.contents.push(child)
    }

    if (m = child.content.match(tagExpr)) {
      // Remove the comment, then remove the extra space
      parent = findParent(stack.contents, m[1], m[2])
      if (parent && applyToToken(parent, m[3])) {
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

/**
 * Private: given a list of tokens `list` and `lastParent`, find the one that matches `tag`.
 */

function findParent (list, tag, depth) {
  if (!tag) return list[list.length - 1]

  if (depth === '^') {
    depth = 1
  } else if (typeof depth === 'string') { /* '^2' */
    depth = +depth.substr(1)
  } else {
    depth = 0
  }

  var target = opening[tag.toLowerCase()]
  var token
  var len = list.length
  var deepness = -1
  for (var i = len - 1; i >= 0; i--) {
    token = list[i]
    if (token.type === target) {
      if (++deepness === depth) return token
    }
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
