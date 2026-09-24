"""Build the public media kit from the same content used on the website.

Requires Python with Pillow and reportlab. Run via npm run media-kit.
The original downloadable photos are copied into the ZIP without alteration.
"""
import json
import os
from pathlib import Path
import sys
from xml.sax.saxutils import escape
import zipfile

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

data = json.load(sys.stdin)
root = Path(data["root"])
kit, audience, links = data["kit"], data["audience"], data["links"]
out = root / "public" / "media-kit"
out.mkdir(parents=True, exist_ok=True)


def public_file(src):
    return root / "public" / src.lstrip("/")


def size_label(size):
    return f"{size / 1_000_000:.1f} MB" if size >= 1_000_000 else f"{round(size / 1_000)} KB"


photo_files = []
for photo in kit["photos"]:
    path = public_file(photo["src"])
    with Image.open(path) as image:
        width, height = image.size
        if image.getexif().get(274) in (5, 6, 7, 8):
            width, height = height, width
        image_format = "JPG" if image.format in ("JPEG", "MPO") else image.format
    photo_files.append({"id": photo["id"], "width": width, "height": height,
                        "format": image_format, "size": size_label(path.stat().st_size)})

# Keep the PDF typography consistent without making a specific OS mandatory.
font_dir = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
if (font_dir / "arial.ttf").is_file() and (font_dir / "arialbd.ttf").is_file():
    pdfmetrics.registerFont(TTFont("KitSans", str(font_dir / "arial.ttf")))
    pdfmetrics.registerFont(TTFont("KitSansBold", str(font_dir / "arialbd.ttf")))
    regular, bold = "KitSans", "KitSansBold"
else:
    regular, bold = "Helvetica", "Helvetica-Bold"

pdf_path = out / "Jesus-Martinez-Media-Kit.pdf"
pdf = canvas.Canvas(str(pdf_path), pagesize=(612, 792), invariant=1)
pdf.setTitle("Jesus Martinez | JM Crypto Media Kit")
pdf.setAuthor("Jesus Martinez / JM Crypto")
pdf.setSubject(f"Public media kit, updated {audience['checkedLabel']}")
bg, white, muted, teal, line = map(HexColor, ("#11171d", "#edf2f4", "#a4b0ba", "#85b9b9", "#31404b"))
pdf.setFillColor(bg)
pdf.rect(0, 0, 612, 792, fill=1, stroke=0)


def text(value, x, y, size=11, font=None, color=None):
    pdf.setFillColor(color or white)
    pdf.setFont(font or regular, size)
    pdf.drawString(x, y, value)


def paragraph(value, x, top, width, size=10.5, leading=16, color=None):
    style = ParagraphStyle("Kit", fontName=regular, fontSize=size, leading=leading,
                           textColor=color or muted)
    block = Paragraph(escape(value), style)
    _, height = block.wrap(width, 500)
    block.drawOn(pdf, x, top - height)
    return top - height


def rule(y):
    pdf.setStrokeColor(line)
    pdf.setLineWidth(0.6)
    pdf.line(42, y, 570, y)


text("JM CRYPTO / MEDIA KIT", 42, 750, 9, bold, teal)
text(audience["checkedLabel"], 421, 750, 8.5, regular, muted)
text("JESUS", 42, 688, 48, bold)
text("MARTINEZ", 42, 636, 48, bold)
text("Creator. Researcher. In conversation.", 44, 602, 12, regular, teal)
paragraph("Crypto markets, the ideas behind them, and the people building what comes next.",
          44, 574, 282, 12, 18)
text("MIAMI, FLORIDA  /  FULL TIME SINCE 2021", 44, 513, 8, bold, muted)

# Embed the existing edited website portrait; the downloadable source stays intact.
portrait = public_file(next(p["src"] for p in kit["photos"] if p["id"] == "city"))
with Image.open(portrait) as image:
    image = image.convert("RGB")
    photo = ImageReader(image)
    x, y, width, height = 390, 505, 180, 218
    scale = max(width / image.width, height / image.height)
    dw, dh = image.width * scale, image.height * scale
    pdf.saveState()
    clip = pdf.beginPath()
    clip.roundRect(x, y, width, height, 8)
    pdf.clipPath(clip, stroke=0)
    pdf.drawImage(photo, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh)
    pdf.restoreState()

rule(480)
for x, number, label, source in (
    (42, audience["youtube"]["display"], "YouTube subscribers", links["crypto"]),
    (226, audience["x"]["display"], "X followers", links["x"]),
    (410, kit["lifetimeViews"]["display"], "Lifetime YouTube views", kit["lifetimeViews"]["source"]),
):
    text(number, x, 441, 28, bold)
    text(label, x, 419, 10, regular, muted)
    pdf.linkURL(source, (x, 415, x + 160, 464), relative=0)
text("Dated public counts. YouTube rounds subscriber figures. Source links are clickable.",
     42, 390, 8, regular, muted)
rule(370)

