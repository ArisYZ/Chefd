import React, { useEffect, useState } from 'react';
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
import { MakeAgain, Review } from '@/types';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';

interface ReviewModalProps {
  visible: boolean;
  recipeName: string;
  existingReview?: Review;
  onClose: () => void;
  onSubmit: (review: {
    makeAgain: MakeAgain;
    difficulty: number;
    tasteRating: number;
    flavorNotes: string;
    comment: string;
  }) => void;
}

const MAKE_AGAIN_OPTIONS: { value: MakeAgain; icon: string; label: string; color: string }[] = [
  { value: 'yes', icon: 'checkmark-circle', label: 'Yes', color: '#2E7D32' },
  { value: 'maybe', icon: 'help-circle', label: 'Maybe', color: '#F9A825' },
  { value: 'no', icon: 'close-circle', label: 'No', color: '#C62828' },
];

const MAX_COMMENT = 500;
const MAX_FLAVOR_NOTES = 150;

export function ReviewModal({ visible, recipeName, existingReview, onClose, onSubmit }: ReviewModalProps) {
  const [makeAgain, setMakeAgain] = useState<MakeAgain | null>(null);
  const [difficulty, setDifficulty] = useState<number>(0);
  const [tasteRating, setTasteRating] = useState<number>(0);
  const [flavorNotes, setFlavorNotes] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible && existingReview) {
      setMakeAgain(existingReview.makeAgain);
      setDifficulty(existingReview.difficulty);
      setTasteRating(existingReview.tasteRating ?? 0);
      setFlavorNotes(existingReview.flavorNotes ?? '');
      setComment(existingReview.comment ?? '');
    }
  }, [visible, existingReview]);

  const canSubmit = makeAgain !== null && difficulty > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    let taste = tasteRating;
    if (taste > 0 && taste < 1) taste = 1;
    onSubmit({ makeAgain: makeAgain!, difficulty, tasteRating: taste, flavorNotes, comment });
    resetFields();
  };

  const resetFields = () => {
    setMakeAgain(null);
    setDifficulty(0);
    setTasteRating(0);
    setFlavorNotes('');
    setComment('');
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleStarPress = (star: number) => {
    if (tasteRating === star) {
      if (star === 1) {
        setTasteRating(0);
      } else {
        setTasteRating(star - 0.5);
      }
    } else if (tasteRating === star - 0.5) {
      setTasteRating(0);
    } else {
      setTasteRating(star);
    }
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
              <Text style={styles.title}>
                {existingReview ? 'Edit Review' : 'Review'}
              </Text>
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
                      style={[styles.toggleLabel, selected && { color: opt.color, fontFamily: Fonts.bodySemiBold, fontWeight: '600' }]}
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
                    <Ionicons
                      name={selected ? 'star' : 'star-outline'}
                      size={20}
                      color={selected ? Colors.accent : Colors.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.diffLabels}>
              <Text style={styles.diffLabelText}>Very Easy</Text>
              <Text style={styles.diffLabelText}>Very Difficult</Text>
            </View>

            {/* Taste Rating (optional) */}
            <Text style={styles.sectionLabel}>
              Taste Rating{' '}
              <Text style={styles.optional}>(optional, min 1.0; tap twice for half-star)</Text>
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const full = tasteRating >= star;
                const half = !full && tasteRating >= star - 0.5;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleStarPress(star)}
                    activeOpacity={0.7}
                    style={styles.starTouch}
                  >
                    <Ionicons
                      name={full ? 'star' : half ? 'star-half' : 'star-outline'}
                      size={28}
                      color={full || half ? '#FFD700' : Colors.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })}
              {tasteRating > 0 && (
                <Text style={styles.starLabel}>{tasteRating.toFixed(1)}</Text>
              )}
            </View>

            {/* Flavor Notes */}
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>
                Flavor notes <Text style={styles.optional}>(optional)</Text>
              </Text>
              <Text style={styles.charCount}>{flavorNotes.length}/{MAX_FLAVOR_NOTES}</Text>
            </View>
            <TextInput
              style={[styles.textInput, { minHeight: 50 }]}
              placeholder="What did you think of the flavor?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              value={flavorNotes}
              onChangeText={(t) => setFlavorNotes(t.slice(0, MAX_FLAVOR_NOTES))}
              textAlignVertical="top"
              maxLength={MAX_FLAVOR_NOTES}
            />

            {/* Comment */}
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>
                Notes <Text style={styles.optional}>(optional)</Text>
              </Text>
              <Text style={styles.charCount}>{comment.length}/{MAX_COMMENT}</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="How was the recipe? Any tips?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              value={comment}
              onChangeText={(t) => setComment(t.slice(0, MAX_COMMENT))}
              textAlignVertical="top"
              maxLength={MAX_COMMENT}
            />

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>
                {existingReview ? 'Update Review' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xxl,
    maxHeight: '90%',
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
  title: { fontSize: FontSize.xl, fontFamily: Fonts.bodyExtraBold, fontWeight: '800', color: Colors.text },
  recipeName: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  sectionLabel: { fontSize: FontSize.md, fontFamily: Fonts.bodySemiBold, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
  optional: { fontFamily: Fonts.body, fontWeight: '400', color: Colors.textTertiary },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: { fontSize: FontSize.xs, color: Colors.textTertiary },
  toggleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl },
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
  toggleLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
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
  diffDotSelected: { backgroundColor: Colors.accent + '20', borderColor: Colors.accent },
  diffLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  diffLabelText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  starTouch: { padding: 2 },
  starLabel: { fontSize: FontSize.md, fontFamily: Fonts.bodyBold, fontWeight: '700', color: '#FFD700', marginLeft: Spacing.sm },
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
  submitDisabled: { opacity: 0.4 },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontFamily: Fonts.bodyBold, fontWeight: '700' },
});
