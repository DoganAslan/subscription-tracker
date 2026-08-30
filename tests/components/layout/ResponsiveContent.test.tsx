import { render } from '@testing-library/react-native';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { ResponsiveContent } from '@/components/layout/ResponsiveContent';

jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  const mockedReactNative = Object.create(reactNative);

  Object.defineProperty(mockedReactNative, 'useWindowDimensions', {
    enumerable: true,
    value: jest.fn(),
  });

  return mockedReactNative;
});

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<typeof useWindowDimensions>;

describe('ResponsiveContent', () => {
  afterEach(() => {
    mockUseWindowDimensions.mockReset();
  });

  it.each([
    { width: 375, gutter: 16 },
    { width: 820, gutter: 24 },
  ])('centers content with the correct $width px gutter', async ({ width, gutter }) => {
    mockUseWindowDimensions.mockReturnValue({
      width,
      height: 900,
      scale: 1,
      fontScale: 1,
    });

    const result = await render(
      <ResponsiveContent testID="responsive-content" style={{ backgroundColor: '#123456' }}>
        <Text>Subscription content</Text>
      </ResponsiveContent>,
    );

    const content = result.getByTestId('responsive-content');
    const style = StyleSheet.flatten(content.props.style);

    expect(style).toEqual(expect.objectContaining({
      alignSelf: 'center',
      backgroundColor: '#123456',
      maxWidth: 1180,
      paddingHorizontal: gutter,
      width: '100%',
    }));
    expect(result.getByText('Subscription content')).toBeTruthy();
  });
});
