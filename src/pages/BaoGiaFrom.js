import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash, Search, X, Upload, ChevronDown, ChevronLeft, ChevronRight,
  Info, Calculator, Save, List, Filter, ShoppingCart, Check, File, FileText
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';


const QuoteSystem = () => {
  // State cho danh sách hàng hóa
  const [items, setItems] = useState([]);
  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  
  // State cho thông tin báo giá
  const [quoteInfo, setQuoteInfo] = useState({
    id: '',
    companyId: '',
    companyName: '',
    companyShortName: '',
    companyTaxCode: '',
    date: new Date().toISOString().split('T')[0],
    duration: '30',
    sessionCount: '',
    vatRate: '10',
    maintenanceFee: '1000000',
    publicAppFee: '500000'
  });
  
  // State cho sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State cho form thêm hàng hóa
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    code: '',
    name: '',
    detail: '',
    unit: 'Cái',
    price: '',
    quantity: '',
    discount: '',
    note: ''
  });
  
  // State cho danh mục sản phẩm
  const [productCatalog, setProductCatalog] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [companyList, setCompanyList] = useState([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // API configs
  const APP_ID = "fa999040-d473-49aa-b948-6b86007a0041";
  const API_KEY = "V2-AJHhE-w3Tb3-Vma6U-HTB3a-CSA9s-ydUin-fEC1Q-rNUWW";

  // Effect hooks
  useEffect(() => {
    // Tải danh sách sản phẩm khi component được render
    fetchProductCatalog();
    
    // Tải danh sách công ty
    fetchCompanyList();
    
    // Kiểm tra dữ liệu đã lưu
    checkSavedQuote();
    
    // Generate ID
    generateQuoteId();
  }, []);
  
  useEffect(() => {
    // Apply filter khi danh sách sản phẩm hoặc bộ lọc thay đổi
    applyProductFilters();
  }, [productCatalog, searchTerm, selectedCategories]);

  // Fetch danh mục sản phẩm
  const fetchProductCatalog = async () => {
    try {
      const response = await authUtils.apiRequest('DMHH', 'Find', {
        Properties: {
          Locale: "vi-VN",
          Timezone: "Asia/Ho_Chi_Minh",
          Selector: "Filter(DMHH, true)"
        }
      });

      if (response) {
        const formattedProducts = response.map(row => ({
          code: row["Ma_HHDV"] || '',
          name: row["TÊN HH DV"] || '',
          detail: row["CHI TIẾT"] || '',
          unit: row["DVT"] || '',
          category: row["PHÂN LOẠI"] || '',
          subCategory: row["PHÂN LOẠI DT"] || '',
          supplier: row["NCC ƯU TIÊN"] || '',
          price: parseFloat(row["GIÁ BÁN"]) || 0,
          image: row["HÌNH ẢNH"] || ''
        }));
        
        setProductCatalog(formattedProducts);
        setFilteredProducts(formattedProducts);
      } else {
        // Dữ liệu mẫu khi không có API
        setProductCatalog(getSampleProducts());
        setFilteredProducts(getSampleProducts());
      }
    } catch (error) {
      console.error('Lỗi khi tải danh mục hàng hóa:', error);
      // Dữ liệu mẫu khi API lỗi
      setProductCatalog(getSampleProducts());
      setFilteredProducts(getSampleProducts());
    }
  };

  // Fetch danh sách công ty
  const fetchCompanyList = async () => {
    try {
      const response = await authUtils.apiRequest('KHTN', 'Find', {
        Properties: {
          Locale: "vi-VN",
          Timezone: "Asia/Ho_Chi_Minh",
          Selector: "Filter(KHTN, true)"
        }
      });

      if (response) {
        const formattedCompanies = response.map(row => ({
          id: row["ID_CTY"] || '',
          name: row["TÊN CÔNG TY"] || '',
          shortName: row["TÊN VIẾT TẮT"] || '',
          email: row["EMAIL CÔNG TY"] || '',
          taxCode: row["MST"] || ''
        }));
        
        setCompanyList(formattedCompanies);
      } else {
        // Dữ liệu mẫu khi không có API
        setCompanyList(getSampleCompanies());
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách công ty:', error);
      // Dữ liệu mẫu khi API lỗi
      setCompanyList(getSampleCompanies());
    }
  };

  // Functions for filters
  const applyProductFilters = () => {
    let results = [...productCatalog];
    
    // Apply category filter
    if (!selectedCategories.includes('all')) {
      results = results.filter(product => 
        selectedCategories.includes(product.category)
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(product =>
        product.code.toLowerCase().includes(term) ||
        product.name.toLowerCase().includes(term) ||
        (product.category && product.category.toLowerCase().includes(term))
      );
    }
    
    setFilteredProducts(results);
  };

  const handleCategoryFilter = (category) => {
    if (category === 'all') {
      setSelectedCategories(['all']);
    } else {
      // Deselect "all" if it's currently selected
      const newSelection = selectedCategories.includes('all') 
        ? [category] 
        : selectedCategories.includes(category)
          ? selectedCategories.filter(c => c !== category) // remove if already selected
          : [...selectedCategories, category]; // add if not selected
      
      // If empty, select "all" again
      setSelectedCategories(newSelection.length === 0 ? ['all'] : newSelection);
    }
  };

  // Get unique categories from products
  const getUniqueCategories = () => {
    const categories = new Set();
    productCatalog.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories);
  };

  // Handler functions
  const handleQuoteInfoChange = (field, value) => {
    setQuoteInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (field, value) => {
    setCurrentItem(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calculate values based on price, quantity and discount
      if (field === 'price' || field === 'quantity' || field === 'discount') {
        const price = parseFloat(updated.price) || 0;
        const quantity = parseInt(updated.quantity) || 0;
        const discount = parseFloat(updated.discount) || 0;
        
        updated.subtotal = price * quantity;
        updated.discountAmount = updated.subtotal * (discount / 100);
        updated.afterDiscount = updated.subtotal - updated.discountAmount;
      }
      
      return updated;
    });
  };

  const handleAddItem = () => {
    if (!currentItem.code || !currentItem.name || !currentItem.price || !currentItem.quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin hàng hóa (Mã, Tên, Giá, Số lượng)');
      return;
    }
    
    const price = parseFloat(currentItem.price) || 0;
    const quantity = parseInt(currentItem.quantity) || 0;
    const discountPercent = parseFloat(currentItem.discount) || 0;
    
    const subtotal = price * quantity;
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    
    const newItem = {
      code: currentItem.code,
      name: currentItem.name,
      detail: currentItem.detail,
      unit: currentItem.unit,
      price: price,
      quantity: quantity,
      subtotal: subtotal,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      afterDiscount: afterDiscount,
      note: currentItem.note
    };
    
    if (editingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = newItem;
      setItems(updatedItems);
      toast.success('Đã cập nhật hàng hóa thành công');
    } else {
      // Add new item
      setItems(prev => [...prev, newItem]);
      toast.success('Đã thêm hàng hóa thành công');
    }
    
    // Reset form and hide it
    resetItemForm();
    setShowAddItemForm(false);
    setEditingItemIndex(-1);
  };

  const handleDeleteItem = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hàng hóa này không?')) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
      toast.success('Đã xóa hàng hóa thành công');
    }
  };

  const handleEditItem = (index) => {
    const item = items[index];
    setCurrentItem({
      code: item.code,
      name: item.name,
      detail: item.detail || '',
      unit: item.unit,
      price: item.price,
      quantity: item.quantity,
      discount: item.discountPercent,
      note: item.note || '',
      subtotal: item.subtotal,
      discountAmount: item.discountAmount,
      afterDiscount: item.afterDiscount
    });
    
    setEditingItemIndex(index);
    setShowAddItemForm(true);
  };

  const handleSelectCompany = (company) => {
    setQuoteInfo(prev => ({
      ...prev,
      companyId: company.id,
      companyName: company.name,
      companyShortName: company.shortName,
      companyTaxCode: company.taxCode
    }));
    
    setShowCompanyModal(false);
    toast.success('Đã chọn công ty thành công');
  };

  const handleAddProductToQuote = (product) => {
    const newItem = {
      code: product.code,
      name: product.name,
      detail: product.detail || '',
      unit: product.unit,
      price: product.price,
      quantity: 1,
      subtotal: product.price * 1,
      discountPercent: 0,
      discountAmount: 0,
      afterDiscount: product.price * 1,
      note: ''
    };
    
    setItems(prev => [...prev, newItem]);
    toast.success('Đã thêm hàng hóa vào báo giá');
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  // Helper functions
  const resetItemForm = () => {
    setCurrentItem({
      code: '',
      name: '',
      detail: '',
      unit: 'Cái',
      price: '',
      quantity: '',
      discount: '',
      note: '',
      subtotal: 0,
      discountAmount: 0,
      afterDiscount: 0
    });
  };

  const generateQuoteId = () => {
    const prefix = 'BG';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const today = new Date();
    const dateStr = today.getFullYear().toString().substr(-2) +
        (today.getMonth() + 1).toString().padStart(2, '0');
    
    setQuoteInfo(prev => ({
      ...prev,
      id: `${prefix}${dateStr}-${randomNum}`
    }));
  };

  const calculateTotals = () => {
    let totalBeforeDiscount = 0;
    let totalDiscount = 0;
    let totalAfterDiscount = 0;
    
    items.forEach(item => {
      totalBeforeDiscount += item.subtotal;
      totalDiscount += item.discountAmount;
      totalAfterDiscount += item.afterDiscount;
    });
    
    const vatRate = parseFloat(quoteInfo.vatRate);
    const vatAmount = totalAfterDiscount * (vatRate / 100);
    const maintenanceFee = parseFloat(quoteInfo.maintenanceFee) || 0;
    const publicAppFee = parseFloat(quoteInfo.publicAppFee) || 0;
    const grandTotal = totalAfterDiscount + vatAmount + maintenanceFee + publicAppFee;
    
    return {
      totalBeforeDiscount,
      totalDiscount,
      totalAfterDiscount,
      vatAmount,
      grandTotal,
      maintenanceFee,
      publicAppFee
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handleSaveQuote = async () => {
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một hàng hóa/dịch vụ vào báo giá');
      return;
    }
    
    if (!quoteInfo.id || !quoteInfo.companyId || !quoteInfo.date) {
      toast.error('Vui lòng điền đầy đủ thông tin báo giá (ID, Công ty, Ngày báo giá)');
      return;
    }
    
    // Save to localStorage for demo
    const quoteData = {
      ...quoteInfo,
      items: items
    };
    
    localStorage.setItem('savedQuote', JSON.stringify(quoteData));
    
    // Simulate API call
    try {
      toast.success('Đã lưu báo giá thành công!');
      
   
      await authUtils.apiRequest('BAOGIA', 'Add', {
        Properties: {
          Locale: "vi-VN",
          Timezone: "Asia/Ho_Chi_Minh"
      },
        Rows: [quoteData]
      });
      
    } catch (error) {
      console.error('Lỗi khi lưu báo giá:', error);
      toast.error('Có lỗi xảy ra khi lưu báo giá. Vui lòng thử lại.');
    }
  };

  const handleSearchProduct = () => {
    const code = currentItem.code;
    if (!code) {
      toast.warning('Vui lòng nhập mã hàng hóa để tìm kiếm');
      return;
    }
    
    const product = productCatalog.find(p => p.code === code);
    if (product) {
      setCurrentItem(prev => ({
        ...prev,
        name: product.name,
        detail: product.detail || '',
        unit: product.unit,
        price: product.price,
        quantity: prev.quantity || 1
      }));
    } else {
      toast.error('Không tìm thấy mã hàng hóa này');
    }
  };

  const checkSavedQuote = () => {
    const savedQuoteStr = localStorage.getItem('savedQuote');
    if (savedQuoteStr) {
      try {
        const savedQuote = JSON.parse(savedQuoteStr);
        if (window.confirm('Phát hiện báo giá đã lưu. Bạn có muốn nạp lại không?')) {
          loadSavedQuote(savedQuote);
          toast.success('Đã phục hồi báo giá thành công');
        }
      } catch (error) {
        console.error('Lỗi khi nạp dữ liệu báo giá:', error);
      }
    }
  };

  const loadSavedQuote = (quoteData) => {
    if (!quoteData) return;
    
    setQuoteInfo({
      id: quoteData.id || '',
      companyId: quoteData.companyId || '',
      companyName: quoteData.companyName || '',
      companyShortName: quoteData.companyShortName || '',
      companyTaxCode: quoteData.companyTaxCode || '',
      date: quoteData.date || new Date().toISOString().split('T')[0],
      duration: quoteData.duration || '30',
      sessionCount: quoteData.sessionCount || '',
      vatRate: quoteData.vatRate || '10',
      maintenanceFee: quoteData.maintenanceFee || '1000000',
      publicAppFee: quoteData.publicAppFee || '500000'
    });
    
    setItems(quoteData.items || []);
  };

  // Sample data
  const getSampleProducts = () => {
    return [
      {
        code: 'DV001',
        name: 'Dịch vụ phát triển website',
        detail: 'Triển khai và cấu hình hệ thống',
        unit: 'Giờ',
        category: 'Dịch vụ',
        price: 500000
      },
      {
        code: 'LIC001',
        name: 'License phần mềm XYZ',
        detail: 'Bản quyền phần mềm 1 năm',
        unit: 'User',
        category: 'License',
        price: 1200000
      },
      {
        code: 'DT001',
        name: 'Khóa đào tạo CNTT',
        detail: 'Đào tạo kỹ năng cho nhân viên',
        unit: 'Buổi',
        category: 'Đào tạo',
        price: 2000000
      }
    ];
  };

  const getSampleCompanies = () => {
    return [
      {
        id: 'CTY001',
        name: 'Công ty TNHH Công Nghệ ABC',
        shortName: 'ABC Tech',
        email: 'info@abctech.com',
        taxCode: '0123456789'
      },
      {
        id: 'CTY002',
        name: 'Công ty Cổ phần Phần mềm XYZ',
        shortName: 'XYZ Software',
        email: 'contact@xyzsoftware.com',
        taxCode: '0987654321'
      },
      {
        id: 'CTY003',
        name: 'Công ty TNHH Giải pháp Công nghệ 123',
        shortName: '123 Solutions',
        email: 'info@123solutions.com',
        taxCode: '1234567890'
      }
    ];
  };

  // Tính toán tổng giá trị
  const totals = calculateTotals();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="mr-2 md:hidden text-white p-1 rounded-lg hover:bg-indigo-700"
              >
                <List className="h-5 w-5" />
              </button>

              <div className="flex items-center">
                <i className="fas fa-file-invoice-dollar text-2xl mr-3"></i>
                <h1 className="text-xl font-semibold">Hệ Thống Tạo Báo Giá</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={handleSaveQuote}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Lưu báo giá</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-grow relative">
        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <div 
          className={`w-72 bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] transform ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="font-semibold text-indigo-600">Danh Mục Hàng Hóa</h2>
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700 md:hidden ml-2 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto h-full pb-24">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tìm kiếm hàng hóa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="h-4 w-4 absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* Category Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center cursor-pointer">
                <h3 className="font-medium text-sm text-gray-600 uppercase">Phân Loại</h3>
                <button className="text-gray-500 focus:outline-none p-1 rounded-lg hover:bg-gray-100">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 max-h-36 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                      selectedCategories.includes('all')
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => handleCategoryFilter('all')}
                  >
                    Tất cả
                  </button>
                  
                  {getUniqueCategories().map(category => (
                    <button
                      key={category}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                        selectedCategories.includes(category) && !selectedCategories.includes('all')
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => handleCategoryFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="p-4">
              <h3 className="font-medium text-sm text-gray-600 uppercase mb-3">Hàng Hóa & Dịch Vụ</h3>
              <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Search className="h-10 w-10 mb-3 text-gray-300" />
                    <p>Không tìm thấy sản phẩm</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div key={product.code} className="card p-3 cursor-pointer product-item hover:border-indigo-200 border border-transparent">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Mã: {product.code} | ĐVT: {product.unit}
                          </div>
                          <div className="mt-1.5">
                            {product.category && (
                              <span className="badge badge-primary">{product.category}</span>
                            )}
                          </div>
                        </div>
                        <div className="font-medium text-indigo-600 text-lg">
                          {formatCurrency(product.price)} đ
                        </div>
                      </div>
                      <button
                        className="mt-2 w-full text-sm bg-indigo-50 text-indigo-600 rounded-lg py-1.5 hover:bg-indigo-100 transition-colors"
                        onClick={() => handleAddProductToQuote(product)}
                      >
                        <Plus className="h-3 w-3 inline mr-1" /> Thêm vào báo giá
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsed sidebar toggle */}
        {!sidebarOpen && (
          <button 
            className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-r-lg shadow-md text-gray-500 hover:text-gray-700 border border-l-0 border-gray-200 z-10"
            onClick={() => setSidebarOpen(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Main Content */}
        <main className="flex-grow w-full md:w-auto">
          <div className="container mx-auto px-4 py-6">
            {/* Quote Information Card */}
            <div className="card p-6 mb-6 fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-indigo-500" />
                  Thông tin báo giá
                </h2>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <i className="fas fa-calendar-alt mr-1"></i>
                  <span>{new Date().toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Báo giá</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="ID_BBGTH"
                      value={quoteInfo.id}
                      onChange={(e) => handleQuoteInfoChange('id', e.target.value)}
                    />
                    <button 
                      className="absolute right-2 top-2.5 text-indigo-500 hover:text-indigo-700"
                      title="Tạo ID tự động"
                      onClick={generateQuoteId}
                    >
                      <i className="fas fa-magic"></i>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên công ty</label>
                  <div className="flex">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Tên công ty"
                      value={quoteInfo.companyName}
                      onChange={(e) => handleQuoteInfoChange('companyName', e.target.value)}
                    />
                    <button 
                      className="bg-indigo-500 text-white px-3 py-2.5 rounded-r-lg hover:bg-indigo-600 transition"
                      onClick={() => setShowCompanyModal(true)}
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày báo giá</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={quoteInfo.date}
                      onChange={(e) => handleQuoteInfoChange('date', e.target.value)}
                    />
                    <i className="fas fa-calendar absolute right-3 top-3 text-gray-400 pointer-events-none"></i>
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên viết tắt</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                    placeholder="Tên viết tắt"
                    value={quoteInfo.companyShortName}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã số thuế</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                    placeholder="Mã số thuế"
                    value={quoteInfo.companyTaxCode}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Thời hạn báo giá (ngày)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="30"
                    value={quoteInfo.duration}
                    onChange={(e) => handleQuoteInfoChange('duration', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Số buổi</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Số buổi"
                    value={quoteInfo.sessionCount}
                    onChange={(e) => handleQuoteInfoChange('sessionCount', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Items Table Card */}
            <div className="card p-6 mb-6 fade-in">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <List className="h-5 w-5 mr-2 text-indigo-500" />
                  Chi tiết hàng hóa/dịch vụ
                </h2>
                <button 
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition flex items-center"
                  onClick={() => {
                    setShowAddItemForm(true);
                    setEditingItemIndex(-1);
                    resetItemForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Thêm hàng hóa</span>
                </button>
              </div>

              {/* Empty state when no items */}
              {items.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg">Chưa có hàng hóa trong báo giá</p>
                  <p className="text-sm mt-2">Vui lòng thêm hàng hóa từ danh mục hoặc nhập thủ công</p>
                  <button 
                    className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition flex items-center"
                    onClick={() => {
                      setShowAddItemForm(true);
                      resetItemForm();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm hàng hóa
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 shadow-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HHDV</th>
                        <th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên HH/DV</th>
                        <th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ĐVT</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá bán</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% ưu đãi</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiền ưu đãi</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sau ưu đãi</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.code}</td>
                          <td className="w-48 px-3 py-4 text-sm text-gray-900 break-words">
                            <div className="whitespace-normal">{item.name}</div>
                          </td>
                          <td className="w-48 px-3 py-4 text-sm text-gray-500 break-words">
                            <div className="whitespace-normal">{item.detail}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.price)} đ</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.subtotal)} đ</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.discountPercent}%</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.discountAmount)} đ</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600">{formatCurrency(item.afterDiscount)} đ</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                            <button 
                              className="text-indigo-500 hover:text-indigo-700 mx-1 p-1 rounded hover:bg-indigo-50"
                              title="Sửa"
                              onClick={() => handleEditItem(index)}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700 mx-1 p-1 rounded hover:bg-red-50"
                              title="Xóa"
                              onClick={() => handleDeleteItem(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Item Form */}
              {showAddItemForm && (
                <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50 fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {editingItemIndex >= 0 ? 'Cập nhật hàng hóa' : 'Thêm hàng hóa mới'}
                    </h3>
                  </div>

                  {/* Form layout - 3 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left column - Basic info */}
                    <div>
                      <div className="form-group mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã HHDV</label>
                        <div className="flex">
                          <input 
                            type="text" 
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Mã HHDV"
                            value={currentItem.code}
                            onChange={(e) => handleItemChange('code', e.target.value)}
                          />
                          <button 
                            className="bg-indigo-500 text-white px-3 py-2.5 rounded-r-lg hover:bg-indigo-600 transition"
                            onClick={handleSearchProduct}
                          >
                            <Search className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="form-group mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên hàng hóa/dịch vụ</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Tên HHDV"
                          value={currentItem.name}
                          onChange={(e) => handleItemChange('name', e.target.value)}
                        />
                      </div>

                      <div className="form-group mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Đơn vị tính</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Đơn vị tính"
                          value={currentItem.unit}
                          onChange={(e) => handleItemChange('unit', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Middle column - Pricing and quantity */}
                    <div>
                      <div className="form-group mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá bán</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Giá bán"
                            value={currentItem.price}
                            onChange={(e) => handleItemChange('price', e.target.value)}
                          />
                          <span className="absolute right-3 top-2.5 text-gray-400">đ</span>
                        </div>
                      </div>

                      <div className="form-group mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Số lượng"
                          value={currentItem.quantity}
                          onChange={(e) => handleItemChange('quantity', e.target.value)}
                        />
                      </div>

                      <div className="form-group mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">% ưu đãi</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="% ưu đãi"
                            value={currentItem.discount}
                            onChange={(e) => handleItemChange('discount', e.target.value)}
                          />
                          <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                        <textarea 
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ghi chú" 
                          rows="7"
                          value={currentItem.note}
                          onChange={(e) => handleItemChange('note', e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Live calculation preview card */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4 shadow-sm">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">Tổng quan sản phẩm</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Thành tiền:</p>
                        <p className="font-medium text-gray-800">
                          {formatCurrency(
                            (parseFloat(currentItem.price) || 0) * (parseInt(currentItem.quantity) || 0)
                          )} đ
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tiền ưu đãi:</p>
                        <p className="font-medium text-red-500">
                          {formatCurrency(
                            (parseFloat(currentItem.price) || 0) * 
                            (parseInt(currentItem.quantity) || 0) * 
                            (parseFloat(currentItem.discount) || 0) / 100
                          )} đ
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sau ưu đãi:</p>
                        <p className="font-medium text-green-600">
                          {formatCurrency(
                            (parseFloat(currentItem.price) || 0) * 
                            (parseInt(currentItem.quantity) || 0) * 
                            (1 - (parseFloat(currentItem.discount) || 0) / 100)
                          )} đ
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detail textarea */}
                  <div className="mt-4">
                    <div className="form-group mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi tiết</label>
                      <textarea 
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Chi tiết" 
                        rows="4"
                        value={currentItem.detail}
                        onChange={(e) => handleItemChange('detail', e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end mt-5">
                    <button 
                      className="bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg mr-3 hover:bg-gray-300 transition flex items-center"
                      onClick={() => setShowAddItemForm(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hủy
                    </button>
                    <button 
                      className="bg-indigo-500 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-600 transition flex items-center"
                      onClick={handleAddItem}
                    >
                      {editingItemIndex >= 0 ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Cập nhật
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm vào báo giá
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Summary Card */}
            <div className="card p-6 fade-in">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-indigo-500" />
                Thông tin thanh toán
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {/* Payment configuration */}
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">% VAT</label>
                      <select 
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={quoteInfo.vatRate}
                        onChange={(e) => handleQuoteInfoChange('vatRate', e.target.value)}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi phí duy trì</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Chi phí duy trì"
                          value={quoteInfo.maintenanceFee}
                          onChange={(e) => handleQuoteInfoChange('maintenanceFee', e.target.value)}
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400">đ</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phí Public App</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Phí Public App"
                          value={quoteInfo.publicAppFee}
                          onChange={(e) => handleQuoteInfoChange('publicAppFee', e.target.value)}
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400">đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between py-2.5 border-b border-gray-200">
                    <span className="text-gray-600">Tổng tiền hàng:</span>
                    <span className="font-medium">{formatCurrency(totals.totalBeforeDiscount)} đ</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-gray-200">
                    <span className="text-gray-600">Tổng tiền ưu đãi:</span>
                    <span className="font-medium text-red-500">-{formatCurrency(totals.totalDiscount)} đ</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-gray-200">
                    <span className="text-gray-600">Thành tiền trước VAT:</span>
                    <span className="font-medium">{formatCurrency(totals.totalAfterDiscount)} đ</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-gray-200">
                    <span className="text-gray-600">VAT ({quoteInfo.vatRate}%):</span>
                    <span className="font-medium">{formatCurrency(totals.vatAmount)} đ</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-gray-200">
                    <span className="text-gray-600">Chi phí duy trì:</span>
                    <span className="font-medium">{formatCurrency(totals.maintenanceFee)} đ</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-gray-200">
                    <span className="text-gray-600">Phí Public App:</span>
                    <span className="font-medium">{formatCurrency(totals.publicAppFee)} đ</span>
                  </div>
                  <div className="flex justify-between py-3.5 font-bold text-lg mt-1">
                    <span className="text-gray-800">TỔNG THANH TOÁN:</span>
                    <span className="text-indigo-600">{formatCurrency(totals.grandTotal)} đ</span>
                  </div>

                  {/* Export options */}
                  <div className="mt-4 flex justify-end">
                    <div className="dropdown relative inline-block">
                      <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center">
                        <File className="h-4 w-4 mr-2" />
                        <span>Xuất báo giá</span>
                        <ChevronDown className="h-3 w-3 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-auto">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            © 2025 Hệ thống Tạo Báo Giá - Mọi quyền được bảo lưu
          </div>
          <div className="text-sm text-gray-500">
            <a href="#" className="hover:text-indigo-500 transition mr-4">Trợ giúp</a>
            <a href="#" className="hover:text-indigo-500 transition mr-4">Điều khoản</a>
            <a href="#" className="hover:text-indigo-500 transition">Liên hệ</a>
          </div>
        </div>
      </footer>

      {/* Company Search Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col fade-in">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">Tìm kiếm công ty</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                onClick={() => setShowCompanyModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="mb-2 relative">
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tìm kiếm theo tên công ty, MST, tên viết tắt..."
                />
                <Search className="h-4 w-4 absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>
            <div className="overflow-y-auto flex-grow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên công ty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TVT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MST
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chọn
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companyList.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                        Không tìm thấy công ty phù hợp.
                      </td>
                    </tr>
                  ) : (
                    companyList.map(company => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{company.name || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{company.shortName || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{company.taxCode || ''}</td>
                        <td className="px-4 py-3 text-sm font-medium text-center">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded hover:bg-indigo-50"
                            onClick={() => handleSelectCompany(company)}
                          >
                            Chọn
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Toast for notifications */}
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

export default QuoteSystem;