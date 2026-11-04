Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Maria Desktop")
$synth.Rate = 1 # Fala com bom ritmo e energia

$text = "Fala galera! Tá com dúvida de como participar do Bolão dos Cria? É muito simples, rápido e 100% gratuito! " +
        "O nosso bolão funciona por rodadas do Brasileirão, com jogos acumulando pontos até o fim da rodada. " +
        "Mas atenção a regra principal: todos os seus palpites precisam ser enviados antes do primeiro jogo começar! Depois que a bola rolar, os palpites fecham. " +
        "Para jogar é muito fácil: " +
        "Primeiro: acesse bolaodoscria.online. " +
        "Segundo: faça seu cadastro grátis em menos de um minuto com seu nome e WhatsApp. " +
        "Terceiro: coloque seus palpites nos jogos. Cravou o placar exato, você ganha 10 pontos! Acertou o time vencedor, ganha 5 pontos! " +
        "E quarto: clique em Confirmar e Travar Meus Palpites. " +
        "A cada apito final, o ranking atualiza ao vivo na sua tela. Os maiores pontuadores da rodada levam o Pix direto na conta: 50 reais pro primeiro lugar e 30 reais pro segundo! " +
        "Não perde tempo! Acesse agora bolaodoscria.online e mande seus palpites antes do primeiro jogo de hoje!"

$audioPath = Join-Path $PSScriptRoot "locucao_bolao.wav"
$synth.SetOutputToWaveFile($audioPath)
$synth.Speak($text)
$synth.Dispose()

Write-Host "Locução gerada com sucesso em: $audioPath"
