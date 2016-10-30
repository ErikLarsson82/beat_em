define('game', [
    'underscore',
    'userInput',
    'SpriteSheet',
    'TimedAction'
], function (
    _,
    userInput,
    SpriteSheet,
    TimedAction
) {    
    var DEBUG_WRITE_BUTTONS = false;
    
    let gameObjects = [];
    var game = {}
    window.game = game;

    game.detectHits = function(who, type) {
        return _.filter(gameObjects, function(item) {
            if (!item.hitbox) {
                console.error("Dimensions not found on item");
                return false;
            }
            if (item === who) return;

            const condition1 = who.hitbox.x + who.hitbox.width > item.hitbox.x;
            const condition2 = who.hitbox.x < item.hitbox.x + item.hitbox.width;
            const condition3 = who.hitbox.y + who.hitbox.height > item.hitbox.y;
            const condition4 = who.hitbox.y < item.hitbox.y + item.hitbox.height;
            const condition5 = item instanceof type;
            return (condition1 && condition2 && condition3 && condition4 && condition5);
        });
    }

    game.findGameObj = function(klass) {
        return _.find(gameObjects, function(item) {
            return item instanceof klass;
        });
    }
    

    function debugWriteButtons(pad) {
        if (!DEBUG_WRITE_BUTTONS) return;
        _.each(pad && pad.buttons, function(button, idx) {
            if (button.pressed) console.log(idx + " pressed");
        })
    }

    var player_idle_spritesheet = new Image();
    player_idle_spritesheet.src = "fighter_idle_spritesheet.png";

    var player_punch_spritesheet = new Image();
    player_punch_spritesheet.src = "fighter_punch_spritesheet.png";

    var bag = new Image();
    bag.src = "bag.png";

    var bag_punched_spritesheet = new Image();
    bag_punched_spritesheet.src = "bag_punched_spritesheet.png";

    var dojo = new Image();
    dojo.src = "dojo.png";

    const WALKING = 'Walking';
    const PUNCH = 'Punch';
    const FALL = 'Fall';

    const LEFT = 'Left';
    const RIGHT = 'Right';

    class GameObject {
        constructor(config) {
            this.game = config.game;
            this.hitbox = config.hitbox;
            this.color = config.color || "#444444";
            this.markedForRemoval = false;
        }
        tick() {

        }
        draw2d() {
            context.fillStyle = this.color;
            context.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
        }
        draw3d() {

        }
    }

    class Punch extends GameObject {
        constructor(config) {
            super(config);
            this.detectHitsOnce = _.once(() => {
                var bag = this.game.detectHits(this, PunchBag)[0];
                bag && bag.hit();
            })
            this.removeTimer = new TimedAction(200, () => { this.markedForRemoval = true });
        }
        tick() {
            this.detectHitsOnce();
            this.removeTimer.tick();
        }
        draw2d() {
            context.fillStyle = this.color;
            context.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
        }
    }

    class PunchBag extends GameObject {
        constructor(config) {
            super(config);
            this.sprite = { tick: () => {} };
            this.resetColor = { tick: () => {} };
        }
        tick() {
            this.sprite.tick();
            this.resetColor.tick();
        }
        hit() {
            this.color = "red";
            this.resetColor = new TimedAction(100, () => { this.color = "blue" })
            this.sprite = SpriteSheet.new(bag_punched_spritesheet, {
                frames: [400, 400, 400, 400, 400],
                x: 0,
                y: 0,
                width: 56,
                height: 84,
                restart: false,
                autoPlay: true,
                callback: () => { this.sprite = { tick: () => {} } }
            });
        }
        draw3d() {
            if (this.sprite.draw) {
                this.sprite.draw(context, { x: this.hitbox.x, y: this.hitbox.y });
            } else {
                context.drawImage(bag, this.hitbox.x, this.hitbox.y)
            }
        }
    }
    window.PunchBag = PunchBag;
    
    class Player extends GameObject {
        constructor(config) {
            super(config);
            this.id = config.id;
            this.markedForRemoval = false;
            this.state = WALKING;
            this.duration = null;
            this.direction = LEFT;
            this.setIdleSpriteSheet();
        }
        setIdleSpriteSheet() {
            this.sprite = SpriteSheet.new(player_idle_spritesheet, {
                frames: [400, 400, 400, 400],
                x: 0,
                y: 0,
                width: 60,
                height: 84,
                restart: true,
                autoPlay: true,
            });

        }
        setPunchSpriteSheet() {
            this.sprite = SpriteSheet.new(player_punch_spritesheet, {
                frames: [100, 100, 100, 100, 200],
                x: 0,
                y: 0,
                width: 60,
                height: 84,
                restart: false,
                autoPlay: true
            });
        }
        tick() {
            var pad = userInput.readInput()[this.id];
            debugWriteButtons(pad);
            this.sprite.tick();
            switch(this.state) {
                case WALKING:

                    if (!(pad && pad.axes && pad.axes[2] && pad.axes[3])) return;

                    this.direction =  (pad.axes[0] > 0) ? LEFT: RIGHT;

                    if (pad.buttons[2].pressed) {
                        var offset = 7;
                        var config = {
                            hitbox: {
                                x: this.hitbox.x + this.hitbox.width,
                                y: this.hitbox.y + offset,
                                width: this.hitbox.width,
                                height: this.hitbox.height - offset*2
                            },
                            game: game
                        }
                        gameObjects.push(new Punch(config))
                        this.state = PUNCH;
                        this.setPunchSpriteSheet();
                        this.duration = 70;
                        return;
                    }

                    this.hitbox.x = this.hitbox.x + pad.axes[0];
                    this.hitbox.y = this.hitbox.y + pad.axes[1];
                break;
                case PUNCH:
                    this.duration = this.duration - 1;
                    if (this.duration < 0) {
                        this.state = WALKING;
                        this.setIdleSpriteSheet();
                        this.duration = null;
                    }
                break;
            }
            
        }
        draw2d() {
            const colors = {
                Walking: "green",
                Punch: "red",
                Fall: "blue"

            }
            context.fillStyle = colors[this.state];
            context.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
        }
        draw3d() {
            var pos = { x: Math.round(this.hitbox.x), y: Math.round(this.hitbox.y) }
            this.sprite.draw(context, pos);
        }
    }

    const delta = 1.0/144;

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    return {
        init: function() {
            gameObjects.push(new Player({
                hitbox: {
                    x: 300,
                    y: 300,
                    width: 20,
                    height: 20
                },
                id: 0,
                game: game
            }));

            gameObjects.push(new PunchBag({
                hitbox: {
                    x: 320,
                    y: 300,
                    width: 20,
                    height: 20
                },
                color: "blue",
                game: game
            }))
        },
        tick: function() {

            _.each(gameObjects, function(gameObject) {
                gameObject.tick();
            });
            
            gameObjects = _.filter(gameObjects, function(gameObject) {
                return !gameObject.markedForRemoval;
            });

            gameObjects = _.sortBy(gameObjects, (obj) => {
                return obj.hitbox.y;
            })

            context.drawImage(dojo, 0, 0);

            context.save();
            context.translate(200, 200)
            _.each(gameObjects, function(gameObject) {
                gameObject.draw2d();
            });
            context.restore();

            _.each(gameObjects, function(gameObject) {
                gameObject.draw3d();
            });
        }
    }
});