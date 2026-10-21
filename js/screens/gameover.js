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
