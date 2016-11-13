define('app/game', [
    'underscore',
    'userInput',
    'SpriteSheet',
    'TimedAction',
    'utils'
], function (
    _,
    userInput,
    SpriteSheet,
    TimedAction,
    utils
) {    
    var DEBUG_WRITE_BUTTONS = false;
    var DEBUG_NO_2D = !true;
    
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
    player_idle_spritesheet.src = "./graphics/fighter_idle_spritesheet.png";

    var player_punch_spritesheet = new Image();
    player_punch_spritesheet.src = "./graphics/fighter_punch_spritesheet.png";

    var lifter_lifting_spritesheet = new Image();
    lifter_lifting_spritesheet.src = "./graphics/lifter_lifting.png";

    var lifter_hurt_spritesheet = new Image();
    lifter_hurt_spritesheet.src = "./graphics/lifter_hurt.png";

    var lifter_idle_spritesheet = new Image();
    lifter_idle_spritesheet.src = "./graphics/lifter_idle.png";

    var lifter_punch_spritesheet = new Image();
    lifter_punch_spritesheet.src = "./graphics/lifter_punch.png";

    var player_punch_uppercut_spritesheet = new Image();
    player_punch_uppercut_spritesheet.src = "./graphics/fighter_punch_uppercut_spritesheet.png";

    var bag = new Image();
    bag.src = "./graphics/bag.png";

    var bag_punched_spritesheet = new Image();
    bag_punched_spritesheet.src = "./graphics/bag_punched_spritesheet.png";

    var red_punchbag_spritesheet = new Image();
    red_punchbag_spritesheet.src = "./graphics/red_punchbag_spritesheet.png";

    var dojo = new Image();
    dojo.src = "./graphics/dojo.png";

    var weak = new Image();
    weak.src = "./graphics/weak.png";

    var power = new Image();
    power.src = "./graphics/power.png";

    const WALKING = 'Walking';
    const PUNCH = 'Punch';
    const PUNCH_UPPERCUT = 'Punch_Uppercut';
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

    class TextFlash extends GameObject {
        constructor(config) {
            super(config);
            this.duration = (config.max) ? 4000 : 1500;
            this.timer = new TimedAction(this.duration, () => { this.markedForRemoval = true; })
            this.max = config.max;
            if (config.max) {
                this.sprite = SpriteSheet.new(power, {
                    frames: [100, 100, 100, 100, 100, 100],
                    x: 0,
                    y: 0,
                    width: 36 * 4,
                    height: 9 * 4,
                    restart: true,
                    autoPlay: true
                });
            }
        }
        tick() {
            this.hitbox.y = this.hitbox.y - 0.5;
            this.timer.tick();
            this.sprite && this.sprite.tick();
        }
        draw3d() {
            if (this.timer.status() > this.duration - 400 ) return;

            context.globalAlpha = utils.interpolateLinear(this.duration, 0, 1)[Math.round(this.timer.status())];
            if (this.max) {
                this.sprite.draw(context, { x: this.hitbox.x, y: this.hitbox.y });
            } else {
                context.drawImage(weak, this.hitbox.x, this.hitbox.y);
            }
            context.globalAlpha = 1;
        }
    }

    class Punch extends GameObject {
        constructor(config) {
            super(config);
            this.detectHitsOnce = _.once(() => {
                var bag = this.game.detectHits(this, PunchBag)[0];
                bag && bag.hit(config.power);

                var bagRed = this.game.detectHits(this, PunchBagRed)[0];
                bagRed && bagRed.hit(config.power);

                var lifterDecor = this.game.detectHits(this, LifterDecor)[0];
                lifterDecor && lifterDecor.hit(config.power);

                var lifter = this.game.detectHits(this, Lifter)[0];
                lifter && lifter.hit(config.power);
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
        hit(power) {
            if (power > 0 && power < 50) {
                var config = {
                    hitbox: {
                        x: this.hitbox.x + 5,
                        y: this.hitbox.y - 15
                    },
                    max: false
                }
                gameObjects.push(new TextFlash(config));
            } else if (power > 50) {
                var config = {
                    hitbox: {
                        x: this.hitbox.x + 5,
                        y: this.hitbox.y - 15
                    },
                    max: true
                }
                gameObjects.push(new TextFlash(config));
            }
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

    class LifterDecor extends GameObject {
        constructor(config) {
            super(config);
            this.sprite = { tick: () => {} };
            this.sprite = SpriteSheet.new(lifter_lifting_spritesheet, {
                frames: [400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400],
                x: 0,
                y: 0,
                width: 15 * 4,
                height: 21 * 4,
                restart: true,
                autoPlay: true
            });
        }
        hit() {
            var x = this.hitbox.x;
            var y = this.hitbox.y;
            var callback = function() {
                this.markedForRemoval = true;
                gameObjects.push(new Lifter({
                    hitbox: {
                        x: x, //670
                        y: y,
                        width: 40,
                        height: 25
                    },
                    color: "blue",
                    game: game
                }))
            }.bind(this);
            this.sprite = SpriteSheet.new(lifter_hurt_spritesheet, {
                frames: [400, 400, 400, 400, 400, 400],
                x: 0,
                y: 0,
                width: 15 * 4,
                height: 21 * 4,
                restart: true,
                autoPlay: true,
                callback: callback
            });;
        }
        tick() {
            this.sprite.tick();
        }
        draw3d() {
            this.sprite.draw(context, { x: this.hitbox.x + 5, y: this.hitbox.y });
        }
    }

    class Lifter extends GameObject {
        constructor(config) {
            super(config);
            this.sprite = { tick: () => {} };
            this.reset();
        }
        reset() {
            this.walking = true;
            this.sprite = SpriteSheet.new(lifter_idle_spritesheet, {
                frames: [400, 400],
                x: 0,
                y: 0,
                width: 15 * 4,
                height: 21 * 4,
                restart: true,
                autoPlay: true
            });
        }
        hit(power) {
            var callback = function() {
                this.reset();
                this.walking = true;
            }.bind(this)

            this.walking = false;
            this.sprite = SpriteSheet.new(lifter_hurt_spritesheet, {
                frames: [400, 400, 400, 400, 400, 400],
                x: 0,
                y: 0,
                width: 15 * 4,
                height: 21 * 4,
                restart: true,
                autoPlay: true,
                callback: callback
            });

            if (power > 0 && power < 65) {
                var config = {
                    hitbox: {
                        x: this.hitbox.x + 5,
                        y: this.hitbox.y - 15
                    },
                    max: false
                }
                gameObjects.push(new TextFlash(config));
            } else if (power > 65) {
                var config = {
                    hitbox: {
                        x: this.hitbox.x + 5,
                        y: this.hitbox.y - 15
                    },
                    max: true
                }
                gameObjects.push(new TextFlash(config));
            }
        }
        tick() {
            this.sprite.tick();

            if (this.walking && this.hitbox.x > 480) {
                this.hitbox.x -= 0.5;
            }
        }
        draw3d() {
            this.sprite.draw(context, { x: Math.round(this.hitbox.x + 5), y: Math.round(this.hitbox.y) });
        }
    }

    class PunchBagRed extends GameObject {
        constructor(config) {
            super(config);
            this.sprite = SpriteSheet.new(red_punchbag_spritesheet, {
                frames: [150, 200, 300, 400, 400, 500, 400],
                x: 0,
                y: 0,
                width: 13 * 4,
                height: 23 * 4,
                restart: false,
                autoPlay: false
            });
        }
        tick() {
            this.sprite.tick();
        }
        hit(power) {
            if (power > 0 && power < 65) {
                var config = {
                    hitbox: {
                        x: this.hitbox.x + 5,
                        y: this.hitbox.y - 15
                    },
                    max: false
                }
                gameObjects.push(new TextFlash(config));
            } else if (power > 65) {
                var config = {
                    hitbox: {
                        x: this.hitbox.x + 5,
                        y: this.hitbox.y - 15
                    },
                    max: true
                }
                gameObjects.push(new TextFlash(config));
            }
            this.sprite.stop();
            this.sprite.play();
        }
        draw3d() {
            this.sprite.draw(context, { x: this.hitbox.x, y: this.hitbox.y });
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
            this.comboReady = false;
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
        setPunchUppercutSpriteSheet() {
            this.sprite = SpriteSheet.new(player_punch_uppercut_spritesheet, {
                frames: [100, 100, 100, 100, 200, 200, 100, 100],
                x: 0,
                y: 0,
                width: 60,
                height: 84,
                restart: false,
                autoPlay: true
            });
        }
        tick() {
            var pad = userInput.getInput(this.id);
            debugWriteButtons(pad);
            this.sprite.tick();
            switch(this.state) {
                case WALKING:
                    this.duration--;
                    
                    this.direction =  (pad.axes[0] > 0) ? LEFT: RIGHT;

                    this.comboReady = false;

                    if (pad.buttons[2].pressed) {
                        if (this.duration > 0) return;

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
                    if (pad.buttons[2].pressed && this.comboReady) {
                        var offset = 7;
                        var config = {
                            hitbox: {
                                x: this.hitbox.x + this.hitbox.width,
                                y: this.hitbox.y + offset,
                                width: this.hitbox.width,
                                height: this.hitbox.height - offset*2
                            },
                            game: game,
                            power: 70 - this.duration
                        }
                        gameObjects.push(new Punch(config))
                        this.state = PUNCH_UPPERCUT;
                        this.setPunchUppercutSpriteSheet();
                        this.duration = 70;
                        return;
                    }
                    if (!pad.buttons[2].pressed) {
                        this.comboReady = true;
                    }

                    if (this.duration < 0) {
                        this.state = WALKING;
                        this.setIdleSpriteSheet();
                        this.duration = 50;
                    }
                break;
                case PUNCH_UPPERCUT:
                    this.duration = this.duration - 1;
                    if (this.duration < 0) {
                        this.state = WALKING;
                        this.setIdleSpriteSheet();
                        this.duration = 50;
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

            gameObjects.push(new LifterDecor({
                hitbox: {
                    x: 670,
                    y: 310,
                    width: 40,
                    height: 25
                },
                color: "blue",
                game: game
            }))

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

            gameObjects.push(new PunchBagRed({
                hitbox: {
                    x: 204,
                    y: 204,
                    width: 20,
                    height: 20
                },
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

            if (!DEBUG_NO_2D) {
                context.save();
                context.translate(200, 200)
                _.each(gameObjects, function(gameObject) {
                    gameObject.draw2d();
                });
                context.restore();
            }

            _.each(gameObjects, function(gameObject) {
                gameObject.draw3d();
            });
        }
    }
});