import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useExpenses } from '@/hooks/useExpenses';
import { useBudgets } from '@/hooks/useBudgets';
import { useAuth } from '@/hooks/useAuth';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { formatCurrency } from '@/utils/formatters';
import { Dimensions } from 'react-native';
import {
  CircleAlert as AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react-native';
import Colors from '@/constants/Colors';
import ExpenseSummaryCard from '@/components/expense/ExpenseSummaryCard';
import BudgetProgressCard from '@/components/budget/BudgetProgressCard';
import { useRouter } from 'expo-router';
const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useRouter();
  const { expenses, isLoading: expensesLoading, fetchExpenses } = useExpenses();
  const { budgets, isLoading: budgetsLoading } = useBudgets();
  const [refreshing, setRefreshing] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }],
  });

  useEffect(() => {
    if (expenses.length > 0) {
      // Calculate total spent
      const total = expenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );
      setTotalSpent(total);

      // Process category data for pie chart
      const categories: { [key: string]: number } = {};
      expenses.forEach((expense) => {
        const category = expense?.category || 'Other';
        categories[category] =
          (categories[category] || 0) + parseFloat(expense.amount);
      });

      const colors = [
        '#FF9500',
        '#FF2D55',
        '#5AC8FA',
        '#007AFF',
        '#5856D6',
        '#AF52DE',
        '#FF3B30',
        '#34C759',
        '#FFCC00',
        '#64D2FF',
      ];

      const pieData = Object.keys(categories).map((category, index) => ({
        name: category,
        amount: categories[category],
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));

      setCategoryData(pieData);

      // Process monthly data for line chart
      const monthlyExpenses: { [key: string]: number } = {};
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 5);

      for (let i = 0; i < 6; i++) {
        const month = new Date(sixMonthsAgo);
        month.setMonth(sixMonthsAgo.getMonth() + i);
        const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
        monthlyExpenses[monthKey] = 0;
      }

      expenses.forEach((expense) => {
        const expenseDate = new Date(expense?.date);
        const monthKey = `${expenseDate.getFullYear()}-${
          expenseDate.getMonth() + 1
        }`;
        if (monthlyExpenses[monthKey] !== undefined) {
          monthlyExpenses[monthKey] += parseFloat(expense.amount);
        }
      });

      const months = Object.keys(monthlyExpenses).sort();
      const monthLabels = months.map((m) => {
        const [year, month] = m.split('-');
        return [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ][parseInt(month) - 1];
      });

      setMonthlyData({
        labels: monthLabels,
        datasets: [
          {
            data: months.map((m) => monthlyExpenses[m]),
            color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      });
    }
  }, [expenses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  if (expensesLoading || budgetsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your financial data...</Text>
      </View>
    );
  }

  // Find most expensive category
  let maxCategory = { name: 'None', amount: 0 };
  if (categoryData.length > 0) {
    maxCategory = categoryData.reduce(
      (max, cat) => (cat.amount > max.amount ? cat : max),
      categoryData[0]
    );
  }

  // Get closest budget to limit
  const sortedBudgets = [...budgets].sort((a, b) => {
    const aPercentage =
      (parseFloat(a.currentAmount) / parseFloat(a.limit)) * 100;
    const bPercentage =
      (parseFloat(b.currentAmount) / parseFloat(b.limit)) * 100;
    return bPercentage - aPercentage;
  });

  const criticalBudget = sortedBudgets.length > 0 ? sortedBudgets[0] : null;
  const criticalPercentage = criticalBudget
    ? (parseFloat(criticalBudget.currentAmount) /
        parseFloat(criticalBudget.limit)) *
      100
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {user?.email || user?.username || 'User'}
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Spent This Month</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(totalSpent)}</Text>
      </View>

      <View style={styles.summaryContainer}>
        <ExpenseSummaryCard
          title="Highest Expense"
          amount={
            expenses?.length > 0
              ? Math.max(
                  ...expenses
                    .map((e) => parseFloat(e?.amount))
                    .filter((val) => !isNaN(val))
                )
              : 0
          }
          icon={<TrendingUp size={20} color="#FF453A" />}
          color="#FFEFED"
          textColor="#FF453A"
        />

        <ExpenseSummaryCard
          title="Average Expense"
          amount={expenses?.length > 0 ? totalSpent / expenses?.length : 0}
          icon={<DollarSign size={20} color="#30D158" />}
          color="#E9F9EF"
          textColor="#30D158"
        />
      </View>

      {criticalBudget && criticalPercentage > 80 && (
        <View style={styles.alertCard}>
          <AlertCircle size={24} color="#FF9500" style={styles.alertIcon} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Budget Alert</Text>
            <Text style={styles.alertMessage}>
              Your {criticalBudget.category} budget is{' '}
              {criticalPercentage.toFixed(0)}% used
            </Text>
          </View>
        </View>
      )}

      {budgets.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Budget Progress</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetsScroll}
          >
            {budgets.map((budget) => (
              <BudgetProgressCard key={budget.id} budget={budget} />
            ))}
          </ScrollView>
        </View>
      )}

      {categoryData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.chartCard}>
            <PieChart
              data={categoryData}
              width={screenWidth - 48}
              height={200}
              chartConfig={{
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </View>

          <View style={styles.insightCard}>
            <TrendingUp size={20} color="#0A84FF" style={styles.insightIcon} />
            <Text style={styles.insightText}>
              Your highest spending category is{' '}
              <Text style={styles.insightHighlight}>{maxCategory.name}</Text> at{' '}
              <Text style={styles.insightHighlight}>
                {formatCurrency(maxCategory.amount)}
              </Text>
            </Text>
          </View>
        </View>
      )}

      {monthlyData.datasets[0].data.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Monthly Spending Trend</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={monthlyData}
              width={screenWidth - 48}
              height={220}
              yAxisLabel="$"
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#0A84FF',
                },
              }}
              bezier
              style={styles.lineChart}
            />
          </View>

          {monthlyData.datasets[0].data.length >= 2 && (
            <View style={styles.insightCard}>
              {monthlyData.datasets[0].data[
                monthlyData.datasets[0].data.length - 1
              ] >
              monthlyData.datasets[0].data[
                monthlyData.datasets[0].data.length - 2
              ] ? (
                <>
                  <TrendingUp
                    size={20}
                    color="#FF453A"
                    style={styles.insightIcon}
                  />
                  <Text style={styles.insightText}>
                    Your spending has{' '}
                    <Text
                      style={[styles.insightHighlight, { color: '#FF453A' }]}
                    >
                      increased
                    </Text>{' '}
                    compared to last month
                  </Text>
                </>
              ) : (
                <>
                  <TrendingDown
                    size={20}
                    color="#30D158"
                    style={styles.insightIcon}
                  />
                  <Text style={styles.insightText}>
                    Your spending has{' '}
                    <Text
                      style={[styles.insightHighlight, { color: '#30D158' }]}
                    >
                      decreased
                    </Text>{' '}
                    compared to last month
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.recentExpensesContainer}>
        <View style={styles.recentExpensesHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity
            onPress={() => {
              // Navigate to expenses screen
              navigation.navigate('/(tabs)/expenses');
            }}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {expenses.slice(0, 3).map((expense) => (
          <View key={expense.id} style={styles.expenseItem}>
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: getCategoryColor(expense.category) },
              ]}
            />
            <View style={styles.expenseDetails}>
              <Text style={styles.expenseTitle}>{expense.name}</Text>
              <Text style={styles.expenseCategory}>
                {expense.category || 'Other'}
              </Text>
            </View>
            <View style={styles.expenseAmountContainer}>
              <Text style={styles.expenseAmount}>
                -{formatCurrency(expense.amount)}
              </Text>
              <Text style={styles.expenseDate}>
                {new Date(expense.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function getCategoryColor(category: string): string {
  const categoryColors: { [key: string]: string } = {
    Food: '#FF9500',
    Transportation: '#FF2D55',
    Entertainment: '#5AC8FA',
    Shopping: '#007AFF',
    Housing: '#5856D6',
    Utilities: '#AF52DE',
    Healthcare: '#FF3B30',
    Education: '#34C759',
    Travel: '#FFCC00',
  };

  return categoryColors[category] || '#64D2FF';
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  balanceCard: {
    margin: 16,
    backgroundColor: '#1B4332',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  alertCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIcon: {
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  sectionContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  budgetsScroll: {
    paddingHorizontal: 8,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    marginRight: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  insightHighlight: {
    fontWeight: 'bold',
    color: '#0A84FF',
  },
  recentExpensesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recentExpensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '500',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 16,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#8E8E93',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
