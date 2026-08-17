from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parents[1]
version = sys.argv[1] if len(sys.argv) > 1 else "v10"

if version == "v11":
    cells = [
        (root / "reviews/references/v-rising/official-24.jpg", "REFERENCE · CHARACTER ANATOMY / COSTUME"),
        (root / "reviews/evidence/v11-nightbound-close-facing.png", "V11 · AUTHORED NIGHTBOUND AT PLAY SCALE"),
        (root / "reviews/references/v-rising/official-15.jpg", "REFERENCE · ENEMY ANATOMY / GROUP READ"),
        (root / "reviews/evidence/v11-husk-group.png", "V11 · FOUR AUTHORED HUSKS"),
        (root / "reviews/references/v-rising/official-20.jpg", "REFERENCE · WORLD DEPTH / MATERIAL HIERARCHY"),
        (root / "reviews/evidence/v11-compare-world.png", "V11 · HOLLOW MARCH WORLD"),
        (root / "reviews/references/v-rising/official-15.jpg", "REFERENCE · BOSS SPECTACLE / SILHOUETTES"),
        (root / "reviews/evidence/v11-boss-phase2.png", "V11 · BELL-SAINT PHASE II"),
    ]
else:
    cells = [
        (root / "reviews/references/v-rising/official-20.jpg", "REFERENCE · ATMOSPHERE / WORLD DEPTH"),
        (root / f"reviews/evidence/{version}-compare-world.png", f"{version.upper()} · WORLD MATERIAL HIERARCHY"),
        (root / "reviews/references/v-rising/official-15.jpg", "REFERENCE · COMBAT EFFECT DEPTH"),
        (root / f"reviews/evidence/{version}-compare-vfx.png", f"{version.upper()} · CONTACT LANGUAGE"),
        (root / "reviews/references/v-rising/official-15.jpg", "REFERENCE · BOSS SPECTACLE / SILHOUETTES"),
        (root / f"reviews/evidence/{version}-boss-phase2.png", f"{version.upper()} · PHASE II SPECTACLE"),
    ]

cell_width, image_height, label_height = 960, 540, 40
rows = (len(cells) + 1) // 2
board = Image.new("RGB", (cell_width * 2, (image_height + label_height) * rows), "#090d12")
draw = ImageDraw.Draw(board)
font = ImageFont.load_default(size=14)

for index, (source, label) in enumerate(cells):
    image = Image.open(source).convert("RGB")
    scale = max(cell_width / image.width, image_height / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - cell_width) // 2)
    top = max(0, (resized.height - image_height) // 2)
    crop = resized.crop((left, top, left + cell_width, top + image_height))
    column, row = index % 2, index // 2
    x, y = column * cell_width, row * (image_height + label_height)
    draw.text((20 + x, 14 + y), label, fill="#e8edf0", font=font)
    board.paste(crop, (x, y + label_height))

output = root / f"reviews/evidence/{version}-reference-board.jpg"
board.save(output, quality=90, optimize=True)
print(output)
