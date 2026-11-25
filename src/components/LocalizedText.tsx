import React from 'react';
import { Text as NativeText, type TextProps } from 'react-native';
import { useTranslate } from '@/settings/SettingsContext';

type LocalizedTextProps = TextProps & { translate?: boolean };

export const LocalizedText = React.forwardRef<NativeText, LocalizedTextProps>(
  function LocalizedText({ children, translate = true, ...props }, ref) {
    const t = useTranslate();
    const translatedChildren = translate
      ? React.Children.map(children, (child) => typeof child === 'string' ? t(child) : child)
      : children;
    return (
      <NativeText ref={ref} {...props}>
        {translatedChildren}
      </NativeText>
    );
  }
);
