import { IMove } from "battlemovr/lib/IBattleMovr";
import { Component } from "eightbittr/lib/Component";
import { IMenuDialogRaw } from "menugraphr/lib/IMenuGraphr";
import { IEventCallback, ITimeEvent } from "timehandlr/lib/ITimeHandlr";

import { Direction, DirectionAliases, DirectionClasses } from "./Constants";
import { FullScreenPokemon } from "./FullScreenPokemon";
import {
    IArea, IAreaGate, IareaSpawner, ICharacter, IColorFadeSettings, IDetector, IDialog,
    IDialogOptions, IEnemy, IGymDetector, IHMCharacter, IHMMoveSchema, IMap, IMenuTriggerer, IPlayer,
    IPokemon, ISightDetector, IThemeDetector, IThing, ITransporter, ITransportSchema,
    IWalkingOnStop, IWalkingOnStopCommandFunction,
    IWildPokemonSchema
} from "./IFullScreenPokemon";

/**
 * Animation functions used by FullScreenPokemon instances.
 */
export class Animations<TEightBittr extends FullScreenPokemon> extends Component<TEightBittr> {
    /**
     * Spawning callback for Characters. Sight and roaming are accounted for.
     * 
     * @param thing   A newly placed Character.
     */
    public spawnCharacter(thing: ICharacter): void {
        if (thing.sight) {
            thing.sightDetector = this.eightBitter.things.add(
                [
                    "SightDetector",
                    {
                        direction: thing.direction,
                        width: thing.sight * 8
                    }
                ]) as ISightDetector;
            thing.sightDetector.viewer = thing;
            this.eightBitter.animations.animatePositionSightDetector(thing);
        }

        if (thing.roaming) {
            this.eightBitter.timeHandler.addEvent(
                (): boolean => this.eightBitter.animations.activateCharacterRoaming(thing),
                this.eightBitter.numberMaker.randomInt(70));
        }
    }

    /**
     * Activates a WindowDetector by immediately starting its cycle of
     * checking whether it's in-frame to activate.
     * 
     * @param thing   A newly placed WindowDetector.
     */
    public spawnWindowDetector(thing: IDetector): void {
        if (!this.eightBitter.animations.checkWindowDetector(thing)) {
            this.eightBitter.timeHandler.addEventInterval(
                (): boolean => this.eightBitter.animations.checkWindowDetector(thing),
                7,
                Infinity);
        }
    }

    /**
     * Snaps a moving Thing to a predictable grid position.
     * 
     * @param thing   A Thing to snap the position of.
     */
    public animateSnapToGrid(thing: IThing): void {
        const grid: number = this.eightBitter.unitsize * 8;
        const x: number = (this.eightBitter.mapScreener.left + thing.left) / grid;
        const y: number = (this.eightBitter.mapScreener.top + thing.top) / grid;

        this.eightBitter.physics.setLeft(thing, Math.round(x) * grid - this.eightBitter.mapScreener.left);
        this.eightBitter.physics.setTop(thing, Math.round(y) * grid - this.eightBitter.mapScreener.top);
    }

    /**
     * Freezes a Character to start a dialog.
     * 
     * @param thing   A Character to freeze.
     */
    public animatePlayerDialogFreeze(thing: ICharacter): void {
        this.animateCharacterPreventWalking(thing);
        this.eightBitter.timeHandler.cancelClassCycle(thing, "walking");

        if (thing.walkingFlipping) {
            this.eightBitter.timeHandler.cancelEvent(thing.walkingFlipping);
            thing.walkingFlipping = undefined;
        }
    }

    /**
     * Gradually changes a numeric attribute over time.
     * 
     * @param thing   A Thing whose attribute is to change.
     * @param attribute   The name of the attribute to change.
     * @param change   How much to change the attribute each tick.
     * @param goal   A final value for the attribute to stop at.
     * @param speed   How many ticks between changes.
     * @param onCompletion   A callback for when the attribute reaches the goal.
     * @returns The in-progress TimeEvent, if started.
     */
    public animateFadeAttribute(
        thing: IThing,
        attribute: string,
        change: number,
        goal: number,
        speed: number,
        onCompletion?: (thing: IThing) => void): ITimeEvent | undefined {
        (thing as any)[attribute] += change;

        if (change > 0) {
            if ((thing as any)[attribute] >= goal) {
                (thing as any)[attribute] = goal;
                if (typeof onCompletion === "function") {
                    onCompletion(thing);
                }
                return undefined;
            }
        } else {
            if ((thing as any)[attribute] <= goal) {
                (thing as any)[attribute] = goal;
                if (typeof onCompletion === "function") {
                    onCompletion(thing);
                }
                return undefined;
            }
        }

        return this.eightBitter.timeHandler.addEvent(
            (): void => {
                this.eightBitter.animations.animateFadeAttribute(
                    thing,
                    attribute,
                    change,
                    goal,
                    speed,
                    onCompletion);
            },
            speed);
    }

    /**
     * Slides a Thing across the screen horizontally over time.
     * 
     * @param thing   A Thing to slide across the screen.
     * @param change   How far to move each tick.
     * @param goal   A midX location to stop sliding at.
     * @param speed   How many ticks between movements.
     * @param onCompletion   A callback for when the Thing reaches the goal.
     * @returns The in-progress TimeEvent.
     */
    public animateSlideHorizontal(
        thing: IThing,
        change: number,
        goal: number,
        speed: number,
        onCompletion?: (thing: IThing) => void): void {
        this.eightBitter.physics.shiftHoriz(thing, change);

        if (change > 0) {
            if (this.eightBitter.physics.getMidX(thing) >= goal) {
                this.eightBitter.physics.setMidX(thing, goal);
                if (onCompletion) {
                    onCompletion(thing);
                }
                return;
            }
        } else {
            if (this.eightBitter.physics.getMidX(thing) <= goal) {
                this.eightBitter.physics.setMidX(thing, goal);
                if (onCompletion) {
                    onCompletion(thing);
                }
                return;
            }
        }

        this.eightBitter.timeHandler.addEvent(
            (): void => {
                this.animateSlideHorizontal(
                    thing,
                    change,
                    goal,
                    speed,
                    onCompletion);
            },
            speed);
    }

    /**
     * Slides a Thing across the screen vertically over time.
     * 
     * @param thing   A Thing to slide across the screen.
     * @param change   How far to move each tick.
     * @param goal   A midY location to stop sliding at.
     * @param speed   How many ticks between movements.
     * @param onCompletion   A callback for when the Thing reaches the goal.
     * @returns The in-progress TimeEvent.
     */
    public animateSlideVertical(
        thing: IThing,
        change: number,
        goal: number,
        speed: number,
        onCompletion?: (thing: IThing) => void): void {
        this.eightBitter.physics.shiftVert(thing, change);

        if (change > 0) {
            if (this.eightBitter.physics.getMidY(thing) >= goal) {
                this.eightBitter.physics.setMidY(thing, goal);
                if (onCompletion) {
                    onCompletion(thing);
                }
                return;
            }
        } else {
            if (this.eightBitter.physics.getMidY(thing) <= goal) {
                this.eightBitter.physics.setMidY(thing, goal);
                if (onCompletion) {
                    onCompletion(thing);
                }
                return;
            }
        }

        this.eightBitter.timeHandler.addEvent(
            (): void => {
                this.animateSlideVertical(
                    thing,
                    change,
                    goal,
                    speed,
                    onCompletion);
            },
            speed);
    }

