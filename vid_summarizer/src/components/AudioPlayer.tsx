

// import React from 'react'
import "./AudioPlayer.scss"
// import { audioBufferToWav } from '../sound/SoundProcessing';
type AudioPlayerConfig = {
    src?: string | undefined
}

export default function AudioPlayer( config : AudioPlayerConfig ) {
    return (
        <div className="player-container">
            {/* <div className={config.isLoading? "player-loading-bar-container": "player-loading-bar-container none"}>
            </div> */}
            <audio controls src={config.src} className="player"></audio>
        </div>
    );
}
