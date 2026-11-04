import os
import time
import math
from playwright.sync_api import sync_playwright

def inject_styles_and_touch(page):
    js = """
    (() => {
        if (document.getElementById('touch-cursor')) return;
        const cursor = document.createElement('div');
        cursor.id = 'touch-cursor';
        cursor.style.position = 'fixed';
        cursor.style.width = '36px';
        cursor.style.height = '36px';
        cursor.style.borderRadius = '50%';
        cursor.style.backgroundColor = 'rgba(0, 230, 118, 0.4)';
        cursor.style.border = '3px solid #00e676';
        cursor.style.boxShadow = '0 0 20px rgba(0, 230, 118, 0.9)';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '99999999';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.transition = 'transform 0.15s ease, background-color 0.15s ease, opacity 0.25s ease';
        cursor.style.display = 'none';
        document.body.appendChild(cursor);

        window.animateTouch = (x, y, isClick = false) => {
            cursor.style.display = 'block';
            cursor.style.left = x + 'px';
            cursor.style.top = y + 'px';
            if (isClick) {
                cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
                cursor.style.backgroundColor = 'rgba(255, 215, 0, 0.85)';
                cursor.style.borderColor = '#ffd700';
                setTimeout(() => {
                    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                    cursor.style.backgroundColor = 'rgba(0, 230, 118, 0.4)';
                    cursor.style.borderColor = '#00e676';
                }, 220);
            }
        };

        window.hideTouch = () => {
            cursor.style.display = 'none';
        };
    })();
    """
    page.evaluate(js)

def move_and_click(page, x, y, click=True, pause_after=0.4):
    page.evaluate(f"window.animateTouch({x}, {y}, {str(click).lower()})")
    time.sleep(0.2)
    if click:
        page.mouse.click(x, y)
    time.sleep(pause_after)

def smooth_scroll(page, target_y, duration_s=1.2, steps=30):
    current_y = page.evaluate("window.scrollY")
    diff = target_y - current_y
    step_time = duration_s / steps
    for i in range(1, steps + 1):
        fraction = i / steps
        ease = 0.5 * (1 - math.cos(fraction * math.pi))
        new_y = current_y + diff * ease
        page.evaluate(f"window.scrollTo(0, {new_y})")
        time.sleep(step_time)

