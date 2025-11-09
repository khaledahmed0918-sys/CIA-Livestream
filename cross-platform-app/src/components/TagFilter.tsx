import React, { useState, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, FlatList, TextInput, SafeAreaView, Platform } from 'react-native';
import { useLocalization } from '../hooks/useLocalization';
import { useTheme } from '../hooks/useTheme';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  tagCounts: { [key: string]: number };
}

export const TagFilter: React.FC<TagFilterProps> = ({ allTags, selectedTags, onSelectedTagsChange, tagCounts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLocalization();
  const { theme } = useTheme();

  const toggleTag = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onSelectedTagsChange(newSelectedTags);
  };

  const filteredTags = useMemo(() => allTags
    .filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0) || a.localeCompare(b)),
    [allTags, searchTerm, tagCounts]
  );

  const getButtonLabel = () => {
    if (selectedTags.length === 0) return t('filterByTags');
    if (selectedTags.length === 1) return selectedTags[0];
    return t('tagsSelected', { count: selectedTags.length });
  };

  const renderModalContent = () => (
    <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.modalHeader}>
         <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={t('searchTags')}
            placeholderTextColor={theme.colors.textBody}
            style={[styles.searchInput, { backgroundColor: theme.colors.cardBg, color: theme.colors.textStreamer }]}
          />
        <Pressable onPress={() => setIsOpen(false)}>
            <Text style={{color: theme.colors.textTitle, fontFamily: 'Inter_600SemiBold'}}>{t('close')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredTags}
        keyExtractor={item => item}
        renderItem={({ item: tag }) => {
            const isSelected = selectedTags.includes(tag);
            return (
                <Pressable onPress={() => toggleTag(tag)} style={styles.tagItem}>
                    <View style={styles.tagInfo}>
                        <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : {borderColor: theme.colors.textBody}]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[styles.tagName, {color: theme.colors.textStreamer}]}>{tag}</Text>
                    </View>
                    <Text style={[styles.tagCount, {color: theme.colors.textBody}]}>{tagCounts[tag] || 0}</Text>
                </Pressable>
            )
        }}
      />
      {selectedTags.length > 0 && (
         <Pressable onPress={() => onSelectedTagsChange([])} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>{t('clearAll')}</Text>
         </Pressable>
      )}
    </SafeAreaView>
  );

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={[styles.button, { backgroundColor: theme.colors.cardBg }]}
      >
        <Text style={[styles.buttonText, { color: theme.colors.textStreamer }]} numberOfLines={1}>{getButtonLabel()}</Text>
        <Text style={{color: theme.colors.textStreamer}}>▼</Text>
      </Pressable>
      
      {Platform.OS !== 'web' && (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isOpen}
            onRequestClose={() => setIsOpen(false)}
        >
            {renderModalContent()}
        </Modal>
      )}

      {Platform.OS === 'web' && isOpen && (
          <View style={[styles.webDropdown, { backgroundColor: theme.colors.background, borderColor: 'rgba(255,255,255,0.1)'}]}>
              {renderModalContent()}
          </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  searchInput: {
      flex: 1,
      height: 40,
      paddingHorizontal: 16,
      borderRadius: 20,
      fontSize: 16,
  },
  tagItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
  },
  checkboxSelected: {
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6'
  },
  checkmark: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
  },
  tagName: {
    fontSize: 16
  },
  tagCount: {
    fontSize: 14
  },
  clearButton: {
      padding: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#ccc'
  },
  clearButtonText: {
      color: '#3b82f6',
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold'
  },
  webDropdown: {
      position: 'absolute',
      top: '110%',
      width: '100%',
      maxHeight: 400,
      borderRadius: 8,
      borderWidth: 1,
      zIndex: 1000,
  }
});
