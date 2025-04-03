import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Building, Users, Search } from 'lucide-react';

// Sample organizational data
const sampleOrgData = {
  companyInfo: {
    name: "TechVision Solutions",
    founded: "2010",
    headquarters: "Hà Nội, Việt Nam",
    employees: 245,
    ceo: "Nguyễn Văn Minh"
  },
  departments: [
    {
      id: "board",
      name: "Ban lãnh đạo",
      head: "Nguyễn Văn Minh",
      headTitle: "CEO",
      employeeCount: 5,
      budget: 500000000,
      value: 500
    },
    {
      id: "tech",
      name: "Công nghệ",
      head: "Trần Thị Hương",
      headTitle: "CTO",
      employeeCount: 85,
      budget: 1200000000,
      value: 1200,
      subDepartments: [
        {
          id: "dev",
          name: "Phát triển phần mềm",
          head: "Lê Minh Đức",
          headTitle: "Development Director",
          employeeCount: 45,
          budget: 800000000,
          value: 800
        },
        {
          id: "infra",
          name: "Hạ tầng & DevOps",
          head: "Phạm Tuấn Anh",
          headTitle: "Infrastructure Manager",
          employeeCount: 15,
          budget: 250000000,
          value: 250
        },
        {
          id: "qa",
          name: "Kiểm thử & Đảm bảo chất lượng",
          head: "Hoàng Thị Mai",
          headTitle: "QA Manager",
          employeeCount: 25,
          budget: 150000000,
          value: 150
        }
      ]
    },
    {
      id: "sales",
      name: "Kinh doanh",
      head: "Đỗ Quang Hải",
      headTitle: "Sales Director",
      employeeCount: 35,
      budget: 800000000,
      value: 800,
      subDepartments: [
        {
          id: "domestic",
          name: "Kinh doanh trong nước",
          head: "Nguyễn Thu Trang",
          headTitle: "Domestic Sales Manager",
          employeeCount: 20,
          budget: 450000000,
          value: 450
        },
        {
          id: "international",
          name: "Kinh doanh quốc tế",
          head: "Lý Quốc Bảo",
          headTitle: "International Sales Manager",
          employeeCount: 15,
          budget: 350000000,
          value: 350
        }
      ]
    },
    {
      id: "marketing",
      name: "Marketing",
      head: "Vũ Thị Hà",
      headTitle: "Marketing Director",
      employeeCount: 25,
      budget: 600000000,
      value: 600,
      subDepartments: [
        {
          id: "digital",
          name: "Digital Marketing",
          head: "Ngô Minh Tuấn",
          headTitle: "Digital Marketing Manager",
          employeeCount: 15,
          budget: 350000000,
          value: 350
        },
        {
          id: "brand",
          name: "Thương hiệu & PR",
          head: "Trần Mai Anh",
          headTitle: "Brand Manager",
          employeeCount: 10,
          budget: 250000000,
          value: 250
        }
      ]
    },
    {
      id: "hr",
      name: "Nhân sự",
      head: "Lê Thanh Thảo",
      headTitle: "HR Director",
      employeeCount: 12,
      budget: 300000000,
      value: 300,
      subDepartments: [
        {
          id: "recruitment",
          name: "Tuyển dụng",
          head: "Nguyễn Minh Trí",
          headTitle: "Recruitment Manager",
          employeeCount: 5,
          budget: 120000000,
          value: 120
        },
        {
          id: "training",
          name: "Đào tạo & Phát triển",
          head: "Phạm Thị Quỳnh",
          headTitle: "Training Manager",
          employeeCount: 7,
          budget: 180000000,
          value: 180
        }
      ]
    },
    {
      id: "finance",
      name: "Tài chính",
      head: "Trương Văn Nam",
      headTitle: "CFO",
      employeeCount: 20,
      budget: 400000000,
      value: 400,
      subDepartments: [
        {
          id: "accounting",
          name: "Kế toán",
          head: "Lê Thị Hồng",
          headTitle: "Chief Accountant",
          employeeCount: 12,
          budget: 250000000,
          value: 250
        },
        {
          id: "financial_planning",
          name: "Hoạch định tài chính",
          head: "Đặng Văn Hiếu",
          headTitle: "Financial Planning Manager",
          employeeCount: 8,
          budget: 150000000,
          value: 150
        }
      ]
    },
    {
      id: "operations",
      name: "Vận hành",
      head: "Võ Thành Long",
      headTitle: "Operations Director",
      employeeCount: 30,
      budget: 500000000,
      value: 500,
      subDepartments: [
        {
          id: "logistics",
          name: "Hậu cần & Cung ứng",
          head: "Nguyễn Văn Tùng",
          headTitle: "Logistics Manager",
          employeeCount: 18,
          budget: 300000000,
          value: 300
        },
        {
          id: "facilities",
          name: "Cơ sở vật chất",
          head: "Trần Thị Thu",
          headTitle: "Facilities Manager",
          employeeCount: 12,
          budget: 200000000,
          value: 200
        }
      ]
    },
    {
      id: "customer_support",
      name: "Hỗ trợ khách hàng",
      head: "Nguyễn Thị Lan",
      headTitle: "Customer Support Director",
      employeeCount: 33,
      budget: 450000000,
      value: 450,
      subDepartments: [
        {
          id: "technical_support",
          name: "Hỗ trợ kỹ thuật",
          head: "Lê Văn Dũng",
          headTitle: "Technical Support Manager",
          employeeCount: 20,
          budget: 280000000,
          value: 280
        },
        {
          id: "customer_service",
          name: "Dịch vụ khách hàng",
          head: "Phạm Thị Hương",
          headTitle: "Customer Service Manager",
          employeeCount: 13,
          budget: 170000000,
          value: 170
        }
      ]
    }
  ]
};

