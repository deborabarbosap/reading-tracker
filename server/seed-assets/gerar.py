"""Gera as 3 imagens de capa de exemplo do seed. Requer Pillow (pip install pillow)."""
from PIL import Image, ImageDraw

CAPAS = [
    ("seed-garota-no-trem.jpg", "JPEG", (46, 64, 92), "A GAROTA\nNO TREM"),
    ("seed-1984.png", "PNG", (120, 30, 30), "1984"),
    ("seed-torto-arado.webp", "WEBP", (74, 52, 38), "TORTO\nARADO"),
]

for nome, formato, cor, texto in CAPAS:
    img = Image.new("RGB", (400, 600), cor)
    d = ImageDraw.Draw(img)
    d.multiline_text((30, 250), texto, fill=(240, 240, 240), spacing=12)
    kwargs = {"quality": 80} if formato in ("JPEG", "WEBP") else {}
    img.save(f"server/seed-assets/{nome}", formato, **kwargs)
    print("gerado:", nome)
