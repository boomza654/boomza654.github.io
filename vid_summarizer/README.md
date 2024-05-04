# Vid summarizer

Goal: 
- Making  a video transcript summarizer
- help me learn  REACT



# Project log:
## 21-3-2024: First log I am putting here
- Context: I kinda am frustrated with all the meeting notes needed to be taken given  that meetings are usually kinda long and weirdly convoluted
- Doing some business validation:  = Asking around peeps
- Get a lot of people office to say "YES PLZZZ" 


## 30-3-2024: First design challenge
- We are making a front-end only video conversion app ---> So it can be hosted on github wth no charge
- The main flow of the algorthm simply is
    - Get the Video /Audio ***
    - FFmpeg or some coversion to make sure input file turns into audio
    - Process audio / chunking so that we can process transcription per chunk
    - Transcribe Audio using OpenaI API or some other place that host Whispers (like whipser space)
    - Then LLM summarization (using Google gemini for free API usage for now)

- The main problem seems to be "How to get Video / Audio in the first place?"
    - Most meetings in my company (i.e. my user base) happens with Microsoft Team  (occasionally with google meet)
    - The main problem is that Google meet does allow you to download video, but microsoft team?  Not so much
    - If we are doing desktop application: It might still be hard to programmatically record stuff
    - Windows solution: Xbox Game bar !!!
    - Mac solution????: Also has screen recordings!!!
    - IPhone and android also have auto screen record  : We can use that
    - We can  even use an entire screen recorder (like from web)
    -  so this is kinda  fixed

- The Get Audio/Video can be done with Screen recordings entirely 
    - either by 1:  Havvinig user screen records  them selves/ Loadfrom  microsoft team + send in files
    - 2: allow web  Screen record
    - Maybe we gotta do both but  MVP = 1


- Conversion of video to audio
    - This is actually easy if we have desktop app:  Simply ship with ffmpeg and ffmpeg the thing (However, we don't wanna deal with Recreating UI and stuff)
    - The main problem with this is that 
    - DecodeAudio or ffmpeg.js to convert video to audio usually require To case files intoArrayBuffer
    -  But THEN ArrayBuffer has a size limit !!!!! ---> So mp4 video of greater than  2GB usually kinda get rekt***
    - Considering using a hack: Which is touse a video  tag to load the video in, and  then extract audio from the video tag


## 06-04-2024: continueing with the input method of "HOW"

- We are back reimplementing the input method again
    - the problem is EVEN with the audio tagto load video in --> The only method possible for extracting audio buffer is to Playback and record it --> Slow


I think we will settle for 3 input methodwhich is
1. Natve file  < 2GB : If not video / audio then reject
    - Cons: Cnat  handle big  video  file
2. Screen recording with system audio included: 
    - Can likewhilestreaming the media, we can chunk the video and convert into audio buffer
    - Cons: Only available on Chrom + edge --> No support for fire fox or Safari
    - Cons: Have to deal with syncing  user  input sound and session sound
3. Last method: Big fiilie video conversion
    - Use audio tag to play back into audio buffer
    - Cons: Slow  and Uninntuitive

We would just gotta ask user to convert video  to audio first

### Windows:  Give  out ffmpeg batch script so they can convert to audio
1. Give out the bat file of the following template

```bat
@echo off
setlocal
set ps_cmd=powershell "Add-Type -AssemblyName System.windows.forms|Out-Null;$f=New-Object System.Windows.Forms.OpenFileDialog;$f.showHelp=$true;$f.ShowDialog()|Out-Null;$f.FileName"
for /f "delims=" %%I in ( '%ps_cmd%' ) do  set "filename=%%I"
curl -L -o ffmpeg.zip https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
tar -xf ffmpeg.zip
.\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe -i "%filename%" "%filename%.mp3"
del /Q /F ffmpeg.zip
rmdir /Q /S ffmpeg-master-latest-win64-gpl
```

2. Ask user to move this to in the same folder as the uploaded  file
3. run

### MacOS: Simply ask the  user to save video export as Audio only

### Linux : Peeps probably know how to use FFMpeg if use linux


### But actuallyI havent gave up on front-end onlyvideo conversion

Last resort  for big vids conversion  Using MediaRecorder  API
    - First play the sound into Audio track using  range playback
    - Stream to mmedia stream destnation
    - Then  use MediaRecorderAPI to record the thingy  into Blob
    - We get an mp3 blob of  each range playback
    -  Cons:  This is slow  and needs like Large amount of concurrency (but maybe  this worksss LETS TRY)

**IT finally worked!!!!!!**
- Cons: The  sound does over lap a bit for like 20 ms or  however long  depending  on the performance  of the browser
- Cons2: Its kinda slow... Max concurrency of the the browser is limited  to roughly around like 40ish media recorder / media player  so we can getat most40x  speed up---> 2hr meetings  will cost 3 minutes for conversion
- *Cons3* : It  take tolls on UI thread  a *LOT*.  I.e. if you have any sort of animation it willtake toll on the RAM like A LOT. ----> (So Preferably having ffmpeg script might be better)

- Ultimately,
    - If  we dont have  desktop do the task, then we just need to be able to deal with laggy UI


## 4-8-2024: Memory optimization
Try out finnished  the Audio reading iin part --> turns out Its big to read any 1hr sound file to perform any sort of sound processing  ----> 1hr of sound in PCM takes like 1.6GB
*Especially* now that  we need to split sounds into parts --> This becomes like memory intensive  -->  We cant do this  for  longer  than  1 hr sound for sure

Now we came back to using ffmpeg to cut sound fiiles directly.
- This means we can afford a bit of a  slow down + we still do not consume as much memory since ffmpeg handle  the conversion / dissection for us
- Its justsuper slow
- Maybe we just acceptit

-  FFMPEG CANTSPLIT THE SOUND FILEEITHER CUZ OF THE VERSION 


I think we will end up pretty much doing everything on the script side after this not gonna lie.
w8 but even with script  side : This still suks
so wegotta find way to dosth somehow


## 09-04-2024:  We are back with manual decoding and spllitting on raw  space ---> Cuz python script also gotta ddo this??



## 10-04-2024: Maybe a cancedl button?? naaah laterr

- we finish  splitting: Lets transcribe per call
    - You can use Hugginface serverleass or openai/whisper client

- The main problem is that "HOLYYY I CANT GETTHE Gradio client to WORKON JAVASCRIPT"
    - At first Ithought it was the veersioningproblemor the heartbeat problems
    - Turnsout *Don't trust the API specgiven in the gradio client api page of each huggingface space*  (And yes for soe weirduse cases like this , Google won't help you much)
    - What you might want todo is to look at the network inspector of  the chorme client
    - Try joining some queue /doing some inferenceand see how the  gradio client interacts with the backend
    - I finally get it to work after finally knowing that gradio client does  not handleblobs well ->yousimply have to base64 encodethe binary and interact as a raw base64 string

