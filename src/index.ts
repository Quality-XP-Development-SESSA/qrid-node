const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

export interface QRIdPayload {
  v: number;
  code: string;
  id: string;
  company: string;
  email: string;
  address: string;
}

/**
 * Decode a base64-encoded QR ID string into its structured payload.
 *
 * Mirrors QRId\Codec::decodeQRId() in qrid/codec (PHP).
 *
 * @throws TypeError   When the base64 input is malformed.
 * @throws SyntaxError When the decoded content is not valid JSON.
 */
export function decodeQRId(encoded: string): QRIdPayload {
  const trimmed = encoded.trim();

  if (!BASE64_RE.test(trimmed)) {
    throw new TypeError(
      'Invalid base64 input: could not decode the provided string.',
    );
  }

  const json = Buffer.from(trimmed, 'base64').toString('utf8');
  return JSON.parse(json) as QRIdPayload;
}

/**
 * Encode invoice identity fields and return an SVG QR code string.
 *
 * Mirrors QRId\Codec::encodeQRId() in qrid/codec (PHP).
 * Requires the optional peer dependency: npm install qrcode
 *
 * @throws Error When the `qrcode` peer dependency is not installed.
 */
export async function encodeQRId(
  code: string,
  id: string,
  company: string,
  email: string,
  address: string,
): Promise<string> {
  let qrcode: typeof import('qrcode');
  try {
    qrcode = await import('qrcode');
  } catch {
    throw new Error(
      'qrcode is required for encodeQRId(). Install with: npm install qrcode',
    );
  }

  const payload: QRIdPayload = { v: 1, code, id, company, email, address };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

  return qrcode.toString(encoded, { type: 'svg' });
}