def record():
    rec_dir = os.path.abspath("scripts/record_temp")
    os.makedirs(rec_dir, exist_ok=True)

    print("Launching Chromium with mobile viewport 430x932 (860x1864 retina)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            headless=True
        )
        context = browser.new_context(
            viewport={'width': 430, 'height': 932},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            record_video_dir=rec_dir,
            record_video_size={'width': 860, 'height': 1864}
        )
        page = context.new_page()
        page.set_default_timeout(20000)

        # Handle any alert or confirm dialogs automatically
        page.on("dialog", lambda d: d.accept())

        # ==========================================
        # PART 1: 0.0s to 13.0s (Intro & Premiação)
        # ==========================================
        print("--- PART 1: Homepage & Pix Prizes ---")
        t0 = time.time()
        page.goto("https://bolaodoscria.online", wait_until="networkidle")
        inject_styles_and_touch(page)

        # Hero view
        time.sleep(3.0)

        # Scroll to prizes
        smooth_scroll(page, 450, duration_s=2.5)
        time.sleep(2.5)

        # Scroll to scoring rules & CTA
        smooth_scroll(page, 750, duration_s=2.0)
        time.sleep(1.5)

        # Scroll back to top
        smooth_scroll(page, 0, duration_s=1.5)
        # Pad to exactly 13.0s
        elapsed = time.time() - t0
        if elapsed < 13.0:
            time.sleep(13.0 - elapsed)
        print(f"Part 1 done at {time.time() - t0:.2f}s")

        # ==========================================
        # PART 2: 13.0s to 24.4s (Cadastro na prática)
        # ==========================================
        print("--- PART 2: Cadastro na Prática ---")
        t1 = time.time()
        # Click Cadastrar button in header (top right ~ x=360, y=28)
        inject_styles_and_touch(page)
        move_and_click(page, 360, 28, click=True, pause_after=0.8)

        # Modal opens. Click into Nome Completo
        inject_styles_and_touch(page)
        move_and_click(page, 215, 335, click=True, pause_after=0.3)
        page.keyboard.type("Lucas Silva", delay=65)
        time.sleep(0.5)

        # Click into WhatsApp input
        move_and_click(page, 215, 475, click=True, pause_after=0.3)
        page.keyboard.type("(11) 98765-4321", delay=60)
        time.sleep(1.2)

        # Close modal (click close X around x=375, y=225 or outside)
        move_and_click(page, 375, 230, click=True, pause_after=0.5)

        elapsed2 = time.time() - t1
        if elapsed2 < 11.4:
            time.sleep(11.4 - elapsed2)
        print(f"Part 2 done at {time.time() - t1:.2f}s")

        # ==========================================
        # PART 3: 24.4s to 34.8s (Tela de Jogos)
        # ==========================================
        print("--- PART 3: Tela de Palpites & Confrontos ---")
        t2 = time.time()
        page.goto("https://bolaodoscria.online/bolao/cmw25ldi800075s7fhamldjmy/palpites", wait_until="networkidle")
        inject_styles_and_touch(page)
        time.sleep(2.0)

        # Scroll to show first matches with team badges
        smooth_scroll(page, 220, duration_s=2.0)
        time.sleep(2.0)

        # Scroll more down to show other matches
        smooth_scroll(page, 520, duration_s=2.5)
        time.sleep(1.5)

        elapsed3 = time.time() - t2
        if elapsed3 < 10.4:
            time.sleep(10.4 - elapsed3)
        print(f"Part 3 done at {time.time() - t2:.2f}s")

        # ==========================================
        # PART 4: 34.8s to 48.5s (Digitando Palpites)
        # ==========================================
        print("--- PART 4: Digitando Palpites & Pontuação ---")
        t3 = time.time()
        # Scroll back to top match (Flamengo x Grêmio)
        smooth_scroll(page, 180, duration_s=1.2)
        time.sleep(0.5)

        # Find all number inputs
        inputs = page.query_selector_all("input[type='number']")
        print(f"Found {len(inputs)} score inputs")

        if len(inputs) >= 6:
            # Match 1: Flamengo (2) x (1) Grêmio
            box0 = inputs[0].bounding_box()
            if box0:
                move_and_click(page, box0['x'] + box0['width']/2, box0['y'] + box0['height']/2, click=True)
                inputs[0].fill("2")
                time.sleep(0.4)

            box1 = inputs[1].bounding_box()
            if box1:
                move_and_click(page, box1['x'] + box1['width']/2, box1['y'] + box1['height']/2, click=True)
                inputs[1].fill("1")
                time.sleep(0.8)

            # Match 2: Athletico-PR (1) x (1) Vasco
            box2 = inputs[2].bounding_box()
            if box2:
                move_and_click(page, box2['x'] + box2['width']/2, box2['y'] + box2['height']/2, click=True)
                inputs[2].fill("1")
                time.sleep(0.4)

            box3 = inputs[3].bounding_box()
            if box3:
                move_and_click(page, box3['x'] + box3['width']/2, box3['y'] + box3['height']/2, click=True)
                inputs[3].fill("1")
                time.sleep(0.8)

            # Match 3: Botafogo (2) x (0) Atlético-MG
            box4 = inputs[4].bounding_box()
            if box4:
                move_and_click(page, box4['x'] + box4['width']/2, box4['y'] + box4['height']/2, click=True)
                inputs[4].fill("2")
                time.sleep(0.4)

            box5 = inputs[5].bounding_box()
            if box5:
                move_and_click(page, box5['x'] + box5['width']/2, box5['y'] + box5['height']/2, click=True)
                inputs[5].fill("0")
                time.sleep(0.8)

        # Highlight scoring rule (+10 pts / +5 pts)
        time.sleep(1.5)

        elapsed4 = time.time() - t3
        if elapsed4 < 13.7:
            time.sleep(13.7 - elapsed4)
        print(f"Part 4 done at {time.time() - t3:.2f}s")

        # ==========================================
        # PART 5: 48.5s to 59.2s (Travar Palpites)
        # ==========================================
        print("--- PART 5: Regra do Prazo & Travar Palpites ---")
        t4 = time.time()
        # Scroll up to show the "Confirmar e Travar Palpites" button
        smooth_scroll(page, 0, duration_s=1.2)
        time.sleep(1.0)

        # Find the save button
        save_btn = page.query_selector("button:has-text('Confirmar e Travar')")
        if save_btn:
            s_box = save_btn.bounding_box()
            if s_box:
                move_and_click(page, s_box['x'] + s_box['width']/2, s_box['y'] + s_box['height']/2, click=True, pause_after=1.5)

        time.sleep(2.0)
        elapsed5 = time.time() - t4
        if elapsed5 < 10.7:
            time.sleep(10.7 - elapsed5)
        print(f"Part 5 done at {time.time() - t4:.2f}s")

        # ==========================================
        # PART 6: 59.2s to 73.4s (Ranking & Pix)
        # ==========================================
        print("--- PART 6: Ranking ao Vivo & Pix ---")
        t5 = time.time()
        page.goto("https://bolaodoscria.online/bolao/cmw25ldi800075s7fhamldjmy/ranking", wait_until="networkidle")
        inject_styles_and_touch(page)
        time.sleep(2.5)

        # Scroll through ranking
        smooth_scroll(page, 350, duration_s=3.0)
        time.sleep(2.0)
        smooth_scroll(page, 650, duration_s=2.5)
        time.sleep(2.0)
        smooth_scroll(page, 0, duration_s=1.5)

        elapsed6 = time.time() - t5
        if elapsed6 < 14.2:
            time.sleep(14.2 - elapsed6)
        print(f"Part 6 done at {time.time() - t5:.2f}s")

        # Get video path before closing
        video_path = page.video.path()
        context.close()
        browser.close()

    print(f"Raw video recorded successfully to: {video_path}")
    return video_path

if __name__ == "__main__":
    vid = record()
    print("Done! Recorded video file:", vid)