## 16-04-2024 :  Figuring out how to do summarization but not leaking tokens
- In my locally developd version: We simply call LLMs to  perform summarization for us
- And  Gemini really is a  free options
- *However,* If we simply ask frontend to call Gemini ->  Frontend needs to know API KEy -> API key leaks  tothe user
- So Now we actually need to have some backend,  (Which I have to have it abit fully managed since I will not be activeely maintaining this thingy that much)

- On a Journey to finding the backend,
    - The plan  is to useCloud function, but I have 0 experience dealing with Cloud console myself, so...
    - Learning about gCP:

### Google cloud product overview:
- Imchoosing GCP  cuz (1. I learnedaboutit abit from my colleague  2. Its known to bemost beginner friendly)
- Ithink Ilearnedalot from youtube series: So imma just putstuff down here
- ML stuff:
    - Fully manged api:  GTranslate, G vision ,...
    - Managed training  : AutoML
    - VertexAI : be a platform for ML / Bunch of  other sutf?!?!?!?!?!?  (Simply a gateway to Gemini at this point)
        - Model garden : choose pretrained model
        - Gemini:
        - ML platform:
- Compute stuff:
    
    - Highly managed: Cloud functions: :   Backend  Functions with no infra +auto scale
    - Highly managed: App engine:  Deploying backend to the cloud    --->Have a bit more of a state/ context
        - Pay per instance hour / notby usage)
        - suited to applications, which have numerous pieces of functionality behaving in various inter-related (or even unrelated) ways
    - cloud  run:  Backend DOCKER  with no infra+auto scale ( the sadge thing is u gonna need Http container)
    - kubernetes engine: Basically a Kubernetes ( contianer clusters???)   so now  ucan actually managed continaers
        - Pay per  VM used
    - compute engine: Basically now managed  the VM
- Database  stuff:
    - cloud storage: Cloud File system
    - CloudSQL: Managed RDBMS Replicas andstuff  as well
        - Spanner:  Provides strong consistency globally,
    - CloudFireStore: Managed NoSqk  DBMS
    - BigQuery: DataWarehouse  --> Stuff for analysis
-  NiceGCPwrapper : Firebase
-Free PROGRAM *YES PLZ*
    - Need debit card, but dont worry you wont get charged unless u upgrade
    - Billing account != neeedto pay???
    - Naaah I still needto connect to debit card and this will incur morethan free teier limit maybe

- CodeLab  Free GCPtutorial hands on labs??

### TODOs:
- Enable  MFA on my gmail account
    - Alsoso that billing statement (if any) comes directly to my email
