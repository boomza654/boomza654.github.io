@echo off
setlocal
set ps_cmd=powershell "Add-Type -AssemblyName System.windows.forms|Out-Null;$f=New-Object System.Windows.Forms.OpenFileDialog;$f.showHelp=$true;$f.ShowDialog()|Out-Null;$f.FileName"
for /f "delims=" %%I in ( '%ps_cmd%' ) do  set "filename=%%I"
curl -L -o ffmpeg.zip https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
tar -xf ffmpeg.zip
.\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe -i "%filename%" "%filename%.mp3"
del /Q /F ffmpeg.zip
rmdir /Q /S ffmpeg-master-latest-win64-gpl