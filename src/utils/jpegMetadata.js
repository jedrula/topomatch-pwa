// Carry a JPEG's metadata across a canvas re-encode.
//
// Resizing a photo through createImageBitmap -> OffscreenCanvas -> convertToBlob keeps the
// pixels and throws away everything else: the canvas knows nothing about the file it came
// from, so the output is a bare JPEG with no EXIF and no XMP. Everything the camera told us
// about how the shot was taken dies there.
//
// That is expensive, not merely untidy. A DJI JPEG carries the gimbal orientation, the flight
// yaw, the relative altitude and the GPS fix in its XMP -- gravity and metric scale, exactly,
// for free -- and an ordinary phone JPEG carries the focal length, which is a camera intrinsics
// prior. Having discarded all of it we then spend a reconstruction and a good deal of geometry
// re-deriving a worse version of the same numbers from the images themselves.
//
// So: lift the metadata segments off the original file and splice them into the re-encoded one.
// Working at the segment level rather than through a parser means we carry whatever the camera
// wrote, including maker notes and vendor XMP we have no schema for, instead of only the tags
// some library happens to model.

const SOI = 0xd8;
const SOS = 0xda;
const APP0 = 0xe0;
const EOI = 0xd9;

/** Markers worth carrying: APP1 (EXIF, XMP), APP2 (ICC profile, MPF), APP13 (IPTC/Photoshop). */
const CARRY = new Set([0xe1, 0xe2, 0xed]);

/**
 * Split a JPEG into its marker segments, stopping at the compressed scan data.
 * Returns null if the buffer is not a JPEG.
 */
function readSegments(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== SOI) return null;
  const segs = [];
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) break;             // desynchronised; give up rather than guess
    const marker = bytes[i + 1];
    if (marker === SOS || marker === EOI) break;
    // Standalone markers (RSTn, TEM) carry no length field.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (len < 2 || i + 2 + len > bytes.length) break;
    segs.push({ marker, start: i, end: i + 2 + len });
    i += 2 + len;
  }
  return segs;
}

/**
 * Reconcile the EXIF tags that describe the pixels with the pixels we actually have.
 *
 * Everything else in the segment describes the SHOT -- focal length, gimbal, GPS, exposure --
 * and is just as true of a resized copy. Three tags describe the FILE and would be lies if
 * carried across unchanged:
 *
 *   Orientation (0x0112)      createImageBitmap already applied it, so the canvas pixels are
 *                             upright; carrying it tells the next reader to rotate an
 *                             already-rotated image.
 *   ExifImageWidth  (0xA002)  the original pixel dimensions, which a downstream consumer may
 *   ExifImageHeight (0xA003)  reasonably trust over the JPEG's own SOF -- and which is how a
 *                             wrong focal-length-in-pixels gets computed.
 *
 * All three are inline values of at most four bytes, so they are rewritten in place: the
 * segment keeps its exact length and every offset inside it stays valid, which is what makes
 * this safe without re-serialising the whole IFD.
 */
function reconcileExif(bytes, segStart, segEnd, width, height) {
  // APP1 payload: "Exif\0\0" then a TIFF header at `tiff`.
  const p = segStart + 4;
  const isExif = bytes[p] === 0x45 && bytes[p + 1] === 0x78 &&
                 bytes[p + 2] === 0x69 && bytes[p + 3] === 0x66;
  if (!isExif) return;
  const tiff = p + 6;
  if (tiff + 8 > segEnd) return;
  const le = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
  const u16 = (o) => (le ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1]);
  const u32 = (o) => (le
    ? (bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)) >>> 0
    : ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0);
  if (u16(tiff + 2) !== 42) return;

  const setU16 = (o, v) => {
    if (le) { bytes[o] = v & 0xff; bytes[o + 1] = (v >> 8) & 0xff; }
    else { bytes[o] = (v >> 8) & 0xff; bytes[o + 1] = v & 0xff; }
  };
  const setU32 = (o, v) => {
    if (le) {
      bytes[o] = v & 0xff; bytes[o + 1] = (v >> 8) & 0xff;
      bytes[o + 2] = (v >> 16) & 0xff; bytes[o + 3] = (v >>> 24) & 0xff;
    } else {
      bytes[o] = (v >>> 24) & 0xff; bytes[o + 1] = (v >> 16) & 0xff;
      bytes[o + 2] = (v >> 8) & 0xff; bytes[o + 3] = v & 0xff;
    }
  };
  // Write a count-1 integer into its inline value slot, honouring the tag's declared type.
  const setInline = (e, v) => {
    const type = u16(e + 2);
    if (u32(e + 4) !== 1) return;
    if (type === 3) { setU16(e + 8, v); setU16(e + 10, 0); }
    else if (type === 4) setU32(e + 8, v);
  };

  // IFD0, then the Exif sub-IFD it points at. Walking both is necessary: Orientation lives in
  // IFD0 while the pixel dimensions live in the sub-IFD.
  const walk = (ifd) => {
    if (ifd + 2 > segEnd) return;
    const n = u16(ifd);
    if (ifd + 2 + n * 12 > segEnd) return;
    for (let k = 0; k < n; k++) {
      const e = ifd + 2 + k * 12;
      const tag = u16(e);
      if (tag === 0x0112) setInline(e, 1);                    // Orientation
      else if (tag === 0xa002) setInline(e, width);           // ExifImageWidth
      else if (tag === 0xa003) setInline(e, height);          // ExifImageHeight
      else if (tag === 0x8769) walk(tiff + u32(e + 8));       // Exif sub-IFD pointer
    }
  };
  walk(tiff + u32(tiff + 4));
}

/**
 * Return a Blob holding `resizedBlob`'s pixels and `originalFile`'s metadata.
 *
 * `width`/`height` are the resized dimensions, used to correct the EXIF tags that describe the
 * file rather than the shot.
 *
 * Falls back to the resized blob unchanged when either side is not a JPEG we can parse -- a
 * photo whose metadata we cannot carry must still upload, and losing the tags is no worse than
 * today's behaviour.
 */
export async function copyJpegMetadata(originalFile, resizedBlob, width, height) {
  const src = new Uint8Array(await originalFile.arrayBuffer());
  const dst = new Uint8Array(await resizedBlob.arrayBuffer());
  const srcSegs = readSegments(src);
  const dstSegs = readSegments(dst);
  if (!srcSegs || !dstSegs) return resizedBlob;

  const carried = srcSegs.filter((s) => CARRY.has(s.marker));
  if (!carried.length) return resizedBlob;

  const parts = [];
  for (const s of carried) {
    const slice = src.slice(s.start, s.end);
    if (s.marker === 0xe1) reconcileExif(slice, 0, slice.length, width, height);
    parts.push(slice);
  }

  // EXIF belongs immediately after SOI, or immediately after the JFIF APP0 when the encoder
  // wrote one -- which every canvas encoder does. Inserting before APP0 instead produces a
  // file some readers reject outright.
  const first = dstSegs[0];
  const insertAt = first && first.marker === APP0 ? first.end : 2;

  const carriedLen = parts.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(dst.length + carriedLen);
  out.set(dst.subarray(0, insertAt), 0);
  let o = insertAt;
  for (const part of parts) { out.set(part, o); o += part.length; }
  out.set(dst.subarray(insertAt), o);
  return new Blob([out], { type: 'image/jpeg' });
}
