var game = {
    data: {
        score : 0,
        steps: 0,
        start: false,
        newHiScore: false,
        muted: false
    },

    resources: [
        // images
        {name: "bg", type:"image", src: "data/img/bg.png"},
        {name: "clumsy", type:"image", src: "data/img/clumsy.png"},
        {name: "pipe", type:"image", src: "data/img/pipe.png"},
        {name: "logo", type:"image", src: "data/img/logo.png"},
        {name: "ground", type:"image", src: "data/img/ground.png"},
        {name: "gameover", type:"image", src: "data/img/gameover.png"},
        {name: "gameoverbg", type:"image", src: "data/img/gameoverbg.png"},
        {name: "hit", type:"image", src: "data/img/hit.png"},
        {name: "getready", type:"image", src: "data/img/getready.png"},
        {name: "new", type:"image", src: "data/img/new.png"},
        {name: "share", type:"image", src: "data/img/share.png"},
        {name: "tweet", type:"image", src: "data/img/tweet.png"},
        // sounds
        {name: "theme", type: "audio", src: "data/bgm/"},
        {name: "hit", type: "audio", src: "data/sfx/"},
        {name: "lose", type: "audio", src: "data/sfx/"},
        {name: "wing", type: "audio", src: "data/sfx/"}
    ],

    "onload": function() {
        if (!me.video.init(900, 600, {
            wrapper: "screen",
            scale : "auto",
            scaleMethod: "stretch"
        })) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }
        me.audio.init("mp3,ogg");
        me.loader.preload(game.resources, this.loaded.bind(this));
    },

    "loaded": function() {
        // Compatibility alias for melonJS state
        me.state.GAME_OVER = me.state.GAMEOVER;

        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());
        me.state.set(me.state.GAME_OVER, new game.GameOverScreen());

        me.input.bindKey(me.input.KEY.SPACE, "fly", true);
        me.input.bindKey(me.input.KEY.M, "mute", true);
        me.input.bindPointer(me.input.KEY.SPACE);

        // Safe instancing without corrupted recycled object states
        me.pool.register("clumsy", game.BirdEntity);
        me.pool.register("pipe", game.PipeEntity);
        me.pool.register("hit", game.HitEntity);
        me.pool.register("ground", game.Ground);

        me.state.change(me.state.MENU);
    }
};
game.BirdEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = 'clumsy';
        settings.width = 85;
        settings.height = 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0.2;
        this.maxAngleRotation = Number.prototype.degToRad(-30);
        this.maxAngleRotationDown = Number.prototype.degToRad(35);
        this.renderable.addAnimation("flying", [0, 1, 2]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.body.removeShapeAt(0);
        this.body.addShape(new me.Ellipse(5, 5, 71, 51));

        this.flyTween = null;
        this.angleTween = null;
        this.endTween = null;

        this.collided = false;
        this.gravityForce = 0.2;
    },

    update: function(dt) {
        var that = this;
        this.pos.x = 60;
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this.renderable.currentTransform.identity();
        if (me.input.isKeyPressed('fly')) {
            me.audio.play('wing');
            this.gravityForce = 0.2;
            var currentPos = this.pos.y;

            if (this.angleTween) {
                this.angleTween.stop();
            }
            if (this.flyTween) {
                this.flyTween.stop();
            }

            this.flyTween = new me.Tween(this.pos);
            this.flyTween.easing(me.Tween.Easing.Exponential.InOut);
            this.flyTween.to({y: currentPos - 72}, 50);
            this.flyTween.start();

            this.angleTween = new me.Tween(this);
            this.angleTween.easing(me.Tween.Easing.Exponential.InOut);
            this.angleTween.to({currentAngle: that.maxAngleRotation}, 50).onComplete(function(angle) {
                that.renderable.currentTransform.rotate(that.maxAngleRotation);
            });
            this.angleTween.start();
        } else {
            this.gravityForce += 0.2;
            this.pos.y += me.timer.tick * this.gravityForce;
            this.currentAngle += Number.prototype.degToRad(3);
            if (this.currentAngle >= this.maxAngleRotationDown) {
                this.renderable.currentTransform.identity();
                this.currentAngle = this.maxAngleRotationDown;
            }
        }
        this.renderable.currentTransform.rotate(this.currentAngle);

        var hitSky = -80; // bird height + 20px
        var hitGround = me.game.viewport.height - 96 - 45;
        if (this.pos.y <= hitSky || this.pos.y >= hitGround || this.collided) {
            if (!this.collided) {
                this.collided = true;
            }
            game.data.start = false;
            me.audio.play("lose");
            this.endAnimation();
            return false;
        }
        me.collision.check(this);
        return true;
    },

    onCollision: function(response) {
        var obj = response.b;
        if (obj.type === 'pipe' || obj.type === 'ground') {
            try {
                me.device.vibrate(500);
            } catch(e) {}
            this.collided = true;
        }
        if (obj.type === 'hit') {
            me.game.world.removeChild(obj);
            game.data.steps++;
            game.data.score = game.data.steps;
            me.audio.play('hit');
        }
    },

    endAnimation: function() {
        if (this.endTween) {
            return;
        }
        if (this.flyTween) {
            this.flyTween.stop();
            this.flyTween = null;
        }
        if (this.angleTween) {
            this.angleTween.stop();
            this.angleTween = null;
        }

        var currentPos = this.pos.y;
        this.renderable.currentTransform.identity();
        this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));
        var finalPos = me.game.viewport.height - this.renderable.width/2 - 96;

        this.endTween = new me.Tween(this.pos);
        this.endTween.easing(me.Tween.Easing.Exponential.InOut);
        this.endTween
            .to({y: currentPos}, 150)
            .to({y: finalPos}, 450)
            .onComplete(function() {
                me.state.change(me.state.GAME_OVER || me.state.GAMEOVER);
            });
        this.endTween.start();
    },

    onDestroyEvent: function() {
        if (this.flyTween) {
            this.flyTween.stop();
            this.flyTween = null;
        }
        if (this.angleTween) {
            this.angleTween.stop();
            this.angleTween = null;
        }
        if (this.endTween) {
            this.endTween.stop();
            this.endTween = null;
        }
    }
});

