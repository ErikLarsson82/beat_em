requirejs.config({
    waitSeconds: '60',
    baseUrl: 'lib',
    paths: {
      'app': '../app',
      'GameLoop': '../node_modules/gameloop-schwein/GameLoop'
    }
});

requirejs([
  'app/game',
  'GameLoop'
], function (game, GameLoop) {

    let running = true;

    window.addEventListener('keydown', function (e) {
        if (e.keyCode === 80) {
            running = !running;
        }
    });

    game.init();

    var tick = function(delta) {
        if (!running) return;
        game.tick(delta);
    }
    var config = {
        callback: tick,
        fpsMode: 'screenHz',
        autoStart: true,
        createDebugKeyBoardShortcuts: true
    }
    var gameLoop = new GameLoop(config);
})