    /**
     * Freezes a Character in grass and calls startBattle.
     * 
     * @param thing   A Character about to start a battle.
     * @param grass   Grass the Character is walking in.
     */
    public animateGrassBattleStart(thing: ICharacter, grass: IThing): void {
        const grassMap: IMap = this.eightBitter.areaSpawner.getMap(grass.mapName) as IMap;
        const grassArea: IArea = grassMap.areas[grass.areaName] as IArea;
        const options: IWildPokemonSchema[] | undefined = grassArea.wildPokemon.grass;
        if (!options) {
            throw new Error("Grass doesn't have any wild Pokemon options defined.");
        }

        const chosen: IWildPokemonSchema = this.eightBitter.battles.chooseRandomWildPokemon(options);
        const chosenPokemon: IPokemon = this.eightBitter.utilities.createPokemon(chosen);

        this.eightBitter.graphics.removeClass(thing, "walking");
        if (thing.shadow) {
            this.eightBitter.graphics.removeClass(thing.shadow, "walking");
        }

        this.animateCharacterPreventWalking(thing);

        this.eightBitter.battles.startBattle({
            battlers: {
                opponent: {
                    name: chosen.title,
                    actors: [chosenPokemon],
                    category: "Wild",
                    sprite: chosen.title.join("") + "Front"
                }
            }
        });
    }

    /**
     * Freezes a Character and starts a battle with an enemy.
     * 
     * @param _   A Character about to start a battle with other.
     * @param other   An enemy about to battle thing.
     */
    public animateTrainerBattleStart(_: ICharacter, other: IEnemy): void {
        const battleName: string = other.battleName || other.title;
        const battleSprite: string = other.battleSprite || battleName;

        this.eightBitter.battles.startBattle({
            battlers: {
                opponent: {
                    name: battleName.split(""),
                    sprite: battleSprite + "Front",
                    category: "Trainer",
                    hasActors: true,
                    reward: other.reward,
                    actors: other.actors.map(
                        (schema: IWildPokemonSchema): IPokemon => {
                            return this.eightBitter.utilities.createPokemon(schema);
                        })
                }
            },
            textStart: ["", " wants to fight!"],
            textDefeat: other.textDefeat,
            textAfterBattle: other.textAfterBattle,
            giftAfterBattle: other.giftAfterBattle,
            badge: other.badge,
            textVictory: other.textVictory,
            nextCutscene: other.nextCutscene
        });
    }

    /**
     * Creates and positions a set of four Things around a point.
     * 
     * @param x   The horizontal value of the point.
     * @param y   The vertical value of the point.
     * @param title   A title for each Thing to create.
     * @param settings   Additional settings for each Thing.
     * @param groupType   Which group to move the Things into, if any.
     * @returns The four created Things.
     */
    public animateThingCorners(
        x: number,
        y: number,
        title: string,
        settings: any,
        groupType?: string): [IThing, IThing, IThing, IThing] {
        let things: IThing[] = [];

        for (let i: number = 0; i < 4; i += 1) {
            things.push(this.eightBitter.things.add([title, settings]));
        }

        if (groupType) {
            for (let thing of things) {
                this.eightBitter.groupHolder.switchMemberGroup(thing, thing.groupType, groupType);
            }
        }

        this.eightBitter.physics.setLeft(things[0], x);
        this.eightBitter.physics.setLeft(things[1], x);

        this.eightBitter.physics.setRight(things[2], x);
        this.eightBitter.physics.setRight(things[3], x);

        this.eightBitter.physics.setBottom(things[0], y);
        this.eightBitter.physics.setBottom(things[3], y);

        this.eightBitter.physics.setTop(things[1], y);
        this.eightBitter.physics.setTop(things[2], y);

        this.eightBitter.graphics.flipHoriz(things[0]);
        this.eightBitter.graphics.flipHoriz(things[1]);

        this.eightBitter.graphics.flipVert(things[1]);
        this.eightBitter.graphics.flipVert(things[2]);

        return things as [IThing, IThing, IThing, IThing];
    }

    /**
     * Moves a set of four Things away from a point.
     * 
     * @param things   The four Things to move.
     * @param amount   How far to move each Thing horizontally and vertically.
     */
    public animateExpandCorners(things: [IThing, IThing, IThing, IThing], amount: number): void {
        this.eightBitter.physics.shiftHoriz(things[0], amount);
        this.eightBitter.physics.shiftHoriz(things[1], amount);
        this.eightBitter.physics.shiftHoriz(things[2], -amount);
        this.eightBitter.physics.shiftHoriz(things[3], -amount);

        this.eightBitter.physics.shiftVert(things[0], -amount);
        this.eightBitter.physics.shiftVert(things[1], amount);
        this.eightBitter.physics.shiftVert(things[2], amount);
        this.eightBitter.physics.shiftVert(things[3], -amount);
    }

    /**
     * Creates a small smoke animation from a point.
     * 
     * @param x   The horizontal location of the point.
     * @param y   The vertical location of the point.
     * @param callback   A callback for when the animation is done.
     */
    public animateSmokeSmall(x: number, y: number, callback: (thing: IThing) => void): void {
        let things: IThing[] = this.animateThingCorners(x, y, "SmokeSmall", undefined, "Text");

        this.eightBitter.timeHandler.addEvent(
            (): void => {
                for (const thing of things) {
                    this.eightBitter.physics.killNormal(thing);
                }
            },
            7);

        this.eightBitter.timeHandler.addEvent(
            (): void => this.animateSmokeMedium(x, y, callback),
            7);
    }

    /**
     * Creates a medium-sized smoke animation from a point.
     * 
     * @param x   The horizontal location of the point.
     * @param y   The vertical location of the point.
     * @param callback   A callback for when the animation is done.
     */
    public animateSmokeMedium(x: number, y: number, callback: (thing: IThing) => void): void {
        const things: [IThing, IThing, IThing, IThing] = this.animateThingCorners(x, y, "SmokeMedium", undefined, "Text");

        this.eightBitter.timeHandler.addEvent(
            (): void => this.animateExpandCorners(things, this.eightBitter.unitsize),
            7);

        this.eightBitter.timeHandler.addEvent(
            (): void => {
                for (const thing of things) {
                    this.eightBitter.physics.killNormal(thing);
                }
            },
            14);

        this.eightBitter.timeHandler.addEvent(
            (): void => this.animateSmokeLarge(x, y, callback),
            14);
    }

    /**
     * Creates a large smoke animation from a point.
     * 
     * @param x   The horizontal location of the point.
     * @param y   The vertical location of the point.
     * @param callback   A callback for when the animation is done.
     */
    public animateSmokeLarge(x: number, y: number, callback: (thing: IThing) => void): void {
        const things: [IThing, IThing, IThing, IThing] = this.animateThingCorners(x, y, "SmokeLarge", undefined, "Text");

        this.animateExpandCorners(things, this.eightBitter.unitsize * 2.5);

        this.eightBitter.timeHandler.addEvent(
            (): void => this.animateExpandCorners(things, this.eightBitter.unitsize * 2),
            7);

        this.eightBitter.timeHandler.addEvent(
            (): void => {
                for (const thing of things) {
                    this.eightBitter.physics.killNormal(thing);
                }
            },
            21);

        if (callback) {
            this.eightBitter.timeHandler.addEvent(callback, 21);
        }
    }