game.PipeEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('pipe');
        settings.width = 148;
        settings.height = 1664;
        settings.framewidth = 148;
        settings.frameheight = 1664;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-5, 0);
        this.type = 'pipe';
    },

    update: function(dt) {
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
            return false;
        }
        return this._super(me.Entity, 'update', [dt]);
    }
});

game.PipeGenerator = me.Renderable.extend({
    init: function() {
        this._super(me.Renderable, 'init', [0, 0, me.game.viewport.width, me.game.viewport.height]);
        this.alwaysUpdate = true;
        this.generate = 0;
        this.pipeFrequency = 92;
        this.pipeHoleSize = 1240;
        this.posX = me.game.viewport.width;
    },

    update: function(dt) {
        if (!game.data.start) {
            return false;
        }
        if (this.generate++ % this.pipeFrequency === 0) {
            var minPos = 200;
            var maxPos = me.game.viewport.height - 100;
            var posY = ~~(Math.random() * (maxPos - minPos)) + minPos;
            var posY2 = posY - me.game.viewport.height - this.pipeHoleSize;

            var pipe1 = me.pool.pull('pipe', this.posX, posY);
            var pipe2 = me.pool.pull('pipe', this.posX, posY2);
            var hitPos = posY - 100;
            var hit = me.pool.pull("hit", this.posX, hitPos);

            pipe1.renderable.currentTransform.scaleY(-1);
            me.game.world.addChild(pipe1, 10);
            me.game.world.addChild(pipe2, 10);
            me.game.world.addChild(hit, 11);
        }
        return this._super(me.Renderable, "update", [dt]);
    }
});

game.HitEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('hit');
        settings.width = 148;
        settings.height = 60;
        settings.framewidth = 148;
        settings.frameheight = 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.updateTime = false;
        this.renderable.alpha = 0;
        this.body.accel.set(-5, 0);
        this.body.removeShapeAt(0);
        this.body.addShape(new me.Rect(0, 0, settings.width - 30, settings.height - 30));
        this.type = 'hit';
    },

    update: function(dt) {
        this.pos.add(this.body.accel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
            return false;
        }
        return this._super(me.Entity, "update", [dt]);
    }
});

game.Ground = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('ground');
        settings.width = 900;
        settings.height = 96;
        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-4, 0);
        this.type = 'ground';
    },

    update: function(dt) {
        this.pos.add(this.body.vel);
        if (this.pos.x < -900) {
            this.pos.x = me.game.viewport.width - 10;
        }
        return this._super(me.Entity, 'update', [dt]);
    }
});
game.HUD = game.HUD || {};

game.HUD.Container = me.Container.extend({
    init: function() {
        this._super(me.Container, 'init');
        // Do not persist across reset to prevent accumulating duplicate HUDs
        this.isPersistent = false;

        // non collidable
        this.collidable = false;

        // make sure our object is always drawn on top
        this.z = 15;

        // give a name
        this.name = "HUD";

        // add our child score object at the top left corner
        this.addChild(new game.HUD.ScoreItem(5, 5));
    }
});

