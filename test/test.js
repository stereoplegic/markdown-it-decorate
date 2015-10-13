'use strict'

var assert = require('assert')
var markdownIt = require('markdown-it')
var decorate = require('../')

describe('markdown-it-decorate', function () {
  var md

  beforeEach(function () {
    md = markdownIt({ html: true }).use(decorate)
  })

  describe('classes', function () {
    test('text <!--{.red}-->', '<p class="red">text</p>\n')
    test('text <!--{.red.blue}-->', '<p class="red blue">text</p>\n')
    test('text <!--{.red .blue}-->', '<p class="red blue">text</p>\n')
  })

  describe('spaces', function () {
    test('text <!--{.red}-->', '<p class="red">text</p>\n')
    test('text <!--{ .red }-->', '<p class="red">text</p>\n')
    test('text <!-- {.red }-->', '<p class="red">text</p>\n')
    test('text <!--{ .red} -->', '<p class="red">text</p>\n')
    test('text <!-- {.red} -->', '<p class="red">text</p>\n')
    test('text <!-- { .red } -->', '<p class="red">text</p>\n')
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
    test('text [link](/) <!--{#x .y z=1}-->', '<p id="x" class="y" z="1">text <a href="/">link</a></p>\n')
  })

  describe('attributes', function () {
    test('text <!--{key="val"}-->', '<p key="val">text</p>\n')
    test('text <!--{key="val space"}-->', '<p key="val space">text</p>\n')
    test('text <!--{key=\'val\'}-->', '<p key="val">text</p>\n')
    test('text <!--{a=b c=d}-->', '<p a="b" c="d">text</p>\n')
    test('text <!--{key=val}-->', '<p key="val">text</p>\n')
    test('text <!--{data-toggle="foo"}-->', '<p data-toggle="foo">text</p>\n')
  })

  describe('h1 (atx)', function () {
    test('# h1 <!--{key=val}-->', '<h1 key="val">h1</h1>\n')
  })

  describe('h1 (lined)', function () {
    test('h1\n==\n<!--{key=val}-->', '<h1 key="val">h1</h1>\n')
  })

  describe('blockquote', function () {
    test('> text <!--{key=val}-->', '<blockquote>\n<p key="val">text</p>\n</blockquote>\n')
    test('> text\n<!--{key=val}-->', '<blockquote key="val">\n<p>text</p>\n</blockquote>\n')
    test('> text\n> text\n<!--{key=val}-->', '<blockquote key="val">\n<p>text\ntext</p>\n</blockquote>\n')
  })

  describe('lists', function () {
    test('* text\n<!--{.c}-->', '<ul class="c">\n<li>text</li>\n</ul>\n')
    test('* * text\n<!--{.c}-->', '<ul class="c">\n<li>\n<ul>\n<li>text</li>\n</ul>\n</li>\n</ul>\n')
  })

  describe('tables', function () {
    test('| x | y |\n|---|---|\n| a | b |\n<!--{.c}-->', { match: /^<table class="c">/ })
    test('* * text\n<!--{.c}-->', '<ul class="c">\n<li>\n<ul>\n<li>text</li>\n</ul>\n</li>\n</ul>\n')
  })

  describe('specifying tags', function () {
    test('* text <!--{li: .c}-->', '<ul>\n<li class="c">text</li>\n</ul>\n')
    test('* text <!--{ul: .c}-->', '<ul class="c">\n<li>text</li>\n</ul>\n')
    test('1. text <!--{ol: .c}-->', '<ol class="c">\n<li>text</li>\n</ol>\n')
    test('# text <!--{h1: .c}-->', '<h1 class="c">text</h1>\n')
    test('> text <!--{blockquote: .c}-->', '<blockquote class="c">\n<p>text</p>\n</blockquote>\n')
    test('> * text <!--{blockquote:.c}-->', { match: /<blockquote class="c">/ })
  })

  describe('li with paragraphs', function () {
    test('* text\n\n* text<!--{.c}-->',
      '<ul>\n' +
        '<li>\n' +
          '<p>text</p>\n' +
        '</li>\n' +
        '<li>\n' +
          '<p class="c">text</p>\n' +
        '</li>\n' +
      '</ul>\n')
  })

  describe('line breaks', function () {
    test('para\n<!--{.red .blue}-->', '<p class="red blue">para</p>\n')
    test('# heading\n<!--{key=val}-->', '<h1 key="val">heading</h1>\n')
    test('> bquote\n<!--{key=val}-->', '<blockquote key="val">\n<p>bquote</p>\n</blockquote>\n')
    test('> > bquote 2x\n<!--{key=val}-->', '<blockquote key="val">\n<blockquote>\n<p>bquote 2x</p>\n</blockquote>\n</blockquote>\n')
  })

  function test (input, output) {
    var label = input.replace(/\n/g, '· ')
    it(label, function () {
      if (typeof output === 'object' && output.match) {
        assert.ok(md.render(input).match(output.match))
      } else {
        assert.equal(md.render(input), output)
      }
    })
  }
})