- Enable billing
- Createa cloud function (Seaparate from the gemini API projects,cuz Gemini  requires  having no billing)
- Nowwhut to do if the randos know  ourb Cloud function  URL and SPAMM?!?!!?!?

### Common API vulnerability to concern
- Unauthenticated Access: The user is a bad guy???
    - API key  is somwhut ok  but not really
    - O Auth????
    - Technicallywewant the public guy tobe abletouse this as well  sowe cantjust limit users!!
    -  We just add some  random Auth token in front end (sothat a random dude finding this API inthe internet)
- Unauthorized Access : The user doesnt have  right to determine this
    - Solved by  ONLY HAVING 1 ACCESS Level LMAOO (Weare making this  a PoC So this is  fyne)
- DDoS:   A Lot of  request***
    - Given that we open this to the public : We needto atleastdealwith CORS or like DDos
- Content Injection: Malformed content
    - It fyne,  Gemini aint hackable  so whutever

2 solutions:
1. No authentication// Everyone can spam this API   +Wemake sure to make a global Ratelimiter  on the API gateway instead = DDos will suceed but  we wont have to pay money
2. Authenticate using Google OAuth?? (andalso ratelimiter still)
- I think 2 is better


This actually finally drive me through  the whole  OAuth deep dive
### OAuth and Google  sign=in
- Authorization vs  Authentication
    - Authentication = As a backend, Verify the frontend / requester 
        - Usually requester will provide some *crednetials* (tokens or Passwords) and then backend gotta verify it 
    - Authorization = Happens after authenticate /  Basically  "determine you can access what"
        - More on like Access management stuff
- IAM is an overarching subfield covering this
- SSO is just atechnique name for having a single Sign in to provide the OAtuh token?
- Essentially, OAuth is an *Authorization* method (i.e. allowing web browser to) but Google OAtu hinvolve authentication
    - The  intended use case was somethinglike "Webapp wanna use Google's resource on behalf of the user"
    - Webapp register iwthgoogle first.
    - Google wont allow resourceaccess unless thewebapp hasa "TOKEN"
    - Whenuser comes, user gets *Authenticated* with Google server (Backend dont know)
    - ourwebapp gets *Authorized* to get the token with google  server ("Give permission to accessour webapp")
    -  Google Redirect backto our webpage with the tokens andstuff
    - Now our webappget the token then send tokens  to retrieve the right resource
- Now techncally we could have used OAuth (Google) for authenticating with our  Backendas well (This is what was kinda taught to us in the Weblab course)
    - Intended goal: "Our backend needs to know who is requesting to us"
    -  Webapp gets the OAuth  token from Google
    - Webapp SENDS the Oauth token with the request???? 
        - USUALLY this OAuth token DOES NOT relate to users whorequests (It just that Google  does stores )
        -  OAuth 2.0 doesn't specify exact methods to validate tokens for authentication purposes, 
        
    - Our backend gets the  Token and ask  the Google for like whether this  token is valid
        - depend on continuous availability of the authorization server. (i.e.Google)
    - And our backend  communicates with Google for the retrieving the users credential
    - i.e. It kinda is an authorization in the form of a "Authorize Webapp to access my Email Address / my crednetials"  (cuz youuse the token to make the )

- OpenID connect ontop of OAuth (OIDC) handles this differently
    - When OAuth, the authorization server must return a id token Which is *JWT* (i.e. JSON web token = A signed json that ssays "Hey this user is XYZ" signed by Google)
    - Webapps sends IDtoken along with the r4equest
    - Ourbackend ask Google to verify the sgnature
    
- Now as for Rate limitinng:
    - We probably needtouse  google API Gatway (this is product for API gate way for Google Serverless products)
    - 

## 04-05-2024: Back to this project after a while
What seemsto happen after a while is that
- A bunch of people start asking for my service even tho i havent finished lol
- So I come back to this

Talked with my friends: They suggest putting API KEy in the request param
- So we can go for that for now
- But actually,  "WHAT IS DECODABLE WILLBE DECODED"

I actually just stumbled  upon https://gist.github.com/bmaupin/d2d243218863320b01b0c1e1ca0cf5f3 
-  Adaptable.io seems like the free web service  that suit my need + NOOOO CREDIT CARD REQUIRED
- There's also render.com As wELL!!!
- I was thiknig of GCP cloud function but i think it requires credit card

Im comparing them rn (seems like render.com is used for weblab these days)
- Seems Like I will get start with simple express.js server with render.com
- These  services deploy usinga separate github repo, so I am  creating another one in 
https://github.com/boomza654/boomza654.vid.server
- This is finallydeplloyed  at https://boomza654-vid-server.onrender.com/

IT finally worked

LETS Deploy / Push  to github io



