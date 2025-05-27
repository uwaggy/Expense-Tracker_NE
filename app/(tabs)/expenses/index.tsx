import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Calendar, Trash2, Search } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import ExpenseSearchBar from '@/components/expense/ExpenseSearchBar';
import EmptyState from '@/components/ui/EmptyState';
import { Expense } from '@/contexts/ExpensesContext';

export default function ExpensesScreen() {
  const router = useRouter();
  const { expenses, isLoading, error, fetchExpenses, deleteExpense } =
    useExpenses();
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Reverse the expenses array to show newest first
    const reversedExpenses = [...expenses].reverse();

    if (searchQuery) {
      const filtered = reversedExpenses.filter(
        (expense) =>
          expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (expense.description &&
            expense.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(reversedExpenses);
    }
  }, [expenses, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const handleExpensePress = (id: string) => {
    router.push(`/expenses/${id}`);
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id);
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseCard}
      onPress={() => handleExpensePress(item.id)}
    >
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.name}</Text>
          <View style={styles.expenseMeta}>
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: getCategoryColor('Other', 0.2) },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: getCategoryColor('Other') },
                ]}
              >
                Other
              </Text>
            </View>
            <View style={styles.dateContainer}>
              <Calendar size={14} color="#8E8E93" style={styles.dateIcon} />
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.expenseAmount}>-{formatCurrency(item.amount)}</Text>
      </View>

      {item.description && (
        <Text style={styles.expenseDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteExpense(item.id)}
        >
          <Trash2 size={16} color="#FF453A" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading expenses</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpenses}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Search size={18} color={Colors.primary} />
          <Text style={styles.actionText}>Search</Text>
        </TouchableOpacity>
      </View>

      {showSearch && (
        <ExpenseSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      )}

      {filteredExpenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          message={
            searchQuery
              ? 'Try changing your search query'
              : 'Add your first expense'
          }
          icon="receipt"
          actionLabel="Add Expense"
          onAction={() => router.push('/expenses/new')}
        />
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

function getCategoryColor(category: string, opacity: number = 1): string {
  const categoryColors: { [key: string]: string } = {
    Food: `rgba(255, 149, 0, ${opacity})`,
    Transportation: `rgba(255, 45, 85, ${opacity})`,
    Entertainment: `rgba(90, 200, 250, ${opacity})`,
    Shopping: `rgba(0, 122, 255, ${opacity})`,
    Housing: `rgba(88, 86, 214, ${opacity})`,
    Utilities: `rgba(175, 82, 222, ${opacity})`,
    Healthcare: `rgba(255, 59, 48, ${opacity})`,
    Education: `rgba(52, 199, 89, ${opacity})`,
    Travel: `rgba(255, 204, 0, ${opacity})`,
  };

  return opacity === 1
    ? categoryColors[category]?.replace(`, ${opacity}`, '') || '#64D2FF'
    : categoryColors[category] || `rgba(100, 210, 255, ${opacity})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 16,
    color: '#FF453A',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 6,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 8,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginTop: 8,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FF453A',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
});
