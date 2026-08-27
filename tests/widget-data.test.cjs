const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = function transpileTypeScript(module, filename) {
  const source = require('node:fs').readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveProjectAlias(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    return resolveFilename(path.resolve(__dirname, '../src', request.slice(2)), parent, isMain, options);
  }
  return resolveFilename(request, parent, isMain, options);
};

const widgetDataModulePath = path.resolve(
  __dirname,
  '../src/services/background/widgetData.ts',
);

test('widget verisi ekleme, fiyat güncelleme ve silme anlık görüntüsünü doğru yansıtmalı', () => {
  const { buildWidgetData } = require(widgetDataModulePath);
  const now = new Date('2026-08-23T10:00:00.000Z');
  const base = {
    baseCurrency: 'TRY',
    currencySymbol: '₺',
    isTurkish: true,
    now,
    rates: { TRY: 1, USD: 0.03, EUR: 0.027 },
  };

  const netflix = {
    id: 'netflix',
    name: 'Netflix',
    amount: 200,
    currency: 'TRY',
    billingCycle: 'monthly',
    renewalDate: '2026-08-25T10:00:00.000Z',
    status: 'active',
  };
  const yearly = {
    id: 'yearly',
    name: 'Yıllık servis',
    amount: 1200,
    currency: 'TRY',
    billingCycle: 'yearly',
    renewalDate: '2026-09-10T10:00:00.000Z',
    status: 'active',
  };

  const afterAdd = buildWidgetData({ ...base, subscriptions: [netflix, yearly] });
  assert.equal(afterAdd.monthlyTotal, '₺300.00');
  assert.equal(afterAdd.activeCount, 2);
  assert.equal(afterAdd.nextPaymentName, 'Netflix');

  const afterPriceUpdate = buildWidgetData({
    ...base,
    subscriptions: [{ ...netflix, amount: 350 }, yearly],
  });
  assert.equal(afterPriceUpdate.monthlyTotal, '₺450.00');

  const afterDelete = buildWidgetData({ ...base, subscriptions: [yearly] });
  assert.equal(afterDelete.monthlyTotal, '₺100.00');
  assert.equal(afterDelete.activeCount, 1);
  assert.equal(afterDelete.nextPaymentName, 'Yıllık servis');
});

test('widget duraklatılmış abonelikleri toplam ve sıradaki ödemeden çıkarmalı', () => {
  const { buildWidgetData } = require(widgetDataModulePath);
  const data = buildWidgetData({
    subscriptions: [
      {
        id: 'paused',
        name: 'Duraklatılmış',
        amount: 999,
        currency: 'TRY',
        billingCycle: 'monthly',
        renewalDate: '2026-08-24T10:00:00.000Z',
        status: 'paused',
      },
    ],
    baseCurrency: 'TRY',
    currencySymbol: '₺',
    isTurkish: true,
    now: new Date('2026-08-23T10:00:00.000Z'),
    rates: { TRY: 1, USD: 0.03, EUR: 0.027 },
  });

  assert.equal(data.monthlyTotal, '₺0.00');
  assert.equal(data.activeCount, 0);
  assert.equal(data.nextPaymentName, 'Yaklaşan ödeme yok');
});

test('widget aktif deneme bitişini yenilemeden önceki sıradaki ödeme olarak göstermeli', () => {
  const { buildWidgetData } = require(widgetDataModulePath);
  const data = buildWidgetData({
    subscriptions: [{
      name: 'Deneme servisi',
      amount: 120,
      currency: 'TRY',
      billingCycle: 'monthly',
      renewalDate: '2026-10-15T10:00:00.000Z',
      isTrial: true,
      trialEndDate: '2026-08-25T10:00:00.000Z',
      status: 'active',
    }],
    baseCurrency: 'TRY',
    currencySymbol: '₺',
    isTurkish: true,
    now: new Date('2026-08-23T10:00:00.000Z'),
    rates: { TRY: 1, USD: 0.03, EUR: 0.027 },
  });

  assert.equal(data.nextPaymentName, 'Deneme servisi');
  assert.equal(data.nextPaymentDate, new Date('2026-08-25T10:00:00.000Z').toLocaleDateString('tr-TR', {
    month: 'short',
    day: 'numeric',
  }));
  assert.equal(data.nextPaymentMeta, '2 gün sonra');
});
