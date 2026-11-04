import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1080
HEIGHT = 1920
OUTPUT_DIR = os.path.join(os.getcwd(), "scripts", "video_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

FONT_TITLE_PATH = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_TEXT_PATH = r"C:\Windows\Fonts\segoeui.ttf"

def get_font(size, bold=False):
    path = FONT_TITLE_PATH if bold else FONT_TEXT_PATH
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_header_badge(draw, text, bg_color="#E5A93C", text_color="#080C0E", y=180):
    font = get_font(34, bold=True)
    bbox = font.getbbox(text)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    pad_x = 36
    pad_y = 16
    x0 = (WIDTH - (w + pad_x * 2)) // 2
    y0 = y
    x1 = x0 + w + pad_x * 2
    y1 = y0 + h + pad_y * 2
    draw.rounded_rectangle([x0, y0, x1, y1], radius=24, fill=bg_color)
    draw.text((x0 + pad_x, y0 + pad_y - 2), text, font=font, fill=text_color)

def draw_card(draw, x0, y0, x1, y1, border_color="#1E293B", fill_color="#0D171D", radius=36):
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill_color, outline=border_color, width=4)

def create_base_canvas():
    img = Image.new("RGB", (WIDTH, HEIGHT), color="#080C0E")
    draw = ImageDraw.Draw(img)
    # Background gradient effect with lines
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(8 + (15 - 8) * ratio)
        g = int(12 + (25 - 12) * ratio)
        b = int(14 + (32 - 14) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
    
    # Top brand watermark
    f_brand = get_font(42, bold=True)
    brand_text = "BOLAO DOS CRIA"
    bbox = f_brand.getbbox(brand_text)
    bw = bbox[2] - bbox[0]
    draw.text(((WIDTH - bw) // 2, 80), brand_text, font=f_brand, fill="#E5A93C")

    # Bottom website url banner
    f_site = get_font(36, bold=True)
    site_text = "www.bolaodoscria.online"
    s_bbox = f_site.getbbox(site_text)
    sw = s_bbox[2] - s_bbox[0]
    draw.rounded_rectangle([(WIDTH - sw) // 2 - 40, HEIGHT - 140, (WIDTH + sw) // 2 + 40, HEIGHT - 60], radius=20, fill="#13231B", outline="#00E676", width=2)
    draw.text(((WIDTH - sw) // 2, HEIGHT - 116), site_text, font=f_site, fill="#00E676")

    return img, draw

# Slide 1: Introdução
def make_slide_1():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "TUTORIAL PASSO A PASSO", bg_color="#E5A93C", text_color="#080C0E", y=220)

    draw_card(draw, 80, 420, WIDTH - 80, 1600, border_color="#E5A93C", fill_color="#0F1A15")

    f_hero = get_font(68, bold=True)
    draw.text((140, 520), "COMO JOGAR NO", font=f_hero, fill="#FFFFFF")
    draw.text((140, 610), "BOLAO DOS CRIA?", font=f_hero, fill="#E5A93C")

    f_sub = get_font(40, bold=False)
    draw.text((140, 740), "Simples, rapido e 100% gratuito!", font=f_sub, fill="#00E676")

    # Benefit boxes
    box_items = [
        ("100% GRATIS", "Nao paga nada para participar", "#00E676"),
        ("PREMIACAO NO PIX", "1o Lugar: R$ 50 | 2o Lugar: R$ 30", "#E5A93C"),
        ("DISPUTA POR RODADA", "Pontos somados jogo a jogo", "#60A5FA"),
    ]
    by = 880
    for title, desc, col in box_items:
        draw.rounded_rectangle([140, by, WIDTH - 140, by + 180], radius=24, fill="#131F1D", outline=col, width=3)
        draw.text((180, by + 35), title, font=get_font(42, bold=True), fill=col)
        draw.text((180, by + 105), desc, font=get_font(34, bold=False), fill="#E2E8F0")
        by += 220

    img.save(os.path.join(OUTPUT_DIR, "slide_1.png"))

# Slide 2: Como funciona por rodada
def make_slide_2():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "FORMATO DA COMPETICAO", bg_color="#00E676", text_color="#080C0E", y=220)
    draw_card(draw, 80, 380, WIDTH - 80, 1640, border_color="#00E676", fill_color="#0B161A")

    f_title = get_font(64, bold=True)
    draw.text((140, 460), "DISPUTA POR RODADA", font=f_title, fill="#FFFFFF")
    draw.text((140, 545), "DO BRASILEIRAO!", font=f_title, fill="#00E676")

    info_card_y = 690
    draw.rounded_rectangle([140, info_card_y, WIDTH - 140, info_card_y + 360], radius=28, fill="#13231F", outline="#00E676", width=2)
    draw.text((180, info_card_y + 40), "PACOTE COMPLETO DE JOGOS", font=get_font(38, bold=True), fill="#00E676")
    draw.text((180, info_card_y + 115), "Voce envia seus palpites para", font=get_font(34), fill="#E2E8F0")
    draw.text((180, info_card_y + 175), "todos os jogos oficiais da rodada.", font=get_font(34), fill="#E2E8F0")
    draw.text((180, info_card_y + 245), "Os pontos acumulam jogo a jogo!", font=get_font(36, bold=True), fill="#E5A93C")

    # Dynamic explanation
    draw.rounded_rectangle([140, 1120, WIDTH - 140, 1540], radius=28, fill="#121820", outline="#3B82F6", width=2)
    draw.text((180, 1170), "PONTUACAO CONTINUA", font=get_font(38, bold=True), fill="#60A5FA")
    draw.text((180, 1250), "- Cada jogo finalizado atualiza a sua pontuacao", font=get_font(32), fill="#CBD5E1")
    draw.text((180, 1330), "- O ranking reorganiza os participantes ao vivo", font=get_font(32), fill="#CBD5E1")
    draw.text((180, 1410), "- Quem somar mais pontos ate o fim leva o Pix!", font=get_font(34, bold=True), fill="#E5A93C")

    img.save(os.path.join(OUTPUT_DIR, "slide_2.png"))

# Slide 3: Regra de ouro do prazo
def make_slide_3():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "REGRA DE OURO!", bg_color="#EF4444", text_color="#FFFFFF", y=220)
    draw_card(draw, 80, 380, WIDTH - 80, 1640, border_color="#EF4444", fill_color="#180F12")

    f_title = get_font(60, bold=True)
    draw.text((140, 460), "FECHAMENTO ANTES", font=f_title, fill="#FFFFFF")
    draw.text((140, 540), "DO 1o JOGO COMEÇAR!", font=f_title, fill="#EF4444")

    # Giant warning card
    draw.rounded_rectangle([140, 680, WIDTH - 140, 1180], radius=32, fill="#2A1215", outline="#EF4444", width=4)
    draw.text((180, 740), "ATENCAO AO HORARIO:", font=get_font(44, bold=True), fill="#EF4444")
    draw.text((180, 830), "Todos os seus palpites da rodada", font=get_font(36), fill="#F8FAFC")
    draw.text((180, 895), "precisam ser confirmados antes do", font=get_font(36), fill="#F8FAFC")
    draw.text((180, 960), "primeiro jogo da rodada comecar!", font=get_font(38, bold=True), fill="#FDE047")
    draw.text((180, 1050), "Apos a bola rolar, o bolao fecha!", font=get_font(38, bold=True), fill="#EF4444")

    # Anti-fraude seal
    draw.rounded_rectangle([140, 1240, WIDTH - 140, 1540], radius=28, fill="#111B18", outline="#00E676", width=2)
    draw.text((180, 1290), "DISPUTA 100% LIMPA E JUSTA", font=get_font(38, bold=True), fill="#00E676")
    draw.text((180, 1370), "Ninguem aposta durante o jogo.", font=get_font(32), fill="#CBD5E1")
    draw.text((180, 1435), "Transparencia total para todos!", font=get_font(32), fill="#CBD5E1")

    img.save(os.path.join(OUTPUT_DIR, "slide_3.png"))

# Slide 4: Passo 1
def make_slide_4():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "PASSO 1 DE 4", bg_color="#E5A93C", text_color="#080C0E", y=220)
    draw_card(draw, 80, 380, WIDTH - 80, 1640, border_color="#E5A93C", fill_color="#0D171D")

    f_title = get_font(60, bold=True)
    draw.text((140, 460), "ACESSE O SITE OFICIAL", font=f_title, fill="#FFFFFF")
    draw.text((140, 540), "PELO SEU CELULAR", font=f_title, fill="#E5A93C")

    # Url big button
    draw.rounded_rectangle([140, 720, WIDTH - 140, 960], radius=32, fill="#0F2418", outline="#00E676", width=4)
    draw.text((180, 770), "LINK DIRETO:", font=get_font(32, bold=True), fill="#94A3B8")
    draw.text((180, 840), "bolaodoscria.online", font=get_font(52, bold=True), fill="#00E676")

    # Highlights
    draw.rounded_rectangle([140, 1040, WIDTH - 140, 1540], radius=28, fill="#121820", outline="#1E293B", width=2)
    draw.text((180, 1100), "DICAS RAPIDAS:", font=get_font(38, bold=True), fill="#E5A93C")
    draw.text((180, 1190), "- Abre direto no navegador do celular", font=get_font(34), fill="#E2E8F0")
    draw.text((180, 1280), "- Nao precisa baixar aplicativo pesado", font=get_font(34), fill="#E2E8F0")
    draw.text((180, 1370), "- Rapido, seguro e carrega em segundos", font=get_font(34), fill="#E2E8F0")

    img.save(os.path.join(OUTPUT_DIR, "slide_4.png"))

# Slide 5: Passo 2 - Cadastro
def make_slide_5():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "PASSO 2 DE 4", bg_color="#00E676", text_color="#080C0E", y=220)
    draw_card(draw, 80, 380, WIDTH - 80, 1640, border_color="#00E676", fill_color="#0D171D")

    f_title = get_font(60, bold=True)
    draw.text((140, 460), "CADASTRO GRATIS", font=f_title, fill="#FFFFFF")
    draw.text((140, 540), "EM MENOS DE 1 MINUTO", font=f_title, fill="#00E676")

    # Form items
    fields = [
        ("NOME COMPLETO", "Para aparecer no ranking oficial"),
        ("WHATSAPP COM DDD", "Para confirmacao e envio do Pix"),
        ("TIME DO CORACAO", "Escolha seu clube do Brasileirao"),
        ("SENHA DE ACESSO", "Para consultar seus pontos depois"),
    ]
    fy = 680
    for name, desc in fields:
        draw.rounded_rectangle([140, fy, WIDTH - 140, fy + 175], radius=24, fill="#141E1C", outline="#1F3A30", width=2)
        draw.text((180, fy + 35), name, font=get_font(36, bold=True), fill="#00E676")
        draw.text((180, fy + 95), desc, font=get_font(28), fill="#94A3B8")
        fy += 210

    img.save(os.path.join(OUTPUT_DIR, "slide_5.png"))

# Slide 6: Passo 3 - Palpites e Pontuação
def make_slide_6():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "PASSO 3 DE 4", bg_color="#E5A93C", text_color="#080C0E", y=220)
    draw_card(draw, 80, 380, WIDTH - 80, 1640, border_color="#E5A93C", fill_color="#0B1317")

    f_title = get_font(58, bold=True)
    draw.text((140, 460), "COLOQUE OS PLACARES", font=f_title, fill="#FFFFFF")
    draw.text((140, 535), "E ACUMULE PONTOS!", font=f_title, fill="#E5A93C")

    # Scoring rules cards
    draw.rounded_rectangle([140, 660, WIDTH - 140, 920], radius=28, fill="#142B1F", outline="#00E676", width=3)
    draw.text((180, 710), "+10 PONTOS (PLACAR EXATO)", font=get_font(42, bold=True), fill="#00E676")
    draw.text((180, 785), "Cravou o placar certinho (ex: 2x1 e foi 2x1)", font=get_font(32), fill="#E2E8F0")
    draw.text((180, 840), "Voce ganha 10 pontos de uma vez!", font=get_font(32, bold=True), fill="#FDE047")

    draw.rounded_rectangle([140, 960, WIDTH - 140, 1220], radius=28, fill="#282211", outline="#E5A93C", width=3)
    draw.text((180, 1010), "+5 PONTOS (VENCEDOR)", font=get_font(42, bold=True), fill="#E5A93C")
    draw.text((180, 1085), "Acertou quem ganhou ou se deu empate,", font=get_font(32), fill="#E2E8F0")
    draw.text((180, 1140), "mesmo se errou a quantidade de gols!", font=get_font(32), fill="#CBD5E1")

    draw.rounded_rectangle([140, 1260, WIDTH - 140, 1540], radius=28, fill="#0F1B2B", outline="#3B82F6", width=2)
    draw.text((180, 1310), "+2 PONTOS (SALDO / GOLS)", font=get_font(42, bold=True), fill="#60A5FA")
    draw.text((180, 1385), "Acertou a diferenca de gols da partida.", font=get_font(32), fill="#CBD5E1")
    draw.text((180, 1445), "Todos os pontos acumulam no ranking!", font=get_font(34, bold=True), fill="#FFFFFF")

    img.save(os.path.join(OUTPUT_DIR, "slide_6.png"))

# Slide 7: Passo 4 - Confirmar e Travar
def make_slide_7():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "PASSO 4 DE 4", bg_color="#00E676", text_color="#080C0E", y=220)
    draw_card(draw, 80, 380, WIDTH - 80, 1640, border_color="#00E676", fill_color="#0D171D")

    f_title = get_font(58, bold=True)
    draw.text((140, 460), "CONFIRMAR E TRAVAR", font=f_title, fill="#FFFFFF")
    draw.text((140, 535), "SEUS PALPITES!", font=f_title, fill="#00E676")

    # Big button preview
    draw.rounded_rectangle([140, 720, WIDTH - 140, 940], radius=32, fill="#00E676", outline="#FFFFFF", width=3)
    draw.text((190, 800), "CONFIRMAR MEUS PALPITES", font=get_font(44, bold=True), fill="#080C0E")

    draw.rounded_rectangle([140, 1040, WIDTH - 140, 1540], radius=28, fill="#121820", outline="#1E293B", width=2)
    draw.text((180, 1100), "O QUE ACONTECE DEPOIS:", font=get_font(38, bold=True), fill="#E5A93C")
    draw.text((180, 1190), "- Seus palpites ficam salvos com seguranca", font=get_font(34), fill="#E2E8F0")
    draw.text((180, 1280), "- Ninguem pode alterar apos a trava", font=get_font(34), fill="#E2E8F0")
    draw.text((180, 1370), "- Voce ja entra na disputa do Pix!", font=get_font(36, bold=True), fill="#00E676")

    img.save(os.path.join(OUTPUT_DIR, "slide_7.png"))

