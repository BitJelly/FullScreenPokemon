/**
 * FullScreenPokemon.js
 * 
 * A free HTML5 remake of Pokemon generations I & II,
 * expanded for modern browsing.
 * 
 * @example 
 * // Creating a 15 x 14.5 blocks sized FullScreenPokemon object.
 * var FSP = new FullScreenPokemon({
 *     "width": 480, 
 *     "height": 464
 * });
 * 
 * @example 
 * // Creating a 15 x 14.5 blocks sized FullScreenPokemon object and logging the
 * // logging the amount of time each reset function took.
 * var FSP = new FullScreenPokemon({
 *     "width": 480, 
 *     "height": 464,
 *     "resetTimed": true
 * });
 * console.log(FSP.resetTimes);
 * 
 * @example 
 * // Binding the FullScreenPokemon object controls to the body's mouse
 * // and key events, and starting the game.
 * window.FSP = new FullScreenPokemon({
 *    "width": window.innerWidth, 
 *    "height": window.innerHeight
 * });
 * 
 * document.body.appendChild(FSP.container);
 * 
 * FSP.proliferate(document.body, {
 *     "onkeydown": FSP.InputWriter.makePipe("onkeydown", "keyCode", true),
 *     "onkeyup": FSP.InputWriter.makePipe("onkeyup", "keyCode", true),
 *     "onmousedown": FSP.InputWriter.makePipe("onmousedown", "which", true)
 * });
 * 
 * FSP.gameStart();
 */
