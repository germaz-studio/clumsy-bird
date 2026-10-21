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
