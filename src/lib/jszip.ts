interface GenerateOptions { type: "blob"; compression?: string; compressionOptions?: { level?: number } }

interface StoredFile { name: string; data: Blob | string }

const encoder = new TextEncoder();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(view: DataView, offset: number, value: number) { view.setUint16(offset, value, true); }
function write32(view: DataView, offset: number, value: number) { view.setUint32(offset, value >>> 0, true); }

export default class JSZip {
  private files: StoredFile[] = [];

  file(name: string, data: Blob | string) {
    this.files.push({ name, data });
    return this;
  }

  async generateAsync(_options: GenerateOptions): Promise<Blob> {
    const locals: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;

    for (const entry of this.files) {
      const name = encoder.encode(entry.name.replace(/^\/+/, ""));
      const data = typeof entry.data === "string" ? encoder.encode(entry.data) : new Uint8Array(await entry.data.arrayBuffer());
      const crc = crc32(data);

      const local = new Uint8Array(30 + name.length + data.length);
      const localView = new DataView(local.buffer);
      write32(localView, 0, 0x04034b50);
      write16(localView, 4, 20);
      write16(localView, 6, 0x0800);
      write16(localView, 8, 0);
      write16(localView, 10, 0);
      write16(localView, 12, 0);
      write32(localView, 14, crc);
      write32(localView, 18, data.length);
      write32(localView, 22, data.length);
      write16(localView, 26, name.length);
      write16(localView, 28, 0);
      local.set(name, 30);
      local.set(data, 30 + name.length);
      locals.push(local);

      const cd = new Uint8Array(46 + name.length);
      const cdView = new DataView(cd.buffer);
      write32(cdView, 0, 0x02014b50);
      write16(cdView, 4, 20);
      write16(cdView, 6, 20);
      write16(cdView, 8, 0x0800);
      write16(cdView, 10, 0);
      write16(cdView, 12, 0);
      write16(cdView, 14, 0);
      write32(cdView, 16, crc);
      write32(cdView, 20, data.length);
      write32(cdView, 24, data.length);
      write16(cdView, 28, name.length);
      write16(cdView, 30, 0);
      write16(cdView, 32, 0);
      write16(cdView, 34, 0);
      write16(cdView, 36, 0);
      write32(cdView, 38, 0);
      write32(cdView, 42, offset);
      cd.set(name, 46);
      central.push(cd);
      offset += local.length;
    }

    const centralSize = central.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    write32(endView, 0, 0x06054b50);
    write16(endView, 4, 0);
    write16(endView, 6, 0);
    write16(endView, 8, this.files.length);
    write16(endView, 10, this.files.length);
    write32(endView, 12, centralSize);
    write32(endView, 16, offset);
    write16(endView, 20, 0);

    const parts: BlobPart[] = [...locals, ...central, end].map((bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    return new Blob(parts, { type: "application/zip" });
  }
}
