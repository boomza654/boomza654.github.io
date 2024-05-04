

// import  lamejs from  "lamejs"; 
import FFMpegWorker from "ffmpeg.js/ffmpeg-worker-webm?worker"
// import { HfInference } from "@huggingface/inference";
import { client } from "@gradio/client";




// export async  function audioFromFileRecordingChunk(file : File, start:number, stop:number, audioContext : AudioContext):  Promise<AudioBuffer> {
//     const file_url = URL.createObjectURL(file) + `#t=${start},${stop}`;
//     const audio_player = new Audio();
//     audio_player.autoplay = false;
//     const audio_player_node = audioContext.createMediaElementSource(audio_player);
//     const audio_stream = audioContext.createMediaStreamDestination();
//     audio_player_node.connect(audio_stream);

//     let chunks : Blob[] = [];
//     const recorder = new MediaRecorder(audio_stream.stream);
//     await  new  Promise(async (resolve_recorder)  =>  {
//         recorder.ondataavailable = (ev) => {chunks.push(ev.data); resolve_recorder(undefined);}
//         audio_player.onpause = () => {
//             recorder.stop();
//             console.log("Finish record chunk"); // This is to debug  whether is there any chunk not returned
//         };
//         audio_player.src = file_url;
//         recorder.start();
//         audio_player.play();

//     }); // play and wait till audio_player ends
    
//     let blob  = new Blob(chunks);
//     const buffer  = await blob.arrayBuffer();
//     const audio_buffer = await audioContext.decodeAudioData(buffer);
//     return audio_buffer;
// }

// /**
//  * 
//  * @param buffers  NOn-empty list of buffers  with SAME number of channels and SAME Sampling rate
//  * @returns Concatenated Audio buffers
//  */
// function AudioBuffer_concat(buffers : AudioBuffer[]) :  AudioBuffer {
//     let audioContext = new AudioContext();
//     console.log(buffers);
//     let numChannels = buffers[0].numberOfChannels
//     let sampleRate = buffers[0].sampleRate;
//     let lengths = buffers.map((buffer) => buffer.length);
//     let totalLength = lengths.reduce((a,b) => a+b,  0);
//     var outBuffer = audioContext.createBuffer(numChannels, totalLength, sampleRate);// Create new buffer
//     for(let idx = 0; idx < numChannels; idx ++) {
//         let dataIndex = 0;

//         for(let c = 0; c < buffers.length; c++) {
//             outBuffer.getChannelData(idx).set(buffers[c].getChannelData(idx), dataIndex);
//             dataIndex += lengths[c];// Next position where we should store the next buffer values
//         }
//     }
//     return   outBuffer;

// }

// /**
//  * @param file 
//  * @returns Duration of the audio file or undefined if not an audio  file
//  */
// export async function audioDuration(file: File) : Promise<number | undefined> {
//     const audio = new Audio();
//     try {
//         await new Promise((resolve) => {
//             audio.onloadeddata = resolve;
//             audio.src = URL.createObjectURL(file);
//         })
//         return audio.duration;
//     } catch(err) {
//         return undefined;
//     }

// }

// /**
//  * Use WebRecording API Hacks torecord audio from files
//  * @param file to get the stuff
//  * @returns AudioBuffer of the file if file is audio / video and is  at least 1 seconds long  else undefined
//  * @note This use a highly concurrent recording hacks, the sound quality is chunky still ,
//  *       so avoid this if file not big
//  */
// export async function audioFromFileByRecording(file : File):  Promise<AudioBuffer |  undefined> {
//     const duration = await audioDuration(file);
//     if (duration === undefined || duration < 1) {
//         return undefined;
//     }
//     const MAX_CONCURRENCY =  64; // THere can be  more actually, but Ithink this is enough
//     const durationPerChunk = Math.max(duration / MAX_CONCURRENCY, 10); // Making sure sound chunks are at least 10 seconds
//     let promises: Promise<AudioBuffer>[] = [];
//     let audioContext = new AudioContext();  //  so as not  to spawn too many audio Context


//     for(let startTime = 0; startTime < duration; startTime += durationPerChunk) {
//         let promise = audioFromFileRecordingChunk(file,  startTime,  startTime + durationPerChunk,  audioContext);  // overlap 1 seconds so as to make sure things are somewhut  not lost  (at the expense of )
//         promises.push(promise);
//     }
//     console.log(durationPerChunk, promises.length);

//     let results = await Promise.all(promises);
//     let result  = AudioBuffer_concat(results);
//     // let ctx = new AudioContext();
//     // let node = ctx.createBufferSource();
//     // node.buffer = result;
//     // node.connect(ctx.destination);
//     // node.start();

//     return result;
// }


export type AudioFromFileSmallSuceed = {
    status : 'suceed',
    buffer:  AudioBuffer
};

export type AudioFromFileSmallUnsupported= {
    status : 'unsupported',
};

