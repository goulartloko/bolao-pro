Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
foreach ($v in $synth.GetInstalledVoices()) {
    Write-Host "Voz: " $v.VoiceInfo.Name " | Cultura: " $v.VoiceInfo.Culture.Name
}
$synth.Dispose()
