import * as iosWidgetSync from '@/services/background/widgetSync.ios';
import * as webWidgetSync from '@/services/background/widgetSync.web';

const adapters = [iosWidgetSync, webWidgetSync];

describe.each(adapters)('non-Android widget adapter', adapter => {
  it('keeps the shared contract without doing native work', async () => {
    expect(adapter.BACKGROUND_WIDGET_SYNC_TASK).toBe('BACKGROUND_WIDGET_SYNC_TASK');
    await expect(adapter.updateWidgetData([], 'TRY', 'tr')).resolves.toBeNull();
    await expect(adapter.clearWidgetData('TRY', 'tr')).resolves.toBeUndefined();
    await expect(adapter.triggerWidgetSync('user-1')).resolves.toBeUndefined();
    await expect(adapter.registerBackgroundSync()).resolves.toBeUndefined();
    expect(adapter.resetWidgetSync()).toBeUndefined();
  });
});
