import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { QuranicVerse as VerseType } from '../data/quranicVerses';
import { useTheme } from '../hooks/useTheme';

interface QuranicVerseProps {
  verse: VerseType;
}

export const QuranicVerse: React.FC<QuranicVerseProps> = ({ verse }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.cardBg, borderColor: 'rgba(0,0,0,0.1)' }]}>
      <Text style={[styles.verseText, { color: theme.colors.textTitle }]}>
        {verse.verse}
      </Text>
      {verse.source && <Text style={[styles.sourceText, { color: theme.colors.textBody }]}>{verse.source}</Text>}
      {verse.interpretation && <Text style={[styles.interpretationText, { color: theme.colors.textBody }]}>{verse.interpretation}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 600,
        textAlign: 'center',
        marginVertical: 24,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    verseText: {
        fontSize: 24,
        fontFamily: 'NotoNaskhArabic_700Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    sourceText: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 12,
        textAlign: 'center',
    },
    interpretationText: {
        fontSize: 16,
        fontFamily: 'NotoNaskhArabic_400Regular',
        opacity: 0.8,
        textAlign: 'center',
    }
});
