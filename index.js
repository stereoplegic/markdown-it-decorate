'use strict'

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

      applyToToken(lastParent, m[1])
      omissions.unshift(i)
    }

    // "# Hello <!--{.classname} -->"
    // { type: 'inline', children: { ..., '<!--{...}-->' } }
    if (token.type === 'inline') {
      var lastChild = token.children[token.children.length - 1]
      m = lastChild && lastChild.content.match(tagExpr)
      if (!m) return

      // Remove the comment, then remove the extra space
      token.children.pop()
      trimRight(token.children[token.children.length - 1], 'content')
      applyToToken(tokens[i - 1], m[1])
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

  while (attrs.length > 0) {
    if (m = attrs.match(/^\s*\.([a-zA-Z0-9\-\_]+)/)) {
      addClass(token, m[1])
      shift()
    } else if (m = attrs.match(/^\s*\#([a-zA-Z0-9\-\_]+)/)) {
      setAttr(token, 'id', m[1])
      shift()
    } else if (m = attrs.match(/^\s*([a-zA-Z0-9\-\_]+)="([^"]*)"/)) {
      setAttr(token, m[1], m[2])
      shift()
    } else if (m = attrs.match(/^\s*([a-zA-Z0-9\-\_]+)='([^']*)'/)) {
      setAttr(token, m[1], m[2])
      shift()
    } else if (m = attrs.match(/^\s*([a-zA-Z0-9\-\_]+)=([^ ]*)/)) {
      setAttr(token, m[1], m[2])
      shift()
    } else if (m = attrs.match(/^\s+/)) {
      shift()
    }
  }

  function shift () {
    attrs = attrs.substr(m[0].length)
  }
}

/**
 * Private: adds a class name to token
 */

function addClass (token, value) {
  setAttr(token, 'class', value, { append: true })
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