# Slide 8: Ranking ao vivo e Premiação
def make_slide_8():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "RANKING & PREMIACOES", bg_color="#E5A93C", text_color="#080C0E", y=220)
    draw_card(draw, 80, 380, WIDTH - 80, 1640, border_color="#E5A93C", fill_color="#0F181B")

    f_title = get_font(56, bold=True)
    draw.text((140, 460), "RANKING AO VIVO E", font=f_title, fill="#FFFFFF")
    draw.text((140, 535), "PREMIACAO NO PIX!", font=f_title, fill="#E5A93C")

    # Prize 1
    draw.rounded_rectangle([140, 680, WIDTH - 140, 940], radius=28, fill="#2A1F0D", outline="#E5A93C", width=4)
    draw.text((180, 725), "1o LUGAR NA RODADA", font=get_font(38, bold=True), fill="#E5A93C")
    draw.text((180, 800), "R$ 50,00 VIA PIX", font=get_font(64, bold=True), fill="#FFFFFF")
    draw.text((180, 885), "Direto na sua conta bancaria!", font=get_font(28), fill="#CBD5E1")

    # Prize 2
    draw.rounded_rectangle([140, 980, WIDTH - 140, 1240], radius=28, fill="#1A202C", outline="#94A3B8", width=3)
    draw.text((180, 1025), "2o LUGAR NA RODADA", font=get_font(38, bold=True), fill="#CBD5E1")
    draw.text((180, 1100), "R$ 30,00 VIA PIX", font=get_font(60, bold=True), fill="#FFFFFF")
    draw.text((180, 1185), "Premio garantido para o vice-lider!", font=get_font(28), fill="#94A3B8")

    # Live notice
    draw.rounded_rectangle([140, 1280, WIDTH - 140, 1540], radius=28, fill="#0F2418", outline="#00E676", width=2)
    draw.text((180, 1335), "ATUALIZACAO AUTOMATICA", font=get_font(36, bold=True), fill="#00E676")
    draw.text((180, 1410), "A cada jogo que encerra, seus pontos sobem", font=get_font(30), fill="#E2E8F0")
    draw.text((180, 1465), "e voce acompanha sua colocacao em tempo real!", font=get_font(30), fill="#E2E8F0")

    img.save(os.path.join(OUTPUT_DIR, "slide_8.png"))

