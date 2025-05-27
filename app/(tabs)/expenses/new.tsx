import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenses } from '@/hooks/useExpenses';
import { validateAmount, validateRequired } from '@/utils/validation';
import {
  Calendar,
  DollarSign,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import DateTimePicker from '@/components/ui/DateTimePicker';
import Colors from '@/constants/Colors';

export default function NewExpenseScreen() {
  const router = useRouter();
  const { addExpense, isLoading } = useExpenses();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [titleError, setTitleError] = useState('');
  const [amountError, setAmountError] = useState('');

  const validateForm = () => {
    let isValid = true;

    const titleValidation = validateRequired(title, 'Title');
    setTitleError(titleValidation);
    if (titleValidation) isValid = false;

    const amountValidation = validateAmount(amount);
    setAmountError(amountValidation);
    if (amountValidation) isValid = false;

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await addExpense({
        name: title,
        amount,
        createdAt: date.toISOString(),
        description,
      });

      Alert.alert('Success', 'Expense added successfully', [
        { text: 'OK', onPress: () => router.push('/expenses') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Expense Details</Text>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={[styles.input, titleError ? styles.inputError : null]}
              placeholder="e.g., Grocery Shopping"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setTitleError('');
              }}
            />
            {titleError ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#FF453A" />
                <Text style={styles.errorText}>{titleError}</Text>
              </View>
            ) : null}
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <View
              style={[
                styles.amountInputContainer,
                amountError ? styles.inputError : null,
              ]}
            >
              <DollarSign size={20} color="#8E8E93" style={styles.amountIcon} />
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  setAmountError('');
                }}
              />
            </View>
            {amountError ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#FF453A" />
                <Text style={styles.errorText}>{amountError}</Text>
              </View>
            ) : null}
          </View>

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#8E8E93" style={styles.dateIcon} />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes about this expense"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Expense</Text>
          )}
        </TouchableOpacity>
      </View>

      <DateTimePicker
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          setDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        date={date}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  inputError: {
    borderColor: '#FF453A',
  },
  textArea: {
    height: 100,
  },
  amountInputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  amountIcon: {
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    padding: 16,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    marginLeft: 4,
    color: '#FF453A',
    fontSize: 13,
  },
});
