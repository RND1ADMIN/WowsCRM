import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Download, BarChart2, PieChart, Calendar, ChevronDown, ArrowRight, TrendingUp, TrendingDown, DollarSign, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const ThongKePage = () => {
    // State Management
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('month'); // 'month', 'quarter', 'year'
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [filterUnit, setFilterUnit] = useState('TẤT CẢ');
    const [filterCategory, setFilterCategory] = useState('TẤT CẢ');
    const [filterType, setFilterType] = useState('TẤT CẢ');
    const [filterItem, setFilterItem] = useState('TẤT CẢ');
    const [showFilters, setShowFilters] = useState(true);
    const [chartType, setChartType] = useState('bar'); // 'bar', 'pie', 'line'
    const [showTrends, setShowTrends] = useState(true);

    // Available years, units, categories, types, and items
    const [availableYears, setAvailableYears] = useState([]);
    const [availableUnits, setAvailableUnits] = useState(['TẤT CẢ']);
    const [availableCategories, setAvailableCategories] = useState(['TẤT CẢ', 'DOANH THU', 'CHI PHÍ']);
    const [availableTypes, setAvailableTypes] = useState(['TẤT CẢ']);
    const [availableItems, setAvailableItems] = useState(['TẤT CẢ']);
    const [filterUnits, setFilterUnits] = useState([]);
    const [filterCategories, setFilterCategories] = useState([]);
    const [filterTypes, setFilterTypes] = useState([]);
    const [filterItems, setFilterItems] = useState([]);
    const [filterYears, setFilterYears] = useState([{ value: new Date().getFullYear(), label: `${new Date().getFullYear()}` }]);
    // Fetch all data
    const handleFilterChange = (selectedOptions, setterFunction) => {
        setterFunction(selectedOptions || []);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await authUtils.apiRequest('GHINHAN', 'Find', {});

            // Format the records - ensure dates are properly parsed
            const formattedRecords = response.map(record => ({
                ...record,
                'NGÀY': new Date(record['NGÀY']),
                'SỐ TIỀN': parseFloat(record['SỐ TIỀN'].toString().replace(/[,.]/g, '')) || 0
            }));

            setRecords(formattedRecords);

            // Extract available years from data
            const years = [...new Set(formattedRecords.map(record => record['NGÀY'].getFullYear()))];
            setAvailableYears(years.sort((a, b) => b - a)); // Sort years in descending order

            // Extract available units, types, and items
            const units = ['TẤT CẢ', ...new Set(formattedRecords.map(record => record['ĐƠN VỊ']).filter(Boolean))];
            setAvailableUnits(units);

            const types = ['TẤT CẢ', ...new Set(formattedRecords.map(record => record['PHÂN LOẠI']).filter(Boolean))];
            setAvailableTypes(types);

            const items = ['TẤT CẢ', ...new Set(formattedRecords.map(record => record['HẠNG MỤC']).filter(Boolean))];
            setAvailableItems(items);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Lỗi khi tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        fetchData();
    }, []);

    // Filter data based on selections
    const filteredData = useMemo(() => {
        return records.filter(record => {
            const recordYear = record['NGÀY'].getFullYear();

            // Match if any of the selected years match the record's year
            const matchesYear = filterYears.length === 0 ||
                filterYears.some(option => option.value === recordYear);

            // Match if any of the selected units match the record's unit (or if no units are selected)
            const matchesUnit = filterUnits.length === 0 ||
                filterUnits.some(option => option.value === record['ĐƠN VỊ']);

            // Match if any of the selected categories match the record's category
            const matchesCategory = filterCategories.length === 0 ||
                filterCategories.some(option => option.value === record['KHOẢN MỤC']);

            // Match if any of the selected types match the record's type
            const matchesType = filterTypes.length === 0 ||
                filterTypes.some(option => option.value === record['PHÂN LOẠI']);

            // Match if any of the selected items match the record's item
            const matchesItem = filterItems.length === 0 ||
                filterItems.some(option => option.value === record['HẠNG MỤC']);

            return matchesYear && matchesUnit && matchesCategory && matchesType && matchesItem;
        });
    }, [records, filterYears, filterUnits, filterCategories, filterTypes, filterItems]);
    // Group and aggregate data based on viewMode
    // Group and aggregate data based on viewMode
 // Group and aggregate data based on viewMode
