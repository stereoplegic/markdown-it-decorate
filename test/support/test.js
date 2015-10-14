var assert = require('assert')

function test (input, output) {
  var label = input.replace(/\n/g, '· ')
  it(label, testRun(input, output))
}

test.only = function (input, output) {
  var label = input.replace(/\n/g, '· ')
  it.only(label, testRun(input, output))
}

function testRun (input, output) {
  return function () {
    if (typeof output === 'object' && output.match) {
      assert.ok(global.md.render(input).match(output.match))
    } else {
      assert.equal(global.md.render(input), output, ' ')
    }
  }
}

module.exports = test
