var assert = require('assert');

global.window = { innerWidth: 800, innerHeight: 600 };

describe('canvas clearing', function () {
  it('resets transform state before clearing the frame', function () {
    var canvasModule = require('../src/client/js/canvas');
    var calls = [];
    var context = {
      save: function () { calls.push('save'); },
      setTransform: function (a, b, c, d, e, f) {
        calls.push(['setTransform', a, b, c, d, e, f]);
      },
      beginPath: function () { calls.push('beginPath'); },
      clearRect: function (x, y, width, height) {
        calls.push(['clearRect', x, y, width, height]);
      },
      fillRect: function (x, y, width, height) {
        calls.push(['fillRect', x, y, width, height]);
      },
      restore: function () { calls.push('restore'); },
      globalCompositeOperation: 'source-over',
      fillStyle: ''
    };

    canvasModule.clearCanvas(context, 800, 600);

    assert.strictEqual(calls[0], 'save');
    assert.deepStrictEqual(calls[1], ['setTransform', 1, 0, 0, 1, 0, 0]);
    assert.strictEqual(calls[2], 'beginPath');
    assert.deepStrictEqual(calls[3], ['clearRect', 0, 0, 800, 600]);
    assert.strictEqual(context.fillStyle, '#d8d0b5');
    assert.deepStrictEqual(calls[4], ['fillRect', 0, 0, 800, 600]);
    assert.strictEqual(calls[5], 'restore');
    assert.strictEqual(context.globalCompositeOperation, 'source-over');
  });
});
