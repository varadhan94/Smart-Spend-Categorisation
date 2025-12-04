
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { CategorySummary, Transaction } from '../types';
import { DollarSign, Filter, PieChart as PieIcon, Table as TableIcon, TrendingUp, Wallet, CreditCard } from 'lucide-react';

interface ResultsViewProps {
  transactions: Transaction[];
  onReset: () => void;
}

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#f97316', '#64748b'];

const ResultsView: React.FC<ResultsViewProps> = ({ transactions, onReset }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  
  // Financial Calculations
  const { totalSalary, totalInvestments, totalExpenses, expenseTransactions } = useMemo(() => {
    let salary = 0;
    let investments = 0;
    let expenses = 0;
    
    transactions.forEach(t => {
      if (t.category === 'Salary') {
        salary += t.amount;
      } else if (t.category === 'Investments + EMI') {
        investments += t.amount;
      } else {
        // Adding amount here (negative amounts for refunds will naturally subtract)
        expenses += t.amount;
      }
    });

    return {
      totalSalary: salary,
      totalInvestments: investments,
      totalExpenses: expenses,
      // For charts, we usually want to see where money went (Expenses + Investments), 
      // but typically we exclude Salary (Income) from a spend pie chart.
      expenseTransactions: transactions.filter(t => t.category !== 'Salary')
    };
  }, [transactions]);

  // Data for Charts and Tables (Excluding Salary from breakdown to focus on Spends/Allocations)
  const summaryData: CategorySummary[] = useMemo(() => {
    const map = new Map<string, CategorySummary>();
    let totalForCalc = 0;

    expenseTransactions.forEach(t => {
      // Logic: refunds (negative) reduce the category total
      totalForCalc += t.amount;
      const existing = map.get(t.category);
      if (existing) {
        existing.totalAmount += t.amount;
        existing.transactionCount += 1;
      } else {
        map.set(t.category, {
          category: t.category,
          totalAmount: t.amount,
          transactionCount: 1,
          percentage: 0
        });
      }
    });

    // Final calculation for percentages based on the NET total
    const result = Array.from(map.values()).map(item => ({
      ...item,
      percentage: totalForCalc > 0 ? (item.totalAmount / totalForCalc) * 100 : 0
    }));

    // Filter out categories with 0 or negative net spend for the Pie Chart 
    // (e.g. if I spent 500 but got refunded 500, net is 0, shouldn't appear in "Spend Breakdown")
    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [expenseTransactions]);

  // Specific data for Pie Chart (Must handle negatives by excluding them)
  const pieChartData = useMemo(() => {
    return summaryData.filter(item => item.totalAmount > 0);
  }, [summaryData]);


  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
          <p className="font-semibold text-gray-800">{data.category || data.name}</p>
          <p className="text-indigo-600 font-medium">
            ₹{data.totalAmount?.toFixed(2) ?? data.value?.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, category }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    // Only show label if slice is big enough
    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-medium">
        {category}
      </text>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Financial Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Salary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Salary (Income)</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
        
        {/* Investments */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Investments + EMI</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{totalInvestments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 flex items-center space-x-4">
          <div className="p-3 bg-rose-50 rounded-full text-rose-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Categories Tracked</p>
            <h3 className="text-2xl font-bold text-gray-900">{summaryData.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-full text-purple-600">
            <TableIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Transactions</p>
            <h3 className="text-2xl font-bold text-gray-900">{transactions.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('summary')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <PieIcon className="w-4 h-4" />
            <span>Allocation Summary</span>
          </div>
        </button>
        <button
          onClick={() => setViewMode('details')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === 'details' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
           <div className="flex items-center space-x-2">
            <TableIcon className="w-4 h-4" />
            <span>Line Items</span>
          </div>
        </button>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charts */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px]">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Spend & Investment Breakdown</h3>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={pieChartData as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="totalAmount"
                    nameKey="category"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No net expenses to display
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800">Category Details (Excl. Salary)</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                     <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                     <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">% Total</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {summaryData.map((item, idx) => (
                     <tr key={item.category} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <span className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                           <span className="text-sm font-medium text-gray-900">{item.category}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                         ₹{item.totalAmount.toFixed(2)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                         {item.percentage.toFixed(1)}%
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* Detailed Transactions View */}
      {viewMode === 'details' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.date || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{t.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-md text-xs ${
                        t.category === 'Salary' ? 'bg-emerald-100 text-emerald-800' :
                        t.category === 'Investments + EMI' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100'
                      }`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-xs truncate max-w-[100px]">{t.originalSource}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      t.amount < 0 ? 'text-green-600' : // Refund
                      t.category === 'Salary' ? 'text-emerald-600' : 
                      'text-gray-900'
                    }`}>
                      {t.amount < 0 ? '+' : ''}{t.category === 'Salary' ? '+' : ''}
                      {/* Show refunds as green plus (since they add back to balance) or just keep negative sign? 
                          User asked to "subtract from expenses".
                          If amount is -500 (Refund), displaying "-₹500" is clear. 
                      */}
                      ₹{t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          Categorize New Files
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
