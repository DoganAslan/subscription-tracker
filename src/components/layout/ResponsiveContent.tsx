import type { PropsWithChildren } from 'react';
import { StyleProp, useWindowDimensions, View, ViewStyle } from 'react-native';
import { getResponsiveLayout } from './responsiveLayout';

interface Props extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ResponsiveContent = ({ children, style, testID }: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <View
      testID={testID}
      style={[
        {
          alignSelf: 'center',
          maxWidth: layout.contentMaxWidth,
          paddingHorizontal: layout.gutter,
          width: '100%',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
