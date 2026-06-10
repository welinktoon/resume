from pathlib import Path

import pypdfium2 as pdfium


root = Path(__file__).resolve().parents[1]
pdf = pdfium.PdfDocument(root / "assets" / "resume.pdf")
page = pdf[0]
bitmap = page.render(scale=2.0)
image = bitmap.to_pil()
image.save(root / "assets" / "resume-preview.png")
print(f"resume-preview.png {image.size[0]}x{image.size[1]}")