var FullScreenPokemon = (function (GameStartr) {
    "use strict";
    
    // Use an GameStartr as the class parent, with GameStartr's constructor
    var GameStartrProto = new GameStartr(),
        
        // Used for combining arrays from the prototype to this
        proliferate = GameStartrProto.proliferate,
        proliferateHard = GameStartrProto.proliferateHard;
        
    // Subsequent settings will be stored in FullScreenPokemon.prototype.settings
    GameStartrProto.settings = {};
    
    /**
     * Constructor for a new FullScreenPokemon game object.
     * Static game settings are stored in the appropriate settings/*.js object
     * as members of the FullScreenPokemon.prototype object.
     * Dynamic game settings may be given as members of the "customs" argument.
     * On typical machines, game startup time is approximately 500-700ms.
     * 
     * @constructor
     * @param {Number} width   Width of the game viewport: at least 480.
     * @param {Number} height   Height of the game viewport: at least 464.
     * @param {Boolean} [resetTimes]   Whether the amount of time in of each
     *                               reset function (in millseconds) should be 
     *                               stored as a member .resetTimes (by default,
     *                               false).
     * @param {Object} [style]   Additional CSS styles to be given to the
     *                           game's container <div> element.
     * @return {FullScreenPokemon}
     */
    function FullScreenPokemon(customs) {
        // Call the parent GameStartr constructor to set the base settings and
        // verify the prototype requirements
        GameStartr.call(this, {
            "customs": customs,
            "constructor": FullScreenPokemon,
            "requirements": {
                "settings": {
                    "audio": "settings/audio.js",
                    "collisions": "settings/collisions.js",
                    "editor": "settings/editor.js",
                    "events": "settings/events.js",
                    "generator": "settings/generator.js",
                    "input": "settings/inpug.js",
                    "maps": "settings/maps.js",
                    "mods": "settings/mods.js",
                    "numbers": "settings/number.js",
                    "objects": "settings/objetcs.js",
                    "quadrants": "settings/quadrants.js",
                    "renderer": "settings/renderer.js",
                    "runner": "settings/runner.js",
                    "sprites": "settings/sprites.js",
                    "statistics": "settings/statistics.js",
                    "ui": "settings/ui.js",
                }
            },
            "constants": [
                "unitsize",
                "scale"
            ]
        });
        
        if (customs.resetTimed) {
            this.resetTimes = this.resetTimed(this, customs);
        } else {
            this.reset(this, customs);
        }
    }
    FullScreenPokemon.prototype = GameStartrProto;
    
    // For the sake of reset functions, store constants as members of the actual
    // FullScreenPokemon Function itself - this allows prototype setters to use 
    // them regardless of whether the prototype has been instantiated yet.
    FullScreenPokemon.unitsize = 4;
    FullScreenPokemon.scale = FullScreenPokemon.unitsize / 2;
    
    
    /* Resets
    */
    
    /**
     * Sets self.container via the parent GameStartr resetContaienr.
     * 
     * The container is given the "Press Start" font, the PixelRender is told
     * to draw the scenery, solid, character, and text groups, and the container
     * width is set to the custom's width.
     * 
     * @param {EightBittr} EightBitter
     * @param {Object} [customs]
     */
    function resetContainer(self, customs) {
        GameStartr.prototype.resetContainer(self, customs);
        
        self.container.style.fontFamily = "Press Start";
        
        self.PixelDrawer.setThingArrays([
            self.GroupHolder.getTerrainGroup(),
            self.GroupHolder.getSolidGroup(),
            self.GroupHolder.getSceneryGroup(),
            self.GroupHolder.getCharacterGroup()
        ]);
    }


    /* Global manipulations
    */

    /**
     * 
     */
    function gameStart(EightBitter) {
        var EightBitter = EightBittr.ensureCorrectCaller(this);

        EightBitter.setMap(
            EightBitter.settings.maps.mapDefault,
            EightBitter.settings.maps.locationDefault
        );

        EightBitter.ModAttacher.fireEvent("onGameStart");
    }

    /**
     * 
     */
    function onGamePlay(EightBitter) {
        console.log("Playing!");
    }

    /**
     * 
     */
    function onGamePause(EightBitter) {
        console.log("Paused.");
    }

    /**
     * Adds a Thing via addPreThing based on the specifications in a PreThing.
     * This is done relative to MapScreener.left and MapScreener.top.
     * 
     * @param {PreThing} prething
     */
    function addPreThing(prething) {
        var thing = prething.thing,
            position = prething.position || thing.position;

        thing.EightBitter.addThing(
            thing,
            prething.left * thing.EightBitter.unitsize - thing.EightBitter.MapScreener.left,
            prething.top * thing.EightBitter.unitsize - thing.EightBitter.MapScreener.top
        );

        // Either the prething or thing, in that order, may request to be in the
        // front or back of the container
        if (position) {
            thing.EightBitter.TimeHandler.addEvent(function () {
                switch (position) {
                    case "beginning":
                        thing.EightBitter.arrayToBeginning(thing, thing.EightBitter.GroupHolder.getGroup(thing.groupType));
                        break;
                    case "end":
                        thing.EightBitter.arrayToEnd(thing, thing.EightBitter.GroupHolder.getGroup(thing.groupType));
                        break;
                }
            });
        }

        thing.EightBitter.ModAttacher.fireEvent("onAddPreThing", prething);
    }

    /**
     * 
     */
    function addPlayer(left, top) {
        var EightBitter = EightBittr.ensureCorrectCaller(this),
            player;

        left = left || 0;
        top = top || 0;

        player = EightBitter.player = EightBitter.ObjectMaker.make("Player");

        EightBitter.InputWriter.setEventInformation(player);

        EightBitter.addThing(player, left, top);

        EightBitter.ModAttacher.fireEvent("onAddPlayer", player);

        return player;
    }


    /* Inputs
    */

    /**
     * 
     */
    function canInputsTrigger(EightBitter) {
        return true;
    }

    /**
     * Reacts to the left key being pressed. keys.run and leftDown are marked 
     * and the mod event is fired.
     * 
     * @param {Player} player
     */
    function keyDownLeft(player, event) {
        if (player.EightBitter.GamesRunner.getPaused()) {
            return;
        }

        player.EightBitter.ModAttacher.fireEvent("onKeyDownLeft");
    }

    /**
     * Reacts to the right key being pressed. keys.run and keys.rightDown are
     * marked and the mod event is fired.
     * 
     * @param {Player} player
     */
    function keyDownRight(player, event) {
        if (player.EightBitter.GamesRunner.getPaused()) {
            return;
        }

        event.preventDefault();
    }

    /**
     * Reacts to the up key being pressed. If the player can jump, it does, and
     * underwater paddling is checked. The mod event is fired.
     * 
     * @param {Player} player
     */
    function keyDownUp(player, event) {
        if (player.EightBitter.GamesRunner.getPaused()) {
            return;
        }

        player.EightBitter.ModAttacher.fireEvent("onKeyDownUp");

        event.preventDefault();
    }

    /**
     * Reacts to the down key being pressed. keys.crouch is marked and the mod
     * event is fired.
     * 
     * @param {Player} player
     */
    function keyDownDown(player, event) {
        if (player.EightBitter.GamesRunner.getPaused()) {
            return;
        }

        player.EightBitter.ModAttacher.fireEvent("onKeyDownDown");

        event.preventDefault();
    }

    /**
     * Reacts to the pause key being pressed. Pausing happens almost immediately
     * (the delay helps prevent accidental pauses) and the mod event fires.
     * 
     * @param {Player} player
     */
    function keyDownPause(player, event) {
        if (!player.EightBitter.GamesRunner.getPaused()) {
            player.EightBitter.TimeHandler.addEvent(
                player.EightBitter.GamesRunner.pause, 7, true
            );
        }
        player.EightBitter.ModAttacher.fireEvent("onKeyDownPause");

        event.preventDefault();
    }

    /**
     * Reacts to the mute key being lifted. Muting is toggled and the mod event
     * is fired.
     * 
     * @param {Player} player
     */
    function keyDownMute(player, event) {
        if (player.EightBitter.GamesRunner.getPaused()) {
            return;
        }

        player.EightBitter.AudioPlayer.toggleMuted();
        player.EightBitter.ModAttacher.fireEvent("onKeyDownMute");

        event.preventDefault();
    }

    /**
     * Reacts to the left key being lifted. The mod event is fired.
     * 
     * @param {Player} player
     */
    function keyUpLeft(player, event) {
        player.EightBitter.ModAttacher.fireEvent("onKeyUpLeft");

        event.preventDefault();
    }

    /**
     * Reacts to the right key being lifted. The mod event is fired.
     * 
     * @param {Player} player
     */
    function keyUpRight(player, event) {
        player.EightBitter.ModAttacher.fireEvent("onKeyUpRight");

        event.preventDefault();
    }

    /**
     * Reacts to the up key being lifted. The mod event is fired.
     * 
     * @param {Player} player
     */
    function keyUpUp(player, event) {
        player.EightBitter.ModAttacher.fireEvent("onKeyUpUp");

        event.preventDefault();
    }

    /**
     * Reacts to the down key being lifted. The mod event is fired.
     * 
     * @param {Player} player
     */
    function keyUpDown(player, event) {
        player.EightBitter.ModAttacher.fireEvent("onKeyUpDown");

        event.preventDefault();
    }

    /**
     * Reacts to the pause key being lifted. The game is unpaused if necessary
     * and the mod event is fired.
     * 
     * @param {Player} player
     */
    function keyUpPause(player, event) {
        if (player.EightBitter.GamesRunner.getPaused()) {
            player.EightBitter.GamesRunner.play();
        }
        player.EightBitter.ModAttacher.fireEvent("onKeyUpPause");

        event.preventDefault();
    }

    /**
     * Reacts to a right click being pressed. Pausing is toggled and the mod
     * event is fired.
     * 
     * @param {Player} player
     */
    function mouseDownRight(player, event) {
        player.EightBitter.GamesRunner.togglePause();
        player.EightBitter.ModAttacher.fireEvent("onMouseDownRight");

        event.preventDefault();
    }

    
    /* Upkeep maintenance
    */

    /**
     * 
     */
    function maintainCharacters(EightBitter, characters) {
        var character, i;

        for (i = 0; i < characters.length; i += 1) {
            character = characters[i];

            if (character.isMoving) {
                EightBitter.shiftBoth(character, character.xvel, character.yvel);
            } else if (character.shouldMove) {
                character.startMovement(character);
            }
        }
    }


    /* Character movement
    */

    /**
     * 
     */
    function characterStartWalking(thing, direction) {
        var dx = 0,
            dy = 0,
            repeats = 8 * thing.EightBitter.unitsize / thing.speed;

        if (typeof direction !== "undefined") {
            thing.EightBitter.characterSetDirection(thing, direction);
        }

        switch (direction) {
            case 0:
                dy = -thing.speed;
                break;
            case 1:
                dx = thing.speed;
                break;
            case 2:
                dy = thing.speed;
                break;
            case 3:
                dx = -thing.speed;
                break;
        }

        thing.EightBitter.TimeHandler.addEventInterval(
            thing.EightBitter.shiftBoth, 1, repeats, thing, dx, dy
        );

        thing.EightBitter.addClass(thing, "walking");
        thing.EightBitter.TimeHandler.addClassCycle(
            thing,
            ["standing", "walking", "standing", "standing", "walking", "walking", false], // characterStopWalking
            "walking",
            Math.floor(repeats / 6)
        );
    }

    /**
     * 
     */
    function characterSetDirection(thing, direction) {
        thing.direction = direction;

        if (direction !== 1) {
            thing.EightBitter.unflipHoriz(thing);
        } else {
            thing.EightBitter.flipHoriz(thing);
        }

        thing.EightBitter.removeClasses(thing, "up left down");

        switch (direction) {
            case 0:
                thing.EightBitter.addClass(thing, "up");
                break;
            case 1:
                thing.EightBitter.addClass(thing, "left");
                break;
            case 2:
                thing.EightBitter.addClass(thing, "down");
                break;
            case 3:
                thing.EightBitter.addClass(thing, "left");
                break;
        }
    }


    /* Map sets
    */

    /**
     * 
     */
    function setMap(name, location) {
        var EightBitter = EightBittr.ensureCorrectCaller(this),
            map;

        if (typeof name === "undefined" || name instanceof EightBittr) {
            name = EightBitter.MapsHandler.getMapName();
        }

        map = EightBitter.MapsHandler.setMap(name);

        EightBitter.ModAttacher.fireEvent("onPreSetMap", map);

        EightBitter.NumberMaker.resetFromSeed(map.seed);
        EightBitter.InputWriter.restartHistory();

        EightBitter.ModAttacher.fireEvent("onSetMap", map);

        EightBitter.setLocation(
            location
            || map.locationDefault
            || EightBitter.settings.maps.locationDefault
        );
    }

    /**
     * 
     */
    function setLocation(name) {
        var EightBitter = EightBittr.ensureCorrectCaller(this),
            location;

        EightBitter.MapScreener.clearScreen();
        EightBitter.GroupHolder.clearArrays();
        EightBitter.TimeHandler.cancelAllEvents();

        EightBitter.MapsHandler.setLocation(name || 0);
        EightBitter.MapScreener.setVariables();
        location = EightBitter.MapsHandler.getLocation(name || 0);

        EightBitter.ModAttacher.fireEvent("onPreSetLocation", location)

        EightBitter.PixelDrawer.setBackground(
            EightBitter.MapsHandler.getArea().background
        );

        EightBitter.AudioPlayer.clearAll();

        EightBitter.QuadsKeeper.resetQuadrants();

        location.entry(EightBitter, location);
        
        EightBitter.ModAttacher.fireEvent("onSetLocation", location);

        EightBitter.GamesRunner.play();
    }

    /**
     * 
     */
    function getAreaBoundariesReal(EightBitter) {
        var area = EightBitter.MapsHandler.getArea();

        if (!area) {
            return {
                "top": 0,
                "right": 0,
                "bottom": 0,
                "left": 0,
                "width": 0,
                "height": 0
            }
        };

        return {
            "top": area.boundaries.top * EightBitter.unitsize,
            "right": area.boundaries.right * EightBitter.unitsize,
            "bottom": area.boundaries.bottom * EightBitter.unitsize,
            "left": area.boundaries.left * EightBitter.unitsize,
            "width": (area.boundaries.right - area.boundaries.left) * EightBitter.unitsize,
            "height": (area.boundaries.bottom - area.boundaries.top) * EightBitter.unitsize
        }
    }

    /**
     * 
     */
    function getScreenScrollability(EightBitter) {
        var area = EightBitter.MapsHandler.getArea(),
            boundaries, width, height;

        if (!area) {
            return "none";
        }

        boundaries = area.boundaries;
        width = (boundaries.right - boundaries.left) * EightBitter.unitsize;
        height = (boundaries.bottom - boundaries.top) * EightBitter.unitsize;

        if (width > EightBitter.MapScreener.width) {
            if (height > EightBitter.MapScreener.height) {
                return "both";
            } else {
                return "horizontal";
            }
        } else if (height > EightBitter.MapScreener.height) {
            return "vertical";
        } else {
            return "none";
        }
    }


    /* Map entrances
    */

    /**
     * 
     */
    function mapEntranceNormal(EightBitter, location) {
        EightBitter.addPlayer(
            location.xloc ? location.xloc * EightBitter.unitsize : 0,
            location.yloc ? location.yloc * EightBitter.unitsize : 0
        );

        EightBitter.centerMapScreen(EightBitter);
    }

    /**
     * 
     */
    function centerMapScreen(EightBitter) {
        var boundaries = EightBitter.MapScreener.boundaries,
            difference;

        difference = EightBitter.MapScreener.width - boundaries.width;
        if (difference > 0) {
            EightBitter.scrollWindow(difference / -2);
        }

        difference = EightBitter.MapScreener.height - boundaries.height;
        if (difference > 0) {
            EightBitter.scrollWindow(0, difference / -2);
        }
    }

    
    proliferateHard(FullScreenPokemon.prototype, {
        // Resets
        "resetContainer": resetContainer,
        // Global manipulations
        "gameStart": gameStart,
        "onGamePlay": onGamePlay,
        "onGamePause": onGamePause,
        "addPreThing": addPreThing,
        "addPlayer": addPlayer,
        // Inputs
        "canInputsTrigger": canInputsTrigger,
        "keyDownLeft": keyDownLeft,
        "keyDownRight": keyDownRight,
        "keyDownUp": keyDownUp,
        "keyDownDown": keyDownDown,
        "keyDownPause": keyDownPause,
        "keyDownMute": keyDownMute,
        "keyUpLeft": keyUpLeft,
        "keyUpRight": keyUpRight,
        "keyUpUp": keyUpUp,
        "keyUpDown": keyUpDown,
        "keyUpPause": keyUpPause,
        "mouseDownRight": mouseDownRight,
        // Upkeep maintenance
        "maintainCharacters": maintainCharacters,
        // Character movement
        "characterStartWalking": characterStartWalking,
        "characterSetDirection": characterSetDirection,
        // Map sets
        "setMap": setMap,
        "setLocation": setLocation,
        "getAreaBoundariesReal": getAreaBoundariesReal,
        "getScreenScrollability": getScreenScrollability,
        "centerMapScreen": centerMapScreen,
        // Map entrances
        "mapEntranceNormal": mapEntranceNormal
    });
    
    return FullScreenPokemon;
})(GameStartr);