    /**
     * Animates an exclamation mark above a Thing.
     * 
     * @param thing   A Thing to show the exclamation over.
     * @param timeout   How long to keep the exclamation (by default, 140).
     * @param callback   A callback for when the exclamation is removed.
     * @returns The exclamation Thing.
     */
    public animateExclamation(thing: IThing, timeout?: number, callback?: () => void): IThing {
        let exclamation: IThing = this.eightBitter.things.add("Exclamation");

        timeout = timeout || 140;

        this.eightBitter.physics.setMidXObj(exclamation, thing);
        this.eightBitter.physics.setBottom(exclamation, thing.top);

        this.eightBitter.timeHandler.addEvent(
            (): void => this.eightBitter.physics.killNormal(exclamation),
            timeout);

        if (callback) {
            this.eightBitter.timeHandler.addEvent(callback, timeout);
        }

        return exclamation;
    }

    /**
     * Fades the screen out to a solid color.
     * 
     * @param settings   Settings for the animation.
     * @returns The solid color Thing.
     */
    public animateFadeToColor(settings: IColorFadeSettings = {}): IThing {
        const color: string = settings.color || "White";
        const callback: ((...args: any[]) => void) | undefined = settings.callback;
        const change: number = settings.change || .33;
        const speed: number = settings.speed || 4;
        const blank: IThing = this.eightBitter.objectMaker.make(color + "Square", {
            width: this.eightBitter.mapScreener.width,
            height: this.eightBitter.mapScreener.height,
            opacity: 0
        });

        this.eightBitter.things.add(blank);

        this.eightBitter.animations.animateFadeAttribute(
            blank,
            "opacity",
            change,
            1,
            speed,
            (): void => {
                this.eightBitter.physics.killNormal(blank);
                if (callback) {
                    callback();
                }
            });

        return blank;
    }

    /**
     * Places a solid color over the screen and fades it out.
     * 
     * @param settings   Settings for the animation.
     * @returns The solid color Thing.
     */
    public animateFadeFromColor(settings: IColorFadeSettings = {}, ...args: any[]): IThing {
        const color: string = settings.color || "White";
        const callback: ((...args: any[]) => void) | undefined = settings.callback;
        const change: number = settings.change || .33;
        const speed: number = settings.speed || 4;
        const blank: IThing = this.eightBitter.objectMaker.make(color + "Square", {
            width: this.eightBitter.mapScreener.width,
            height: this.eightBitter.mapScreener.height,
            opacity: 1
        });

        this.eightBitter.things.add(blank);

        this.eightBitter.animations.animateFadeAttribute(
            blank,
            "opacity",
            -change,
            0,
            speed,
            (): void => {
                this.eightBitter.physics.killNormal(blank);
                if (callback) {
                    callback(settings, ...args);
                }
            });

        return blank;
    }

    /**
     * Animates a "flicker" effect on a Thing by repeatedly toggling its hidden
     * flag for a little while.
     * 
     * @param thing   A Thing to flicker.
     * @param cleartime   How long to wait to stop the effect (by default, 49).
     * @param interval   How many steps between hidden toggles (by default, 2).
     * @param callback   A Function to called on the Thing when done flickering.
     * @returns The flickering time event.
     */
    public animateFlicker(
        thing: IThing,
        cleartime: number = 49,
        interval: number = 2,
        callback?: (thing: IThing) => void): ITimeEvent {
        thing.flickering = true;

        this.eightBitter.timeHandler.addEventInterval(
            (): void => {
                thing.hidden = !thing.hidden;
                if (!thing.hidden) {
                    this.eightBitter.pixelDrawer.setThingSprite(thing);
                }
            },
            interval | 0,
            cleartime | 0);

        return this.eightBitter.timeHandler.addEvent(
            (): void => {
                thing.flickering = thing.hidden = false;
                this.eightBitter.pixelDrawer.setThingSprite(thing);

                if (callback) {
                    callback(thing);
                }
            },
            ((cleartime * interval) | 0) + 1);
    }

    /**
     * Shakes all Things on the screen back and forth for a little bit.
     * 
     * 
     * @param eightBitter
     * @param dx   How far to shift horizontally (by default, 0).
     * @param dy   How far to shift horizontally (by default, 0).
     * @param cleartime   How long until the screen is done shaking.
     * @param interval   How many game upkeeps between movements.
     * @returns The shaking time event.
     */
    public animateScreenShake(
        dx: number = 0,
        dy: number = 0,
        cleartime: number = 8,
        interval: number = 8,
        callback?: IEventCallback): ITimeEvent {
        this.eightBitter.timeHandler.addEventInterval(
            (): void => {
                this.eightBitter.groupHolder.callOnAll(this.eightBitter.physics, this.eightBitter.physics.shiftHoriz, dx);
                this.eightBitter.groupHolder.callOnAll(this.eightBitter.physics, this.eightBitter.physics.shiftVert, dy);
            },
            1,
            cleartime * interval);

        return this.eightBitter.timeHandler.addEvent(
            (): void => {
                dx *= -1;
                dy *= -1;

                this.eightBitter.timeHandler.addEventInterval(
                    (): void => {
                        dx *= -1;
                        dy *= -1;
                    },
                    interval,
                    cleartime);

                if (callback) {
                    this.eightBitter.timeHandler.addEvent(callback, interval * cleartime);
                }
            },
            (interval / 2) | 0);
    }

    /**
     * Sets a Character's xvel and yvel based on its speed and direction, and marks
     * its destination endpoint.
     * 
     * @param thing   A moving Character.
     * @param distance   How far the Character is moving.
     */
    public animateCharacterSetDistanceVelocity(thing: ICharacter, distance: number): void {
        thing.distance = distance;

        switch (thing.direction) {
            case 0:
                thing.xvel = 0;
                thing.yvel = -thing.speed;
                thing.destination = thing.top - distance;
                break;

            case 1:
                thing.xvel = thing.speed;
                thing.yvel = 0;
                thing.destination = thing.right + distance;
                break;

            case 2:
                thing.xvel = 0;
                thing.yvel = thing.speed;
                thing.destination = thing.bottom + distance;
                break;

            case 3:
                thing.xvel = -thing.speed;
                thing.yvel = 0;
                thing.destination = thing.left - distance;
                break;

            default:
                throw new Error("Unknown direction: " + thing.direction + ".");
        }
    }

