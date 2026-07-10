var assert = require('assert');
var DrawingUtil = require('../src/client/js/drawingUtil');

global.Image = function () {};

describe('DrawingUtil', function () {
  it('uses the provided canvas wrapper context for rendering', function () {
    var wrapper = {
      getCanvas: function () {
        return { getContext: function () { return {}} };
      },
      getContext: function () {
        return { save: function () {}, restore: function () {}, translate: function () {}, fillRect: function () {}, fillStyle: '', createPattern: function () { return {}; } };
      }
    };

    var util = new DrawingUtil(wrapper);

    assert.ok(util.context2D);
    assert.strictEqual(typeof util.context2D.save, 'function');
  });
});
