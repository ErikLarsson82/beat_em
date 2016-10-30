requirejs.config({
    waitSeconds: '60',
    baseUrl: 'lib',
    paths: {
      'app': '../app',
    }
});

requirejs([
  'app/game'
], function (game) {

    let running = true;

    window.addEventListener('keydown', function (e) {
        if (e.keyCode === 80) {
            running = !running;
        }
    });

    game.init();

    function gameLoop() {
        window.requestAnimationFrame(gameLoop);
        if (!running) return;
        game.tick();
    }
    gameLoop();
})