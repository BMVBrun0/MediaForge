type Metadata = Record<string, unknown>;

const TAGS: Record<number, string> = {
  0x010f: "Make",
  0x0110: "Model",
  0x0112: "Orientation",
  0x0131: "Software",
  0x0132: "DateTime",
  0x8769: "ExifIFDPointer",
  0x8825: "GPSInfoIFDPointer",
  0x829a: "ExposureTime",
  0x829d: "FNumber",
  0x8827: "ISO",
  0x9003: "DateTimeOriginal",
  0x9004: "CreateDate",
  0x9209: "Flash",
  0x920a: "FocalLength",
  0xa002: "PixelXDimension",
  0xa003: "PixelYDimension",
  0xa405: "FocalLengthIn35mmFormat",
  0xa434: "LensModel",
  0x0001: "GPSLatitudeRef",
  0x0002: "GPSLatitude",
  0x0003: "GPSLongitudeRef",
  0x0004: "GPSLongitude",
  0x0005: "GPSAltitudeRef",
  0x0006: "GPSAltitude",
};

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function rational(view: DataView, offset: number, little: boolean, signed = false) {
  const numerator = signed ? view.getInt32(offset, little) : view.getUint32(offset, little);
  const denominator = signed ? view.getInt32(offset + 4, little) : view.getUint32(offset + 4, little);
  return denominator ? numerator / denominator : 0;
}

function readValue(view: DataView, tiffStart: number, entryOffset: number, type: number, count: number, little: boolean) {
  if (!Number.isFinite(count) || count > 100_000) return undefined;
  const size = (TYPE_SIZE[type] ?? 1) * count;
  const valueOffset = size <= 4 ? entryOffset + 8 : tiffStart + view.getUint32(entryOffset + 8, little);
  if (valueOffset < 0 || valueOffset + size > view.byteLength) return undefined;

  if (type === 2) {
    const bytes = new Uint8Array(view.buffer, view.byteOffset + valueOffset, Math.max(0, count - 1));
    return new TextDecoder().decode(bytes).replace(/\0/g, "").trim();
  }
  if (type === 3) {
    if (count === 1) return view.getUint16(valueOffset, little);
    return Array.from({ length: count }, (_, i) => view.getUint16(valueOffset + i * 2, little));
  }
  if (type === 4) {
    if (count === 1) return view.getUint32(valueOffset, little);
    return Array.from({ length: count }, (_, i) => view.getUint32(valueOffset + i * 4, little));
  }
  if (type === 5 || type === 10) {
    const values = Array.from({ length: count }, (_, i) => rational(view, valueOffset + i * 8, little, type === 10));
    return count === 1 ? values[0] : values;
  }
  if (type === 1 || type === 7) {
    if (count === 1) return view.getUint8(valueOffset);
    return Array.from(new Uint8Array(view.buffer, view.byteOffset + valueOffset, count));
  }
  if (type === 9) return count === 1 ? view.getInt32(valueOffset, little) : Array.from({ length: count }, (_, i) => view.getInt32(valueOffset + i * 4, little));
  return undefined;
}

function parseIfd(view: DataView, tiffStart: number, relativeOffset: number, little: boolean, output: Metadata, depth = 0) {
  if (depth > 4) return;
  const start = tiffStart + relativeOffset;
  if (start < 0 || start + 2 > view.byteLength) return;
  const count = view.getUint16(start, little);
  if (count > 512) return;

  for (let i = 0; i < count; i += 1) {
    const entry = start + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const valueCount = view.getUint32(entry + 4, little);
    const value = readValue(view, tiffStart, entry, type, valueCount, little);
    const key = TAGS[tag];
    if (key && value !== undefined) output[key] = value;
    if ((tag === 0x8769 || tag === 0x8825) && typeof value === "number") parseIfd(view, tiffStart, value, little, output, depth + 1);
  }
}

function parseTiffAt(view: DataView, tiffStart: number, output: Metadata) {
  if (tiffStart < 0 || tiffStart + 8 > view.byteLength) return false;
  try {
    const endian = view.getUint16(tiffStart, false);
    const little = endian === 0x4949;
    if (!little && endian !== 0x4d4d) return false;
    if (view.getUint16(tiffStart + 2, little) !== 42) return false;
    const firstIfd = view.getUint32(tiffStart + 4, little);
    if (firstIfd < 8 || tiffStart + firstIfd >= view.byteLength) return false;
    parseIfd(view, tiffStart, firstIfd, little, output);
    return true;
  } catch {
    return false;
  }
}

function findBytes(bytes: Uint8Array, pattern: number[], start = 0) {
  outer: for (let i = Math.max(0, start); i <= bytes.length - pattern.length; i += 1) {
    for (let p = 0; p < pattern.length; p += 1) if (bytes[i + p] !== pattern[p]) continue outer;
    return i;
  }
  return -1;
}

function parseEmbeddedExif(view: DataView, output: Metadata) {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  const exifMarker = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  let markerAt = findBytes(bytes, exifMarker);
  while (markerAt >= 0) {
    if (parseTiffAt(view, markerAt + exifMarker.length, output)) return true;
    markerAt = findBytes(bytes, exifMarker, markerAt + 1);
  }

  // HEIC/HEIF stores EXIF as an item inside the ISO-BMFF container. Depending on
  // the encoder there may be no literal "Exif\0\0" prefix, so fall back to a
  // validated TIFF-header scan. False positives are rejected by parseTiffAt().
  for (const signature of [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]]) {
    let at = findBytes(bytes, signature);
    while (at >= 0) {
      if (parseTiffAt(view, at, output)) return true;
      at = findBytes(bytes, signature, at + 1);
    }
  }
  return false;
}

function gpsDecimal(value: unknown, ref: unknown) {
  if (!Array.isArray(value) || value.length < 3) return undefined;
  const decimal = Number(value[0]) + Number(value[1]) / 60 + Number(value[2]) / 3600;
  return ref === "S" || ref === "W" ? -decimal : decimal;
}

export async function parse(file: File, _options?: unknown): Promise<Metadata> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const output: Metadata = {
    FileName: file.name,
    FileSize: file.size,
    MIMEType: file.type || "application/octet-stream",
    LastModified: new Date(file.lastModified),
  };

  if (view.byteLength >= 12 && view.getUint16(0, false) === 0xffd8) {
    let offset = 2;
    while (offset + 4 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);
      const length = view.getUint16(offset + 2, false);
      if (marker === 0xe1 && offset + 10 < view.byteLength) {
        const exif = String.fromCharCode(...new Uint8Array(buffer, offset + 4, 6));
        if (exif.startsWith("Exif")) {
          parseTiffAt(view, offset + 10, output);
          break;
        }
      }
      if (length < 2) break;
      offset += 2 + length;
    }
  } else {
    parseEmbeddedExif(view, output);
  }

  const latitude = gpsDecimal(output.GPSLatitude, output.GPSLatitudeRef);
  const longitude = gpsDecimal(output.GPSLongitude, output.GPSLongitudeRef);
  if (latitude !== undefined) output.latitude = latitude;
  if (longitude !== undefined) output.longitude = longitude;
  return output;
}