    /**
     * Starts a Character's walking cycle regardless of the direction.
     * 
     * @param thing   A Character to start walking.
     * @param direction   What direction the Character should turn to face.
     * @param onStop   A queue of commands as alternating directions and distances.
     */
    public animateCharacterStartWalkingCycle(thing: ICharacter, direction: Direction, onStop?: IWalkingOnStop): void {
        if (!onStop || onStop.length === 0) {
            return;
        }

        // If the first queued command is a 0 distance, walking might be complete
        if (onStop[0] === 0) {
            // More commands indicates walking isn't done, and to continue turning/walking
            if (onStop.length > 1) {
                if (typeof onStop[1] === "function") {
                    (onStop[1] as IWalkingOnStopCommandFunction)(thing);
                    return;
                }

                this.animateCharacterSetDirection(thing, DirectionAliases[onStop[1] as number]);

                this.animateCharacterStartWalkingCycle(
                    thing,
                    DirectionAliases[onStop[1] as number],
                    onStop.slice(2));
            }

            return;
        }

        if (thing.follower) {
            thing.walkingCommands!.push(direction);
        }

        this.animateCharacterStartWalking(thing, direction, onStop);

        if (!thing.bordering[direction]) {
            this.eightBitter.physics.shiftBoth(thing, -thing.xvel, -thing.yvel);
        }
    }

    /**
     * Starts a Character walking in the given direction as part of a walking cycle.
     * 
     * @param thing   The Character to start walking.
     * @param direction   What direction to walk in (by default, up).
     * @param onStop   A queue of commands as alternating directions and distances.
     */
    public animateCharacterStartWalking(thing: ICharacter, direction: Direction = Direction.Top, onStop?: any): void {
        const repeats: number = this.eightBitter.mathDecider.compute("speedWalking", thing);
        const distance: number = repeats * thing.speed;

        thing.walking = true;
        this.eightBitter.animations.animateCharacterSetDirection(thing, direction);
        this.eightBitter.animations.animateCharacterSetDistanceVelocity(thing, distance);

        if (!thing.cycles || !(thing.cycles as any).walking) {
            this.eightBitter.timeHandler.addClassCycle(
                thing,
                ["walking", "standing"],
                "walking",
                repeats / 2);
        }

        if (!thing.walkingFlipping) {
            thing.walkingFlipping = this.eightBitter.timeHandler.addEventInterval(
                (): void => this.eightBitter.animations.animateSwitchFlipOnDirection(thing),
                repeats,
                Infinity,
                thing);
        }

        if (thing.sight) {
            thing.sightDetector!.nocollide = true;
        }

        this.eightBitter.timeHandler.addEventInterval(
            (): void => thing.onWalkingStop.call(this.eightBitter.animations, thing, onStop),
            repeats,
            Infinity,
            thing,
            onStop);

        if (!thing.bordering[direction]) {
            this.eightBitter.physics.shiftBoth(thing, thing.xvel, thing.yvel);
        }
    }

    /**
     * Starts a roaming Character walking in a random direction, determined
     * by the allowed directions it may use (that aren't blocked).
     * 
     * @param thing   A roaming Character.
     */
    public animateCharacterStartWalkingRandom(thing: ICharacter): void {
        if (!thing.roamingDirections) {
            throw new Error("Roaming Thing should define a .roamingDirections.");
        }

        let totalAllowed: number = 0;
        let direction: Direction;
        let i: number;

        for (const border of thing.bordering) {
            if (!border) {
                totalAllowed += 1;
            }
        }

        if (totalAllowed === 0) {
            return;
        }

        direction = this.eightBitter.numberMaker.randomInt(totalAllowed);

        for (i = 0; i <= direction; i += 1) {
            if (thing.bordering[i]) {
                direction += 1;
            }
        }

        if (thing.roamingDirections.indexOf(direction) === -1) {
            this.animateCharacterSetDirection(thing, direction);
        } else {
            this.animateCharacterStartWalking(thing, direction);
        }
    }

    /**
     * Continues a Character's walking cycle after taking a step. If .turning
     * is provided, the Character turns. If a Player is provided, its keys
     * and .canKeyWalking are respected.
     * 
     * @param thing   A Character mid-step.
     */
    public animateCharacterRepeatWalking(thing: ICharacter): void {
        if (typeof thing.turning !== "undefined") {
            if (!thing.player || !(thing as any).keys[thing.turning]) {
                this.animateCharacterSetDirection(thing, thing.turning);
                thing.turning = undefined;
                return;
            }

            thing.turning = undefined;
        }

        if (thing.player) {
            (thing as IPlayer).canKeyWalking = false;
        }

        this.animateCharacterStartWalking(thing, thing.direction);
    }

    /**
     * Reacts to a Character finishing a step and either stops all walking or moves to
     * the next action in the onStop queue.
     * 
     * @param thing   A Character finishing a walking step.
     * @param onStop   A queue of commands as alternating directions and distances.
     * @returns True, unless the next onStop is a Function to return the result of.
     */
    public animateCharacterStopWalking(thing: ICharacter, onStop?: IWalkingOnStop): boolean {
        thing.xvel = 0;
        thing.yvel = 0;
        thing.walking = false;

        this.eightBitter.graphics.removeClasses(thing, "walking", "standing");
        this.eightBitter.timeHandler.cancelClassCycle(thing, "walking");

        if (thing.walkingFlipping) {
            this.eightBitter.timeHandler.cancelEvent(thing.walkingFlipping);
            thing.walkingFlipping = undefined;
        }

        this.eightBitter.animations.animateSnapToGrid(thing);

        if (thing.sight) {
            thing.sightDetector!.nocollide = false;
            this.eightBitter.animations.animatePositionSightDetector(thing);
        }

        if (!onStop) {
            return true;
        }

        switch (onStop.constructor) {
            case Number:
                this.eightBitter.animations.animateCharacterRepeatWalking(thing);
                break;

            case Array:
                if (onStop[0] > 0) {
                    onStop[0] = onStop[0] as number - 1;
                    this.eightBitter.animations.animateCharacterStartWalkingCycle(thing, thing.direction, onStop);
                } else if (onStop.length === 0) {
                    break;
                } else {
                    if (onStop[1] instanceof Function) {
                        return (onStop[1] as IWalkingOnStopCommandFunction)(thing) as boolean;
                    }
                    this.eightBitter.animations.animateCharacterStartWalkingCycle(
                        thing,
                        DirectionAliases[onStop[1] as number],
                        onStop.slice(2));
                }
                break;

            case Function:
                return (onStop as any)(thing);

            default:
                throw new Error("Unknown onStop: " + onStop + ".");
        }

        return true;
    }

    /**
     * Animates a Player to stop walking, which is the same logic for a normal
     * Character as well as MenuGrapher and following checks.
     * 
     * @param thing   A Player to stop walking.
     * @param onStop   A queue of commands as alternating directions and distances.
     * @returns True, unless the next onStop is a Function to return the result of.
     */
    public animatePlayerStopWalking(thing: IPlayer, onStop: IWalkingOnStop): boolean {
        if (this.eightBitter.battles.checkPlayerGrassBattle(thing)) {
            thing.canKeyWalking = true;
            return false;
        }

        if (thing.following) {
            return this.eightBitter.animations.animateCharacterStopWalking(thing, onStop);
        }

        if (
            !this.eightBitter.menuGrapher.getActiveMenu()
            && (thing.keys as any)[thing.direction]) {
            this.eightBitter.animations.animateCharacterSetDistanceVelocity(thing, thing.distance);
            return false;
        }

        if (typeof thing.nextDirection !== "undefined") {
            if (thing.nextDirection !== thing.direction && !thing.ledge) {
                this.eightBitter.physics.setPlayerDirection(thing, thing.nextDirection);
            }

            delete thing.nextDirection;
        } else {
            thing.canKeyWalking = true;
        }

        return this.eightBitter.animations.animateCharacterStopWalking(thing, onStop);
    }

