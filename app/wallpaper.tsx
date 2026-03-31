import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Colors } from '../constants/Colors';
import { useVerse } from '../context/VerseContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Download } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

export default function Wallpaper() {
  const [isDark, setIsDark] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const viewShotRef = useRef<ViewShot>(null);
  
  const { t } = useLanguage();
  const { colors: appColors } = useTheme();
  const { currentVerse: dailyVerse } = useVerse();

  const handleSave = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant photo gallery permission to save the wallpaper.');
          return;
        }
      }

      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'Wallpaper saved to your gallery!');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save wallpaper.');
    }
  };

  const wpColors = isDark ? Colors.dark : Colors.light;
  
  const bg = wpColors.background;
  const textPrimary = wpColors.primary;
  const textSecondary = wpColors.text;
  const border = wpColors.border;

  return (
    <View style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.header, { borderBottomColor: appColors.border }]}>
        <Text style={[styles.headerTitle, { color: appColors.primary }]}>{t('nav.wallpaper')}</Text>
      </View>

      <View style={styles.previewContainer}>
        <View style={styles.shadowWrapper}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={[styles.canvas, { backgroundColor: bg, borderColor: border }]}>
              <View style={styles.canvasContent}>
                <Text style={[styles.canvasArabic, { color: textPrimary }]}>{dailyVerse.arabic}</Text>
                
                <View style={[styles.canvasRefContainer, { opacity: 0.6 }]}>
                  <View style={[styles.canvasLine, { backgroundColor: textPrimary }]} />
                  <Text style={[styles.canvasRef, { color: wpColors.accent }]}>{dailyVerse.reference}</Text>
                  <View style={[styles.canvasLine, { backgroundColor: textPrimary }]} />
                </View>

                {showTranslation && (
                  <Text style={[styles.canvasTranslation, { color: textSecondary }]}>"{dailyVerse.translation}"</Text>
                )}
              </View>
              
              <View style={styles.canvasFooter}>
                <Text style={[styles.canvasBrand, { color: textSecondary }]}>sakinah</Text>
              </View>
            </View>
          </ViewShot>
        </View>
      </View>

      <View style={[styles.controls, { borderTopColor: appColors.border, backgroundColor: appColors.card }]}>
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: appColors.text }]}>{t('wallpaper.dark')}</Text>
          <Switch 
            value={isDark} 
            onValueChange={setIsDark} 
            trackColor={{ true: appColors.primary, false: appColors.cardBorder }}
            thumbColor={isDark ? appColors.background : '#f4f3f4'}
          />
        </View>

        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: appColors.text }]}>{t('wallpaper.translation')}</Text>
          <Switch 
            value={showTranslation} 
            onValueChange={setShowTranslation}
            trackColor={{ true: appColors.primary, false: appColors.cardBorder }}
            thumbColor={showTranslation ? appColors.background : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: appColors.primary, shadowColor: appColors.primary }]} onPress={handleSave}>
          <Download size={20} color={appColors.background} strokeWidth={2.5} />
          <Text style={[styles.saveBtnText, { color: appColors.background }]}>{t('wallpaper.save')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 16,
    paddingTop: 32,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shadowWrapper: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  canvas: {
    width: 216,
    height: 384,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  canvasContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  canvasArabic: {
    fontFamily: 'serif',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 24,
    writingDirection: 'rtl',
  },
  canvasRefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  canvasLine: {
    width: 24,
    height: 1,
  },
  canvasRef: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  canvasTranslation: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  canvasFooter: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  canvasBrand: {
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  controls: {
    padding: 24,
    paddingBottom: 120,
    gap: 16,
    borderTopWidth: 1,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 30,
    marginTop: 8,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
