import React from 'react';
import { Modal, View, Text, Image, Pressable, ScrollView, StyleSheet, Linking, SafeAreaView } from 'react-native';
import type { Channel } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { humanizeTime, formatFullDateTime } from '../utils/time';
import { useTheme } from '../hooks/useTheme';

interface StreamerModalProps {
  streamer: Channel | null;
  onClose: () => void;
}

export const StreamerModal: React.FC<StreamerModalProps> = ({ streamer, onClose }) => {
  const { t, language } = useLocalization();
  const { theme } = useTheme();

  if (!streamer) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!streamer}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Pressable style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <ScrollView>
              {streamer.banner_image && (
                <Image source={{ uri: streamer.banner_image }} style={styles.banner} />
              )}
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>X</Text>
              </Pressable>

              <View style={styles.contentContainer}>
                  <View style={styles.header}>
                    <Image source={{ uri: streamer.profile_pic || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                    <View>
                        <Text style={[styles.displayName, { color: theme.colors.textTitle }]}>{streamer.display_name}</Text>
                    </View>
                  </View>
                  
                  {streamer.bio && (
                      <View style={styles.section}>
                           <Text style={[styles.sectionTitle, {color: theme.colors.textTitle}]}>{t('bio')}</Text>
                           <Text style={[styles.sectionContent, {color: theme.colors.textBody}]}>"{streamer.bio}"</Text>
                      </View>
                  )}
              </View>
            </ScrollView>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    banner: {
        width: '100%',
        height: 120,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    contentContainer: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: -40,
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#fff',
        marginRight: 16,
    },
    displayName: {
        fontSize: 24,
        fontFamily: 'Inter_700Bold',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        marginBottom: 8,
    },
    sectionContent: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
    }
});
