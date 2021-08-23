

/**
 * Manage Keyboards and showing which key is currently down and stuff
 * - check which key is pressed
 * - Get rid of multiple calls to keyDown
 */
export class KeyManager {

    /**
     * Create KeyManager Instance
     */
    constructor() {
        this.pressed = {}; // store map of {downed_key : true}
        this.keyDownListeners = []; // listenening for first key down
        this.keyUpListeners = []; // listenening for keyUp (no need to filter I think)
    }

    /**
     * Add a listener activated upon keydown
     * Listener will be passed exactly the event that is passed in theough keyDown method
     * @param {callable} keyDownListener 
     */
    addKeyDownListener = ( keyDownListener ) => {
        this.keyDownListeners.push(keyDownListener);
    }

    /**
     * Remove a registered keydownlistener
     * @param {callable} keyDownListener 
     */
    removeKeyDownListener = ( keyDownListener ) => {
        for( var i = 0; i < this.keyDownListeners.length; i++){            
            if ( this.keyDownListeners[i] === keyDownListener) { 
                this.keyDownListeners.splice(i, 1); 
                i--; 
            }
        }
    }

    /**
     * Add a listener activated upon keyup
     * Listener will be passed exactly the event that is passed in theough keyUp method
     * @param {callable} keyUpListener 
     */
    addKeyUpListener = ( keyUpListener ) => {
        this.keyUpListeners.push(keyUpListener);
    }

    /**
     * remove a registered listener activated upon keyup
     * @param {callable} keyUpListener 
     */
    removeKeyUpListener = ( keyUpListener ) => {
        for( var i = 0; i < this.keyUpListeners.length; i++){            
            if ( this.keyUpListeners[i] === keyUpListener) { 
                this.keyUpListeners.splice(i, 1); 
                i--; 
            }
        }
    }

    /**
     * event handler for keydown event
     * @param {KeyDownEvent} e 
     */
    keyDown = (e) => {
        if(this.pressed[e.code] === undefined) {
            this.keyDownListeners.forEach((listener) => listener(e));
        }
        this.pressed[e.code] = true;
    }

    /**
     * event handler for keyup event
     * @param {KeyUpEvent} e 
     */
    keyUp = (e) => {
        delete this.pressed[e.code];
        this.keyUpListeners.forEach((listener) => listener(e));
    }

    /**
     * Check whether the keycode is currently held down
     * @param {string} keycode 
     * @returns boolean
     */
    isPressed = (keycode) => {
        return !!this.pressed[keycode];
    }
};