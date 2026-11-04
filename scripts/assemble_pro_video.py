import os
import glob
import shutil
import subprocess

def assemble():
    # Find latest webm file in scripts/record_temp
    webm_files = glob.glob("scripts/record_temp/*.webm")
    if not webm_files:
        raise FileNotFoundError("No webm file found in scripts/record_temp")
    
    # Sort by mtime descending
    webm_files.sort(key=os.path.getmtime, reverse=True)
    raw_video = webm_files[0]
    print(f"Using raw recorded video: {raw_video}")

    audio_file = "scripts/locucao_completa_antonio.mp3"
    output_mp4 = "public/video_tutorial_bolao.mp4"
    desktop_mp4 = os.path.expanduser(r"~\OneDrive\Área de Trabalho\video_tutorial_bolao.mp4")

    # Probe audio duration
    res_audio = subprocess.run(
        ["ffprobe", "-i", audio_file, "-show_entries", "format=duration", "-v", "quiet", "-of", "csv=p=0"],
        capture_output=True, text=True, check=True
    )
    audio_dur = float(res_audio.stdout.strip())
    print(f"Audio duration: {audio_dur:.2f}s")

    # Probe video duration
    res_vid = subprocess.run(
        ["ffprobe", "-i", raw_video, "-show_entries", "format=duration", "-v", "quiet", "-of", "csv=p=0"],
        capture_output=True, text=True, check=True
    )
    vid_dur = float(res_vid.stdout.strip())
    print(f"Raw video duration: {vid_dur:.2f}s")

    # We want to fit/scale the mobile recording (860x1864) into a 1080x1920 canvas.
    # 860x1864 centered on 1080x1920 with subtle dark arena padding on left/right (or scaled to 886x1920 with border)
    # Filter graph:
    # 1. Scale video to height 1920 (preserving aspect ratio): scale=-2:1920
    # 2. Pad to 1080x1920 centered: pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=#0a0e17
    # 3. Add stylish subtle header banner / caption bar or keep pure full-screen mobile
    # 4. Sync audio and video, cut at audio duration
    
    # Crop exactly to the real mobile screen content (430x932) and scale to full-frame 1080x1920
    filter_complex = (
        "[0:v]crop=430:932:0:0,scale=1080:1920:flags=lanczos[v]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", audio_file,
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", f"{audio_dur:.2f}",
        "-movflags", "+faststart",
        output_mp4
    ]

    print("Running FFmpeg render command...")
    subprocess.run(cmd, check=True)
    print(f"Exported final MP4 to {output_mp4}")

    # Copy to Desktop
    shutil.copy2(output_mp4, desktop_mp4)
    print(f"Copied to Desktop: {desktop_mp4}")

    file_size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
    print(f"Final video size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    assemble()
