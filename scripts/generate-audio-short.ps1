Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Maria Desktop")
$synth.Rate = 2 # Ritmo mais dinâmico e comercial

$text = "Fala galera! Tá com dúvida de como jogar no Bolão dos Cria? É muito simples, rápido e 100% gratuito! " +
        "O bolão funciona por rodadas do Brasileirão. " +
        "E atenção a regra mais importante: todos os seus palpites precisam ser enviados antes do primeiro jogo da rodada começar! Depois que a bola rolar, o bolão fecha! " +
        "Olha como é fácil participar: " +
        "Passo 1: acesse bolaodoscria.online. " +
        "Passo 2: faça seu cadastro grátis com nome e WhatsApp em menos de um minuto. " +
        "Passo 3: coloque seus palpites nos jogos da rodada! Cravou o placar exato, ganha 10 pontos! Acertou o time vencedor, ganha 5 pontos! " +
        "Passo 4: clique em Confirmar e Travar Meus Palpites. " +
        "Conforme os jogos forem encerrando, o ranking atualiza ao vivo na tela. Os maiores pontuadores levam a premiação via Pix: 50 reais pro primeiro lugar e 30 reais pro segundo! " +
        "Não perde tempo! Acesse agora bolaodoscria.online e garanta seus palpites antes do primeiro jogo!"

$audioPath = Join-Path $PSScriptRoot "locucao_bolao_curto.wav"
$synth.SetOutputToWaveFile($audioPath)
$synth.Speak($text)
$synth.Dispose()

Write-Host "Locução curta gerada com sucesso em: $audioPath"
