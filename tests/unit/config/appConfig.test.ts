import appConfig from '../../../app.config';

describe('Expo iOS Firebase configuration', () => {
  const previousPlistPath = process.env.GOOGLE_SERVICES_INFO_PLIST;

  afterEach(() => {
    if (previousPlistPath === undefined) {
      delete process.env.GOOGLE_SERVICES_INFO_PLIST;
    } else {
      process.env.GOOGLE_SERVICES_INFO_PLIST = previousPlistPath;
    }
  });

  it('uses the local ignored plist for local Expo commands', () => {
    delete process.env.GOOGLE_SERVICES_INFO_PLIST;

    const config = appConfig({
      config: {
        name: 'SubMate',
        slug: 'submate',
        ios: { bundleIdentifier: 'com.doganaslan.submate' },
      },
    } as Parameters<typeof appConfig>[0]);

    expect(config.ios).toEqual(expect.objectContaining({
      bundleIdentifier: 'com.doganaslan.submate',
      googleServicesFile: './GoogleService-Info.plist',
    }));
  });

  it('uses the EAS file environment path when one is provided', () => {
    process.env.GOOGLE_SERVICES_INFO_PLIST = '/eas/secret/GoogleService-Info.plist';

    const config = appConfig({
      config: {
        name: 'SubMate',
        slug: 'submate',
        ios: { bundleIdentifier: 'com.doganaslan.submate' },
      },
    } as Parameters<typeof appConfig>[0]);

    expect(config.ios?.googleServicesFile).toBe('/eas/secret/GoogleService-Info.plist');
  });
});
