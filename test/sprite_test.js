var assert = require('assert');
var Sprite = require('../src/server/lib/sprite');

describe('sprite rendering', function () {
  it('rounds sprite draw coordinates to avoid subpixel trails', function () {
    var calls = [];
    var context = {
      save: function () { calls.push('save'); },
      translate: function (x, y) { calls.push(['translate', x, y]); },
      rotate: function (r) { calls.push(['rotate', r]); },
      drawImage: function (image, sx, sy, sw, sh, dx, dy, dw, dh) {
        calls.push(['drawImage', sx, sy, sw, sh, dx, dy, dw, dh]);
      },
      restore: function () { calls.push('restore'); }
    };

    var sprite = new Sprite(100, 80, 0, 1, 1);
    Sprite.render(sprite, context, {}, 100.7, 80.4, 0.3);

    var drawCall = calls.find(function (entry) {
      return Array.isArray(entry) && entry[0] === 'drawImage';
    });

    assert.ok(drawCall);
    assert.strictEqual(drawCall[5], 51);
    assert.strictEqual(drawCall[6], 40);
  });
});
