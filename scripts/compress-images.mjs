// 脚本：批量压缩 public/images 下的图片为 WebP
// 运行：node scripts/compress-images.mjs
import sharp from "sharp";
import { readdir, stat, mkdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const IMG_DIR = join(ROOT, "public", "images");

const TARGET_WIDTH = 1280; // 最大宽度，移动端足够
const QUALITY = 80;

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (/\.(jpg|jpeg|png)$/i.test(extname(e.name))) {
      yield full;
    }
  }
}

async function main() {
  let count = 0;
  let savedBefore = 0;
  let savedAfter = 0;

  for await (const file of walk(IMG_DIR)) {
    const before = (await stat(file)).size;
    savedBefore += before;
    const out = file.replace(/\.(jpg|jpeg|png)$/i, ".webp");
    await sharp(file)
      .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out);
    const after = (await stat(out)).size;
    savedAfter += after;
    count++;
    console.log(
      `[OK] ${file.replace(ROOT, "")}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`
    );
  }

  console.log(`\n压缩完成：${count} 张图片`);
  console.log(`总大小：${(savedBefore / 1024 / 1024).toFixed(2)} MB -> ${(savedAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`节省：${((savedBefore - savedAfter) / 1024 / 1024).toFixed(2)} MB (${(((savedBefore - savedAfter) / savedBefore) * 100).toFixed(1)}%)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
