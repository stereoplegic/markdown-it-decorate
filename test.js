'use strict'
var assert = require('assert')
var markdownIt = require('markdown-it')
var markdownItAttrs = require('./')

describe('markdown-it-attrs', function () {
  var md

  beforeEach(function () {
    md = markdownIt({ html: true }).use(markdownItAttrs)
  })

  describe('classes', function () {
    test('text <!--{.red}-->', '<p class="red">text</p>\n')
    test('text <!--{ .red }-->', '<p class="red">text</p>\n')
    test('text <!--{.red.blue}-->', '<p class="red blue">text</p>\n')
    test('text <!--{.red .blue}-->', '<p class="red blue">text</p>\n')
  })

  describe('ids', function () {
    test('text <!--{#myid}-->', '<p id="myid">text</p>\n')
    test('text <!--{#x#myid}-->', '<p id="myid">text</p>\n')
    test('text <!--{#x #myid}-->', '<p id="myid">text</p>\n')
  })

  describe('combinations', function () {
    test('text <!--{#x.y}-->', '<p id="x" class="y">text</p>\n')
    test('text <!--{#x .y}-->', '<p id="x" class="y">text</p>\n')
    test('text <!--{#x .y z=1}-->', '<p id="x" class="y" z="1">text</p>\n')
  })

  describe('attributes', function () {
    test('text <!--{key="val"}-->', '<p key="val">text</p>\n')
    test('text <!--{key="val space"}-->', '<p key="val space">text</p>\n')
    test('text <!--{key=\'val\'}-->', '<p key="val">text</p>\n')
    test('text <!--{a=b c=d}-->', '<p a="b" c="d">text</p>\n')
    test('text <!--{key=val}-->', '<p key="val">text</p>\n')
  })

  describe('non-p', function () {
    test('# h1 <!--{key=val}-->', '<h1 key="val">h1</h1>\n')
  })

  describe.skip('line breaks', function () {
    test('text\n<!--{.red .blue}-->', '<p class="red blue">text</p>\n')
    test('# h1\n<!--{key=val}-->', '<h1 key="val">h1</h1>\n')
  })

  function test (input, output) {
    var m = input.match(/<!--(.*?)-->/)
    it(m && m[1] || input, function () {
      assert.equal(md.render(input), output)
    })
  }
})
