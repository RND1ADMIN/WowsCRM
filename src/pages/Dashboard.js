import React, { useState, useEffect } from 'react';
import {
   LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis,
   CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
   Users, FileText, Briefcase, Calendar, TrendingUp, 
   Phone, MessageSquare, Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { DatePicker } from "../components/ui/datepicker";
import authUtils from '../utils/authUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const formatCurrency = (value) => {
   if (value >= 1e9) return (value / 1e9).toFixed(1) + ' tỷ';
   if (value >= 1e6) return (value / 1e6).toFixed(1) + ' triệu';
   if (value >= 1e3) return (value / 1e3).toFixed(1) + ' nghìn';
   return value + 'đ';
};

const StatCardSkeleton = () => (
   <Card className="animate-pulse">
       <CardContent className="p-4">
           <div className="flex items-start justify-between">
               <div className="space-y-2">
                   <div className="h-3 w-20 bg-gray-200 rounded"></div>
                   <div className="h-6 w-24 bg-gray-300 rounded"></div>
                   <div className="h-3 w-28 bg-gray-200 rounded"></div>
               </div>
               <div className="bg-gray-300 rounded-lg p-2 w-8 h-8"></div>
           </div>
       </CardContent>
   </Card>
);

const ChartSkeleton = ({ height = "h-72" }) => (
   <Card>
       <CardHeader>
           <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
       </CardHeader>
       <CardContent>
           <div className={`${height} bg-gray-100 rounded-lg animate-pulse flex items-center justify-center`}>
               <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
           </div>
       </CardContent>
   </Card>
);

