
import {fabric} from "fabric";
import {KeyManager} from "./keyManager.js";
import {Player} from "./player.js";
import {Stage} from "./stage/stage.js";

/**
 * Hold game instance as well as public method that windows should call
 */
export class Game  {

    static playerSpeed = 500; //px p s
    /**
     * Create Game Instance 
     * 
     * Argument
     * - stageDiv: the div to put everything (including canvas) in
     */
    constructor(args) {
        // key Manager to deduplicate keyDown event
        this.keyManager = new KeyManager();

        // create game canvas
        let canvasId = args.canvasId;
        this.canvas = new fabric.StaticCanvas(canvasId, {
            width: 500,
            height: 400,
        });

        // add player
        this.player = new Player({
            canvas: this.canvas
        });
        
        // add stage
        this.stage = new Stage({
            canvas: this.canvas
        });

        let rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'red',
            width: 20,
            height: 20
        });

        this.canvas.add(rect);
        this.canvas.renderAll();
    }

    keyDown = (e) => {this.keyManager.keyDown(e);}
    keyUp = (e) => {this.keyManager.keyUp(e);}
    
    /**
     * Update the game to its next frame
     * Argument:
     * - dt: elapsed time since last frame in ms
     */
    update = (e) => {

        let dt = e.dt;
        // move player based on key pressed
        let dx = 0; let dy = 0;
        if(this.keyManager.isPressed('ArrowDown')) {
            dy ++;
        }
        if(this.keyManager.isPressed('ArrowUp')) {
            dy --;
        }
        if(this.keyManager.isPressed('ArrowRight')) {
            dx ++;
        }
        if(this.keyManager.isPressed('ArrowLeft')) {
            dx --;
        }
        let dd = Math.sqrt(dx * dx + dy * dy);
        if (dd != 0) {
            dx /= dd;
            dy /= dd;
        }
        dx *= Game.playerSpeed * dt/1000;
        dy *= Game.playerSpeed * dt/1000;
        this.stage.moveCameraRelative({dx, dy});

        // Try animate stage easing
        if(this.keyManager.isPressed('Enter')) {
            this.stage.animateCameraRelative({dx: dx * 30, dy: dy * 30});
        }

        
        console.log(this.keyManager.pressed);
        console.log(dt);
        console.log(this.stage.underAnimation);
        // this.canvas.renderAll();
        this.canvas.requestRenderAll();
    }
}
