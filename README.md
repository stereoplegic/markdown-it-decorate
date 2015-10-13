# markdown-it-decorate

Add attributes, IDs and classes to Markdown.

[![Status](https://travis-ci.org/rstacruz/markdown-it-decorate.svg?branch=master)](https://travis-ci.org/rstacruz/markdown-it-decorate "See test builds")

```md
This is some text. <!--{.center}-->
```

```html
<p class='center'>This is some text.</p>
```

Based off of [arve0/markdown-it-attrs](https://github.com/arve0/markdown-it-attrs).

## Block elements

Create an HTML comment in the format `<!--{...}-->`, where `...` can be a `.class`, `#id`, `key=attr` or a combination of both. Be sure to render markdownIt with `html: true` to enable parsing of `<!--{comments}-->`.

You can put the comment in the same line or in the next.

#### Examples

| What | Source | Destination |
|----|----|----|
| Classes | `Text <!--{.center}-->` | `<p class='center'>Text</p>` |
| Multi classes | `# Hello <!--{.center.red}-->` | `<h1 class='center red'>Hello</h1>` |
| ID and classes | `# Hello <!--{#top .hide}-->` | `<h1 id='top' class='hide'>Hello</h1>` |
