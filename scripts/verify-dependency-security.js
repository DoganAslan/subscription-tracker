const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

const metroDirectory = dirname(require.resolve('metro'));
const imageSizeEntry = require.resolve('image-size', { paths: [metroDirectory] });
const imageSizePackage = JSON.parse(
  readFileSync(join(dirname(imageSizeEntry), '..', 'package.json'), 'utf8'),
);

assert.equal(
  imageSizePackage.name,
  'image-size-next',
  'Metro must resolve the security-maintained image-size fork.',
);
assert.equal(
  imageSizePackage.version,
  '1.2.2',
  'Review the image parser security tests before changing the pinned fork version.',
);

const craftedPayloads = {
  heifZeroSizeBox: [
    0x00, 0x00, 0x00, 0x00,
    0x66, 0x74, 0x79, 0x70,
    0x61, 0x76, 0x69, 0x66,
  ],
  icnsZeroLengthEntry: [
    0x69, 0x63, 0x6e, 0x73,
    0x00, 0x00, 0x00, 0x10,
    0x69, 0x63, 0x30, 0x37,
    0x00, 0x00, 0x00, 0x00,
  ],
  jxlZeroSizeBox: [
    0x00, 0x00, 0x00, 0x00,
    0x4a, 0x58, 0x4c, 0x20,
  ],
};

for (const [name, payload] of Object.entries(craftedPayloads)) {
  const childCode = `
    const { imageSize } = require(${JSON.stringify(imageSizeEntry)});
    try { imageSize(Uint8Array.from(${JSON.stringify(payload)})); } catch {}
  `;
  const result = spawnSync(process.execPath, ['-e', childCode], {
    encoding: 'utf8',
    timeout: 2_000,
    windowsHide: true,
  });

  assert.notEqual(
    result.error?.code,
    'ETIMEDOUT',
    `${name} triggered an image parser infinite loop.`,
  );
  assert.equal(
    result.status,
    0,
    `${name} parser regression failed: ${result.stderr || result.error?.message || 'unknown error'}`,
  );
}

console.log('✅ Dependency security regression checks passed.');