text("ABOUT JESUS", 42, 345, 9, bold, teal)
paragraph(kit["shortBio"], 42, 326, 528, 11, 17)

text("TOPICS", 42, 230, 9, bold, teal)
text("WAYS TO WORK TOGETHER", 318, 230, 9, bold, teal)
for i, topic in enumerate(kit["topics"]):
    text(topic, 42, 207 - i * 19, 11)
paragraph("YouTube integrations, project deep dives, founder interviews, conference appearances, social campaigns, and podcast conversations.",
          318, 216, 252, 11, 17)

rule(120)
text("LET'S TALK", 42, 98, 9, bold, teal)
text(links["email"], 42, 77, 13, bold)
pdf.linkURL("mailto:" + links["email"], (42, 72, 350, 91), relative=0)
text("martinezaccess.com/press-kit", 42, 56, 10, regular, muted)
pdf.linkURL("https://www.martinezaccess.com/press-kit", (42, 52, 280, 66), relative=0)
text("PHOTOS / BIOS / CHANNEL ARTWORK", 363, 57, 8, bold, teal)
text("Original photos and usage notes are available in the full kit. City portrait uses AI-assisted editing.",
     42, 28, 7, regular, muted)
pdf.showPage()
pdf.save()

bios = (f"JESUS MARTINEZ / JM CRYPTO\nUpdated {audience['checkedLabel']}\n\n"
        f"SHORT BIO\n\n{kit['shortBio']}\n\nEXTENDED BIO\n\n" +
        "\n\n".join(kit["extendedBio"]) + "\n")
(out / "Jesus-Martinez-Bios.txt").write_text(bios, encoding="utf-8")
facts = {
    "name": kit["name"], "channel": "JM Crypto", "location": kit["location"],
    "checkedAt": audience["checkedAt"], "youtubeSubscribers": audience["youtube"]["count"],
    "youtubeSubscriberNote": "Rounded public count", "xFollowers": audience["x"]["count"],
    "youtubeLifetimeViews": kit["lifetimeViews"]["count"], "topics": kit["topics"],
    "links": {**links, "mediaKit": "https://www.martinezaccess.com/press-kit"},
    "sources": {"youtube": kit["lifetimeViews"]["source"], "x": links["x"]},
}
(out / "Jesus-Martinez-Facts.json").write_text(json.dumps(facts, indent=2) + "\n", encoding="utf-8")
link_text = "JESUS MARTINEZ / OFFICIAL LINKS\n\n" + "\n".join(
    f"{label}: {url}" for label, url in (
        ("Website", "https://www.martinezaccess.com"), ("Media kit", "https://www.martinezaccess.com/press-kit"),
        ("YouTube", links["crypto"]), ("X", links["x"]), ("Instagram", links["instagram"]),
        ("Business email", links["email"]))) + "\n"
(out / "Jesus-Martinez-Links.txt").write_text(link_text, encoding="utf-8")
readme = (f"JESUS MARTINEZ / JM CRYPTO MEDIA KIT\nUpdated {audience['checkedLabel']}\n\n"
          f"USING THESE ASSETS\n{kit['usage']}\n\n"
          "PHOTOS\n" + "\n".join(f"photos/{p['filename']} - {p['treatment']}" for p in kit["photos"]) +
          "\n\nThe three original studio/interview photographs are included unchanged. "
          "The city portrait is the AI-assisted crop and color correction used on the website. "
          "For editorial outlets that require unaltered images, choose an original photograph.\n\n"
          "CHANNEL ARTWORK\nartwork/JM-Crypto-Channel-Banner.jpg - Current public YouTube channel banner, "
          f"2560 x 424 JPG. Source: {kit['banner']['source']}\n\n"
          "AUDIENCE FIGURES\nPublic snapshots as of the update date, not live counters. "
          "YouTube rounds public subscriber figures. The PDF and website abbreviate counts for readability. "
          "See Jesus-Martinez-Facts.json for exact retrieved counts and source URLs. "
          "Contact Jesus for current campaign details or audience breakdowns.\n\n"
          "CONTENTS\nPhotos, channel banner, one-page PDF, short/extended bios, official links, "
          "dated public facts, and these usage notes.\n")
(out / "README.txt").write_text(readme, encoding="utf-8")

zip_path = out / "Jesus-Martinez-Media-Kit.zip"
with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
    for photo in kit["photos"]:
        bundle.write(public_file(photo["src"]), "photos/" + photo["filename"])
    bundle.write(public_file(kit["banner"]["src"]), "artwork/" + kit["banner"]["filename"])
    for name in (pdf_path.name, "Jesus-Martinez-Bios.txt", "Jesus-Martinez-Facts.json",
                 "Jesus-Martinez-Links.txt", "README.txt"):
        bundle.write(out / name, name)

manifest = {"zipSize": size_label(zip_path.stat().st_size), "photos": photo_files}
(root / "lib" / "media-kit-downloads.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"pdf": str(pdf_path), "zip": str(zip_path), **manifest}, indent=2))
