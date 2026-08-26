const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildPortfolioContext,
  detectIntent,
  normalizeHistory,
} = require('../lib/aiCore.js');

test('portfolio context excludes paused items and reports evidence-based signals', () => {
  const now = Date.parse('2026-08-19T00:00:00.000Z');
  const context = buildPortfolioContext([
    {
      name: 'Active Music',
      amount: 1200,
      currency: 'TRY',
      billingCycle: 'yearly',
      category: 'Music',
      status: 'active',
      monthlyAmountInBaseCurrency: 100,
      usageFrequency: 'low',
      renewalDate: '2026-08-24T00:00:00.000Z',
    },
    {
      name: 'Paused Video',
      amount: 300,
      currency: 'TRY',
      billingCycle: 'monthly',
      category: 'Video',
      status: 'paused',
      monthlyAmountInBaseCurrency: 300,
    },
  ], 'TRY', now);

  assert.match(context, /Normalized monthly commitment: 100\.00 TRY/);
  assert.match(context, /low-or-no-usage commitment: 100\.00 TRY/);
  assert.match(context, /Active Music \(5 days\)/);
  assert.doesNotMatch(context, /Paused Video/);
});

test('intent detection supports Turkish and English requests', () => {
  assert.equal(detectIntent('Hangi aboneliği iptal etmeliyim?'), 'cancel_or_pause');
  assert.equal(detectIntent('Spotify vs Apple Music karşılaştır'), 'compare_services');
  assert.equal(detectIntent('How can I save money?'), 'reduce_spending');
});

test('history normalization removes welcome turns and duplicate current message', () => {
  const result = normalizeHistory([
    { sender: 'ai', text: 'Welcome' },
    { sender: 'user', text: 'Old question' },
    { sender: 'ai', text: 'Old answer' },
    { sender: 'user', text: 'Current question' },
  ], 'Current question');

  assert.deepEqual(result, [
    { role: 'user', parts: [{ text: 'Old question' }] },
    { role: 'model', parts: [{ text: 'Old answer' }] },
    { role: 'user', parts: [{ text: 'Current question' }] },
  ]);
});
