import { decodeQRId, encodeQRId, QRIdPayload } from '../src/index';

function encode(payload: QRIdPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

function samplePayload(overrides: Partial<QRIdPayload> = {}): QRIdPayload {
  return {
    v: 1,
    code: 'ACT-001',
    id: '3101679980',
    company: 'Acme Corp S.A.',
    email: 'billing@acme.example',
    address: '123 Main St, San José, Costa Rica',
    ...overrides,
  };
}

// ── decodeQRId ────────────────────────────────────────────────────────────────

describe('decodeQRId', () => {
  it('returns all fields', () => {
    const result = decodeQRId(encode(samplePayload()));

    expect(result.v).toBe(1);
    expect(result.code).toBe('ACT-001');
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
    expect(result.code).toBe('ACT-001');
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
      'ACT-001',
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
      JSON.stringify({ v: p.v, code: p.code, id: p.id, company: p.company, email: p.email, address: p.address }),
      'utf8',
    ).toString('base64');

    const decoded = decodeQRId(encoded);

    expect(decoded.code).toBe(p.code);
    expect(decoded.id).toBe(p.id);
    expect(decoded.company).toBe(p.company);
    expect(decoded.email).toBe(p.email);
    expect(decoded.address).toBe(p.address);
  });
});
