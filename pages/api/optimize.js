import formidable from 'formidable';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const config = {
  api: { bodyParser: false },
};

async function optimizeOne(filepath, quality, maxW, maxH) {
  let pipeline = sharp(filepath);
  if (maxW > 0 || maxH > 0) {
    pipeline = pipeline.resize({
      width: maxW > 0 ? maxW : undefined,
      height: maxH > 0 ? maxH : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  const { data, info } = await pipeline
    .png({ quality, compressionLevel: 9, adaptiveFiltering: true, palette: true })
    .toBuffer({ resolveWithObject: true });
  return { data, info, size: info.size, width: info.width, height: info.height, quality };
}

async function optimizeToTarget(filepath, quality, maxW, maxH, targetBytes) {
  const tMin = Math.round(targetBytes * 0.8);
  const tMax = Math.round(targetBytes * 1.2);
  let candidates = [];

  const qualities = [...new Set([quality, 70, 50, 30, 15, 8, 3])]
    .filter(q => q >= 1 && q <= 100)
    .sort((a, b) => b - a);

  for (const q of qualities) {
    const r = await optimizeOne(filepath, q, maxW, maxH);
    candidates.push(r);
    if (r.size >= tMin && r.size <= tMax) return r;
  }

  const best = candidates.reduce((a, b) =>
    Math.abs(a.size - targetBytes) < Math.abs(b.size - targetBytes) ? a : b
  );

  if (best.size > tMax) {
    const meta = await sharp(filepath).metadata();
    const ow = maxW > 0 ? maxW : meta.width;
    const oh = maxH > 0 ? maxH : meta.height;

    for (let s = 0.85; s >= 0.2; s -= 0.07) {
      const w = Math.round(ow * s);
      const h = Math.round(oh * s);
      const r = await optimizeOne(filepath, best.quality, w, h);
      if (r.size < best.size) {
        r.scaled = true;
        r.scalePct = Math.round(s * 100);
        candidates.push(r);
        if (r.size >= tMin && r.size <= tMax) return r;
      }
    }
  }

  const final = candidates.reduce((a, b) =>
    Math.abs(a.size - targetBytes) < Math.abs(b.size - targetBytes) ? a : b
  );
  return final;
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const tmpDir = path.join(os.tmpdir(), 'quodeck-optimize');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const form = formidable({
    uploadDir: tmpDir,
    keepExtensions: true,
    maxFiles: 50,
    maxFileSize: 50 * 1024 * 1024,
    multiples: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const quality    = parseInt(fields.quality?.[0] || fields.quality)     || 80;
    const maxWidth   = parseInt(fields.maxWidth?.[0] || fields.maxWidth)   || 0;
    const maxHeight  = parseInt(fields.maxHeight?.[0] || fields.maxHeight) || 0;
    const targetSize = parseInt(fields.targetSize?.[0] || fields.targetSize) || 0;

    const imageFiles = Array.isArray(files.images) ? files.images : files.images ? [files.images] : [];

    if (!imageFiles.length)
      return res.status(400).json({ error: 'No images provided' });

    const results = [];

    for (const file of imageFiles) {
      try {
        const useTarget = targetSize > 0;

        let buffer, info, extra = {};

        if (useTarget) {
          const opt = await optimizeToTarget(file.filepath, quality, maxWidth, maxHeight, targetSize);
          buffer = opt.data;
          info = opt.info;
          if (opt.scaled) {
            extra.scaled = true;
            extra.scalePct = opt.scalePct;
          }
        } else {
          let pipeline = sharp(file.filepath);
          if (maxWidth > 0 || maxHeight > 0) {
            pipeline = pipeline.resize({
              width: maxWidth || undefined,
              height: maxHeight || undefined,
              fit: 'inside',
              withoutEnlargement: true,
            });
          }
          const compressionLevel = Math.min(9, Math.max(0, Math.round((100 - quality) / 10)));
          const result = await pipeline
            .png({ compressionLevel, adaptiveFiltering: true, quality })
            .toBuffer({ resolveWithObject: true });
          buffer = result.data;
          info = result.info;
        }

        const originalSize  = file.size;
        const optimizedSize = info.size;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        const base64 = buffer.toString('base64');

        results.push({
          original: file.originalFilename || file.newFilename,
          originalSize,
          optimizedSize,
          savings: parseFloat(savings),
          width: info.width,
          height: info.height,
          base64,
          success: true,
          ...extra,
        });

        fs.unlinkSync(file.filepath);
      } catch (e) {
        results.push({
          original: file.originalFilename || file.newFilename,
          error: e.message,
          success: false,
        });
        try { fs.unlinkSync(file.filepath); } catch {}
      }
    }

    res.status(200).json({ results });
  });
}