export type AudioFromFileSmallTooBig= {
    status : 'toobig',
};

/**
 * Result type of the AudioFromFile
 */
export type AudioFromFileSmallResult = AudioFromFileSmallSuceed | AudioFromFileSmallUnsupported | AudioFromFileSmallTooBig;


/**
 * @param file can  be any file 
 * @returns Result from extracting the  audio
 * @see  AudioFromFileSmallResult
 */
export async function audioFromFileSmall(file : File) : Promise<AudioFromFileSmallResult> {
    // File ca
    const audioContext =  new AudioContext(); 
    let arrayBuffer : ArrayBuffer;
    try{
        arrayBuffer  = await file.arrayBuffer();
    } catch(err) {
        return {status : 'toobig'};
    }
    try  {
        let audio_buffer = await audioContext.decodeAudioData(arrayBuffer);
        return {
            status:'suceed',
            buffer: audio_buffer
        };
    } catch(err) {
        return  {status : 'unsupported'};
    }
}


/**
 * split the audioBuffer  into  chunks eachchunk is given by  maxDuration
 * Wesplit based on silence detection algorithm
 * @param audioBuffer 
 * @param maxChunkDuration  in seconds
 * @returns array of chunks of  audio buffer
 */
export async function audioSplitting(audioBuffer : AudioBuffer, maxChunkDuration :number) : Promise<AudioBuffer[]> {
    
    // convert to 16k samplerate first
    let ctx = new OfflineAudioContext({
         length : audioBuffer.duration  * 16000,
         sampleRate: 16000, // targetsamplerate of oursounds
         numberOfChannels :  audioBuffer.numberOfChannels
    });

    let sourceNode =  ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(ctx.destination);
    sourceNode.start();
    let newAudioBuffer = await ctx.startRendering();

    // now splitting chunk with maxDuration
    // let numChunks = Math.ceil(audioBuffer.duration / maxChunkDuration);
    let outChunks : AudioBuffer[] = [];
    let startIdx = 0;
    while(startIdx < newAudioBuffer.length) {
        let length = Math.min(maxChunkDuration* 16000, newAudioBuffer.length -  startIdx);
        let chunk = new AudioBuffer({
            length : length,
            sampleRate: 16000, // targetsamplerate of oursounds
            numberOfChannels :  audioBuffer.numberOfChannels
        });
        for(let channelIdx = 0; channelIdx < newAudioBuffer.numberOfChannels; channelIdx ++) {
            newAudioBuffer.copyFromChannel(chunk.getChannelData(channelIdx), channelIdx, startIdx);
        }
        startIdx += chunk.length;
        outChunks.push(chunk);
    }
    return  outChunks;
}



/**
 * Note that Wav is simply a [A bunchof header,  interleaved  audio Bufferdata]
 * http://soundfile.sapp.org/doc/WaveFormat/
 * https://stackoverflow.com/questions/61264581/how-to-convert-audio-buffer-to-mp3-in-javascript
 * 
 * @param audioBuffer 
 * @return a Wav ArrayBuffer
 */
export function audioBufferToWav(audioBuffer : AudioBuffer) : ArrayBuffer {
    let numOfChan = audioBuffer.numberOfChannels;
    let btwLength = audioBuffer.length * numOfChan * 2 + 44;

    let btwArrBuff = new ArrayBuffer(btwLength);
    let btwView = new DataView(btwArrBuff);
    // let btwPos = 0;

    let btwChnls = [],
        btwIndex,
        btwSample,
        btwOffset = 0,
        btwPos = 0;
    
    
    function setUint16(data  : number) {
        btwView.setUint16(btwPos, data, true);
        btwPos += 2;
    }

    function setUint32(data : number) {
        btwView.setUint32(btwPos, data, true);
        btwPos += 4;
    }

    // Header for Wav
    setUint32(0x46464952);      // "RIFF"
    setUint32(btwLength - 8);   // file length - 8
    setUint32(0x45564157);      // "WAVE"
    //  FMT subchunk
    setUint32(0x20746d66);      // "fmt " chunk
    setUint32(16);              // length = 16
    setUint16(1);               // PCM (uncompressed)   Value other than 1 indicates  some form of compression
    setUint16(numOfChan);       //number of channel
    setUint32(audioBuffer.sampleRate);   // Sample  rate
    setUint32(audioBuffer.sampleRate * 2 * numOfChan); // Byte rate = SampleRate * NumChannels * BitsPerSample/8
    setUint16(numOfChan * 2);   // block-align  == NumChannels * BitsPerSample/8
    setUint16(16);              // Bits per sample : 16-bit 

    //  Data subchunk
    setUint32(0x61746164); // "data" - chunk
    setUint32(btwLength - btwPos - 4); // chunk length   === NumSamples * NumChannels * BitsPerSample/8

    for (btwIndex = 0; btwIndex < audioBuffer.numberOfChannels; btwIndex++)
        btwChnls.push(audioBuffer.getChannelData(btwIndex));

    while (btwPos < btwLength) {
        for (btwIndex = 0; btwIndex < numOfChan; btwIndex++) {
            // interleave btwChnls
            btwSample = Math.max(-1, Math.min(1, btwChnls[btwIndex][btwOffset])); // clamp
            btwSample = (0.5 + btwSample < 0 ? btwSample * 32768 : btwSample * 32767) | 0; // scale to 16-bit signed int
            btwView.setInt16(btwPos, btwSample, true); // write 16-bit sample
            btwPos += 2;
        }
        btwOffset++; // next source sample
    }
    return btwArrBuff;

}