    /**
     * Animates a Character to no longer be able to walk.
     * 
     * @param thing   A Character that shouldn't be able to walk.
     */
    public animateCharacterPreventWalking(thing: ICharacter): void {
        thing.shouldWalk = false;
        thing.xvel = thing.yvel = 0;

        if (thing.player) {
            (thing as IPlayer).keys = (thing as IPlayer).getKeys();
        }

        this.eightBitter.mapScreener.blockInputs = true;
    }

    /**
     * Sets a Thing facing a particular direction.
     * 
     * @param thing   An in-game Thing.
     * @param direction   A direction for thing to face.
     * @todo Add more logic here for better performance.
     */
    public animateCharacterSetDirection(thing: IThing, direction: Direction): void {
        thing.direction = direction;

        if (direction % 2 === 1) {
            this.eightBitter.graphics.unflipHoriz(thing);
        }

        this.eightBitter.graphics.removeClasses(
            thing,
            DirectionClasses[Direction.Top],
            DirectionClasses[Direction.Right],
            DirectionClasses[Direction.Bottom],
            DirectionClasses[Direction.Left]);

        this.eightBitter.graphics.addClass(thing, DirectionClasses[direction]);

        if (direction === Direction.Right) {
            this.eightBitter.graphics.flipHoriz(thing);
            this.eightBitter.graphics.addClass(thing, DirectionClasses[Direction.Left]);
        }
    }

    /**
     * Sets a Thing facing a random direction.
     *
     * @param thing   An in-game Thing.
     */
    public animateCharacterSetDirectionRandom(thing: IThing): void {
        this.eightBitter.animations.animateCharacterSetDirection(thing, this.eightBitter.numberMaker.randomIntWithin(0, 3));
    }

    /**
     * Flips or unflips a Character if its direction is vertical.
     * 
     * @param thing   A Character to flip or unflip.
     */
    public animateSwitchFlipOnDirection(thing: ICharacter): void {
        if (thing.direction % 2 !== 0) {
            return;
        }

        if (thing.flipHoriz) {
            this.eightBitter.graphics.unflipHoriz(thing);
        } else {
            this.eightBitter.graphics.flipHoriz(thing);
        }
    }

    /**
     * Positions a Character's detector in front of it as its sight.
     * 
     * @param thing   A Character that should be able to see.
     */
    public animatePositionSightDetector(thing: ICharacter): void {
        const detector: ISightDetector = thing.sightDetector!;
        let direction: Direction = thing.direction;

        if (detector.direction !== direction) {
            if (thing.direction % 2 === 0) {
                this.eightBitter.physics.setWidth(detector, thing.width);
                this.eightBitter.physics.setHeight(detector, thing.sight * 8);
            } else {
                this.eightBitter.physics.setWidth(detector, thing.sight * 8);
                this.eightBitter.physics.setHeight(detector, thing.height);
            }
            detector.direction = direction;
        }

        switch (direction) {
            case 0:
                this.eightBitter.physics.setBottom(detector, thing.top);
                this.eightBitter.physics.setMidXObj(detector, thing);
                break;
            case 1:
                this.eightBitter.physics.setLeft(detector, thing.right);
                this.eightBitter.physics.setMidYObj(detector, thing);
                break;
            case 2:
                this.eightBitter.physics.setTop(detector, thing.bottom);
                this.eightBitter.physics.setMidXObj(detector, thing);
                break;
            case 3:
                this.eightBitter.physics.setRight(detector, thing.left);
                this.eightBitter.physics.setMidYObj(detector, thing);
                break;
            default:
                throw new Error("Unknown direction: " + direction + ".");
        }
    }

    /**
     * Animates the various logic pieces for finishing a dialog, such as pushes,
     * gifts, options, and battle starting or disabling.
     * 
     * @param thing   A Player that's finished talking to other.
     * @param other   A Character that thing has finished talking to.
     */
    public animateCharacterDialogFinish(thing: IPlayer, other: ICharacter): void {
        let onStop: IWalkingOnStop | undefined = other.pushSteps;

        this.eightBitter.modAttacher.fireEvent("onDialogFinish", other);

        thing.talking = false;
        other.talking = false;
        thing.canKeyWalking = true;

        if (other.directionPreferred) {
            this.animateCharacterSetDirection(other, other.directionPreferred);
        }

        if (other.transport) {
            other.active = true;
            this.activateTransporter(thing, other as any);
            return;
        }

        if (typeof other.pushDirection !== "undefined") {
            this.animateCharacterStartWalkingCycle(thing, other.pushDirection, onStop);
        }

        if (other.gift) {
            this.eightBitter.menuGrapher.createMenu("GeneralText", {
                deleteOnFinish: true
            });
            this.eightBitter.menuGrapher.addMenuDialog(
                "GeneralText",
                "%%%%%%%PLAYER%%%%%%% got " + other.gift.toUpperCase() + "!",
                (): void => this.animateCharacterDialogFinish(thing, other));
            this.eightBitter.menuGrapher.setActiveMenu("GeneralText");

            this.eightBitter.storage.addItemToBag(other.gift);

            other.gift = undefined;
            this.eightBitter.stateHolder.addChange(other.id, "gift", undefined);

            return;
        }

        if (other.dialogNext) {
            other.dialog = other.dialogNext;
            other.dialogNext = undefined;
            this.eightBitter.stateHolder.addChange(other.id, "dialog", other.dialog);
            this.eightBitter.stateHolder.addChange(other.id, "dialogNext", undefined);
        }

        if (other.dialogOptions) {
            this.animateCharacterDialogOptions(thing, other, other.dialogOptions);
        } else if (other.trainer && !(other as IEnemy).alreadyBattled) {
            this.animateTrainerBattleStart(thing, other as IEnemy);
            (other as IEnemy).alreadyBattled = true;
            this.eightBitter.stateHolder.addChange(other.id, "alreadyBattled", true);
        }

        if (other.trainer) {
            other.trainer = false;
            this.eightBitter.stateHolder.addChange(other.id, "trainer", false);

            if (other.sight) {
                other.sight = undefined;
                this.eightBitter.stateHolder.addChange(other.id, "sight", undefined);
            }
        }

        if (!other.dialogOptions) {
            this.eightBitter.storage.autoSave();
        }
    }