game.HUD.ScoreItem = me.Renderable.extend({
    init: function(x, y) {
        this._super(me.Renderable, "init", [x, y, 10, 10]);

        // local copy of the global score
        this.stepsFont = new me.Font('gamefont', 80, '#000', 'center');

        // make sure we use screen coordinates
        this.floating = true;
    },

    draw: function (renderer) {
        if (game.data.start && me.state.isCurrent(me.state.PLAY))
            this.stepsFont.draw(renderer, game.data.steps, me.game.viewport.width/2, 10);
    }
});

var BackgroundLayer = me.ImageLayer.extend({
    init: function(image, z, speed) {
        var settings = {};
        settings.name = image;
        settings.width = 900;
        settings.height = 600;
        settings.image = image;
        settings.z = z || 1;
        settings.ratio = 1;
        this._super(me.ImageLayer, 'init', [0, 0, settings]);
        this.floating = true;
        this.isPersistent = false;
    },

    update: function() {
        if (me.input.isKeyPressed('mute')) {
            game.data.muted = !game.data.muted;
            if (game.data.muted){
                me.audio.disable();
            } else {
                me.audio.enable();
            }
        }
        return true;
    }
});
game.TitleScreen = me.ScreenObject.extend({
    init: function(){
        this._super(me.ScreenObject, 'init');
        this.font = null;
        this.ground1 = null;
        this.ground2 = null;
        this.logo = null;
        this.logoTween = null;
        this.handler = null;
    },

    onResetEvent: function() {
        me.audio.stop("theme");
        game.data.newHiScore = false;

        me.game.world.addChild(new BackgroundLayer('bg', 1), 1);
        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", true);
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

        this.handler = me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
            if (action === "enter") {
                me.state.change(me.state.PLAY);
            }
        });

        //logo
        this.logo = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2 - 20,
            {image: 'logo'}
        );
        me.game.world.addChild(this.logo, 10);

        this.logoTween = new me.Tween(this.logo.pos)
            .to({y: me.game.viewport.height/2 - 100}, 1000)
            .easing(me.Tween.Easing.Exponential.InOut);
        this.logoTween.start();

        this.ground1 = me.pool.pull("ground", 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull("ground", me.game.viewport.width, me.game.viewport.height - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        me.game.world.addChild(new (me.Renderable.extend ({
            init: function() {
                this._super(me.Renderable, 'init', [0, 0, 100, 100]);
                this.text = me.device.touch ? 'Tap to start' : 'PRESS SPACE OR CLICK LEFT MOUSE BUTTON TO START \n\t\t\t\t\t\t\t\t\t\t\tPRESS "M" TO MUTE SOUND';
                this.font = new me.Font('gamefont', 20, '#000');
                this.credits = 'Original by Ellison Leao  •  Ported by Oskar Gerlicz-Kowalczuk (Germaz Studio)';
                this.creditsFont = new me.Font('gamefont', 12, '#333');
            },
            draw: function (renderer) {
                var measure = this.font.measureText(renderer, this.text);
                var xpos = me.game.viewport.width/2 - measure.width/2;
                var ypos = me.game.viewport.height/2 + 50;
                this.font.draw(renderer, this.text, xpos, ypos);

                var credMeasure = this.creditsFont.measureText(renderer, this.credits);
                this.creditsFont.draw(renderer, this.credits, me.game.viewport.width/2 - credMeasure.width/2, me.game.viewport.height - 25);
            }
        })), 12);
    },

    onDestroyEvent: function() {
        if (this.handler) {
            me.event.unsubscribe(this.handler);
            this.handler = null;
        }
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
        this.ground1 = null;
        this.ground2 = null;
        this.logo = null;
    }
});
game.PlayScreen = me.ScreenObject.extend({
    init: function() {
        var vol = me.device.ua.indexOf("Firefox") !== -1 ? 0.3 : 0.5;
        me.audio.setVolume(vol);
        this._super(me.ScreenObject, 'init');
        this.pipeGenerator = null;
        this.getReadyTween = null;
    },

    onResetEvent: function() {
        me.game.reset();
        me.audio.stop("theme");
        if (!game.data.muted){
            me.audio.play("theme", true);
        }

        me.input.bindKey(me.input.KEY.SPACE, "fly", true);
        game.data.score = 0;
        game.data.steps = 0;
        game.data.start = false;
        game.data.newHiscore = false;

        me.game.world.addChild(new BackgroundLayer('bg', 1), 1);

        this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull('ground', me.game.viewport.width, me.game.viewport.height - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD, 15);

        this.bird = me.pool.pull("clumsy", 60, me.game.viewport.height/2 - 100);
        me.game.world.addChild(this.bird, 10);

        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.SPACE);

        this.getReady = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2,
            {image: 'getready'}
        );
        me.game.world.addChild(this.getReady, 12);

        var that = this;
        this.getReadyTween = new me.Tween(this.getReady).to({alpha: 0}, 2000)
            .easing(me.Tween.Easing.Linear.None)
            .onComplete(function() {
                if (!me.state.isCurrent(me.state.PLAY)) return;
                game.data.start = true;
                that.pipeGenerator = new game.PipeGenerator();
                me.game.world.addChild(that.pipeGenerator, 0);
                if (that.getReady) {
                    me.game.world.removeChild(that.getReady);
                    that.getReady = null;
                }
            });
        this.getReadyTween.start();
    },

    onDestroyEvent: function() {
        me.audio.stopTrack('theme');
        if (this.getReadyTween) {
            this.getReadyTween.stop();
            this.getReadyTween = null;
        }
        if (this.getReady) {
            me.game.world.removeChild(this.getReady);
            this.getReady = null;
        }
        if (this.pipeGenerator) {
            me.game.world.removeChild(this.pipeGenerator);
            this.pipeGenerator = null;
        }
        this.HUD = null;
        this.bird = null;
        this.ground1 = null;
        this.ground2 = null;
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
    }
});
game.GameOverScreen = me.ScreenObject.extend({
    init: function() {
        this.savedData = null;
        this.handler = null;
    },

    onResetEvent: function() {
        this.savedData = {
            score: game.data.score,
            steps: game.data.steps
        };
        me.save.add(this.savedData);

        var savedBest = 0;
        try {
            savedBest = parseInt(localStorage.getItem('clumsy_top_steps') || '0', 10);
        } catch(e) {}

        if (!me.save.topSteps) me.save.add({topSteps: savedBest});
        if (savedBest > me.save.topSteps) me.save.topSteps = savedBest;

        if (game.data.steps > me.save.topSteps) {
            me.save.topSteps = game.data.steps;
            game.data.newHiScore = true;
            try {
                localStorage.setItem('clumsy_top_steps', me.save.topSteps.toString());
            } catch(e) {}
        }

        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", false);
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

        var canRestart = false;
        setTimeout(function() {
            canRestart = true;
        }, 400);

        this.handler = me.event.subscribe(me.event.KEYDOWN,
            function (action, keyCode, edge) {
                if (action === "enter" && canRestart) {
                    me.state.change(me.state.MENU);
                }
            });

        me.game.world.addChild(new BackgroundLayer('bg', 1), 1);

        this.gameOverSprite = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2 - 100,
            {image: 'gameover'}
        );
        me.game.world.addChild(this.gameOverSprite, 12);

        this.gameOverBG = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2,
            {image: 'gameoverbg'}
        );
        me.game.world.addChild(this.gameOverBG, 10);

        this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull('ground', me.game.viewport.width, me.game.viewport.height - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        if (game.data.newHiScore) {
            this.newRect = new me.Sprite(
                this.gameOverBG.width/2,
                this.gameOverBG.height/2,
                {image: 'new'}
            );
            me.game.world.addChild(this.newRect, 12);
        }

        this.dialog = new (me.Renderable.extend({
            init: function() {
                this._super(me.Renderable, 'init',
                    [0, 0, me.game.viewport.width/2, me.game.viewport.height/2]
                );
                this.font = new me.Font('gamefont', 40, 'black', 'left');
                this.steps = 'Score: ' + game.data.steps.toString();
                this.topSteps = 'Best:  ' + me.save.topSteps.toString();
            },

            draw: function (renderer) {
                var stepsText = this.font.measureText(renderer, this.steps);
                this.font.draw(
                    renderer,
                    this.steps,
                    me.game.viewport.width/2 - stepsText.width/2 - 50,
                    me.game.viewport.height/2
                );
                this.font.draw(
                    renderer,
                    this.topSteps,
                    me.game.viewport.width/2 - stepsText.width/2 - 50,
                    me.game.viewport.height/2 + 50
                );
            }
        }));
        me.game.world.addChild(this.dialog, 12);
    },

    onDestroyEvent: function() {
        if (this.handler) {
            me.event.unsubscribe(this.handler);
            this.handler = null;
        }
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
        this.ground1 = null;
        this.ground2 = null;
        this.gameOverSprite = null;
        this.gameOverBG = null;
        this.newRect = null;
        this.dialog = null;
        me.audio.stop("theme");
    }
});