const StatCard = ({ title, value, icon: Icon, color, percentageChange, isCurrency }) => (
   <Card className="transition-transform duration-200 hover:scale-[1.02]">
       <CardContent className="p-4">
           <div className="flex items-start justify-between">
               <div>
                   <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                   <h3 className="text-xl font-bold text-gray-800">
                       {isCurrency ? formatCurrency(value) : value}
                   </h3>
                   {percentageChange !== undefined && (
                       <p className={`text-xs mt-1 flex items-center ${percentageChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                           <span className={`mr-1 ${percentageChange > 0 ? 'rotate-0' : 'rotate-180'}`}>↑</span>
                           {Math.abs(percentageChange)}% so với tháng trước
                       </p>
                   )}
               </div>
               <div className={`${color} rounded-lg p-2`}>
                   <Icon className="w-4 h-4 text-white" />
               </div>
           </div>
       </CardContent>
   </Card>
);

// Mock data generator functions
const generateMockData = () => {
   // Customers data
   const customers = Array.from({ length: 120 }, (_, i) => ({
       id: i + 1,
       name: `Khách hàng ${i + 1}`,
       phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
       email: `customer${i + 1}@example.com`,
       type: ['VIP', 'Regular', 'New'][Math.floor(Math.random() * 3)],
       createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
   }));

   // Customer care activities
   const careActivities = Array.from({ length: 250 }, (_, i) => ({
       id: i + 1,
       customerId: Math.floor(Math.random() * 120) + 1,
       type: ['Call', 'Email', 'Message', 'Visit'][Math.floor(Math.random() * 4)],
       notes: `Hoạt động chăm sóc ${i + 1}`,
       date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
   }));

   // Quotes
   const quotes = Array.from({ length: 80 }, (_, i) => ({
       id: i + 1,
       customerId: Math.floor(Math.random() * 120) + 1,
       amount: Math.floor(10000000 + Math.random() * 90000000),
       status: ['Pending', 'Accepted', 'Rejected'][Math.floor(Math.random() * 3)],
       date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
   }));

   // Contracts
   const contracts = Array.from({ length: 45 }, (_, i) => ({
       id: i + 1,
       customerId: Math.floor(Math.random() * 120) + 1,
       amount: Math.floor(20000000 + Math.random() * 150000000),
       status: ['Active', 'Completed', 'Terminated'][Math.floor(Math.random() * 3)],
       startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
   }));

   // Appointments
   const appointments = Array.from({ length: 95 }, (_, i) => ({
       id: i + 1,
       customerId: Math.floor(Math.random() * 120) + 1,
       purpose: ['Discussion', 'Presentation', 'Contract Signing', 'Support'][Math.floor(Math.random() * 4)],
       status: ['Scheduled', 'Completed', 'Cancelled'][Math.floor(Math.random() * 3)],
       date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
   }));

   return { customers, careActivities, quotes, contracts, appointments };
};

const CRMDashboard = () => {
   const [allData, setAllData] = useState(null);
   const [dateRange, setDateRange] = useState({
       start: new Date(new Date().setDate(new Date().getDate() - 30)),
       end: new Date()
   });
   const [chartType, setChartType] = useState('line');
   const [timeFilter, setTimeFilter] = useState('30d');
   const [stats, setStats] = useState(null);
   const [loading, setLoading] = useState(true);
   const [analyticsData, setAnalyticsData] = useState({
       revenueData: [],
       customerStats: [],
       careTypeStats: [],
       quoteStats: {},
   });

   const handleTimeFilterChange = (value) => {
       setTimeFilter(value);
       const end = new Date();
       let start = new Date();

       switch (value) {
           case '7d':
               start.setDate(end.getDate() - 7);
               break;
           case '30d':
               start.setDate(end.getDate() - 30);
               break;
           case '90d':
               start.setDate(end.getDate() - 90);
               break;
           case '1y':
               start.setFullYear(end.getFullYear() - 1);
               break;
       }

       setDateRange({ start, end });
   };

   const handleRefresh = async () => {
       setLoading(true);
       // In a real app, you would fetch from API
       // For now, we regenerate mock data
       setAllData(generateMockData());
       setTimeout(() => {
           processData();
       }, 500);
   };

   const processData = () => {
       try {
           if (!allData) return;

           const { customers, careActivities, quotes, contracts, appointments } = allData;

           // Filter data by date range
           const filteredCustomers = customers.filter(customer => 
               customer.createdAt >= dateRange.start && customer.createdAt <= dateRange.end
           );
           
           const filteredCareActivities = careActivities.filter(activity => 
               activity.date >= dateRange.start && activity.date <= dateRange.end
           );
           
           const filteredQuotes = quotes.filter(quote => 
               quote.date >= dateRange.start && quote.date <= dateRange.end
           );
           
           const filteredContracts = contracts.filter(contract => 
               contract.startDate >= dateRange.start && contract.startDate <= dateRange.end
           );
           
           const filteredAppointments = appointments.filter(appointment => 
               appointment.date >= dateRange.start && appointment.date <= dateRange.end
           );

           // Calculate revenue from contracts
           const totalRevenue = filteredContracts.reduce((sum, contract) => 
               sum + contract.amount, 0
           );

           // Get counts
           const totalCustomers = filteredCustomers.length;
           const totalCareActivities = filteredCareActivities.length;
           const totalQuotes = filteredQuotes.length;
           const totalContracts = filteredContracts.length;
           const totalAppointments = filteredAppointments.length;

           // Calculate percentage changes (comparing to previous period)
           const previousPeriodStart = new Date(dateRange.start);
           previousPeriodStart.setDate(previousPeriodStart.getDate() - (dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
           
           const previousPeriodCustomers = customers.filter(customer => 
               customer.createdAt >= previousPeriodStart && customer.createdAt < dateRange.start
           ).length;
           
           const customerPercentageChange = previousPeriodCustomers 
               ? ((totalCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100 
               : 0;

           const previousPeriodRevenue = contracts.filter(contract => 
               contract.startDate >= previousPeriodStart && contract.startDate < dateRange.start
           ).reduce((sum, contract) => sum + contract.amount, 0);
           
           const revenuePercentageChange = previousPeriodRevenue 
               ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
               : 0;

           setStats({
               customers: totalCustomers,
               careActivities: totalCareActivities,
               quotes: totalQuotes,
               contracts: totalContracts,
               appointments: totalAppointments,
               revenue: totalRevenue,
               customerPercentageChange: parseFloat(customerPercentageChange.toFixed(1)),
               revenuePercentageChange: parseFloat(revenuePercentageChange.toFixed(1))
           });

           // Prepare data for charts
           // Revenue by month
           const revenueByMonth = contracts.reduce((acc, contract) => {
               const month = contract.startDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
               acc[month] = (acc[month] || 0) + contract.amount;
               return acc;
           }, {});

           const revenueData = Object.entries(revenueByMonth)
               .map(([month, amount]) => ({
                   month,
                   revenue: amount
               }))
               .sort((a, b) => new Date(a.month) - new Date(b.month));

           // Customer types
           const customerByType = customers.reduce((acc, customer) => {
               acc[customer.type] = (acc[customer.type] || 0) + 1;
               return acc;
           }, {});

           const customerStats = Object.entries(customerByType)
               .map(([type, count]) => ({
                   type,
                   count
               }));

           // Care activities by type
           const careByType = filteredCareActivities.reduce((acc, activity) => {
               acc[activity.type] = (acc[activity.type] || 0) + 1;
               return acc;
           }, {});

           const careTypeStats = Object.entries(careByType)
               .map(([type, count]) => ({
                   type,
                   count
               }));

           // Quote statistics
           const acceptedQuotes = filteredQuotes.filter(quote => quote.status === 'Accepted').length;
           const quoteSuccessRate = filteredQuotes.length ? (acceptedQuotes / filteredQuotes.length) * 100 : 0;
           
           const quoteStats = {
               total: filteredQuotes.length,
               accepted: acceptedQuotes,
               successRate: quoteSuccessRate,
               averageValue: filteredQuotes.length ? 
                   filteredQuotes.reduce((sum, quote) => sum + quote.amount, 0) / filteredQuotes.length : 0
           };

           setAnalyticsData({
               revenueData,
               customerStats,
               careTypeStats,
               quoteStats
           });
       } catch (error) {
           console.error('Error processing data:', error);
       } finally {
           setLoading(false);
       }
   };

   const resetFilters = () => {
       setDateRange({
           start: new Date(new Date().setDate(new Date().getDate() - 30)),
           end: new Date()
       });
       setTimeFilter('30d');
   };

   useEffect(() => {
       // Load mock data on first render
       if (!allData) {
           setAllData(generateMockData());
       } else {
           processData();
       }
   }, [dateRange, allData]);

   const statCards = stats ? [
       {
           title: 'Khách hàng',
           value: stats.customers || 0,
           icon: Users,
           color: 'bg-blue-500',
           percentageChange: stats.customerPercentageChange,
           isCurrency: false
       },
       {
           title: 'Lượt chăm sóc',
           value: stats.careActivities || 0,
           icon: MessageSquare,
           color: 'bg-green-500',
           isCurrency: false
       },
       {
           title: 'Báo giá',
           value: stats.quotes || 0,
           icon: FileText,
           color: 'bg-orange-500',
           isCurrency: false
       },
       {
           title: 'Hợp đồng',
           value: stats.contracts || 0,
           icon: Briefcase,
           color: 'bg-purple-500',
           isCurrency: false
       },
       {
           title: 'Doanh thu',
           value: stats.revenue || 0,
           icon: TrendingUp,
           color: 'bg-red-500',
           percentageChange: stats.revenuePercentageChange,
           isCurrency: true
       },
       {
           title: 'Cuộc hẹn',
           value: stats.appointments || 0,
           icon: Calendar,
           color: 'bg-indigo-500',
           isCurrency: false
       }
   ] : [];

   return (
       <div className="p-4 bg-gray-50 min-h-screen">
           <div className="mx-auto space-y-4">
               <div className="bg-white p-6 rounded-lg shadow-lg">
                   <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                       <h1 className="text-2xl font-bold text-gray-900">
                           Tổng quan CRM
                       </h1>

                       <div className="flex flex-wrap items-center gap-4">
                           <Button variant="outline" onClick={handleRefresh}>
                               <Loader2 className="w-4 h-4 mr-2" />
                               Làm mới
                           </Button>

                           <Button variant="outline" onClick={resetFilters}>
                               Reset
                           </Button>

                           <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                               <SelectTrigger className="w-44">
                                   <Calendar className="w-4 h-4 mr-2" />
                                   <SelectValue placeholder="Chọn thời gian" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="7d">7 ngày qua</SelectItem>
                                   <SelectItem value="30d">30 ngày qua</SelectItem>
                                   <SelectItem value="90d">90 ngày qua</SelectItem>
                                   <SelectItem value="1y">1 năm qua</SelectItem>
                               </SelectContent>
                           </Select>

                           <div className="flex gap-4">
                               <DatePicker
                                   selected={dateRange.start}
                                   onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                                   className="w-36"
                                   placeholderText="Từ ngày"
                               />
                               <DatePicker
                                   selected={dateRange.end}
                                   onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                                   className="w-36"
                                   placeholderText="Đến ngày"
                               />
                           </div>
                       </div>
                   </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                   {loading
                       ? Array(6).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
                       : statCards.map((stat, index) => <StatCard key={index} {...stat} />)
                   }
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {loading ? (
                       <>
                           <ChartSkeleton height="h-72" />
                           <ChartSkeleton height="h-72" />
                       </>
                   ) : (
                       <>
                           <Card>
                               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                   <CardTitle className="text-base font-semibold">
                                       Xu hướng doanh thu
                                   </CardTitle>
                                   <div className="flex gap-2">
                                       <Button
                                           variant={chartType === 'line' ? 'default' : 'outline'}
                                           size="sm"
                                           onClick={() => setChartType('line')}
                                       >
                                           Line
                                       </Button>
                                       <Button
                                           variant={chartType === 'bar' ? 'default' : 'outline'}
                                           size="sm"
                                           onClick={() => setChartType('bar')}
                                       >
                                           Bar
                                       </Button>
                                   </div>
                               </CardHeader>
                               <CardContent>
                                   <div className="h-72">
                                       <ResponsiveContainer width="100%" height="100%">
                                           {chartType === 'line' ? (
                                               <LineChart data={analyticsData.revenueData}>
                                                   <CartesianGrid strokeDasharray="3 3" />
                                                   <XAxis dataKey="month" />
                                                   <YAxis tickFormatter={formatCurrency} />
                                                   <Tooltip formatter={(value) => formatCurrency(value)} />
                                                   <Legend />
                                                   <Line
                                                       type="monotone"
                                                       dataKey="revenue"
                                                       stroke="#0088FE"
                                                       name="Doanh thu"
                                                   />
                                               </LineChart>
                                           ) : (
                                               <BarChart data={analyticsData.revenueData}>
                                                   <CartesianGrid strokeDasharray="3 3" />
                                                   <XAxis dataKey="month" />
                                                   <YAxis tickFormatter={formatCurrency} />
                                                   <Tooltip formatter={(value) => formatCurrency(value)} />
                                                   <Legend />
                                                   <Bar dataKey="revenue" fill="#0088FE" name="Doanh thu" />
                                               </BarChart>
                                           )}
                                       </ResponsiveContainer>
                                   </div>
                               </CardContent>
                           </Card>

                           <Card>
                               <CardHeader>
                                   <CardTitle className="text-base font-semibold">
                                       Phân loại khách hàng
                                   </CardTitle>
                               </CardHeader>
                               <CardContent>
                                   <div className="h-72">
                                       <ResponsiveContainer width="100%" height="100%">
                                           <PieChart>
                                               <Pie
                                                   data={analyticsData.customerStats}
                                                   dataKey="count"
                                                   nameKey="type"
                                                   cx="50%"
                                                   cy="50%"
                                                   outerRadius={80}
                                                   label={({ type, count }) => `${type}: ${count}`}
                                               >
                                                   {analyticsData.customerStats.map((entry, index) => (
                                                       <Cell
                                                           key={`cell-${index}`}
                                                           fill={COLORS[index % COLORS.length]}
                                                       />
                                                   ))}
                                               </Pie>
                                               <Tooltip />
                                               <Legend />
                                           </PieChart>
                                       </ResponsiveContainer>
                                   </div>
                               </CardContent>
                           </Card>
                       </>
                   )}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {loading ? (
                       <>
                           <ChartSkeleton height="h-72" />
                           <ChartSkeleton height="h-72" />
                       </>
                   ) : (
                       <>
                           <Card>
                               <CardHeader>
                                   <CardTitle className="text-base font-semibold">
                                       Loại hình chăm sóc khách hàng
                                   </CardTitle>
                               </CardHeader>
                               <CardContent>
                                   <div className="h-72">
                                       <ResponsiveContainer width="100%" height="100%">
                                           <BarChart data={analyticsData.careTypeStats}>
                                               <CartesianGrid strokeDasharray="3 3" />
                                               <XAxis dataKey="type" />
                                               <YAxis />
                                               <Tooltip />
                                               <Legend />
                                               <Bar dataKey="count" fill="#00C49F" name="Số lượng" />
                                           </BarChart>
                                       </ResponsiveContainer>
                                   </div>
                               </CardContent>
                           </Card>

                           <Card>
                               <CardHeader>
                                   <CardTitle className="text-base font-semibold">
                                       Thống kê báo giá
                                   </CardTitle>
                               </CardHeader>
                               <CardContent>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                       <div className="bg-blue-50 p-4 rounded-lg">
                                           <p className="text-sm text-blue-600 font-medium">
                                               Tổng số báo giá
                                           </p>
                                           <p className="text-xl font-bold mt-1">
                                               {analyticsData.quoteStats.total}
                                           </p>
                                       </div>
                                       <div className="bg-green-50 p-4 rounded-lg">
                                           <p className="text-sm text-green-600 font-medium">
                                               Tỷ lệ thành công
                                           </p>
                                           <p className="text-xl font-bold mt-1">
                                               {analyticsData.quoteStats.successRate?.toFixed(1)}%
                                           </p>
                                       </div>
                                       <div className="bg-orange-50 p-4 rounded-lg">
                                           <p className="text-sm text-orange-600 font-medium">
                                               Giá trị trung bình
                                           </p>
                                           <p className="text-xl font-bold mt-1">
                                               {formatCurrency(analyticsData.quoteStats.averageValue)}
                                           </p>
                                       </div>
                                   </div>
                                   
                                   <div className="h-40">
                                       <ResponsiveContainer width="100%" height="100%">
                                           <PieChart>
                                               <Pie
                                                   data={[
                                                       { name: 'Chấp nhận', value: analyticsData.quoteStats.accepted },
                                                       { name: 'Từ chối/Chờ', value: analyticsData.quoteStats.total - analyticsData.quoteStats.accepted }
                                                   ]}
                                                   dataKey="value"
                                                   nameKey="name"
                                                   cx="50%"
                                                   cy="50%"
                                                   outerRadius={60}
                                                   label
                                               >
                                                   <Cell fill="#4CAF50" />
                                                   <Cell fill="#F44336" />
                                               </Pie>
                                               <Tooltip />
                                               <Legend />
                                           </PieChart>
                                       </ResponsiveContainer>
                                   </div>
                               </CardContent>
                           </Card>
                       </>
                   )}
               </div>

               <Card>
                   <CardHeader>
                       <CardTitle className="text-base font-semibold">
                           Cuộc hẹn và lịch trình
                       </CardTitle>
                   </CardHeader>
                   <CardContent>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="bg-indigo-50 p-4 rounded-lg">
                               <p className="text-sm text-indigo-600 font-medium">
                                   Tổng số cuộc hẹn
                               </p>
                               <p className="text-xl font-bold mt-1">
                                   {stats?.appointments || 0}
                               </p>
                           </div>
                           <div className="bg-green-50 p-4 rounded-lg">
                               <p className="text-sm text-green-600 font-medium">
                                   Tỷ lệ thành công
                               </p>
                               <p className="text-xl font-bold mt-1">
                                   {allData ? 
                                       ((allData.appointments.filter(a => a.status === 'Completed').length / 
                                         allData.appointments.length) * 100).toFixed(1) + '%' : '0%'}
                               </p>
                           </div>
                           <div className="bg-yellow-50 p-4 rounded-lg">
                               <p className="text-sm text-yellow-600 font-medium">
                                   Cuộc hẹn sắp tới
                               </p>
                               <p className="text-xl font-bold mt-1">
                                   {allData ? 
                                       allData.appointments.filter(a => 
                                           a.status === 'Scheduled' && 
                                           a.date > new Date()).length : 0}
                               </p>
                           </div>
                       </div>
                   </CardContent>
               </Card>
           </div>
       </div>
   );
};

export default CRMDashboard;