    /**
     * Displays a yes/no options menu for after a dialog has completed.
     * 
     * 
     * @param thing   A Player that's finished talking to other.
     * @param other   A Character that thing has finished talking to.
     * @param dialog   The dialog settings that just finished.
     */
    public animateCharacterDialogOptions(thing: IPlayer, other: ICharacter, dialog: IDialog): void {
        if (!dialog.options) {
            throw new Error("Dialog should have .options.");
        }

        const options: IDialogOptions = dialog.options;
        const generateCallback: (inDialog: string | IDialog) => void = (callbackDialog: string | IDialog): (() => void) | undefined => {
            if (!callbackDialog) {
                return undefined;
            }

            let callback: (...args: any[]) => void;
            let words: IMenuDialogRaw;

            if (callbackDialog.constructor === Object && (callbackDialog as IDialog).options) {
                words = (callbackDialog as IDialog).words;
                callback = (): void => {
                    this.animateCharacterDialogOptions(thing, other, callbackDialog as IDialog);
                };
            } else {
                words = (callbackDialog as IDialog).words || callbackDialog as string;
                if ((callbackDialog as IDialog).cutscene) {
                    callback = this.eightBitter.scenePlayer.bindCutscene(
                        (callbackDialog as IDialog).cutscene!,
                        {
                            player: thing,
                            tirggerer: other
                        });
                }
            }

            return (): void => {
                this.eightBitter.menuGrapher.deleteMenu("Yes/No");
                this.eightBitter.menuGrapher.createMenu("GeneralText", {
                    // "deleteOnFinish": true
                });
                this.eightBitter.menuGrapher.addMenuDialog(
                    "GeneralText", words, callback);
                this.eightBitter.menuGrapher.setActiveMenu("GeneralText");
            };
        };

        console.warn("DialogOptions assumes type = Yes/No for now...");

        this.eightBitter.menuGrapher.createMenu("Yes/No", {
            position: {
                offset: {
                    left: 28
                }
            }
        });
        this.eightBitter.menuGrapher.addMenuList("Yes/No", {
            options: [
                {
                    text: "YES",
                    callback: generateCallback(options.Yes)
                }, {
                    text: "NO",
                    callback: generateCallback(options.No)
                }]
        });
        this.eightBitter.menuGrapher.setActiveMenu("Yes/No");
    }

    /**
     * Starts a Character walking behind another Character. The leader is given a
     * .walkingCommands queue of recent steps that the follower will mimic.
     * 
     * @param thing   The following Character.
     * @param other   The leading Character.
     */
    public animateCharacterFollow(thing: ICharacter, other: ICharacter): void {
        let direction: Direction | undefined = this.eightBitter.physics.getDirectionBordering(thing, other);
        if (!direction) {
            throw new Error("Characters are too far away to follow.");
        }

        thing.nocollide = true;

        if (thing.player) {
            (thing as IPlayer).allowDirectionAsKeys = true;
            (thing as IPlayer).shouldWalk = false;
        }

        thing.following = other;
        other.follower = thing;

        this.eightBitter.storage.addStateHistory(thing, "speed", thing.speed);
        thing.speed = other.speed;

        other.walkingCommands = [];

        this.animateCharacterSetDirection(thing, direction);

        switch (direction) {
            case 0:
                this.eightBitter.physics.setTop(thing, other.bottom);
                break;
            case 1:
                this.eightBitter.physics.setRight(thing, other.left);
                break;
            case 2:
                this.eightBitter.physics.setBottom(thing, other.top);
                break;
            case 3:
                this.eightBitter.physics.setLeft(thing, other.right);
                break;
            default:
                break;
        }

        // Manually start the walking process without giving a 0 onStop,
        // so that it continues smoothly in the walking interval
        this.animateCharacterStartWalking(thing, direction);

        thing.followingLoop = this.eightBitter.timeHandler.addEventInterval(
            (): void => this.animateCharacterFollowContinue(thing, other),
            this.eightBitter.mathDecider.compute("speedWalking", thing),
            Infinity);
    }

    /**
     * Continuation helper for a following cycle. The next walking command is
     * played, if it exists.
     * 
     * @param thing   The following Character.
     * @param other   The leading Character.
     */
    public animateCharacterFollowContinue(thing: ICharacter, other: ICharacter): void {
        if (!other.walkingCommands) {
            throw new Error("Thing should have .walkingCommands.");
        }

        if (other.walkingCommands.length === 0) {
            return;
        }

        const direction: Direction = other.walkingCommands.shift()!;

        this.animateCharacterStartWalking(thing, direction, 0);
    }

    /**
     * Animates a Character to stop having a follower.
     * 
     * @param thing   The leading Character.
     * @returns True, to stop TimeHandlr cycles.
     */
    public animateCharacterFollowStop(thing: ICharacter): boolean {
        const other: ICharacter | undefined = thing.following;
        if (!other) {
            return true;
        }

        thing.nocollide = false;
        delete thing.following;
        delete other.follower;

        this.animateCharacterStopWalking(thing);
        this.eightBitter.timeHandler.cancelEvent(thing.followingLoop!);

        return true;
    }

    /**
     * Animates a Character to hop over a ledge.
     * 
     * @param thing   A walking Character.
     * @param other   A ledge for thing to hop over.
     */
    public animateCharacterHopLedge(thing: ICharacter, other: IThing): void {
        const shadow: IThing = this.eightBitter.things.add("Shadow");
        const speed: number = 2;
        let dy: number = -this.eightBitter.unitsize;
        let steps: number = 14;
        let changed: number = 0;

        thing.shadow = shadow;
        thing.ledge = other;

        // Center the shadow below the Thing
        this.eightBitter.physics.setMidXObj(shadow, thing);
        this.eightBitter.physics.setBottom(shadow, thing.bottom);

        // Continuously ensure The Thing still moves off the ledge if not walking
        this.eightBitter.timeHandler.addEventInterval(
            (): boolean => {
                if (thing.walking) {
                    return false;
                }

                this.eightBitter.animations.animateCharacterSetDistanceVelocity(thing, thing.distance);
                return true;
            },
            1,
            steps * speed - 1);

        // Keep the shadow below the Thing, and move the Thing's offsetY
        this.eightBitter.timeHandler.addEventInterval(
            (): void => {
                this.eightBitter.physics.setBottom(shadow, thing.bottom);

                if (changed % speed === 0) {
                    thing.offsetY += dy;
                }

                changed += 1;
            },
            1,
            steps * speed);

        // Inverse the Thing's offsetY changes halfway through the hop
        this.eightBitter.timeHandler.addEvent(
            (): void => {
                dy *= -1;
            },
            speed * (steps / 2) | 0);

        // Delete the shadow after the jump is done
        this.eightBitter.timeHandler.addEvent(
            (): void => {
                delete thing.ledge;
                this.eightBitter.physics.killNormal(shadow);

                if (!thing.walking) {
                    this.eightBitter.animations.animateCharacterStopWalking(thing);
                }

                if (thing.player) {
                    (thing as IPlayer).canKeyWalking = true;
                    this.eightBitter.mapScreener.blockInputs = false;
                }
            },
            steps * speed);
    }

    /**
     * Activates a Detector to trigger a cutscene and/or routine.
     * 
     * @param thing   A Player triggering other.
     * @param other   A Detector triggered by thing.
     */
    public activateCutsceneTriggerer(thing: IPlayer, other: IDetector): void {
        if (!other.alive || thing.collidedTrigger === other) {
            return;
        }

        thing.collidedTrigger = other;
        this.eightBitter.animations.animatePlayerDialogFreeze(thing);

        if (!other.keepAlive) {
            other.alive = false;

            if (other.id.indexOf("Anonymous") !== -1) {
                console.warn("Deleting anonymous CutsceneTriggerer:", other.id);
            }

            this.eightBitter.stateHolder.addChange(other.id, "alive", false);
            this.eightBitter.physics.killNormal(other);
        }

        if (other.cutscene) {
            this.eightBitter.scenePlayer.startCutscene(other.cutscene, {
                player: thing,
                triggerer: other
            });
        }

        if (other.routine) {
            this.eightBitter.scenePlayer.playRoutine(other.routine);
        }
    }