const aggregatedData = useMemo(() => {
    // For multi-year support, we'll group data by year first
    const dataByYear = {};
    
    // Initialize data structure for each selected year
    filterYears.forEach(yearOption => {
      const year = yearOption.value;
      dataByYear[year] = {
        monthly: Array(12).fill(0).map(() => ({ revenue: 0, expense: 0, profit: 0 })),
        quarterly: Array(4).fill(0).map(() => ({ revenue: 0, expense: 0, profit: 0 })),
        units: {},
        categories: {
          'DOANH THU': 0,
          'CHI PHÍ': 0
        },
        types: {},
        items: {}
      };
    });
    
    // Process all filtered data
    filteredData.forEach(record => {
      const recordYear = record['NGÀY'].getFullYear();
      
      // Skip if this year isn't selected
      if (!dataByYear[recordYear]) return;
      
      const month = record['NGÀY'].getMonth(); // 0-11
      const quarter = Math.floor(month / 3); // 0-3
      const amount = record['SỐ TIỀN'];
      const unit = record['ĐƠN VỊ'];
      const category = record['KHOẢN MỤC'];
      const type = record['PHÂN LOẠI'];
      const item = record['HẠNG MỤC'];
      
      // Update monthly data
      if (category === 'DOANH THU') {
        dataByYear[recordYear].monthly[month].revenue += amount;
      } else if (category === 'CHI PHÍ') {
        dataByYear[recordYear].monthly[month].expense += amount;
      }
      
      // Update quarterly data
      if (category === 'DOANH THU') {
        dataByYear[recordYear].quarterly[quarter].revenue += amount;
      } else if (category === 'CHI PHÍ') {
        dataByYear[recordYear].quarterly[quarter].expense += amount;
      }
      
      // Update unit data
      if (unit) {
        if (!dataByYear[recordYear].units[unit]) {
          dataByYear[recordYear].units[unit] = { revenue: 0, expense: 0, profit: 0 };
        }
        
        if (category === 'DOANH THU') {
          dataByYear[recordYear].units[unit].revenue += amount;
        } else if (category === 'CHI PHÍ') {
          dataByYear[recordYear].units[unit].expense += amount;
        }
      }
      
      // Update category data
      if (category === 'DOANH THU' || category === 'CHI PHÍ') {
        dataByYear[recordYear].categories[category] += amount;
      }
      
      // Update type data
      if (type && category) {
        if (!dataByYear[recordYear].types[type]) {
          dataByYear[recordYear].types[type] = 0;
        }
        
        dataByYear[recordYear].types[type] += amount;
      }
      
      // Update item data
      if (item && type && category) {
        if (!dataByYear[recordYear].items[item]) {
          dataByYear[recordYear].items[item] = 0;
        }
        
        dataByYear[recordYear].items[item] += amount;
      }
    });
    
    // Calculate profit for monthly and quarterly data
    Object.keys(dataByYear).forEach(year => {
      dataByYear[year].monthly.forEach(data => {
        data.profit = data.revenue - data.expense;
      });
      
      dataByYear[year].quarterly.forEach(data => {
        data.profit = data.revenue - data.expense;
      });
      
      // Calculate profit for each unit
      Object.keys(dataByYear[year].units).forEach(unit => {
        dataByYear[year].units[unit].profit = 
          dataByYear[year].units[unit].revenue - dataByYear[year].units[unit].expense;
      });
    });
    
    // Now combine data based on view mode
    if (viewMode === 'month') {
      // For month view with multiple years
      if (filterYears.length > 1) {
        // Instead of aggregating by month across years, we'll create separate data for each year/month
        const monthlyLabels = [];
        const monthlyData = [];
        
        // Sort years to maintain consistent order
        const sortedYears = [...filterYears].sort((a, b) => a.value - b.value);
        
        sortedYears.forEach(yearOption => {
          const year = yearOption.value;
          if (!dataByYear[year]) return;
          
          // Add data for each month of this year
          for (let month = 0; month < 12; month++) {
            monthlyLabels.push(`${month+1}/${year}`); // Format as "MM/YYYY"
            monthlyData.push(dataByYear[year].monthly[month]);
          }
        });
        
        return {
          labels: monthlyLabels,
          data: monthlyData
        };
      } else if (filterYears.length === 1) {
        // For single year, use the standard month labels
        const year = filterYears[0].value;
        
        return {
          labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
          data: dataByYear[year] ? dataByYear[year].monthly : Array(12).fill(0).map(() => ({ revenue: 0, expense: 0, profit: 0 }))
        };
      } else {
        // No years selected, return empty data
        return {
          labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
          data: Array(12).fill(0).map(() => ({ revenue: 0, expense: 0, profit: 0 }))
        };
      }
    } else if (viewMode === 'quarter') {
      // For quarter view with multiple years
      if (filterYears.length > 1) {
        const quarterlyLabels = [];
        const quarterlyData = [];
        
        // Sort years to maintain consistent order
        const sortedYears = [...filterYears].sort((a, b) => a.value - b.value);
        
        sortedYears.forEach(yearOption => {
          const year = yearOption.value;
          if (!dataByYear[year]) return;
          
          // Add data for each quarter of this year
          for (let quarter = 0; quarter < 4; quarter++) {
            quarterlyLabels.push(`Q${quarter+1}/${year}`); // Format as "Q1/YYYY"
            quarterlyData.push(dataByYear[year].quarterly[quarter]);
          }
        });
        
        return {
          labels: quarterlyLabels,
          data: quarterlyData
        };
      } else if (filterYears.length === 1) {
        // For single year, use the standard quarter labels
        const year = filterYears[0].value;
        
        return {
          labels: ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'],
          data: dataByYear[year] ? dataByYear[year].quarterly : Array(4).fill(0).map(() => ({ revenue: 0, expense: 0, profit: 0 }))
        };
      } else {
        // No years selected, return empty data
        return {
          labels: ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'],
          data: Array(4).fill(0).map(() => ({ revenue: 0, expense: 0, profit: 0 }))
        };
      }
    } else if (viewMode === 'unit') {
      // For unit view, we'll aggregate data by unit across all selected years
      const unitData = {};
      
      filterYears.forEach(yearOption => {
        const year = yearOption.value;
        if (dataByYear[year]) {
          Object.keys(dataByYear[year].units).forEach(unit => {
            if (!unitData[unit]) {
              unitData[unit] = { revenue: 0, expense: 0, profit: 0 };
            }
            
            unitData[unit].revenue += dataByYear[year].units[unit].revenue;
            unitData[unit].expense += dataByYear[year].units[unit].expense;
            unitData[unit].profit += dataByYear[year].units[unit].profit;
          });
        }
      });
      
      return {
        labels: Object.keys(unitData),
        data: Object.values(unitData)
      };
    } else if (viewMode === 'category') {
      if (filterCategories.length > 0) {
        // If specific categories are selected, show breakdown by type
        const typeData = {};
        
        // Filter records for the selected categories
        const relevantCategories = filterCategories.map(c => c.value);
        
        filterYears.forEach(yearOption => {
          const year = yearOption.value;
          if (dataByYear[year]) {
            // Only include types that are relevant to the selected categories
            // This requires additional filtering from the original data
            filteredData.forEach(record => {
              if (record['NGÀY'].getFullYear() === year && 
                  relevantCategories.includes(record['KHOẢN MỤC']) &&
                  record['PHÂN LOẠI']) {
                
                const type = record['PHÂN LOẠI'];
                if (!typeData[type]) {
                  typeData[type] = 0;
                }
                
                typeData[type] += record['SỐ TIỀN'];
              }
            });
          }
        });
        
        return {
          labels: Object.keys(typeData),
          data: Object.values(typeData),
          category: filterCategories.map(c => c.value).join(', ')
        };
      } else {
        // Just show DOANH THU vs CHI PHÍ
        const categoryData = {
          'DOANH THU': 0,
          'CHI PHÍ': 0
        };
        
        filterYears.forEach(yearOption => {
          const year = yearOption.value;
          if (dataByYear[year]) {
            categoryData['DOANH THU'] += dataByYear[year].categories['DOANH THU'];
            categoryData['CHI PHÍ'] += dataByYear[year].categories['CHI PHÍ'];
          }
        });
        
        return {
          labels: Object.keys(categoryData),
          data: Object.values(categoryData)
        };
      }
    } else if (viewMode === 'type') {
      // For type view, we'll show items breakdown if specific types are selected
      if (filterTypes.length > 0) {
        const itemData = {};
        
        // Filter records for the selected types
        const relevantTypes = filterTypes.map(t => t.value);
        const relevantCategories = filterCategories.map(c => c.value);
        
        filterYears.forEach(yearOption => {
          const year = yearOption.value;
          
          // This requires additional filtering from the original data
          filteredData.forEach(record => {
            if (record['NGÀY'].getFullYear() === year && 
                (relevantCategories.length === 0 || relevantCategories.includes(record['KHOẢN MỤC'])) && 
                relevantTypes.includes(record['PHÂN LOẠI']) &&
                record['HẠNG MỤC']) {
              
              const item = record['HẠNG MỤC'];
              if (!itemData[item]) {
                itemData[item] = 0;
              }
              
              itemData[item] += record['SỐ TIỀN'];
            }
          });
        });
        
        return {
          labels: Object.keys(itemData),
          data: Object.values(itemData),
          category: filterCategories.map(c => c.value).join(', '),
          type: filterTypes.map(t => t.value).join(', ')
        };
      }
      
      return { labels: [], data: [] };
    }
    
    return { labels: [], data: [] };
  }, [filteredData, viewMode, filterYears, filterCategories, filterTypes, filterItems]);
    // Calculate summary stats
    const summaryStats = useMemo(() => {
        const totalRevenue = filteredData.reduce((sum, record) => {
            if (record['KHOẢN MỤC'] === 'DOANH THU') {
                return sum + record['SỐ TIỀN'];
            }
            return sum;
        }, 0);

        const totalExpense = filteredData.reduce((sum, record) => {
            if (record['KHOẢN MỤC'] === 'CHI PHÍ') {
                return sum + record['SỐ TIỀN'];
            }
            return sum;
        }, 0);

        const profit = totalRevenue - totalExpense;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        const expenseToRevenueRatio = totalRevenue > 0 ? (totalExpense / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalExpense,
            profit,
            profitMargin,
            expenseToRevenueRatio,
            transactionCount: filteredData.length
        };
    }, [filteredData]);

    // Analyze trends and generate warnings
    const trendAnalysis = useMemo(() => {
        if (viewMode === 'month' || viewMode === 'quarter') {
            const trends = [];

            for (let i = 1; i < aggregatedData.labels.length; i++) {
                const currentPeriod = aggregatedData.data[i];
                const previousPeriod = aggregatedData.data[i - 1];

                // Skip periods with no data
                if (currentPeriod.revenue === 0 && currentPeriod.expense === 0 &&
                    previousPeriod.revenue === 0 && previousPeriod.expense === 0) {
                    continue;
                }

                // Tính phần trăm thay đổi
                const revenueChange = previousPeriod.revenue !== 0
                    ? ((currentPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100
                    : (currentPeriod.revenue > 0 ? 100 : 0);

                const expenseChange = previousPeriod.expense !== 0
                    ? ((currentPeriod.expense - previousPeriod.expense) / previousPeriod.expense) * 100
                    : (currentPeriod.expense > 0 ? 100 : 0);

                // Tính tỷ lệ chi phí trên doanh thu
                const expenseToRevenueRatio = currentPeriod.revenue !== 0
                    ? (currentPeriod.expense / currentPeriod.revenue) * 100
                    : 0;

                const previousExpenseToRevenueRatio = previousPeriod.revenue !== 0
                    ? (previousPeriod.expense / previousPeriod.revenue) * 100
                    : 0;

                const ratioChange = previousExpenseToRevenueRatio !== 0
                    ? ((expenseToRevenueRatio - previousExpenseToRevenueRatio) / previousExpenseToRevenueRatio) * 100
                    : 0;

                // Xác định cảnh báo
                const warnings = [];

                if (revenueChange < -10) {
                    warnings.push({
                        type: 'severe',
                        message: `Doanh thu giảm ${Math.abs(revenueChange).toFixed(1)}% so với kỳ trước`,
                        metric: 'revenue'
                    });
                }

                if (expenseChange > 5) {
                    warnings.push({
                        type: 'warning',
                        message: `Chi phí tăng ${expenseChange.toFixed(1)}% so với kỳ trước`,
                        metric: 'expense'
                    });
                }

                if (expenseToRevenueRatio > 90) {
                    warnings.push({
                        type: 'severe',
                        message: `Tỷ lệ chi phí/doanh thu cao (${expenseToRevenueRatio.toFixed(1)}%)`,
                        metric: 'ratio'
                    });
                } else if (expenseToRevenueRatio > 70) {
                    warnings.push({
                        type: 'warning',
                        message: `Tỷ lệ chi phí/doanh thu khá cao (${expenseToRevenueRatio.toFixed(1)}%)`,
                        metric: 'ratio'
                    });
                }

                if (ratioChange > 10) {
                    warnings.push({
                        type: 'info',
                        message: `Tỷ lệ chi phí/doanh thu tăng ${ratioChange.toFixed(1)}% so với kỳ trước`,
                        metric: 'ratio'
                    });
                }

                trends.push({
                    period: aggregatedData.labels[i],
                    revenueChange,
                    expenseChange,
                    expenseToRevenueRatio,
                    ratioChange,
                    warnings
                });
            }

            return trends;
        }

        return [];
    }, [aggregatedData, viewMode]);

    // Calculate overall trend (most recent period vs previous)
    const overallTrends = useMemo(() => {
        if ((viewMode === 'month' || viewMode === 'quarter') && aggregatedData.data.length > 0) {
            // Find the most recent non-zero data periods
            let currentIndex = null;
            let previousIndex = null;

            // Get the last period with data
            for (let i = aggregatedData.data.length - 1; i >= 0; i--) {
                const periodData = aggregatedData.data[i];
                if ((periodData.revenue > 0 || periodData.expense > 0) && currentIndex === null) {
                    currentIndex = i;
                    break;
                }
            }

            // If we found a current period, find the previous period
            if (currentIndex !== null) {
                // Get the current period's year and month/quarter
                const currentLabel = aggregatedData.labels[currentIndex];
                const currentYear = parseInt(currentLabel.split('/')[1]);
                const currentPeriod = parseInt(currentLabel.split('/')[0]);

                // Find the previous period
                for (let i = currentIndex - 1; i >= 0; i--) {
                    const periodData = aggregatedData.data[i];
                    if (periodData.revenue > 0 || periodData.expense > 0) {
                        previousIndex = i;
                        break;
                    }
                }

                // If we couldn't find a previous period in the same year, look for the last period of the previous year
                if (previousIndex === null) {
                    for (let i = aggregatedData.data.length - 1; i >= 0; i--) {
                        const periodData = aggregatedData.data[i];
                        const label = aggregatedData.labels[i];
                        const year = parseInt(label.split('/')[1]);
                        const period = parseInt(label.split('/')[0]);

                        if ((periodData.revenue > 0 || periodData.expense > 0) && year < currentYear) {
                            previousIndex = i;
                            break;
                        }
                    }
                }
            }

            // If we can't find two periods with data, return null
            if (currentIndex === null || previousIndex === null) return null;

            const current = aggregatedData.data[currentIndex];
            const previous = aggregatedData.data[previousIndex];

            // Calculate changes
            const revenueChange = previous.revenue !== 0
                ? ((current.revenue - previous.revenue) / previous.revenue) * 100
                : (current.revenue > 0 ? 100 : 0);

            const expenseChange = previous.expense !== 0
                ? ((current.expense - previous.expense) / previous.expense) * 100
                : (current.expense > 0 ? 100 : 0);

            const profitChange = previous.profit !== 0
                ? ((current.profit - previous.profit) / previous.profit) * 100
                : (current.profit > 0 ? 100 : -100);

            const currentExpenseRatio = current.revenue !== 0
                ? (current.expense / current.revenue) * 100
                : 0;

            const previousExpenseRatio = previous.revenue !== 0
                ? (previous.expense / previous.revenue) * 100
                : 0;

            const expenseRatioChange = previousExpenseRatio !== 0
                ? ((currentExpenseRatio - previousExpenseRatio) / previousExpenseRatio) * 100
                : 0;

            return {
                currentPeriod: aggregatedData.labels[currentIndex],
                previousPeriod: aggregatedData.labels[previousIndex],
                revenueChange,
                expenseChange,
                profitChange,
                currentExpenseRatio,
                previousExpenseRatio,
                expenseRatioChange,
                currentData: current,
                previousData: previous,
                // Thêm cảnh báo tổng thể
                warnings: [
                    ...(revenueChange < -10 ? [{
                        type: 'severe',
                        message: `Doanh thu kỳ hiện tại giảm ${Math.abs(revenueChange).toFixed(1)}% so với kỳ trước`,
                    }] : []),
                    ...(expenseChange > 5 ? [{
                        type: 'warning',
                        message: `Chi phí kỳ hiện tại tăng ${expenseChange.toFixed(1)}% so với kỳ trước`,
                    }] : []),
                    ...(currentExpenseRatio > 90 ? [{
                        type: 'severe',
                        message: `Tỷ lệ chi phí/doanh thu rất cao (${currentExpenseRatio.toFixed(1)}%)`,
                    }] : currentExpenseRatio > 70 ? [{
                        type: 'warning',
                        message: `Tỷ lệ chi phí/doanh thu cao (${currentExpenseRatio.toFixed(1)}%)`,
                    }] : []),
                ]
            };
        }

        return null;
    }, [aggregatedData, viewMode]);

    // Update available types when unit or category changes
    useEffect(() => {
        if (filterUnit === 'TẤT CẢ' && filterCategory === 'TẤT CẢ') {
            const types = ['TẤT CẢ', ...new Set(records.map(record => record['PHÂN LOẠI']).filter(Boolean))];
            setAvailableTypes(types);
        } else if (filterUnit !== 'TẤT CẢ' && filterCategory === 'TẤT CẢ') {
            const types = ['TẤT CẢ', ...new Set(records
                .filter(record => record['ĐƠN VỊ'] === filterUnit)
                .map(record => record['PHÂN LOẠI'])
                .filter(Boolean))];
            setAvailableTypes(types);
        } else if (filterUnit === 'TẤT CẢ' && filterCategory !== 'TẤT CẢ') {
            const types = ['TẤT CẢ', ...new Set(records
                .filter(record => record['KHOẢN MỤC'] === filterCategory)
                .map(record => record['PHÂN LOẠI'])
                .filter(Boolean))];
            setAvailableTypes(types);
        } else {
            const types = ['TẤT CẢ', ...new Set(records
                .filter(record => record['ĐƠN VỊ'] === filterUnit && record['KHOẢN MỤC'] === filterCategory)
                .map(record => record['PHÂN LOẠI'])
                .filter(Boolean))];
            setAvailableTypes(types);
        }

        // Reset type filter when unit or category changes
        setFilterType('TẤT CẢ');
    }, [filterUnit, filterCategory, records]);

    // Update available items when unit, category, or type changes
    useEffect(() => {
        if (filterType === 'TẤT CẢ') {
            const items = ['TẤT CẢ', ...new Set(records
                .filter(record =>
                    (filterUnit === 'TẤT CẢ' || record['ĐƠN VỊ'] === filterUnit) &&
                    (filterCategory === 'TẤT CẢ' || record['KHOẢN MỤC'] === filterCategory)
                )
                .map(record => record['HẠNG MỤC'])
                .filter(Boolean))];
            setAvailableItems(items);
        } else {
            const items = ['TẤT CẢ', ...new Set(records
                .filter(record =>
                    (filterUnit === 'TẤT CẢ' || record['ĐƠN VỊ'] === filterUnit) &&
                    (filterCategory === 'TẤT CẢ' || record['KHOẢN MỤC'] === filterCategory) &&
                    record['PHÂN LOẠI'] === filterType
                )
                .map(record => record['HẠNG MỤC'])
                .filter(Boolean))];
            setAvailableItems(items);
        }

        // Reset item filter when type changes
        setFilterItem('TẤT CẢ');
    }, [filterUnit, filterCategory, filterType, records]);

    // Chart data configuration
    const chartData = useMemo(() => {
        if (viewMode === 'month' || viewMode === 'quarter') {
            if (chartType === 'bar') {
                return {
                    labels: aggregatedData.labels,
                    datasets: [
                        {
                            label: 'Doanh thu',
                            data: aggregatedData.data.map(item => item.revenue),
                            backgroundColor: 'rgba(34, 197, 94, 0.7)',
                            borderColor: 'rgb(34, 197, 94)',
                            borderWidth: 1
                        },
                        {
                            label: 'Chi phí',
                            data: aggregatedData.data.map(item => item.expense),
                            backgroundColor: 'rgba(239, 68, 68, 0.7)',
                            borderColor: 'rgb(239, 68, 68)',
                            borderWidth: 1
                        },
                        {
                            label: 'Lợi nhuận',
                            data: aggregatedData.data.map(item => item.profit),
                            backgroundColor: 'rgba(59, 130, 246, 0.7)',
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 1
                        }
                    ]
                };
            } else if (chartType === 'line') {
                return {
                    labels: aggregatedData.labels,
                    datasets: [
                        {
                            label: 'Doanh thu',
                            data: aggregatedData.data.map(item => item.revenue),
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderColor: 'rgb(34, 197, 94)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: 'Chi phí',
                            data: aggregatedData.data.map(item => item.expense),
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderColor: 'rgb(239, 68, 68)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: 'Lợi nhuận',
                            data: aggregatedData.data.map(item => item.profit),
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        }
                    ]
                };
            } else if (chartType === 'pie') {
                // For pie chart, we'll show either revenue, expense, or profit distribution
                const totalRevenue = aggregatedData.data.reduce((sum, item) => sum + item.revenue, 0);

                return {
                    labels: aggregatedData.labels,
                    datasets: [
                        {
                            data: aggregatedData.data.map(item => item.revenue),
                            backgroundColor: [
                                'rgba(34, 197, 94, 0.7)',
                                'rgba(59, 130, 246, 0.7)',
                                'rgba(236, 72, 153, 0.7)',
                                'rgba(250, 204, 21, 0.7)',
                                'rgba(168, 85, 247, 0.7)',
                                'rgba(234, 88, 12, 0.7)',
                                'rgba(20, 184, 166, 0.7)',
                                'rgba(239, 68, 68, 0.7)',
                                'rgba(6, 182, 212, 0.7)',
                                'rgba(245, 158, 11, 0.7)',
                                'rgba(16, 185, 129, 0.7)',
                                'rgba(217, 70, 239, 0.7)'
                            ],
                            borderWidth: 1
                        }
                    ]
                };
            }
        } else if (viewMode === 'unit') {
            if (chartType === 'bar') {
                return {
                    labels: aggregatedData.labels,
                    datasets: [
                        {
                            label: 'Doanh thu',
                            data: aggregatedData.data.map(item => item.revenue),
                            backgroundColor: 'rgba(34, 197, 94, 0.7)',
                            borderColor: 'rgb(34, 197, 94)',
                            borderWidth: 1
                        },
                        {
                            label: 'Chi phí',
                            data: aggregatedData.data.map(item => item.expense),
                            backgroundColor: 'rgba(239, 68, 68, 0.7)',
                            borderColor: 'rgb(239, 68, 68)',
                            borderWidth: 1
                        },
                        {
                            label: 'Lợi nhuận',
                            data: aggregatedData.data.map(item => item.profit),
                            backgroundColor: 'rgba(59, 130, 246, 0.7)',
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 1
                        }
                    ]
                };
            } else if (chartType === 'pie') {
                return {
                    labels: aggregatedData.labels,
                    datasets: [
                        {
                            data: aggregatedData.data.map(item => item.revenue),
                            backgroundColor: [
                                'rgba(34, 197, 94, 0.7)',
                                'rgba(59, 130, 246, 0.7)',
                                'rgba(236, 72, 153, 0.7)',
                                'rgba(250, 204, 21, 0.7)',
                                'rgba(168, 85, 247, 0.7)',
                                'rgba(234, 88, 12, 0.7)',
                                'rgba(20, 184, 166, 0.7)',
                                'rgba(239, 68, 68, 0.7)',
                                'rgba(6, 182, 212, 0.7)',
                                'rgba(245, 158, 11, 0.7)',
                                'rgba(16, 185, 129, 0.7)',
                                'rgba(217, 70, 239, 0.7)'
                            ],
                            borderWidth: 1
                        }
                    ]
                };
            }
        } else if (viewMode === 'category') {
            // For category view, use different chart formats
            const backgroundColors = [
                'rgba(34, 197, 94, 0.7)',
                'rgba(239, 68, 68, 0.7)',
                'rgba(59, 130, 246, 0.7)',
                'rgba(236, 72, 153, 0.7)',
                'rgba(250, 204, 21, 0.7)',
                'rgba(168, 85, 247, 0.7)',
                'rgba(234, 88, 12, 0.7)',
                'rgba(20, 184, 166, 0.7)',
                'rgba(6, 182, 212, 0.7)',
                'rgba(245, 158, 11, 0.7)'
            ];

            const borderColors = [
                'rgb(34, 197, 94)',
                'rgb(239, 68, 68)',
                'rgb(59, 130, 246)',
                'rgb(236, 72, 153)',
                'rgb(250, 204, 21)',
                'rgb(168, 85, 247)',
                'rgb(234, 88, 12)',
                'rgb(20, 184, 166)',
                'rgb(6, 182, 212)',
                'rgb(245, 158, 11)'
            ];

            if (chartType === 'pie' || chartType === 'bar') {
                return {
                    labels: aggregatedData.labels,
                    datasets: [
                        {
                            data: aggregatedData.data,
                            backgroundColor: backgroundColors.slice(0, aggregatedData.labels.length),
                            borderColor: borderColors.slice(0, aggregatedData.labels.length),
                            borderWidth: 1
                        }
                    ]
                };
            }
        } else if (viewMode === 'type') {
            // For type view, similar to category but showing items
            const backgroundColors = [
                'rgba(34, 197, 94, 0.7)',
                'rgba(59, 130, 246, 0.7)',
                'rgba(236, 72, 153, 0.7)',
                'rgba(250, 204, 21, 0.7)',
                'rgba(168, 85, 247, 0.7)',
                'rgba(234, 88, 12, 0.7)',
                'rgba(20, 184, 166, 0.7)',
                'rgba(239, 68, 68, 0.7)',
                'rgba(6, 182, 212, 0.7)',
                'rgba(245, 158, 11, 0.7)'
            ];

            if (chartType === 'pie' || chartType === 'bar') {
                return {
                    labels: aggregatedData.labels,
                    datasets: [
                        {
                            data: aggregatedData.data,
                            backgroundColor: backgroundColors.slice(0, aggregatedData.labels.length),
                            borderWidth: 1
                        }
                    ]
                };
            }
        }

        return { labels: [], datasets: [] };
    }, [aggregatedData, chartType, viewMode]);

    // Chart options
    // Update chart options to handle more labels when showing multiple years
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: filterYears.length > 1 ? 45 : 0, // Rotate labels when multiple years
          minRotation: filterYears.length > 1 ? 45 : 0,
          autoSkip: false,
          font: {
            size: filterYears.length > 1 ? 9 : 12 // Smaller font for many labels
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value, true);
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== undefined) {
              label += formatCurrency(context.parsed.y);
            } else if (context.parsed !== undefined) {
              label += formatCurrency(context.parsed);
            }
            return label;
          }
        }
      },
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: getChartTitle()
      }
    }
  };

    // Simplified chart options for pie charts
    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = formatCurrency(context.raw);
                        return `${label}: ${value}`;
                    }
                }
            },
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: getChartTitle()
            }
        }
    };

    // Helper to get chart title based on current filters
    // Helper to get chart title based on current filters
    function getChartTitle() {
        const yearText = filterYears.length === 1
            ? `năm ${filterYears[0].value}`
            : `(${filterYears.map(y => y.value).join(', ')})`;

        let title = `Thống kê ${yearText}`;

        if (viewMode === 'month') {
            title = `Thống kê theo tháng ${yearText}`;
        } else if (viewMode === 'quarter') {
            title = `Thống kê theo quý ${yearText}`;
        } else if (viewMode === 'unit') {
            title = `Thống kê theo đơn vị ${yearText}`;
        } else if (viewMode === 'category') {
            if (filterCategories.length > 0) {
                const categoryText = filterCategories.map(c => c.value).join(', ');
                title = `Phân bổ ${categoryText} theo phân loại ${yearText}`;
            } else {
                title = `Thống kê doanh thu & chi phí ${yearText}`;
            }
        } else if (viewMode === 'type') {
            if (filterCategories.length > 0 && filterTypes.length > 0) {
                const categoryText = filterCategories.map(c => c.value).join(', ');
                const typeText = filterTypes.map(t => t.value).join(', ');
                title = `Phân bổ ${categoryText} - ${typeText} theo hạng mục ${yearText}`;
            }
        }

        if (filterUnits.length > 0) {
            title += ` - ${filterUnits.map(u => u.value).join(', ')}`;
        }

        return title;
    }

    // Currency formatter
    const formatCurrency = (amount, compact = false) => {
        if (amount === undefined || amount === null) return '0 ₫';

        try {
            const options = {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            };

            if (compact && Math.abs(amount) >= 1000000) {
                return (amount / 1000000).toFixed(1) + ' triệu ₫';
            } else if (compact && Math.abs(amount) >= 1000) {
                return (amount / 1000).toFixed(1) + ' nghìn ₫';
            }

            return new Intl.NumberFormat('vi-VN', options).format(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return '0 ₫';
        }
    };

    // Export to Excel
    const handleExportExcel = () => {
        try {
            let dataToExport = [];

            if (viewMode === 'month' || viewMode === 'quarter') {
                // Format data for monthly/quarterly export
                const periods = aggregatedData.labels;

                periods.forEach((period, index) => {
                    dataToExport.push({
                        'Kỳ': period,
                        'Doanh thu': aggregatedData.data[index].revenue,
                        'Chi phí': aggregatedData.data[index].expense,
                        'Lợi nhuận': aggregatedData.data[index].profit,
                        'Chi phí/Doanh thu (%)': aggregatedData.data[index].revenue > 0
                            ? ((aggregatedData.data[index].expense / aggregatedData.data[index].revenue) * 100).toFixed(1) + '%'
                            : '0%'
                    });
                });

                // Add totals row
                const totalRevenue = aggregatedData.data.reduce((sum, item) => sum + item.revenue, 0);
                const totalExpense = aggregatedData.data.reduce((sum, item) => sum + item.expense, 0);
                const totalProfit = totalRevenue - totalExpense;
                const totalRatio = totalRevenue > 0 ? ((totalExpense / totalRevenue) * 100).toFixed(1) + '%' : '0%';

                dataToExport.push({
                    'Kỳ': 'TỔNG CỘNG',
                    'Doanh thu': totalRevenue,
                    'Chi phí': totalExpense,
                    'Lợi nhuận': totalProfit,
                    'Chi phí/Doanh thu (%)': totalRatio
                });
            } else if (viewMode === 'unit') {
                // Format data for unit export
                aggregatedData.labels.forEach((unit, index) => {
                    dataToExport.push({
                        'Đơn vị': unit,
                        'Doanh thu': aggregatedData.data[index].revenue,
                        'Chi phí': aggregatedData.data[index].expense,
                        'Lợi nhuận': aggregatedData.data[index].profit,
                        'Chi phí/Doanh thu (%)': aggregatedData.data[index].revenue > 0
                            ? ((aggregatedData.data[index].expense / aggregatedData.data[index].revenue) * 100).toFixed(1) + '%'
                            : '0%'
                    });
                });

                // Add totals row
                const totalRevenue = aggregatedData.data.reduce((sum, item) => sum + item.revenue, 0);
                const totalExpense = aggregatedData.data.reduce((sum, item) => sum + item.expense, 0);
                const totalProfit = totalRevenue - totalExpense;
                const totalRatio = totalRevenue > 0 ? ((totalExpense / totalRevenue) * 100).toFixed(1) + '%' : '0%';

                dataToExport.push({
                    'Đơn vị': 'TỔNG CỘNG',
                    'Doanh thu': totalRevenue,
                    'Chi phí': totalExpense,
                    'Lợi nhuận': totalProfit,
                    'Chi phí/Doanh thu (%)': totalRatio
                });
            } else if (viewMode === 'category') {
                // For category breakdown
                if (filterCategory !== 'TẤT CẢ') {
                    aggregatedData.labels.forEach((type, index) => {
                        dataToExport.push({
                            'Phân loại': type,
                            'Giá trị': aggregatedData.data[index]
                        });
                    });

                    // Add total
                    const total = aggregatedData.data.reduce((sum, value) => sum + value, 0);
                    dataToExport.push({
                        'Phân loại': 'TỔNG CỘNG',
                        'Giá trị': total
                    });
                } else {
                    // Just DOANH THU vs CHI PHÍ
                    aggregatedData.labels.forEach((category, index) => {
                        dataToExport.push({
                            'Khoản mục': category,
                            'Giá trị': aggregatedData.data[index]
                        });
                    });

                    // Add profit row
                    const totalRevenue = aggregatedData.data[0] || 0; // DOANH THU should be first
                    const totalExpense = aggregatedData.data[1] || 0; // CHI PHÍ should be second

                    dataToExport.push({
                        'Khoản mục': 'LỢI NHUẬN',
                        'Giá trị': totalRevenue - totalExpense
                    });

                    // Add expense to revenue ratio
                    dataToExport.push({
                        'Khoản mục': 'TỶ LỆ CHI PHÍ/DOANH THU',
                        'Giá trị': totalRevenue > 0 ? ((totalExpense / totalRevenue) * 100).toFixed(1) + '%' : '0%'
                    });
                }
            } else if (viewMode === 'type') {
                // For item breakdown within a type
                aggregatedData.labels.forEach((item, index) => {
                    dataToExport.push({
                        'Hạng mục': item,
                        'Giá trị': aggregatedData.data[index]
                    });
                });

                // Add total
                const total = aggregatedData.data.reduce((sum, value) => sum + value, 0);
                dataToExport.push({
                    'Hạng mục': 'TỔNG CỘNG',
                    'Giá trị': total
                });
            }

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();

            // Add title information
            XLSX.utils.sheet_add_aoa(worksheet, [
                [`THỐNG KÊ DOANH THU & CHI PHÍ ${filterYear}`],
                [getChartTitle()],
                ['']  // Empty row before data
            ], { origin: "A1" });

            // Apply some styling (limited in xlsx)
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1";
                if (!worksheet[address]) worksheet[address] = {};
                worksheet[address].s = { font: { bold: true, sz: 16 } };
            }

            // Add trend analysis data if available
            if ((viewMode === 'month' || viewMode === 'quarter') && trendAnalysis.length > 0) {
                const trendWorksheet = XLSX.utils.json_to_sheet(trendAnalysis.map(trend => ({
                    'Kỳ': trend.period,
                    'Thay đổi Doanh thu (%)': trend.revenueChange.toFixed(1) + '%',
                    'Thay đổi Chi phí (%)': trend.expenseChange.toFixed(1) + '%',
                    'Tỷ lệ Chi phí/Doanh thu (%)': trend.expenseToRevenueRatio.toFixed(1) + '%',
                    'Thay đổi tỷ lệ (%)': trend.ratioChange.toFixed(1) + '%',
                    'Cảnh báo': trend.warnings.map(w => w.message).join('; ')
                })));

                XLSX.utils.book_append_sheet(workbook, trendWorksheet, "Phân tích xu hướng");
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, "Thống kê");

            // Generate filename based on filters
            let filename = `Thong_Ke_${filterYear}`;
            if (filterUnit !== 'TẤT CẢ') filename += `_${filterUnit}`;
            if (filterCategory !== 'TẤT CẢ') filename += `_${filterCategory}`;
            if (filterType !== 'TẤT CẢ') filename += `_${filterType}`;

            XLSX.writeFile(workbook, `${filename}.xlsx`);
            toast.success('Xuất Excel thành công!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Lỗi khi xuất Excel');
        }
    };

    // Thêm hàm reset filters
    const handleResetFilters = () => {
        setViewMode('month');
        setFilterYears([{ value: new Date().getFullYear(), label: `${new Date().getFullYear()}` }]);
        setFilterUnits([]);
        setFilterCategories([]);
        setFilterTypes([]);
        setFilterItems([]);
        setChartType('bar');
        setShowTrends(true);
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Thống Kê Doanh Thu & Chi Phí</h1>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                            </button>

                            <button
                                onClick={handleResetFilters}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                Reset bộ lọc
                            </button>

                            <button
                                onClick={handleExportExcel}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm text-green-700 mb-1">Tổng doanh thu</h3>
                                    <p className="text-2xl font-bold text-green-800">{formatCurrency(summaryStats.totalRevenue)}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-green-700" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm text-red-700 mb-1">Tổng chi phí</h3>
                                    <p className="text-2xl font-bold text-red-800">{formatCurrency(summaryStats.totalExpense)}</p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-red-700" />
                                </div>
                            </div>
                        </div>

                        <div className={`${summaryStats.profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-yellow-50 border-yellow-100'} border rounded-lg p-4`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`text-sm ${summaryStats.profit >= 0 ? 'text-blue-700' : 'text-yellow-700'} mb-1`}>Lợi nhuận</h3>
                                    <p className={`text-2xl font-bold ${summaryStats.profit >= 0 ? 'text-blue-800' : 'text-yellow-800'}`}>
                                        {formatCurrency(summaryStats.profit)}
                                    </p>
                                </div>
                                <div className={`p-3 ${summaryStats.profit >= 0 ? 'bg-blue-100' : 'bg-yellow-100'} rounded-lg`}>
                                    {summaryStats.profit >= 0 ?
                                        <TrendingUp className="w-5 h-5 text-blue-700" /> :
                                        <TrendingDown className="w-5 h-5 text-yellow-700" />
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm text-purple-700 mb-1">Biên lợi nhuận</h3>
                                    <p className="text-2xl font-bold text-purple-800">
                                        {summaryStats.profitMargin.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <PieChart className="w-5 h-5 text-purple-700" />
                                </div>
                            </div>
                        </div>

                        {/* Card mới cho tỷ lệ chi phí/doanh thu */}
                        <div className={`${summaryStats.expenseToRevenueRatio > 80
                                ? 'bg-red-50 border-red-100'
                                : summaryStats.expenseToRevenueRatio > 70
                                    ? 'bg-yellow-50 border-yellow-100'
                                    : 'bg-blue-50 border-blue-100'
                            } border rounded-lg p-4`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`text-sm ${summaryStats.expenseToRevenueRatio > 80
                                            ? 'text-red-700'
                                            : summaryStats.expenseToRevenueRatio > 70
                                                ? 'text-yellow-700'
                                                : 'text-blue-700'
                                        } mb-1`}>Chi phí/Doanh thu</h3>
                                    <p className={`text-2xl font-bold ${summaryStats.expenseToRevenueRatio > 80
                                            ? 'text-red-800'
                                            : summaryStats.expenseToRevenueRatio > 70
                                                ? 'text-yellow-800'
                                                : 'text-blue-800'
                                        }`}>
                                        {summaryStats.expenseToRevenueRatio.toFixed(1)}%
                                    </p>
                                </div>
                                <div className={`p-3 ${summaryStats.expenseToRevenueRatio > 80
                                        ? 'bg-red-100'
                                        : summaryStats.expenseToRevenueRatio > 70
                                            ? 'bg-yellow-100'
                                            : 'bg-blue-100'
                                    } rounded-lg`}>
                                    <BarChart2 className={`w-5 h-5 ${summaryStats.expenseToRevenueRatio > 80
                                            ? 'text-red-700'
                                            : summaryStats.expenseToRevenueRatio > 70
                                                ? 'text-yellow-700'
                                                : 'text-blue-700'
                                        }`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cảnh báo tổng thể */}
                    {overallTrends && overallTrends.warnings.length > 0 && (
                        <div className="mb-6">
                            {overallTrends.warnings.map((warning, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center p-3 mb-2 rounded-lg border ${warning.type === 'severe'
                                            ? 'bg-red-50 border-red-200 text-red-800'
                                            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                        }`}
                                >
                                    {warning.type === 'severe' ? (
                                        <AlertCircle className="w-5 h-5 mr-2" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 mr-2" />
                                    )}
                                    <span className="font-medium">{warning.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filter Section */}
                    {/* Filter Section */}
                    {showFilters && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {/* View mode filter */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Chế độ xem:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setViewMode('month')}
                                            className={`px-3 py-1.5 rounded-full text-sm ${viewMode === 'month'
                                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Theo tháng
                                        </button>
                                        <button
                                            onClick={() => setViewMode('quarter')}
                                            className={`px-3 py-1.5 rounded-full text-sm ${viewMode === 'quarter'
                                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Theo quý
                                        </button>
                                        <button
                                            onClick={() => setViewMode('unit')}
                                            className={`px-3 py-1.5 rounded-full text-sm ${viewMode === 'unit'
                                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Theo đơn vị
                                        </button>
                                        <button
                                            onClick={() => setViewMode('category')}
                                            className={`px-3 py-1.5 rounded-full text-sm ${viewMode === 'category'
                                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Theo khoản mục
                                        </button>
                                        <button
                                            onClick={() => setViewMode('type')}
                                            className={`px-3 py-1.5 rounded-full text-sm ${viewMode === 'type'
                                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            Theo hạng mục
                                        </button>
                                    </div>
                                </div>

                                {/* Year selector - multi-select */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Năm:</h3>
                                    <Select
                                        closeMenuOnSelect={false}
                                        components={makeAnimated()}
                                        isMulti
                                        options={availableYears.map(year => ({ value: year, label: `${year}` }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Chọn năm"
                                        value={filterYears}
                                        onChange={(selectedOptions) => handleFilterChange(selectedOptions, setFilterYears)}
                                        defaultValue={[{ value: new Date().getFullYear(), label: `${new Date().getFullYear()}` }]}
                                    />
                                </div>

                                {/* Unit filter - multi-select */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Đơn vị:</h3>
                                    <Select
                                        closeMenuOnSelect={false}
                                        components={makeAnimated()}
                                        isMulti
                                        options={availableUnits.filter(u => u !== 'TẤT CẢ').map(unit => ({ value: unit, label: unit }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Chọn đơn vị"
                                        value={filterUnits}
                                        onChange={(selectedOptions) => handleFilterChange(selectedOptions, setFilterUnits)}
                                    />
                                </div>

                                {/* Category filter - multi-select */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Khoản mục:</h3>
                                    <Select
                                        closeMenuOnSelect={false}
                                        components={makeAnimated()}
                                        isMulti
                                        options={availableCategories.filter(c => c !== 'TẤT CẢ').map(category => ({ value: category, label: category }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Chọn khoản mục"
                                        value={filterCategories}
                                        onChange={(selectedOptions) => handleFilterChange(selectedOptions, setFilterCategories)}
                                    />
                                </div>

                                {/* Type filter - multi-select */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Phân loại:</h3>
                                    <Select
                                        closeMenuOnSelect={false}
                                        components={makeAnimated()}
                                        isMulti
                                        options={availableTypes.filter(t => t !== 'TẤT CẢ').map(type => ({ value: type, label: type }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Chọn phân loại"
                                        value={filterTypes}
                                        onChange={(selectedOptions) => handleFilterChange(selectedOptions, setFilterTypes)}
                                    />
                                </div>

                                {/* Item filter - multi-select */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Hạng mục:</h3>
                                    <Select
                                        closeMenuOnSelect={false}
                                        components={makeAnimated()}
                                        isMulti
                                        options={availableItems.filter(i => i !== 'TẤT CẢ').map(item => ({ value: item, label: item }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Chọn hạng mục"
                                        value={filterItems}
                                        onChange={(selectedOptions) => handleFilterChange(selectedOptions, setFilterItems)}
                                    />
                                </div>
                            </div>

                            {/* Chart type selector và toggle xu hướng */}
                            <div className="mt-4 flex flex-wrap justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Loại biểu đồ:</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setChartType('bar')}
                                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${chartType === 'bar'
                                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <BarChart2 className="w-4 h-4" />
                                            Biểu đồ cột
                                        </button>
                                        <button
                                            onClick={() => setChartType('pie')}
                                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${chartType === 'pie'
                                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <PieChart className="w-4 h-4" />
                                            Biểu đồ tròn
                                        </button>
                                        {(viewMode === 'month' || viewMode === 'quarter') && (
                                            <button
                                                onClick={() => setChartType('line')}
                                                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${chartType === 'line'
                                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <TrendingUp className="w-4 h-4" />
                                                Biểu đồ đường
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Toggle phân tích xu hướng */}
                                <div className="flex items-center mt-2 md:mt-0">
                                    <span className="text-sm text-gray-700 mr-2">Hiện phân tích xu hướng:</span>
                                    <button
                                        onClick={() => setShowTrends(!showTrends)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showTrends ? 'bg-indigo-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showTrends ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span className="ml-3 text-indigo-600">Đang tải dữ liệu...</span>
                        </div>
                    )}

                    {/* Chart Section */}
                    {!loading && filteredData.length > 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="h-96">
                                {chartType === 'bar' && (
                                    <Bar data={chartData} options={chartOptions} />
                                )}
                                {chartType === 'pie' && (
                                    <Pie data={chartData} options={pieChartOptions} />
                                )}
                                {chartType === 'line' && (
                                    <Line data={chartData} options={chartOptions} />
                                )}
                            </div>

                            {/* So sánh với kỳ trước */}
                            {!loading && filteredData.length > 0 && overallTrends && showTrends && (
                                <div className="mt-6 mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">So sánh {overallTrends.currentPeriod} với {overallTrends.previousPeriod}</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* So sánh doanh thu */}
                                        <div className={`bg-white rounded-lg border ${overallTrends.revenueChange >= 0 ? 'border-green-200' : 'border-red-200'
                                            } p-4 shadow-sm`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium text-gray-800">Doanh thu</h4>
                                                <div className={`flex items-center ${overallTrends.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    <span className="text-sm font-bold">{overallTrends.revenueChange.toFixed(1)}%</span>
                                                    {overallTrends.revenueChange >= 0 ? (
                                                        <TrendingUp className="w-4 h-4 ml-1" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4 ml-1" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Kỳ trước: {formatCurrency(overallTrends.previousData.revenue)}</span>
                                                <span>Kỳ này: {formatCurrency(overallTrends.currentData.revenue)}</span>
                                            </div>

                                            <div className="mt-2 h-8 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${overallTrends.revenueChange >= 0 ? 'bg-green-500' : 'bg-red-500'
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(Math.abs(overallTrends.revenueChange), 100)}%`,
                                                        minWidth: '5%'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* So sánh chi phí */}
                                        <div className={`bg-white rounded-lg border ${overallTrends.expenseChange <= 0 ? 'border-green-200' : 'border-red-200'
                                            } p-4 shadow-sm`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium text-gray-800">Chi phí</h4>
                                                <div className={`flex items-center ${overallTrends.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    <span className="text-sm font-bold">{overallTrends.expenseChange.toFixed(1)}%</span>
                                                    {overallTrends.expenseChange <= 0 ? (
                                                        <TrendingDown className="w-4 h-4 ml-1" />
                                                    ) : (
                                                        <TrendingUp className="w-4 h-4 ml-1" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Kỳ trước: {formatCurrency(overallTrends.previousData.expense)}</span>
                                                <span>Kỳ này: {formatCurrency(overallTrends.currentData.expense)}</span>
                                            </div>

                                            <div className="mt-2 h-8 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${overallTrends.expenseChange <= 0 ? 'bg-green-500' : 'bg-red-500'
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(Math.abs(overallTrends.expenseChange), 100)}%`,
                                                        minWidth: '5%'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Tỷ lệ chi phí/doanh thu */}
                                        <div className={`bg-white rounded-lg border ${overallTrends.expenseRatioChange <= 0 ? 'border-green-200' : 'border-red-200'
                                            } p-4 shadow-sm`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium text-gray-800">Chi phí/Doanh thu</h4>
                                                <div className={`flex items-center ${overallTrends.expenseRatioChange <= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    <span className="text-sm font-bold">{overallTrends.currentExpenseRatio.toFixed(1)}%</span>
                                                    {overallTrends.expenseRatioChange < 0 ? (
                                                        <TrendingDown className="w-4 h-4 ml-1" />
                                                    ) : overallTrends.expenseRatioChange > 0 ? (
                                                        <TrendingUp className="w-4 h-4 ml-1" />
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Kỳ trước: {overallTrends.previousExpenseRatio.toFixed(1)}%</span>
                                                <span>Kỳ này: {overallTrends.currentExpenseRatio.toFixed(1)}%</span>
                                            </div>

                                            <div className="mt-2 h-8 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${overallTrends.currentExpenseRatio < 50 ? 'bg-green-500' :
                                                            overallTrends.currentExpenseRatio < 70 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${Math.min(overallTrends.currentExpenseRatio, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phân tích xu hướng & Cảnh báo */}
                            {!loading && filteredData.length > 0 && showTrends && trendAnalysis.length > 0 && (
                                <div className="mt-6 mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Phân tích xu hướng & Cảnh báo</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {trendAnalysis.filter(trend => trend.warnings.length > 0).map((trend, index) => (
                                            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                                <h4 className="font-medium text-gray-800 mb-2">{trend.period}</h4>

                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-600">Doanh thu:</span>
                                                    <div className={`flex items-center ${trend.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        <span className="text-sm font-medium">{trend.revenueChange.toFixed(1)}%</span>
                                                        {trend.revenueChange >= 0 ? (
                                                            <TrendingUp className="w-4 h-4 ml-1" />
                                                        ) : (
                                                            <TrendingDown className="w-4 h-4 ml-1" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-600">Chi phí:</span>
                                                    <div className={`flex items-center ${trend.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        <span className="text-sm font-medium">{trend.expenseChange.toFixed(1)}%</span>
                                                        {trend.expenseChange <= 0 ? (
                                                            <TrendingDown className="w-4 h-4 ml-1" />
                                                        ) : (
                                                            <TrendingUp className="w-4 h-4 ml-1" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm text-gray-600">Tỷ lệ chi phí/doanh thu:</span>
                                                    <span className={`text-sm font-medium ${trend.expenseToRevenueRatio > 80 ? 'text-red-600' :
                                                        trend.expenseToRevenueRatio > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {trend.expenseToRevenueRatio.toFixed(1)}%
                                                    </span>
                                                </div>

                                                <div className="border-t border-gray-100 pt-2 mt-2">
                                                    <h5 className="text-xs font-medium text-gray-500 mb-2">Cảnh báo:</h5>
                                                    {trend.warnings.map((warning, wIndex) => (
                                                        <div
                                                            key={wIndex}
                                                            className={`flex items-start p-2 mb-1 rounded-md text-sm ${warning.type === 'severe' ? 'bg-red-50 text-red-800' :
                                                                    warning.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                                                                        'bg-blue-50 text-blue-800'
                                                                }`}
                                                        >
                                                            {warning.type === 'severe' ? (
                                                                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                                            ) : warning.type === 'warning' ? (
                                                                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                                            ) : (
                                                                <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                                            )}
                                                            <span className="text-xs">{warning.message}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Data table section */}
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết số liệu</h3>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {viewMode === 'month' && (
                                                    <>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tháng</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lợi nhuận</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Biên LN</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí/DT</th>
                                                    </>
                                                )}

                                                {viewMode === 'quarter' && (
                                                    <>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quý</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lợi nhuận</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Biên LN</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí/DT</th>
                                                    </>
                                                )}

                                                {viewMode === 'unit' && (
                                                    <>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lợi nhuận</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Biên LN</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí/DT</th>
                                                    </>
                                                )}

                                                {viewMode === 'category' && (
                                                    <>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            {filterCategory !== 'TẤT CẢ' ? 'Phân loại' : 'Khoản mục'}
                                                        </th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Tổng</th>
                                                    </>
                                                )}

                                                {viewMode === 'type' && (
                                                    <>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng mục</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Tổng</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {(viewMode === 'month' || viewMode === 'quarter') && aggregatedData.labels.map((period, index) => {
                                                const revenue = aggregatedData.data[index].revenue;
                                                const expense = aggregatedData.data[index].expense;
                                                const profit = aggregatedData.data[index].profit;
                                                const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                                                const expenseRatio = revenue > 0 ? (expense / revenue) * 100 : 0;

                                                // Kiểm tra nếu có cảnh báo cho kỳ này
                                                const hasTrendWarning = trendAnalysis.find(trend =>
                                                    trend.period === period && trend.warnings.length > 0
                                                );

                                                return (
                                                    <tr key={index} className={`hover:bg-gray-50 transition-colors ${hasTrendWarning ? 'bg-yellow-50' : ''}`}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            <div className="flex items-center">
                                                                {period}
                                                                {hasTrendWarning && (
                                                                    <AlertTriangle className="w-4 h-4 ml-1 text-yellow-500" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">{formatCurrency(revenue)}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">{formatCurrency(expense)}</td>
                                                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${profit >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                                            {formatCurrency(profit)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                                            {margin.toFixed(1)}%
                                                        </td>
                                                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${expenseRatio > 90 ? 'text-red-600 font-medium' :
                                                                expenseRatio > 70 ? 'text-yellow-600' : 'text-gray-700'
                                                            }`}>
                                                            {expenseRatio.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {viewMode === 'unit' && aggregatedData.labels.map((unit, index) => {
                                                const revenue = aggregatedData.data[index].revenue;
                                                const expense = aggregatedData.data[index].expense;
                                                const profit = aggregatedData.data[index].profit;
                                                const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                                                const expenseRatio = revenue > 0 ? (expense / revenue) * 100 : 0;

                                                return (
                                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{unit}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">{formatCurrency(revenue)}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">{formatCurrency(expense)}</td>
                                                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${profit >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                                            {formatCurrency(profit)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                                            {margin.toFixed(1)}%
                                                        </td>
                                                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${expenseRatio > 90 ? 'text-red-600 font-medium' :
                                                                expenseRatio > 70 ? 'text-yellow-600' : 'text-gray-700'
                                                            }`}>
                                                            {expenseRatio.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {viewMode === 'category' && (
                                                aggregatedData.labels.map((label, index) => {
                                                    const value = aggregatedData.data[index];
                                                    const total = aggregatedData.data.reduce((sum, val) => sum + val, 0);
                                                    const percentage = total > 0 ? (value / total) * 100 : 0;

                                                    return (
                                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{label}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">{formatCurrency(value)}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                                                {percentage.toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}

                                            {viewMode === 'type' && (
                                                aggregatedData.labels.map((label, index) => {
                                                    const value = aggregatedData.data[index];
                                                    const total = aggregatedData.data.reduce((sum, val) => sum + val, 0);
                                                    const percentage = total > 0 ? (value / total) * 100 : 0;

                                                    return (
                                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{label}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">{formatCurrency(value)}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                                                {percentage.toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}

                                            {/* Summary row */}
                                            {(viewMode === 'month' || viewMode === 'quarter' || viewMode === 'unit') && (
                                                <tr className="bg-gray-50 font-semibold">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">TỔNG CỘNG</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                                                        {formatCurrency(summaryStats.totalRevenue)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                                                        {formatCurrency(summaryStats.totalExpense)}
                                                    </td>
                                                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${summaryStats.profit >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                                        {formatCurrency(summaryStats.profit)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                                        {summaryStats.profitMargin.toFixed(1)}%
                                                    </td>
                                                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${summaryStats.expenseToRevenueRatio > 90 ? 'text-red-600' :
                                                            summaryStats.expenseToRevenueRatio > 70 ? 'text-yellow-600' : 'text-gray-700'
                                                        }`}>
                                                        {summaryStats.expenseToRevenueRatio.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            )}

                                            {(viewMode === 'category' || viewMode === 'type') && (
                                                <tr className="bg-gray-50 font-semibold">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">TỔNG CỘNG</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                                        {formatCurrency(aggregatedData.data.reduce((sum, val) => sum + val, 0))}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                                        100.0%
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : !loading && (
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                            <BarChart2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-lg">Không có dữ liệu thống kê phù hợp với bộ lọc đã chọn.</p>
                            <p className="text-sm mt-2">Vui lòng điều chỉnh bộ lọc hoặc thêm dữ liệu ghi nhận.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Container */}
            {/* Toast Container */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
};

export default ThongKePage;