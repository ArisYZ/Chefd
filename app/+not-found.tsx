import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, Fonts } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back to feed</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  link: {
    marginTop: Spacing.lg,
  },
  linkText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
  },
});