    /**
     * Activates a Detector to play an audio theme.
     * 
     * @param thing   A Player triggering other.
     * @param other   A Detector triggered by thing.
     */
    public activateThemePlayer(thing: IPlayer, other: IThemeDetector): void {
        if (!thing.player || this.eightBitter.audioPlayer.getThemeName() === other.theme) {
            return;
        }

        this.eightBitter.audioPlayer.playTheme(other.theme);
    }

    /**
     * Activates a Detector to play a cutscene, and potentially a dialog.
     * 
     * @param thing   A Player triggering other.
     * @param other   A Detector triggered by thing.
     */
    public activateCutsceneResponder(thing: ICharacter, other: IDetector): void {
        if (!thing.player || !other.alive) {
            return;
        }

        if (other.dialog) {
            this.eightBitter.animations.activateMenuTriggerer(thing, other);
            return;
        }

        this.eightBitter.scenePlayer.startCutscene(other.cutscene!, {
            player: thing,
            triggerer: other
        });
    }

    /**
     * Activates a Detector to open a menu, and potentially a dialog.
     * 
     * @param thing   A Character triggering other.
     * @param other   A Detector triggered by thing.
     */
    public activateMenuTriggerer(thing: ICharacter, other: IMenuTriggerer): void {
        if (!other.alive || thing.collidedTrigger === other) {
            return;
        }

        if (!other.dialog) {
            throw new Error("MenuTriggerer should have .dialog.");
        }

        const name: string = other.menu || "GeneralText";
        const dialog: IMenuDialogRaw | IMenuDialogRaw[] = other.dialog;

        thing.collidedTrigger = other;
        this.animateCharacterPreventWalking(thing);

        if (!other.keepAlive) {
            this.eightBitter.physics.killNormal(other);
        }

        if (!this.eightBitter.menuGrapher.getMenu(name)) {
            this.eightBitter.menuGrapher.createMenu(name, other.menuAttributes);
        }

        if (dialog) {
            this.eightBitter.menuGrapher.addMenuDialog(
                name,
                dialog,
                (): void => {
                    let onStop: IWalkingOnStop | undefined = undefined;

                    if (other.pushSteps) {
                        onStop = other.pushSteps.slice();
                    }

                    this.eightBitter.menuGrapher.deleteMenu("GeneralText");

                    if (typeof other.pushDirection !== "undefined") {
                        if (onStop) {
                            onStop.push((): void => {
                                this.eightBitter.mapScreener.blockInputs = false;
                                delete thing.collidedTrigger;
                            });
                            this.animateCharacterStartWalkingCycle(
                                thing, other.pushDirection, onStop);
                        }
                    } else {
                        this.eightBitter.mapScreener.blockInputs = false;
                        delete thing.collidedTrigger;
                    }
                });
        }

        this.eightBitter.menuGrapher.setActiveMenu(name);
    }

    /**
     * Activates a Character's sight detector for when another Character walks
     * into it.
     * 
     * @param thing   A Character triggering other.
     * @param other   A sight detector being triggered by thing.
     */
    public activateSightDetector(thing: ICharacter, other: ISightDetector): void {
        if (other.viewer.talking) {
            return;
        }

        other.viewer.talking = true;
        other.active = false;

        this.eightBitter.mapScreener.blockInputs = true;

        this.eightBitter.scenePlayer.startCutscene("TrainerSpotted", {
            player: thing,
            sightDetector: other,
            triggerer: other.viewer
        });
    }

    /**
     * Activation callback for level transports (any Thing with a .transport 
     * attribute). Depending on the transport, either the map or location are 
     * shifted to it.
     * 
     * @param thing   A Character attempting to enter other.
     * @param other   A transporter being entered by thing.
     */
    public activateTransporter(thing: ICharacter, other: ITransporter): void {
        if (!thing.player || !other.active) {
            return;
        }

        if (typeof other.transport === "undefined") {
            throw new Error("No transport given to activateTransporter");
        }

        const transport: ITransportSchema = other.transport as ITransportSchema;
        let callback: () => void;

        if (transport.constructor === String) {
            callback = (): void => this.eightBitter.maps.setLocation(transport as any);
        } else if (typeof transport.map !== "undefined") {
            callback = (): void => this.eightBitter.maps.setMap(transport.map, transport.location);
        } else if (typeof transport.location !== "undefined") {
            callback = (): void => this.eightBitter.maps.setLocation(transport.location);
        } else {
            throw new Error(`Unknown transport type: '${transport}'`);
        }

        other.active = false;

        this.eightBitter.animations.animateFadeToColor({
            callback,
            color: "Black"
        });
    }

    /**
     * Activation trigger for a gym statue. If the Player is looking up at it,
     * it speaks the status of the gym leader.
     * 
     * @param thing   A Player activating other.
     * @param other   A gym statue being activated by thing.
     */
    public activateGymStatue(thing: ICharacter, other: IGymDetector): void {
        if (thing.direction !== 0) {
            return;
        }

        const gym: string = other.gym;
        const leader: string = other.leader;
        const dialog: string[] = [
            gym.toUpperCase()
            + " \n %%%%%%%POKEMON%%%%%%% GYM \n LEADER: "
            + leader.toUpperCase(),
            "WINNING TRAINERS: %%%%%%%RIVAL%%%%%%%"
        ];

        if (this.eightBitter.itemsHolder.getItem("badges")[leader]) {
            dialog[1] += " \n %%%%%%%PLAYER%%%%%%%";
        }

        this.eightBitter.menuGrapher.createMenu("GeneralText");
        this.eightBitter.menuGrapher.addMenuDialog("GeneralText", dialog);
        this.eightBitter.menuGrapher.setActiveMenu("GeneralText");
    }

    /**
     * Calls an HMCharacter's partyActivate Function when the Player activates the HMCharacter.
     * 
     * @param player   The Player.
     * @param thing   The Solid to be affected.
     */
    public activateHMCharacter(player: IPlayer, thing: IHMCharacter): void {
        if (thing.requiredBadge && !this.eightBitter.itemsHolder.getItem("badges")[thing.requiredBadge]) {
            return;
        }

        let partyPokemon: IPokemon[] = this.eightBitter.itemsHolder.getItem("PokemonInParty");

        for (let pokemon of partyPokemon) {
            let moves: IMove[] = pokemon.moves;

            for (let move of moves) {
                if (move.title === thing.moveName) {
                    thing.moveCallback(player, pokemon);
                    return;
                }
            }
        }
    }

    /**
     * Starts a Character roaming in random directions.
     * 
     * @param thing   A Character to start roaming.
     * @returns Whether the time cycle should stop (thing is dead).
     */
    public activateCharacterRoaming(thing: ICharacter): boolean {
        if (!thing.alive) {
            return true;
        }

        this.eightBitter.timeHandler.addEvent(
            (): boolean => this.eightBitter.animations.activateCharacterRoaming(thing),
            70 + this.eightBitter.numberMaker.randomInt(210));

        if (!thing.talking && !this.eightBitter.menuGrapher.getActiveMenu()) {
            this.eightBitter.animations.animateCharacterStartWalkingRandom(thing);
        }

        return false;
    }

