define('game', [
    'underscore',
    'userInput',
    'SpriteSheet'
], function (
    _,
    userInput,
    SpriteSheet
) {
    var DEBUG_WRITE_BUTTONS = false;

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

    function detectHits(who, list, pos) {
        return _.filter(list, function(item) {
            if (!item.dimensions) {
                console.error("Dimensions not found on item");
                return false;
            }
            if (item === who) return;

            const halfWidth = (item.dimensions[0] / 2);
            const halfHeight = (item.dimensions[1] / 2);

            const condition1 = pos.x > item.pos.x - halfWidth;
            const condition2 = pos.x < item.pos.x + halfWidth;
            const condition3 = pos.y > item.pos.y - halfHeight;
            const condition4 = pos.y < item.pos.y + halfHeight;

            return (condition1 && condition2 && condition3 && condition4);
        });
    }


    const WALKING = 'Walking';
    const PUNCH = 'Punch';
    const FALL = 'Fall';

    const LEFT = 'Left';
    const RIGHT = 'Right';

    class GameObject {
        constructor(id, dimensions, pos) {
            this.pos = pos;
            this.id = id;
            this.dimensions = dimensions;
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
                        //let pos = _.clone(this.pos);

                        this.state = PUNCH;
                        this.setPunchSpriteSheet();
                        this.duration = 70;
                        return;
                    }

                    this.pos.x = this.pos.x + pad.axes[0];
                    this.pos.y = this.pos.y + pad.axes[1];
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
            return;
            const colors = {
                Walking: "green",
                Punch: "red",
                Fall: "blue"

            }
            //context.fillStyle = colors[this.state];
            //context.fillRect(this.pos.x - this.dimensions[0]/2, this.pos.y - this.dimensions[1]/2, this.dimensions[0], this.dimensions[1]);
            context.fillStyle = "#444444";
            if (this.state !== PUNCH) return;
            if (this.direction === LEFT) {
                context.fillRect(this.pos.x, this.pos.y - this.dimensions[1], 10, 10);
            } else {
                context.fillRect(this.pos.x - 20, this.pos.y - this.dimensions[1], 10, 10);
            }
        }
        draw3d() {
            context.save();
            context.translate(Math.round(this.pos.x), Math.round(this.pos.y));
            this.sprite.draw(context);
            context.restore();
        }
    }

    let gameObjects = [];
    window.kurt = gameObjects
    
    const delta = 1.0/144;

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    return {
        init: function() {
            gameObjects.push(new GameObject(0, [10, 10], {x: 300, y: 300}))
            //gameObjects.push(new GameObject(null, [100, 100], {x: 320, y: 320}))
        },
        tick: function() {

            _.each(gameObjects, function(gameObject) {
                gameObject.tick();
            });
            
            gameObjects = _.filter(gameObjects, function(gameObject) {
                return !gameObject.markedForRemoval;
            });

            context.fillStyle = "gray"
            context.fillRect(0, 0, 1024, 768)

            _.each(gameObjects, function(gameObject) {
                gameObject.draw2d();
            });

            _.each(gameObjects, function(gameObject) {
                gameObject.draw3d();
            });
        }
    }
});