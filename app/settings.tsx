import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isPublic, setIsPublic] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your recipes, reviews, and data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/auth');
          },
        },
      ],
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change will be available in a future update.');
  };

  type SettingRow = {
    icon: string;
    label: string;
    type: 'nav' | 'toggle' | 'danger';
    value?: boolean;
    onToggle?: (v: boolean) => void;
    onPress?: () => void;
  };

  const sections: { title: string; items: SettingRow[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          label: 'Edit Profile',
          type: 'nav',
          onPress: () => router.push('/edit-profile'),
        },
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          type: 'nav',
          onPress: handleChangePassword,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Push Notifications',
          type: 'toggle',
          value: pushNotifs,
          onToggle: setPushNotifs,
        },
        {
          icon: 'mail-outline',
          label: 'Email Notifications',
          type: 'toggle',
          value: emailNotifs,
          onToggle: setEmailNotifs,
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          icon: 'eye-outline',
          label: 'Public Profile',
          type: 'toggle',
          value: isPublic,
          onToggle: setIsPublic,
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          icon: 'trash-outline',
          label: 'Delete Account',
          type: 'danger',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}
                onPress={item.type === 'toggle' ? undefined : item.onPress}
                activeOpacity={item.type === 'toggle' ? 1 : 0.7}
              >
                <View style={styles.rowLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.type === 'danger' ? Colors.heart : Colors.text}
                  />
                  <Text
                    style={[styles.rowLabel, item.type === 'danger' && styles.dangerLabel]}
                  >
                    {item.label}
                  </Text>
                </View>
                {item.type === 'toggle' && (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ true: Colors.primary }}
                  />
                )}
                {item.type === 'nav' && (
                  <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Chef'd v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  section: { marginTop: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  dangerLabel: {
    color: Colors.heart,
  },
  logoutBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.heart,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.heart,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
  },
});
