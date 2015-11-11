'use strict'

var markdownIt = require('markdown-it')
var decorate = require('../')
var test = require('./support/test')

global.md = markdownIt({ html: true }).use(decorate)

describe('markdown-it-decorate', function () {
  describe('classes:', function () {
    test('text <!--{.red}-->', '<p class="red">text</p>\n')
    test('text <!--{.red.blue}-->', '<p class="red blue">text</p>\n')
    test('text <!--{.red .blue}-->', '<p class="red blue">text</p>\n')
    test('text <!--{.red-1.green-2}-->', '<p class="red-1 green-2">text</p>\n')
    test('text <!--{.red-1 .green-2}-->', '<p class="red-1 green-2">text</p>\n')
    test('text <!--{.red-1 .-green-2}-->', '<p class="red-1 -green-2">text</p>\n')
  })

  describe('spaces:', function () {
    test('text <!--{.red}-->', '<p class="red">text</p>\n')
    test('text <!--{ .red }-->', '<p class="red">text</p>\n')
    test('text <!-- {.red }-->', '<p class="red">text</p>\n')
    test('text <!--{ .red} -->', '<p class="red">text</p>\n')
    test('text <!-- {.red} -->', '<p class="red">text</p>\n')
    test('text <!-- { .red } -->', '<p class="red">text</p>\n')
    test('text<!--{.red}-->', '<p class="red">text</p>\n')
    test('text<!--{ .red }-->', '<p class="red">text</p>\n')
    test('text<!-- {.red }-->', '<p class="red">text</p>\n')
    test('text<!--{ .red} -->', '<p class="red">text</p>\n')
    test('text<!-- {.red} -->', '<p class="red">text</p>\n')
    test('text<!-- { .red } -->', '<p class="red">text</p>\n')
  })

  describe('ids:', function () {
    test('text <!--{#myid}-->', '<p id="myid">text</p>\n')
    test('text <!--{#x#myid}-->', '<p id="myid">text</p>\n')
    test('text <!--{#x #myid}-->', '<p id="myid">text</p>\n')
  })

  describe('new lines:', function () {
    test('text\n<!--{#myid}-->', '<p id="myid">text</p>\n')
    test('text\n\n<!--{#myid}-->', '<p id="myid">text</p>\n')
    test('text\n<!--{#myid}-->\n\nhi', '<p id="myid">text</p>\n<p>hi</p>\n')
    test('text\n<!--{#myid}-->\nhi', '<p id="myid">text</p>\n<p>hi</p>\n')
    test('text\n\n<!--{#myid}-->\nhi', '<p id="myid">text</p>\n<p>hi</p>\n')
  })

  describe('falses:', function () {
    test('text <!--comment-->', '<p>text <!--comment--></p>\n')
    test('text\n<!--comment-->', '<p>text</p>\n<!--comment-->')
    test('text\n<!--{#x aah}-->', '<p>text</p>\n<!--{#x aah}-->')
    test('text <!--{#x aah}-->', '<p>text <!--{#x aah}--></p>\n')
    test('<!--{#x}-->', '<!--{#x}-->')
  })

  describe('in the middle:', function () {
    test('text <!--{#x.y}--> foo', '<p id="x" class="y">text foo</p>\n')
  })

  describe('multiple tags', function () {
    test('text <!--{#x}--> <!--{.y}--> foo', '<p id="x" class="y">text foo</p>\n')
    test('text <!--{#x}--><!--{.y}--> foo', '<p id="x" class="y">text foo</p>\n')
    test('*hi*<!--{#x}-->', '<p><em id="x">hi</em></p>\n')
  })

  describe('combinations', function () {
    test('text <!--{#x.y}-->', '<p id="x" class="y">text</p>\n')
    test('text <!--{#x .y}-->', '<p id="x" class="y">text</p>\n')
    test('text <!--{#x .y z=1}-->', '<p id="x" class="y" z="1">text</p>\n')
    test('text [link](/) <!--{p: #x .y z=1}-->', '<p id="x" class="y" z="1">text <a href="/">link</a></p>\n')
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

  describe('h1 with formatting', function () {
    test('# *h1* <!--{key=val}-->', '<h1><em key="val">h1</em></h1>\n')
  })

  describe('nested inline formatting:', function () {
    test('# ***yo*<!--{key=val}-->**', '<h1><strong><em key="val">yo</em></strong></h1>\n')
    test('# ***yo***<!--{key=val}-->', '<h1><strong><em key="val">yo</em></strong></h1>\n')
    test('# ***yo***\n\n<!--{key=val}-->', '<h1><strong><em key="val">yo</em></strong></h1>\n')
  })

  describe('h1 (lined):', function () {
    test('h1\n==\n<!--{key=val}-->', '<h1 key="val">h1</h1>\n')
  })

  describe('blockquote:', function () {
    test('> text <!--{key=val}-->', '<blockquote>\n<p key="val">text</p>\n</blockquote>\n')
    test('> text\n<!--{key=val}-->', '<blockquote>\n<p key="val">text</p>\n</blockquote>\n')
    test('> text\n> text\n<!--{key=val}-->', '<blockquote>\n<p key="val">text\ntext</p>\n</blockquote>\n')
  })

  describe('lists:', function () {
    test('* text\n<!--{ul:.c}-->', '<ul class="c">\n<li>text</li>\n</ul>\n')
    test('* * text\n<!--{ul:.c}-->', '<ul>\n<li>\n<ul class="c">\n<li>text</li>\n</ul>\n</li>\n</ul>\n')
  })

  describe('image:', function () {
    test('![](hi.jpg)<!--{.c}-->', '<p><img src="hi.jpg" alt="" class="c"></p>\n')
  })

  describe('horizontal rule:', function () {
    test('----\n<!--{.c}-->', '<hr class="c">\n')
  })

  describe('horizontal rule, nested:', function () {
    test('> ----\n<!--{.c}-->', '<blockquote>\n<hr class="c">\n</blockquote>\n')
  })

  describe('tables:', function () {
    test('| x | y |\n|---|---|\n| a | b |\n<!--{table:.c}-->', { match: /^<table class="c">/ })
  })

  xdescribe('tables (pending):', function () {
    test('| x | y |\n|---|---|\n| a | b |\n<!--{tr:.c}-->', { match: /^<tr class="c">/ })
    test('| x | y |\n|---|---|\n| a | b |\n<!--{td:.c}-->', { match: /^<td class="c">/ })
    test('| x | y |\n|---|---|\n| a | b |\n<!--{tbody:.c}-->', { match: /^<tbody class="c">/ })
  })

  describe('specifying tags:', function () {
    test('* text <!--{li: .c}-->', '<ul>\n<li class="c">text</li>\n</ul>\n')
    test('* text <!--{ul: .c}-->', '<ul class="c">\n<li>text</li>\n</ul>\n')
    test('1. text <!--{ol: .c}-->', '<ol class="c">\n<li>text</li>\n</ol>\n')
    test('# text <!--{h1: .c}-->', '<h1 class="c">text</h1>\n')
    test('> text <!--{blockquote: .c}-->', '<blockquote class="c">\n<p>text</p>\n</blockquote>\n')
    test('> * text <!--{blockquote:.c}-->', { match: /<blockquote class="c">/ })
  })

  describe('tags with spacing:', function () {
    test('* text <!--{li:.c}-->', '<ul>\n<li class="c">text</li>\n</ul>\n')
    test('* text <!--{li: .c}-->', '<ul>\n<li class="c">text</li>\n</ul>\n')
  })

  describe('li with paragraphs:', function () {
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

  describe('line breaks:', function () {
    test('para\n<!--{.red .blue}-->', '<p class="red blue">para</p>\n')
    test('# heading\n<!--{key=val}-->', '<h1 key="val">heading</h1>\n')
    test('> bquote\n<!--{key=val}-->', '<blockquote>\n<p key="val">bquote</p>\n</blockquote>\n')
    test('> > bquote 2x\n<!--{key=val}-->', '<blockquote>\n<blockquote>\n<p key="val">bquote 2x</p>\n</blockquote>\n</blockquote>\n')
    test('> > bquote 2x\n<!--{blockquote:key=val}-->', '<blockquote>\n<blockquote key="val">\n<p>bquote 2x</p>\n</blockquote>\n</blockquote>\n')
    test('> > bquote 2x\n<!--{blockquote^:key=val}-->', '<blockquote key="val">\n<blockquote>\n<p>bquote 2x</p>\n</blockquote>\n</blockquote>\n')
  })

  describe('headings:', function () {
    test(
      '# docpress\n<!--{h1:.-with-byline}-->\n\n' +
      '> It is good\n<!--{blockquote:.byline}-->\n',
      '<h1 class="-with-byline">docpress</h1>\n' +
      '<blockquote class="byline">\n' +
      '<p>It is good</p>\n' +
      '</blockquote>\n')
  })

  describe('fenced code blocks:', function () {
    test(
      '```\n' +
      'hello\n' +
      '```\n' +
      '<!--{code: .foo}-->',
      '<pre><code class="foo">hello\n' +
      '</code></pre>\n')
  })

  describe('indented blocks:', function () {
    // Sadly, it doesn't actually apply.
    test(
      '    hello\n' +
      '\n' +
      '<!--{code: .foo}-->',
      '<pre><code>hello\n' +
      '</code></pre>\n')
  })
})