# Slide 9: Chamada Final
def make_slide_9():
    img, draw = create_base_canvas()
    draw_header_badge(draw, "NAO PERCA O PRAZO!", bg_color="#00E676", text_color="#080C0E", y=220)
    draw_card(draw, 80, 380, WIDTH - 80, 1640, border_color="#00E676", fill_color="#0B161B")

    f_title = get_font(64, bold=True)
    draw.text((140, 470), "ENVIE SEUS", font=f_title, fill="#FFFFFF")
    draw.text((140, 555), "PALPITES AGORA!", font=f_title, fill="#00E676")

    # Big CTA Card
    draw.rounded_rectangle([140, 720, WIDTH - 140, 1140], radius=36, fill="#12251D", outline="#00E676", width=4)
    draw.text((180, 790), "ACESSE PELO CELULAR:", font=get_font(36, bold=True), fill="#E5A93C")
    draw.text((180, 870), "bolaodoscria.online", font=get_font(52, bold=True), fill="#FFFFFF")
    draw.text((180, 970), "100% GRATIS  |  VALENDO PIX", font=get_font(38, bold=True), fill="#00E676")
    draw.text((180, 1045), "O prazo encerra antes do 1o jogo!", font=get_font(32), fill="#FDE047")

    draw.rounded_rectangle([140, 1220, WIDTH - 140, 1540], radius=28, fill="#111B22", outline="#3B82F6", width=2)
    draw.text((180, 1285), "CHAME SEUS AMIGOS!", font=get_font(38, bold=True), fill="#60A5FA")
    draw.text((180, 1370), "Mostre quem entende de futebol e", font=get_font(32), fill="#E2E8F0")
    draw.text((180, 1435), "crava os melhores placares da rodada!", font=get_font(32), fill="#E2E8F0")

    img.save(os.path.join(OUTPUT_DIR, "slide_9.png"))

print("Gerando os 9 slides em 1080x1920...")
make_slide_1()
make_slide_2()
make_slide_3()
make_slide_4()
make_slide_5()
make_slide_6()
make_slide_7()
make_slide_8()
make_slide_9()
print("Todos os slides criados com sucesso em:", OUTPUT_DIR)
