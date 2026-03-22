import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState(user?.avatarUri ?? null);
  const [busy, setBusy] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const src = result.assets[0].uri;
    const base = documentDirectory;
    let dest = src;
    if (base) {
      dest = `${base}avatar-${user?.id ?? 'u'}-${Date.now()}.jpg`;
      await copyAsync({ from: src, to: dest });
    }
    setAvatarUri(dest);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const res = await updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim(),
        avatarUri: avatarUri ?? undefined,
      });
      if (!res.ok) {
        Alert.alert('Error', res.message);
      } else {
        router.back();
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.avatarSection} onPress={pickPhoto} activeOpacity={0.8}>
        <Avatar uri={avatarUri} size={90} />
        <Text style={styles.changePhoto}>Change Photo</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        placeholderTextColor={Colors.textTertiary}
        maxLength={50}
      />

      <Text style={styles.label}>Username</Text>
      <View style={[styles.input, styles.readOnly]}>
        <Text style={styles.readOnlyText}>@{user?.username ?? '—'}</Text>
      </View>

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, 200))}
        placeholder="Tell us about yourself..."
        placeholderTextColor={Colors.textTertiary}
        multiline
        maxLength={200}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{bio.length}/200</Text>

      <TouchableOpacity
        style={[styles.saveBtn, busy && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={busy}
        activeOpacity={0.8}
      >
        {busy ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appCanvas },
  content: { padding: Spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  changePhoto: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  readOnly: { backgroundColor: Colors.surfaceElevated },
  readOnlyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', fontFamily: Fonts.bodyBold },
});
