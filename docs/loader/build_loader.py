import base64, io, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
img_path = os.path.join(HERE, "crayons_q80.webp")
b64 = base64.b64encode(open(img_path, "rb").read()).decode()
drips = json.load(open(os.path.join(HERE, "drips.json")))

print(f"image: {os.path.getsize(img_path)/1024:.0f} KB -> {len(b64)/1024:.0f} KB base64")
print(f"boundary: {drips['boundary']}, columns: {len(drips['cols'])}")

html = open(os.path.join(HERE, "loader_template.html"), encoding="utf-8").read()
html = html.replace("__IMG_B64__", b64)
html = html.replace("__DRIPS_JSON__", json.dumps(drips))

out = os.path.join(HERE, "crayon-melt-loader.html")
open(out, "w", encoding="utf-8").write(html)
print(f"wrote {out}  ({os.path.getsize(out)/1024:.0f} KB)")
