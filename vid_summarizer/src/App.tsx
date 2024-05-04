import React from 'react'
import FileInput from './components/FileInput'
import './App.scss'
import { audioBuffersToWebM, audioFromFileSmall, audioSplitting, AudioBuffer_resample, gradioTranscribe } from './sound/SoundProcessing';
import AudioPlayer from './components/AudioPlayer';
import { LoadingBar } from './components/LoadingBar';
import { getSummary } from './summarizer/Summarizer';


// if not processing,  text == """ means no error shown  else it means error
// if processing,  text means the loading text
type ProcessingState = {
  isProcessing: boolean,
  text: string
};
function App() {

  const [processingState, setProcessingState] = React.useState<ProcessingState>({
    isProcessing: false,
    text: ""
  });
  let startProcessing = () => { setProcessingState({ isProcessing: true, text: "Loading..." }); }
  let updateProcessing = (text: string) => { setProcessingState({ isProcessing: true, text: text }); }
  let finishProcessingError = (text: string) => { setProcessingState({ isProcessing: false, text: text }); }
  let finishProcessing = () => { setProcessingState({ isProcessing: false, text: "" }); };

  const [previewAudioSrc, setPreviewAudioSrc] = React.useState<string | undefined>(undefined);
  const [transcript, setTranscript] = React.useState<string | undefined>(undefined);
  const [summary, setSummary] = React.useState<string | undefined>(undefined);


  let transcriptTextArea_onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
  }


  let summarize = async (the_transcript: string) => {
    let response = await getSummary(the_transcript);
    if (response.status !== "suceed") {
      if (response.text !== undefined) {
        finishProcessingError(response.text);
      }
      setSummary("Error on summarization.\n" + (response.text === undefined ? "" : response.text));
    } else {
      setSummary(response.text);
    }
  }

  let summarize_click = async () => {
    startProcessing();
    setSummary(undefined);
    updateProcessing("Summarizing...");
    if (transcript === undefined) {
      finishProcessingError("Error empty transcript");
      return;
    }
    await summarize(transcript);
    finishProcessing();
  };

  let fileInput_onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    startProcessing();

    let uploaded_files = e.target.files;
    setPreviewAudioSrc(undefined);
    setTranscript(undefined);
    setSummary(undefined);

    if (uploaded_files === undefined || uploaded_files === null) {
      finishProcessingError("Cannot find uploaded file");
      return;
    }

    let uploaded_file = uploaded_files[0];
    if (uploaded_file === undefined) {
      finishProcessingError("Cannot find uploaded file");
      return;
    }

    updateProcessing("Loading File...");

    // Start Processing audio 
    let audioResult = await audioFromFileSmall(uploaded_file);
    if (audioResult.status !== "suceed") {
      if (audioResult.status === 'unsupported') {
        finishProcessingError("Unsupported file format");
      } else if (audioResult.status === 'toobig') {
        finishProcessingError("File too big to process in browser. Consider converting video to MP3 or compression first")
      }
      console.log(audioResult);
      return;
    }
    setPreviewAudioSrc(URL.createObjectURL(uploaded_file));


    updateProcessing("Preprocessing");

    let audioBuffer = audioResult.buffer;
    let resampledAudioBuffer = await AudioBuffer_resample(audioBuffer, 16000);
    let audioBufferChunks = await audioSplitting(resampledAudioBuffer, 60 * 30);//  30minute per chunk
    let webmChunks = await audioBuffersToWebM(audioBufferChunks);
    let webmBlobs = webmChunks.map((chunk) => (new Blob([chunk], { "type": "audio/webm" })));

    setProcessingState({ isProcessing: true, text: "Transcribing..." });
    updateProcessing("Transcribing ...");

    let gradioProgress = (eta: number) => {
      updateProcessing(`Transcribing ETA: ${Math.round(eta)} s...`);
    }
    let outStrings: string[] = await gradioTranscribe(webmBlobs, gradioProgress);
    let transcript = outStrings.join("");

    setTranscript(transcript);

    updateProcessing("Summarizing...");

    await summarize(transcript);

    // console.log(out)
    finishProcessing();

  };


  // console.log(previewAudioSplitSrcs);

  // let previewSplitsJSX =  (previewAudioSplitSrcs.length === 0)? (<></>) : <>
  //   <span> Preview splits </span>
  //   {previewAudioSplitSrcs.map((src,i) => <AudioPlayer key={`split-${i}`} src={src}></AudioPlayer>)}
  // </>;

  return (
    <>
      
      <h1 className='title'>Video Transcript Summarizer</h1>
      <div className="flex-row">
        <div className='flex-u'></div>
        <fieldset className='form-container'>
          <legend> Summarizer </legend>
          
          <span>1. Upload your audio/video file  </span>
          <FileInput isLoading={processingState.isProcessing} onChange={fileInput_onChange} />
            
          
          {
            (previewAudioSrc === undefined) ?
              <></> :
              <>
                {/* <span> Preview Sounds </span> */}
                <AudioPlayer src={previewAudioSrc}></AudioPlayer>
              </>
          }

          {
            (transcript === undefined) ?
              <></> :
              <>
                <br />
                <span>2. Transcripts </span>
                <textarea className="form-textarea" disabled={processingState.isProcessing} onChange={transcriptTextArea_onChange} value={transcript}>
                </textarea>
                <div className="flex-row margin-m" >
                  <div className="flex-u"></div>
                  <button disabled={processingState.isProcessing} onClick={summarize_click}>Re-Summarize</button>
                  <div className="flex-u"></div>
                </div>
              </>
          }

          {
            (summary === undefined) ?
              <></> :
              <>
                <br />
                <span>3. Summary </span>
                <textarea className="form-textarea" disabled={processingState.isProcessing} readOnly value={summary}>
                </textarea>
              </>
          }

          {
            (processingState.text === "" || processingState.isProcessing) ?
              <></> :
              <>
                <br />
                <div className="error-text">{processingState.text}</div>
              </>
          }
          <div className="general-loading-bar-continer" style={{ display: processingState.isProcessing ? "flex" : "none" }}>
            <LoadingBar></LoadingBar>
            <span>{processingState.text}</span>
          </div>



        </fieldset>

        <div className='flex-u'></div>
      </div>
    </>
  );
  
}

export default App
