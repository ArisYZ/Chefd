import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MakeAgain } from '@/types';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';

interface ReviewModalProps {
  visible: boolean;
  recipeName: string;
  onClose: () => void;
  onSubmit: (review: { makeAgain: MakeAgain; difficulty: number; comment: string }) => void;
}

const MAKE_AGAIN_OPTIONS: { value: MakeAgain; icon: string; label: string; color: string }[] = [
  { value: 'yes', icon: 'checkmark-circle', label: 'Yes', color: '#2E7D32' },
  { value: 'maybe', icon: 'help-circle', label: 'Maybe', color: '#F9A825' },
  { value: 'no', icon: 'close-circle', label: 'No', color: '#C62828' },
];

export function ReviewModal({ visible, recipeName, onClose, onSubmit }: ReviewModalProps) {
  const [makeAgain, setMakeAgain] = useState<MakeAgain | null>(null);
  const [difficulty, setDifficulty] = useState<number>(0);
  const [comment, setComment] = useState('');

  const canSubmit = makeAgain !== null && difficulty > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ makeAgain: makeAgain!, difficulty, comment });
    setMakeAgain(null);
    setDifficulty(0);
    setComment('');
  };

  const handleClose = () => {
    setMakeAgain(null);
    setDifficulty(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.title}>Review</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.recipeName}>{recipeName}</Text>

            {/* Would you make it again? */}
            <Text style={styles.sectionLabel}>Would you make it again?</Text>
            <View style={styles.toggleRow}>
              {MAKE_AGAIN_OPTIONS.map((opt) => {
                const selected = makeAgain === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.toggleButton,
                      selected && { backgroundColor: opt.color + '18', borderColor: opt.color },
                    ]}
                    onPress={() => setMakeAgain(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={22}
                      color={selected ? opt.color : Colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.toggleLabel,
                        selected && { color: opt.color, fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Difficulty */}
            <Text style={styles.sectionLabel}>How difficult was it?</Text>
            <View style={styles.difficultyRow}>
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = difficulty >= n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.diffDot, selected && styles.diffDotSelected]}
                    onPress={() => setDifficulty(n)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.diffNumber, selected && styles.diffNumberSelected]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.diffLabels}>
              <Text style={styles.diffLabelText}>Easy</Text>
              <Text style={styles.diffLabelText}>Hard</Text>
            </View>

            {/* Comment */}
            <Text style={styles.sectionLabel}>
              Notes <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="How was the recipe? Any tips?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>Submit Review</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xxl,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  recipeName: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  optional: {
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  toggleLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  diffDot: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  diffDotSelected: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  diffNumber: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  diffNumberSelected: {
    color: Colors.accent,
  },
  diffLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  diffLabelText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
