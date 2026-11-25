import React from 'react';
import { ScrollView, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import type { LegalDoc } from '@/legal/content';
import { useTheme } from '@/theme';

/** Displays a legal document for reference. */
export function LegalDocView({ doc }: { doc: LegalDoc }) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          Effective {doc.effective}
        </Text>
        {doc.sections.map((section) => (
          <React.Fragment key={section.heading}>
            <Text
              style={{
                color: theme.text,
                fontSize: 16,
                fontWeight: '700',
                marginTop: 16,
                marginBottom: 6,
              }}
            >
              {section.heading}
            </Text>
            {section.body.map((paragraph, i) => (
              <Text
                key={i}
                style={{
                  color: theme.text,
                  fontSize: 15,
                  lineHeight: 22,
                  marginBottom: 8,
                }}
              >
                {paragraph}
              </Text>
            ))}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}
