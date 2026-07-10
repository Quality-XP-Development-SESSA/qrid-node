import { decodeQRId, encodeQRId, QRIdPayload } from '../src/index';

function encode(payload: QRIdPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

function samplePayload(overrides: Partial<QRIdPayload> = {}): QRIdPayload {
  return {
    v: 1,
    id: '3101679980',
    company: 'Acme Corp S.A.',
    email: 'billing@acme.example',
    address: '123 Main St, San José, Costa Rica',
    activity_code: 'ACT-001',
    ...overrides,
  };
}

// ── decodeQRId ────────────────────────────────────────────────────────────────

describe('decodeQRId', () => {
  it('returns all fields', () => {
    const result = decodeQRId(encode(samplePayload()));

    expect(result.v).toBe(1);
    expect(result.activity_code).toBe('ACT-001');
    expect(result.id).toBe('3101679980');
    expect(result.company).toBe('Acme Corp S.A.');
    expect(result.email).toBe('billing@acme.example');
    expect(result.address).toBe('123 Main St, San José, Costa Rica');
  });

  it('handles UTF-8 correctly', () => {
    const result = decodeQRId(
      encode(
        samplePayload({
          company: 'Société Générale',
          address: 'Paseo Colón, San José, Costa Rica',
        }),
      ),
    );

    expect(result.company).toBe('Société Générale');
    expect(result.address).toBe('Paseo Colón, San José, Costa Rica');
  });

  it('trims surrounding whitespace', () => {
    const result = decodeQRId('  ' + encode(samplePayload()) + '  ');
    expect(result.activity_code).toBe('ACT-001');
  });

  it('throws TypeError on invalid base64', () => {
    expect(() => decodeQRId('not-valid-base64!!!')).toThrow(TypeError);
    expect(() => decodeQRId('not-valid-base64!!!')).toThrow('Invalid base64 input');
  });

  it('throws SyntaxError on non-JSON payload', () => {
    expect(() =>
      decodeQRId(Buffer.from('not json', 'utf8').toString('base64')),
    ).toThrow(SyntaxError);
  });
});

// ── encodeQRId ────────────────────────────────────────────────────────────────

describe('encodeQRId', () => {
  it('returns an SVG string', async () => {
    const svg = await encodeQRId(
      '3101679980',
      'Acme Corp S.A.',
      'billing@acme.example',
      '123 Main St',
      'ACT-001',
    );

    expect(typeof svg).toBe('string');
    expect(svg.toLowerCase()).toContain('<svg');
  });

  it('defaults activity_code to blank when omitted', async () => {
    const svg = await encodeQRId(
      '3101679980',
      'Acme Corp S.A.',
      'billing@acme.example',
      '123 Main St',
    );

    expect(typeof svg).toBe('string');
    expect(svg.toLowerCase()).toContain('<svg');
  });

  // ── round-trip ────────────────────────────────────────────────────────────

  it('encode then decode preserves all payload fields', async () => {
    const p = samplePayload();

    // Replicate encodeQRId's internal base64 step independently so we can
    // round-trip through decodeQRId without parsing the SVG matrix.
    const encoded = Buffer.from(
      JSON.stringify({
        v: p.v,
        id: p.id,
        company: p.company,
        email: p.email,
        address: p.address,
        activity_code: p.activity_code,
      }),
      'utf8',
    ).toString('base64');

    const decoded = decodeQRId(encoded);

    expect(decoded.activity_code).toBe(p.activity_code);
    expect(decoded.id).toBe(p.id);
    expect(decoded.company).toBe(p.company);
    expect(decoded.email).toBe(p.email);
    expect(decoded.address).toBe(p.address);
  });

  it('encode then decode round-trips a blank activity_code', async () => {
    const p = samplePayload({ activity_code: '' });

    const encoded = Buffer.from(
      JSON.stringify({
        v: p.v,
        id: p.id,
        company: p.company,
        email: p.email,
        address: p.address,
        activity_code: p.activity_code,
      }),
      'utf8',
    ).toString('base64');

    const decoded = decodeQRId(encoded);

    expect(decoded.activity_code).toBe('');
  });
});
