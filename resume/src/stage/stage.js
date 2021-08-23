import {fabric} from "fabric";


/**
 * Class that represents container of everything in the stage
 */
export class Stage {

    /**
     * Create the stage instance
     * Argument
     * - canvas 
     */
    constructor(args) {
        this.canvas = args.canvas;
        this.cameraX = 0;
        this.cameraY = 0;
        this.objectGroup = new fabric.Group([], {
            left: -this.cameraX,
            top: -this.cameraY
        });
        
        this.canvas.add(this.objectGroup);
        this.underAnimation = false;


        // temp object
        this.objectGroup.addWithUpdate(new fabric.Rect({
            left: 100,
            top: 100,
            width: 30,
            height: 30,
            fill: 'lime',
            originX: 'center',
            originY: 'center'
        }));

        this.objectGroup.addWithUpdate(new fabric.Rect({
            left: -100,
            top: -50,
            width: 15,
            height: 40,
            fill: 'blue',
            originX: 'center',
            originY: 'center'
        }));
    }

    /**
     * Move camera
     * Argument:
     * - dx: delta x
     * - dy: delta y
     */
    moveCameraRelative = (args) => {
        if(this.underAnimation ) {return;}
        this.cameraX += args.dx;
        this.cameraY += args.dy;
        this.objectGroup.set({
            left: -this.cameraX,
            top: -this.cameraY
        });
    }

    /**
     * Move camera but with animation 
     * Argument:
     * - dx: delta x
     * - dy: delta y
     */
    animateCameraRelative = (args) => {
        if(this.underAnimation) {return;}
        this.underAnimation = true;
        this.cameraX += args.dx;
        this.cameraY += args.dy;
        // let unblockAnimation = ()=> {this.underAnimation = false;};
        this.objectGroup.animate({
            left: -this.cameraX,
            top: -this.cameraY
        }, {
            duration: 1000,
            easing: fabric.util.ease.easeInOutCubic,
            onChange: ()=> {this.canvas.renderAll();},
            onComplete: ()=> {this.underAnimation = false;}
        });
    }

};