/**
 * Given an audio buffer convert towebm
 * @param file the initial  audio / video file
 * @returns webm ARrayBuffer
 */
export async function audioBufferToWebM(audioBuffer:  AudioBuffer) : Promise<ArrayBuffer> {
    let result = await audioBuffersToWebM([audioBuffer]);
    return result[0];
}



/**
 * Given arrays of audio buffer, convert them to webM
 * 
 * @param audioBuffers the list of  audio / video file
 * @returns array  of webM arraybuffer
 */
export async function audioBuffersToWebM(audioBuffers:  AudioBuffer[]) : Promise<ArrayBuffer[]> {

    // let fname = file.name;
    // let fcontent = await file.arrayBuffer();
    
    let ffmpegWorker = new FFMpegWorker() ;
    await new Promise((resolve) =>  {
        ffmpegWorker.onmessage = (e) => {
            if(e.data.type === "ready") resolve(undefined);
        }
    });

    let outArrayBuffers : ArrayBuffer[] = [];
    for(let audioBuffer of audioBuffers) {
        let fcontent = audioBufferToWav(audioBuffer);
        let result: any = await new Promise((resolve) =>  {
            ffmpegWorker.onmessage = (e) => {
                if(e.data.type === "stdout" || e.data.type  === "stderr") console.log(e.data.data);
                if(e.data.type === "done") resolve(e.data);
            }
            ffmpegWorker.postMessage({
                type: "run", 
                MEMFS: [{name: "test.wav" , data: fcontent}],
                arguments: ["-i", "test.wav" , "-vn", "-ac", "1" ,"-ar" , "16000", "out.webm"]
            });
        })

        // console.log(result);
        let out : Uint8Array = result.data.MEMFS[0].data;
        let outArrayBuffer = out.buffer.slice(out.byteOffset, out.byteLength + out.byteOffset);
        outArrayBuffers.push(outArrayBuffer);
    }
    ffmpegWorker.terminate();
    return outArrayBuffers;
}


/**
 * 
 * @param audioBuffer 
 * @returns resampled Audio Buffer
 */
export async function AudioBuffer_resample(audioBuffer: AudioBuffer, samplingRate : number) : Promise<AudioBuffer> {
    let ctx = new OfflineAudioContext({
        length : audioBuffer.duration  * samplingRate,
        sampleRate: samplingRate, // targetsamplerate of oursounds
        numberOfChannels :  audioBuffer.numberOfChannels
   });

   let sourceNode =  ctx.createBufferSource();
   sourceNode.buffer = audioBuffer;
   sourceNode.connect(ctx.destination);
   sourceNode.start();
   let newAudioBuffer = await ctx.startRendering();
   return newAudioBuffer
}



/**
 * Use Gradio openaito transcribe each blob
 * @param blobs  webM sound blob array to transcribe
 * @param reportProgress The prgress Callback to update
 * @returns strings transcription
 */
export async function gradioTranscribe(blobs: Blob[],  reportProgress? : (eta: number) => any) : Promise<string[]> {

    const app = await client("https://openai-whisper.hf.space/",{status_callback: console.log});
    let base64Read  = async (blob: Blob) => {
        let reader = new FileReader();
        let base64String :  string = await new Promise((resolve) => {
          reader.onloadend = () => {
              resolve(reader.result as string);
          }
          reader.readAsDataURL(blob); 
        });
        return base64String;
    }
  
  
    let etas = blobs.map(() => -1);
    let update_eta = (idx: number, eta: number ) =>  {
      etas[idx] = eta;
      if(reportProgress) reportProgress(Math.max(...etas));
    }

  
    let promises = blobs.map(async (blob, idx) => {
        let base64String = await base64Read(blob);
        let job = await app.submit("/predict", [
            {data: base64String, name : "out.webm"} ,
            "transcribe", // string  in 'Task' Radio component
        ])
        let  result: any = await new Promise((resolve) => {
            job.on("status", (ev) => {
                if (typeof(ev.eta) === "number") update_eta(idx, ev.eta);
            });
            job.on("data", resolve);
        });
        return result.data as string;
    });
    let results = await Promise.all(promises);
    // console.log(results);
    return results;
  }
  