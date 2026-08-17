from pathlib import Path
import sys

from PIL import Image, ImageDraw


if len(sys.argv) != 3:
    raise SystemExit("usage: assemble-v11-authored-motion.py <frames-dir-name> <output-stem>")

root = Path(__file__).resolve().parents[1]
frames_dir = root / "reviews" / "evidence" / sys.argv[1]
stem = sys.argv[2]
paths = sorted(list(frames_dir.glob("*.png")) + list(frames_dir.glob("*.jpg")))
if not paths:
    raise SystemExit(f"No motion frames found in {frames_dir}")

frames = [
    Image.open(path).convert("RGB").resize((960, 540), Image.Resampling.LANCZOS)
    for path in paths
]
animation_path = root / "reviews" / "evidence" / f"{stem}.webp"
frames[0].save(
    animation_path,
    save_all=True,
    append_images=frames[1:],
    duration=100,
    loop=0,
    quality=72,
    method=4,
)

sample_indices = sorted(
    {0, len(frames) // 5, (len(frames) * 2) // 5, (len(frames) * 3) // 5,
     (len(frames) * 4) // 5, len(frames) - 1}
)
board = Image.new("RGB", (960, len(sample_indices) * 570), (10, 13, 18))
draw = ImageDraw.Draw(board)
for row, frame_index in enumerate(sample_indices):
    board.paste(frames[frame_index], (0, row * 570 + 30))
    draw.text(
        (18, row * 570 + 8),
        f"V11 {stem.upper()} FRAME {frame_index + 1}/{len(frames)}",
        fill=(245, 236, 214),
    )
board_path = root / "reviews" / "evidence" / f"{stem}-contact-sheet.jpg"
board.save(board_path, quality=88, optimize=True)
print(f"{animation_path} ({len(frames)} frames)")
print(board_path)
