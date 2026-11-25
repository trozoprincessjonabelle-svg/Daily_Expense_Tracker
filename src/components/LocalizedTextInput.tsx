import React from 'react';
import { TextInput as NativeTextInput, type TextInputProps } from 'react-native';
import { useTranslate } from '@/settings/SettingsContext';

export const LocalizedTextInput = React.forwardRef<React.ComponentRef<typeof NativeTextInput>, TextInputProps>(
  function LocalizedTextInput({ placeholder, accessibilityLabel, ...props }, ref) {
    const t = useTranslate();
    return (
      <NativeTextInput
        ref={ref}
        {...props}
        placeholder={placeholder ? t(placeholder) : placeholder}
        accessibilityLabel={accessibilityLabel ? t(accessibilityLabel) : accessibilityLabel}
      />
    );
  }
);
