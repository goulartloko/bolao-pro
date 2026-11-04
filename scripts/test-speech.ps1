Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("test.wav")
$synth.Speak("Olá, bem-vindo ao Bolão dos Cria!")
$synth.Dispose()
Write-Host "Audio test.wav gerado com sucesso!"
