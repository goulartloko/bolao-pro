import asyncio
import edge_tts

VOICE = "pt-BR-AntonioNeural"

PARTS = [
    ("part1_intro.mp3", "Fala torcedor! Quer disputar Pix de graça a cada rodada do Brasileirão? No Bolão dos Cria é muito fácil e 100% gratuito. Se liga no passo a passo na prática!"),
    ("part2_cadastro.mp3", "Primeiro, acesse bolaodoscria.online pelo celular e clique em Cadastrar. Preencha seu nome e o seu WhatsApp em menos de um minuto. É totalmente grátis!"),
    ("part3_jogos.mp3", "Agora entre na tela de palpites. Aqui você vê todos os confrontos oficiais da rodada do campeonato, com os escudos dos times e os horários das partidas."),
    ("part4_palpites.mp3", "Basta colocar o seu placar jogo a jogo. Cravou o placar exato? Você ganha 10 pontos! Acertou o vencedor ou empate? Ganha 5 pontos para acumular na rodada!"),
    ("part5_travar.mp3", "Atenção para a regra mais importante: todos os palpites fecham antes do primeiro jogo da rodada começar! Ao terminar, clique em Confirmar e Travar Palpites."),
    ("part6_ranking.mp3", "Pronto! O ranking atualiza sozinho gol a gol. Primeiro lugar leva 50 reais no Pix, e o segundo lugar leva 30 reais! Acesse agora bolaodoscria.online e participe!"),
]

async def generate():
    for filename, text in PARTS:
        communicate = edge_tts.Communicate(text, VOICE, rate="+3%", pitch="+0Hz")
        await communicate.save(f"scripts/{filename}")
        print(f"Generated scripts/{filename}")

if __name__ == "__main__":
    asyncio.run(generate())
