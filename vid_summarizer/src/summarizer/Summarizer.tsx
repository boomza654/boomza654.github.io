

export type SummarizerResponse = {
    status: "suceed" | "error";
    text?: string | undefined;
    error?: string | undefined;
}

// Raw Request spam

// type ModelType = "gemini-1.5-pro-latest" | "gemini-1.0-pro"
const SUMMARIZER_URL = "https://boomza654-vid-server.onrender.com/summarize"
// const SUMMARIZER_URL = "http://localhost:3001/summarize"

function isSummarizerResponse(x : any) : x is SummarizerResponse {
    return (
        typeof(x) ===  "object" && 
        (x.status === "suceed" || x.status === "error") && 
        (typeof(x.text) === "string" ||typeof(x.text) === "undefined") &&
        (typeof(x.error) === "string" ||typeof(x.error) === "undefined")
    );
}

/**
 * Request the backend for summary
 * @param transcript 
 * @returns Summary given the transcript
 */
export async function getSummary(transcript: string) : Promise<SummarizerResponse> {
    try {
        let resp = await fetch(SUMMARIZER_URL, {
            method : "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            mode: "cors",
            body: JSON.stringify({
                transcript: transcript
            }) 
        });
        let content = await resp.json();
        if (!isSummarizerResponse(content)) {
            return {
                status :  "error",
                text : "Not the right format",
                error: `${content}`
            };
        }
        return content;
    } catch (err) {
        return  {
            status :  "error",
            text : "Summarizer Request Failed",
            error: `${err}`
        };
    }
}


// let last_call = Date.now();
// /**
//  * 
//  * @param text send stuff withrpm
//  */
// export async function geminiSendRPM(text:string) : Promise<GeminiResponse> {
//     if(Date.now() - last_call < 1000) {
        
//     }
// }