// Format currency
const formatCurrency = (value) => {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + ' tỷ';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + ' triệu';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + ' nghìn';
  return value + 'đ';
};

const OrgChart = () => {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('departments'); // departments or employees
  const [chartData, setChartData] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [detailCard, setDetailCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real application, you would fetch data from an API
    // For now, we use the sample data
    setTimeout(() => {
      setOrgData(sampleOrgData);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    if (!orgData) return;
    
    prepareChartData();
  }, [orgData, viewMode, selectedDepartment, searchTerm]);

  const prepareChartData = () => {
    if (!orgData) return;

    let data = [];

    // Filter departments based on search term
    const filteredDepartments = searchTerm 
      ? orgData.departments.filter(dept => 
          dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dept.head.toLowerCase().includes(searchTerm.toLowerCase()))
      : orgData.departments;

    if (selectedDepartment === 'all') {
      // Show all departments
      if (viewMode === 'departments') {
        data = filteredDepartments.map(dept => ({
          x: dept.name,
          y: dept.budget,
          fillColor: getRandomColor(dept.id),
          departmentId: dept.id,
          head: dept.head,
          headTitle: dept.headTitle,
          employeeCount: dept.employeeCount,
          budget: dept.budget
        }));
      } else {
        // Show by employee count
        data = filteredDepartments.map(dept => ({
          x: dept.name,
          y: dept.employeeCount,
          fillColor: getRandomColor(dept.id),
          departmentId: dept.id,
          head: dept.head,
          headTitle: dept.headTitle,
          employeeCount: dept.employeeCount,
          budget: dept.budget
        }));
      }
    } else {
      // Show specific department and its sub-departments
      const selectedDept = orgData.departments.find(dept => dept.id === selectedDepartment);
      
      if (selectedDept && selectedDept.subDepartments) {
        if (viewMode === 'departments') {
          data = selectedDept.subDepartments.map(subDept => ({
            x: subDept.name,
            y: subDept.budget,
            fillColor: getRandomColor(subDept.id),
            departmentId: subDept.id,
            head: subDept.head,
            headTitle: subDept.headTitle,
            employeeCount: subDept.employeeCount,
            budget: subDept.budget
          }));
        } else {
          data = selectedDept.subDepartments.map(subDept => ({
            x: subDept.name,
            y: subDept.employeeCount,
            fillColor: getRandomColor(subDept.id),
            departmentId: subDept.id,
            head: subDept.head,
            headTitle: subDept.headTitle,
            employeeCount: subDept.employeeCount,
            budget: subDept.budget
          }));
        }
      }
    }

    setChartData([{
      data
    }]);
  };

  const handleTreemapClick = (event, chartContext, config) => {
    const dataPointIndex = config.dataPointIndex;
    const seriesIndex = config.seriesIndex;
    
    if (dataPointIndex !== -1) {
      const clickedItem = chartData[seriesIndex].data[dataPointIndex];
      
      setDetailCard({
        name: clickedItem.x,
        head: clickedItem.head,
        headTitle: clickedItem.headTitle,
        employeeCount: clickedItem.employeeCount,
        budget: clickedItem.budget,
        departmentId: clickedItem.departmentId
      });
      
      // If the department has sub-departments, navigate to it
      const dept = orgData.departments.find(d => d.id === clickedItem.departmentId);
      if (dept && dept.subDepartments && dept.subDepartments.length > 0) {
        setSelectedDepartment(clickedItem.departmentId);
      }
    }
  };

  const getRandomColor = (id) => {
    // Generate a consistent color based on id
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
      '#4CAF50', '#9C27B0', '#2196F3', '#FF5722', '#607D8B'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleBackToAll = () => {
    setSelectedDepartment('all');
    setDetailCard(null);
  };

  const chartOptions = {
    chart: {
      type: 'treemap',
      height: 500,
      events: {
        dataPointSelection: handleTreemapClick
      }
    },
    title: {
      text: viewMode === 'departments' ? 'Sơ đồ tổ chức theo ngân sách' : 'Sơ đồ tổ chức theo số lượng nhân viên',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        fontFamily: 'Inter, sans-serif'
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        colors: ["#fff"]
      },
      formatter: function(text, op) {
        return text + `\n${viewMode === 'departments' ? formatCurrency(op.value) : op.value + ' nhân viên'}`;
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function(value) {
          return viewMode === 'departments' ? formatCurrency(value) : value + ' nhân viên';
        }
      }
    },
    colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'],
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false
      }
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mx-auto space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building className="w-6 h-6 mr-2" />
              Sơ đồ tổ chức công ty
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Chọn chế độ xem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="departments">Xem theo ngân sách</SelectItem>
                  <SelectItem value="employees">Xem theo nhân viên</SelectItem>
                </SelectContent>
              </Select>

              {selectedDepartment !== 'all' && (
                <Button variant="outline" onClick={handleBackToAll}>
                  Quay lại tổng quan
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="ml-4 text-lg">Đang tải dữ liệu...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  {chartData.length > 0 && (
                    <ReactApexChart
                      options={chartOptions}
                      series={chartData}
                      type="treemap"
                      height={500}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {detailCard ? 'Chi tiết phòng ban' : 'Thông tin công ty'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detailCard ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800">{detailCard.name}</h3>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Trưởng phòng</p>
                        <p className="text-base font-semibold">{detailCard.head}</p>
                        <p className="text-sm text-gray-500">{detailCard.headTitle}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Số nhân viên</p>
                          <p className="text-xl font-bold">{detailCard.employeeCount}</p>
                        </div>
                        
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600">Ngân sách</p>
                          <p className="text-xl font-bold">{formatCurrency(detailCard.budget)}</p>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => {
                          // In a real application, you would navigate to department detail page
                          alert(`Xem chi tiết phòng ban: ${detailCard.name}`);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800">{orgData.companyInfo.name}</h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-gray-600">Thành lập</p>
                          <p className="font-medium">{orgData.companyInfo.founded}</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-gray-600">Trụ sở</p>
                          <p className="font-medium">{orgData.companyInfo.headquarters}</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-gray-600">Tổng nhân viên</p>
                          <p className="font-medium">{orgData.companyInfo.employees}</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-gray-600">CEO</p>
                          <p className="font-medium">{orgData.companyInfo.ceo}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Số phòng ban</p>
                        <p className="text-xl font-bold">{orgData.departments.length}</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Tổng ngân sách</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(orgData.departments.reduce((sum, dept) => sum + dept.budget, 0))}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Danh sách phòng ban
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                  <ul className="space-y-2">
                    {orgData.departments.map((dept) => (
                      <li 
                        key={dept.id}
                        className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 ${selectedDepartment === dept.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                        onClick={() => setSelectedDepartment(dept.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-sm text-gray-500">{dept.employeeCount} nhân viên</span>
                        </div>
                        <div className="text-xs text-gray-500">{dept.head} - {dept.headTitle}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgChart;