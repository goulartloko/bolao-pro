import os
import subprocess

base_dir = os.path.join(os.getcwd(), "scripts")
assets_dir = os.path.join(base_dir, "video_assets")
concat_path = os.path.join(base_dir, "concat.txt")
audio_path = os.path.join(base_dir, "locucao_bolao_curto.wav")

public_dir = os.path.join(os.getcwd(), "public")
os.makedirs(public_dir, exist_ok=True)
output_video_public = os.path.join(public_dir, "video_tutorial_bolao.mp4")
output_video_desktop = os.path.join(os.environ.get("USERPROFILE", ""), "OneDrive", "Área de Trabalho", "video_tutorial_bolao.mp4")

# Write concat list with forward slashes
slides_timing = [
    ("slide_1.png", 9),
    ("slide_2.png", 7),
    ("slide_3.png", 11),
    ("slide_4.png", 6),
    ("slide_5.png", 10),
    ("slide_6.png", 13),
    ("slide_7.png", 5),
    ("slide_8.png", 10),
    ("slide_9.png", 7),
]

with open(concat_path, "w", encoding="utf-8") as f:
    for filename, dur in slides_timing:
        full_path = os.path.join(assets_dir, filename).replace("\\", "/")
        f.write(f"file '{full_path}'\n")
        f.write(f"duration {dur}\n")
    # Last frame requirement for ffmpeg concat
    last_file = os.path.join(assets_dir, "slide_9.png").replace("\\", "/")
    f.write(f"file '{last_file}'\n")

print("Arquivo concat.txt gerado com sucesso!")

# Executa ffmpeg para gerar o MP4
cmd = [
    "ffmpeg",
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concat_path,
    "-i", audio_path,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "fast",
    "-crf", "22",
    "-r", "25",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    output_video_public
]

print("Renderizando vídeo MP4 vertical 1080x1920 com áudio sincronizado...")
subprocess.run(cmd, check=True)
print("Vídeo gerado em:", output_video_public)

# Se possível copia para a Área de Trabalho também para facilidade do usuário
try:
    import shutil
    shutil.copyfile(output_video_public, output_video_desktop)
    print("Cópia salva diretamente na Área de Trabalho:", output_video_desktop)
except Exception as e:
    print("Aviso ao copiar para Área de Trabalho:", e)
