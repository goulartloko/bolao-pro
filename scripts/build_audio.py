import subprocess
import os

files = ['part1_intro.mp3', 'part2_cadastro.mp3', 'part3_jogos.mp3', 'part4_palpites.mp3', 'part5_travar.mp3', 'part6_ranking.mp3']
audio_list_path = os.path.join('scripts', 'audio_list.txt')

with open(audio_list_path, 'w', encoding='utf-8') as f:
    for item in files:
        f.write(f"file '{item}'\n")

out_path = os.path.join('scripts', 'locucao_completa_antonio.mp3')
subprocess.run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', audio_list_path, '-c', 'copy', out_path], check=True)

# check duration
res = subprocess.run(['ffprobe', '-i', out_path, '-show_entries', 'format=duration', '-v', 'quiet', '-of', 'csv=p=0'], capture_output=True, text=True)
print(f"Master audio generated! Duration: {float(res.stdout.strip()):.2f}s")
