from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageOps

version = sys.argv[1] if len(sys.argv) > 1 else "v9"
root = Path(__file__).resolve().parents[1]
frames_dir = root / "reviews" / "evidence" / f".{version}-motion-frames"
paths = sorted(frames_dir.glob("*.jpg"))
if not paths:
    raise SystemExit(f"No motion frames found in {frames_dir}")

frames = [Image.open(path).convert("RGB").resize((960, 540), Image.Resampling.LANCZOS) for path in paths]
output = root / "reviews" / "evidence" / f"{version}-motion-evidence.webp"
frames[0].save(output, save_all=True, append_images=frames[1:], duration=120, loop=0, quality=72, method=4)

sample_indices = sorted({0, len(frames) // 4, len(frames) // 2, (len(frames) * 3) // 4, len(frames) - 1})
board = Image.new("RGB", (960, 5 * 570), (12, 15, 19))
draw = ImageDraw.Draw(board)
for row, frame_index in enumerate(sample_indices):
    board.paste(frames[frame_index], (0, row * 570 + 30))
    draw.text((18, row * 570 + 8), f"{version.upper()} MOTION FRAME {frame_index + 1}/{len(frames)}", fill=(245, 236, 214))
board.save(root / "reviews" / "evidence" / f"{version}-motion-contact-sheet.jpg", quality=88, optimize=True)
print(f"{output} ({len(frames)} frames)")
