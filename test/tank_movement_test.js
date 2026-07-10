var expect = require('chai').expect;
var GameLogicService = require('../src/server/lib/gameLogicService');

describe('tank movement', function () {
    it('allows movement along the unblocked axis when the diagonal move would hit a wall', function () {
        var queryCalls = [];
        var gameLogicService = new GameLogicService({
            getQuadtree: function () {
                return {
                    get: function () { return []; },
                    put: function () {},
                    remove: function () {}
                };
            }
        }, {
            insertTrack: function () {}
        });

        var clientData = {
            id: 'player-1',
            position: { x: 100, y: 100 },
            player: {
                userInput: {
                    mouseAngle: 0,
                    keysPressed: {
                        KEY_RIGHT: true,
                        KEY_LEFT: false,
                        KEY_DOWN: true,
                        KEY_UP: false,
                        KEY_SPACE: false
                    }
                }
            },
            tank: {
                x: 100,
                y: 100,
                boostRemaining: 100,
                spriteTankHull: {
                    update: function () {},
                    singleFrameWidth: 32,
                    scaleFactorWidth: 1
                },
                spriteTankGun: {},
                path: {
                    id: 'path-1',
                    hasFinishedDelay: function () { return true; }
                },
                bullets: []
            }
        };

        var wallBounds = null;
        gameLogicService.quadtreeManager.queryGameObjectsForType = function (types, bounds) {
            queryCalls.push(bounds);
            wallBounds = bounds;

            if (bounds.x > 100 && Math.abs(bounds.y - 100) < 0.0001) {
                return { WALL: [{ id: 'wall-1' }] };
            }

            if (Math.abs(bounds.x - 100) < 0.0001 && bounds.y > 100) {
                return { WALL: [] };
            }

            return { WALL: [] };
        };

        gameLogicService.updateTank(clientData);

        expect(clientData.position.x).to.be.greaterThan(100);
        expect(clientData.position.y).to.be.greaterThan(100);
        expect(clientData.tank.x).to.be.greaterThan(100);
        expect(clientData.tank.y).to.be.greaterThan(100);
    });
});
