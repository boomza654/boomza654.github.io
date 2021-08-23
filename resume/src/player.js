import {fabric} from "fabric";

/**
 * Class representing player on screen: 
 * Storing Player Info as well as reference to shape on screen
 * Argument:
 * - canvas: fabric canvas
 */
export class Player {
    constructor(args) {
        this.canvas = args.canvas;
        // add shape to canvas
        this.x = this.canvas.getWidth()/2;
        this.y = this.canvas.getHeight()/2;
        this.shape = new fabric.Circle({
            radius: 20,
            fill: 'green',
            left: this.x,
            top: this.y,
            originX: 'center',
            originY: 'center',
        });
        this.canvas.add(this.shape);
    }

    /**
     * Argument:
     * - dx: delta x
     * - dy: delta y
     */
    move = (args) => {
        this.x += args.dx;
        this.y += args.dy;
        this.shape.set({
            left: this.x,
            top: this.y
        });
        console.log(this.x + "\n"+ this.y);
    }

    
}
