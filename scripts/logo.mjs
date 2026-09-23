// Turns the green-background logo into a transparent gold PNG.
import sharp from "sharp";
const src = "public/brand/logo-original.jpg";
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => { const i = (y * info.width + x) * 4; return [data[i], data[i+1], data[i+2]]; };
console.log("corners", px(5,5), px(600,20), px(20,600), px(1240,1240));
const out = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i+1], b = data[i+2];
  // gold has lots of red; the green background has almost none
  const a = Math.max(0, Math.min(1, (r - 45) / 110));
  out[i] = Math.min(255, r * 1.02); out[i+1] = g; out[i+2] = b; out[i+3] = Math.round(a * 255);
}
const img = sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
await img.clone().png().toFile("public/brand/logo-gold.png");
const trimmed = await sharp("public/brand/logo-gold.png").trim({ threshold: 5 }).png().toBuffer({ resolveWithObject: true });
console.log("trim", trimmed.info);
await sharp(trimmed.data).resize({ width: 800 }).png({ compressionLevel: 9 }).toFile("public/brand/logo-full.png");
// monogram only: crown + H region (above the FRAGRANCES text)
await sharp("public/brand/logo-gold.png").extract({ left: 370, top: 90, width: 580, height: 740 }).trim({threshold:5}).resize({ height: 400 }).png({ compressionLevel: 9 }).toFile("public/brand/logo-mark.png");