    /**
     * Activates a Spawner by calling its .activate.
     * 
     * @param thing   A newly placed Spawner.
     */
    public activateSpawner(thing: IDetector): void {
        if (!thing.activate) {
            throw new Error("Spawner should have .activate.");
        }

        thing.activate.call(this, thing);
    }

    /**
     * Checks if a WindowDetector is within frame, and activates it if so.
     * 
     * @param thing   An in-game WindowDetector.
     */
    public checkWindowDetector(thing: IDetector): boolean {
        if (
            thing.bottom < 0
            || thing.left > this.eightBitter.mapScreener.width
            || thing.top > this.eightBitter.mapScreener.height
            || thing.right < 0) {
            return false;
        }

        if (!thing.activate) {
            throw new Error("WindowDetector should have .activate.");
        }

        thing.activate.call(this, thing);
        this.eightBitter.physics.killNormal(thing);
        return true;
    }

    /**
     * Activates an areaSpawner. If it's for a different Area than the current,
     * that area is spawned in the appropriate direction.
     * 
     * @param thing   An areaSpawner to activate.
     */
    public spawnareaSpawner(thing: IareaSpawner): void {
        const map: IMap = this.eightBitter.areaSpawner.getMap(thing.map) as IMap;
        const area: IArea = map.areas[thing.area] as IArea;

        if (area === this.eightBitter.areaSpawner.getArea()) {
            this.eightBitter.physics.killNormal(thing);
            return;
        }

        if (
            area.spawnedBy
            && area.spawnedBy === (this.eightBitter.areaSpawner.getArea() as IArea).spawnedBy
        ) {
            this.eightBitter.physics.killNormal(thing);
            return;
        }

        area.spawnedBy = (this.eightBitter.areaSpawner.getArea() as IArea).spawnedBy;

        this.eightBitter.maps.activateareaSpawner(thing, area);
    }

    /**
     * Activation callback for an AreaGate. The Player is marked to now spawn
     * in the new Map and Area.
     * 
     * @param thing   A Character walking to other.
     * @param other   An AreaGate potentially being triggered.
     */
    public activateAreaGate(thing: ICharacter, other: IAreaGate): void {
        if (!thing.player || !thing.walking || thing.direction !== other.direction) {
            return;
        }

        const area: IArea = this.eightBitter.areaSpawner.getMap(other.map).areas[other.area] as IArea;
        let areaOffsetX: number;
        let areaOffsetY: number;

        switch (thing.direction) {
            case Direction.Top:
                areaOffsetX = thing.left - other.left;
                areaOffsetY = area.height * this.eightBitter.unitsize - thing.height;
                break;

            case Direction.Right:
                areaOffsetX = 0;
                areaOffsetY = thing.top - other.top;
                break;

            case Direction.Bottom:
                areaOffsetX = thing.left - other.left;
                areaOffsetY = 0;
                break;

            case Direction.Left:
                areaOffsetX = area.width * this.eightBitter.unitsize - thing.width;
                areaOffsetY = thing.top - other.top;
                break;

            default:
                throw new Error(`Unknown direction: '${thing.direction}'.`);
        }

        const screenOffsetX: number = areaOffsetX - thing.left;
        const screenOffsetY: number = areaOffsetY - thing.top;

        this.eightBitter.mapScreener.top = screenOffsetY;
        this.eightBitter.mapScreener.right = screenOffsetX + this.eightBitter.mapScreener.width;
        this.eightBitter.mapScreener.bottom = screenOffsetY + this.eightBitter.mapScreener.height;
        this.eightBitter.mapScreener.left = screenOffsetX;

        this.eightBitter.itemsHolder.setItem("map", other.map);
        this.eightBitter.itemsHolder.setItem("area", other.area);
        this.eightBitter.itemsHolder.setItem("location", undefined);

        this.eightBitter.stateHolder.setCollection(area.map.name + "::" + area.name);

        other.active = false;
        this.eightBitter.timeHandler.addEvent(
            (): void => {
                other.active = true;
            },
            2);
    };

    /**
     * Makes sure that Player is facing the correct HMCharacter
     *
     * @param player   The Player.
     * @param pokemon   The Pokemon using the move.
     * @param move   The move being used.
     * @todo Add context for what happens if player is not bordering the correct HMCharacter.
     * @todo Refactor to give borderedThing a .hmActivate property.
     */
    public partyActivateCheckThing(player: IPlayer, pokemon: IPokemon, move: IHMMoveSchema): void {
        const borderedThing: IThing | undefined = player.bordering[player.direction];

        if (borderedThing && borderedThing.title.indexOf(move.characterName!) !== -1) {
            move.partyActivate!(player, pokemon);
        }
    }

    /**
     * Cuts a CuttableTree.
     *
     * @param player   The Player.
     * @todo Add an animation for what happens when the CuttableTree is cut.
     */
    public partyActivateCut(player: IPlayer): void {
        this.eightBitter.menuGrapher.deleteAllMenus();
        this.eightBitter.menus.closePauseMenu();
        this.eightBitter.physics.killNormal(player.bordering[player.direction]!);
    }

    /**
     * Makes a StrengthBoulder move.
     *
     * @param player   The Player.
     * @todo Verify the exact speed, sound, and distance.
     */
    public partyActivateStrength(player: IPlayer): void {
        let boulder: IHMCharacter = player.bordering[player.direction] as IHMCharacter;

        this.eightBitter.menuGrapher.deleteAllMenus();
        this.eightBitter.menus.closePauseMenu();

        if (!this.eightBitter.thingHitter.checkHitForThings(player as any, boulder as any)
            || boulder.bordering[player.direction] !== undefined) {
            return;
        }

        let xvel: number = 0;
        let yvel: number = 0;

        switch (player.direction) {
            case 0:
                yvel = -this.eightBitter.unitsize;
                break;

            case 1:
                xvel = this.eightBitter.unitsize;
                break;

            case 2:
                yvel = this.eightBitter.unitsize;
                break;

            case 3:
                xvel = -this.eightBitter.unitsize;
                break;

            default:
                throw new Error(`Unknown direction: '${player.direction}'.`);
        }

        this.eightBitter.timeHandler.addEventInterval(
            (): void => this.eightBitter.physics.shiftBoth(boulder, xvel, yvel),
            1,
            8);

        for (let i: number = 0; i < boulder.bordering.length; i += 1) {
            boulder.bordering[i] = undefined;
        }
    }

    /**
     * Starts the Player surfing.
     *
     * @param player   The Player.
     * @todo Add the dialogue for when the Player starts surfing.
     */
    public partyActivateSurf(player: IPlayer): void {
        this.eightBitter.menuGrapher.deleteAllMenus();
        this.eightBitter.menus.closePauseMenu();

        if (player.cycling) {
            return;
        }

        player.bordering[player.direction] = undefined;
        this.eightBitter.graphics.addClass(player, "surfing");
        this.eightBitter.animations.animateCharacterStartWalking(player, player.direction, [1]);
        player.surfing = true;
    }
}