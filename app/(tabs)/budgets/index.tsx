import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useBudgets } from '@/hooks/useBudgets';
import { formatCurrency } from '@/utils/formatters';
import { CirclePlus as PlusCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import EmptyState from '@/components/ui/EmptyState';
import ProgressBar from '@/components/ui/ProgressBar';

export default function BudgetsScreen() {
  const { budgets, isLoading, error } = useBudgets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch budgets
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading budgets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading budgets</Text>
      </View>
    );
  }

  // Placeholder budgets for UI
  const placeholderBudgets = [
    {
      id: '1',
      category: 'Food',
      limit: '300',
      currentAmount: '250',
      period: 'Monthly',
    },
    {
      id: '2',
      category: 'Transportation',
      limit: '150',
      currentAmount: '85',
      period: 'Monthly',
    },
    {
      id: '3',
      category: 'Entertainment',
      limit: '200',
      currentAmount: '195',
      period: 'Monthly',
    },
  ];

  const displayBudgets = budgets.length > 0 ? budgets : placeholderBudgets;

  const renderBudgetItem = ({ item }: { item: any }) => {
    const percentage = Math.min(100, (parseFloat(item.currentAmount) / parseFloat(item.limit)) * 100);
    let statusColor = '#30D158'; // Green for safe
    
    if (percentage >= 90) {
      statusColor = '#FF453A'; // Red for danger
    } else if (percentage >= 75) {
      statusColor = '#FF9500'; // Orange for warning
    }

    return (
      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View>
            <Text style={styles.budgetCategory}>{item.category}</Text>
            <Text style={styles.budgetPeriod}>{item.period}</Text>
          </View>
          
          {percentage >= 90 && (
            <View style={styles.warningBadge}>
              <AlertCircle size={14} color="#FFFFFF" />
              <Text style={styles.warningText}>Alert</Text>
            </View>
          )}
        </View>
        
        <View style={styles.budgetValues}>
          <Text style={styles.currentAmount}>{formatCurrency(item.currentAmount)}</Text>
          <Text style={styles.limitAmount}>of {formatCurrency(item.limit)}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={percentage} 
            color={statusColor}
            height={10}
            backgroundColor="#E5E5EA"
          />
          <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
        </View>
        
        <View style={styles.budgetFooter}>
          <Text style={styles.remainingText}>
            {parseFloat(item.limit) > parseFloat(item.currentAmount) 
              ? `${formatCurrency(parseFloat(item.limit) - parseFloat(item.currentAmount))} remaining` 
              : 'Budget exceeded'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {displayBudgets.length === 0 ? (
        <EmptyState 
          title="No budgets found"
          message="Add your first budget to start tracking your spending limits"
          icon="pie-chart"
          actionLabel="Add Budget"
          onAction={() => {}}
        />
      ) : (
        <FlatList
          data={displayBudgets}
          keyExtractor={(item) => item.id}
          renderItem={renderBudgetItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
      
      <TouchableOpacity style={styles.addButton} onPress={() => {}}>
        <PlusCircle size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
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
  listContainer: {
    padding: 16,
    paddingBottom: 80, // To accommodate floating action button
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  budgetPeriod: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  warningBadge: {
    backgroundColor: '#FF453A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  budgetValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  limitAmount: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  percentageText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  budgetFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  remainingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});