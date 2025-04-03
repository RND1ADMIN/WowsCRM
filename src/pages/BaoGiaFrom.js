import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Edit, Trash, Search, Filter, Image, X, Upload, 
  ChevronDown, ChevronLeft, ChevronRight, Save, Printer, 
  Menu, BarChart, ChevronsLeft, ChevronsRight 
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';

const BaoGiaFrom = () => {
  // Trạng thái cho danh mục hàng hóa
  const [dmhhItems, setDmhhItems] = useState([]);
  const [filteredDmhhItems, setFilteredDmhhItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TẤT CẢ');
  const [categories, setCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Trạng thái cho thông tin báo giá
  const [quoteInfo, setQuoteInfo] = useState({
    quoteId: '',
    companyId: '',
    quoteDate: new Date().toISOString().split('T')[0],
    contractNumber: '',
    quoteDuration: '30',
    sessionCount: '',
  });

  // Trạng thái cho các mục trong báo giá
  const [quoteItems, setQuoteItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    code: '',
    name: '',
    detail: '',
    unit: 'Cái',
    price: '',
    quantity: '1',
    discountPercent: '0',
    showToCustomer: true,
    note: '',
  });

  // Trạng thái cho form thêm mục
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(-1);

  // Trạng thái cho thanh toán
  const [paymentInfo, setPaymentInfo] = useState({
    vatRate: '10',
    maintenanceFee: '1000000',
    publicAppFee: '500000',
  });

  // Trạng thái tổng hợp
  const [totals, setTotals] = useState({
    totalBeforeDiscount: 0,
    totalDiscount: 0,
    totalAfterDiscount: 0,
    vatAmount: 0,
    grandTotal: 0,
  });

  // Trạng thái loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Refs
  const sidebarRef = useRef(null);
  const printFrameRef = useRef(null);

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch danh mục hàng hóa
  const fetchDMHH = async () => {
    try {
      setIsLoading(true);
      const response = await authUtils.apiRequest('DMHH', 'Find', {});
      
      const formattedItems = response.map(item => ({
        code: item['Ma_HHDV'] || '',
        name: item['TÊN HH DV'] || '',
        detail: item['CHI TIẾT'] || '',
        unit: item['DVT'] || '',
        category: item['PHÂN LOẠI'] || '',
        subCategory: item['PHÂN LOẠI DT'] || '',
        supplier: item['NCC ƯU TIÊN'] || '',
        price: parseFloat(item['GIÁ BÁN']) || 0,
        buyPrice: parseFloat(item['GIÁ MUA']) || 0,
        image: item['HÌNH ẢNH'] || ''
      }));
      
      setDmhhItems(formattedItems);
      setFilteredDmhhItems(formattedItems);
      
      // Lấy danh sách phân loại
      const uniqueCategories = [...new Set(formattedItems
        .map(item => item.category)
        .filter(Boolean))];
      setCategories(uniqueCategories);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching DMHH:', error);
      toast.error('Lỗi khi tải danh mục hàng hóa');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDMHH();
    // Load từ localStorage nếu có
    const savedQuote = localStorage.getItem('savedQuote');
    if (savedQuote) {
      try {
        const quoteData = JSON.parse(savedQuote);
        if (window.confirm('Phát hiện báo giá đã lưu. Bạn có muốn nạp lại không?')) {
          loadSavedQuote(quoteData);
        }
      } catch (error) {
        console.error('Error loading saved quote:', error);
      }
    }
  }, []);

  // Lọc danh mục hàng hóa khi tìm kiếm hoặc chọn danh mục
  useEffect(() => {
    filterDmhhItems();
  }, [searchTerm, selectedCategory, dmhhItems]);

  const filterDmhhItems = () => {
    let filtered = [...dmhhItems];
    
    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      const normalizedSearch = normalizeString(searchTerm.toLowerCase());
      filtered = filtered.filter(item => 
        normalizeString(item.code.toLowerCase()).includes(normalizedSearch) ||
        normalizeString(item.name.toLowerCase()).includes(normalizedSearch) ||
        normalizeString(item.detail.toLowerCase()).includes(normalizedSearch)
      );
    }
    
    // Lọc theo phân loại
    if (selectedCategory !== 'TẤT CẢ') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    setFilteredDmhhItems(filtered);
  };

  // Hàm chuẩn hóa chuỗi tiếng Việt
  const normalizeString = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // Xử lý chọn phân loại
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // Cập nhật tổng tiền khi danh sách mục thay đổi
  useEffect(() => {
    updateTotals();
  }, [quoteItems, paymentInfo]);

  // Hàm cập nhật tổng tiền
  const updateTotals = () => {
    const totalBeforeDiscount = quoteItems.reduce((total, item) => total + item.subtotal, 0);
    const totalDiscount = quoteItems.reduce((total, item) => total + item.discountAmount, 0);
    const totalAfterDiscount = quoteItems.reduce((total, item) => total + item.afterDiscount, 0);
    
    const vatRate = parseFloat(paymentInfo.vatRate) || 0;
    const vatAmount = totalAfterDiscount * (vatRate / 100);
    
    const maintenanceFee = parseFloat(paymentInfo.maintenanceFee) || 0;
    const publicAppFee = parseFloat(paymentInfo.publicAppFee) || 0;
    
    const grandTotal = totalAfterDiscount + vatAmount + maintenanceFee + publicAppFee;
    
    setTotals({
      totalBeforeDiscount,
      totalDiscount,
      totalAfterDiscount,
      vatAmount,
      grandTotal
    });
  };

  // Xử lý khi chọn sản phẩm từ danh mục
  const handleProductSelect = (product) => {
    if (isMobile) {
      setShowSidebar(false);
    }
    
    setShowAddItemForm(true);
    setCurrentItem({
      code: product.code,
      name: product.name,
      detail: product.detail || '',
      unit: product.unit || 'Cái',
      price: product.price,
      quantity: '1',
      discountPercent: '0',
      showToCustomer: true,
      note: '',
    });
    
    setIsEditMode(false);
    setEditingItemIndex(-1);
  };

  // Xử lý thay đổi thông tin báo giá
  const handleQuoteInfoChange = (e) => {
    const { id, value } = e.target;
    setQuoteInfo(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Xử lý thay đổi thông tin mục
  const handleItemChange = (e) => {
    const { id, value, type, checked } = e.target;
    
    setCurrentItem(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  // Xử lý thay đổi thông tin thanh toán
  const handlePaymentInfoChange = (e) => {
    const { id, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Tìm sản phẩm theo mã
  const handleSearchProduct = () => {
    const code = currentItem.code;
    if (!code) {
      toast.warning('Vui lòng nhập mã hàng hóa để tìm kiếm');
      return;
    }
    
    const product = dmhhItems.find(item => item.code === code);
    if (product) {
      setCurrentItem(prev => ({
        ...prev,
        name: product.name,
        detail: product.detail || '',
        unit: product.unit || 'Cái',
        price: product.price,
        quantity: '1',
        discountPercent: '0',
      }));
    } else {
      toast.error('Không tìm thấy mã hàng hóa này');
    }
  };

  // Xử lý thêm hoặc cập nhật mục vào báo giá
  const handleAddOrUpdateItem = () => {
    const { code, name, detail, unit, price, quantity, discountPercent, showToCustomer, note } = currentItem;
    
    // Kiểm tra dữ liệu
    if (!code || !name || !price || !quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin hàng hóa (Mã, Tên, Giá, Số lượng)');
      return;
    }
    
    // Tính toán giá trị
    const priceValue = parseFloat(price) || 0;
    const quantityValue = parseInt(quantity) || 0;
    const discountPercentValue = parseFloat(discountPercent) || 0;
    
    const subtotal = priceValue * quantityValue;
    const discountAmount = subtotal * (discountPercentValue / 100);
    const afterDiscount = subtotal - discountAmount;
    
    const newItem = {
      code,
      name,
      detail,
      unit,
      price: priceValue,
      quantity: quantityValue,
      subtotal,
      discountPercent: discountPercentValue,
      discountAmount,
      afterDiscount,
      showToCustomer,
      note
    };
    
    if (isEditMode && editingItemIndex >= 0) {
      // Cập nhật mục đã có
      const updatedItems = [...quoteItems];
      updatedItems[editingItemIndex] = newItem;
      setQuoteItems(updatedItems);
      toast.success('Đã cập nhật hàng hóa');
    } else {
      // Thêm mục mới
      setQuoteItems(prev => [...prev, newItem]);
      toast.success('Đã thêm hàng hóa vào báo giá');
    }
    
    // Đóng form và reset
    setShowAddItemForm(false);
    setIsEditMode(false);
    setEditingItemIndex(-1);
    resetItemForm();
  };

  // Xử lý xóa mục
  const handleDeleteItem = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hàng hóa này không?')) {
      const updatedItems = quoteItems.filter((_, idx) => idx !== index);
      setQuoteItems(updatedItems);
      toast.success('Đã xóa hàng hóa');
    }
  };

  // Xử lý chỉnh sửa mục
  const handleEditItem = (index) => {
    const item = quoteItems[index];
    
    setCurrentItem({
      code: item.code,
      name: item.name,
      detail: item.detail || '',
      unit: item.unit,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      discountPercent: item.discountPercent.toString(),
      showToCustomer: item.showToCustomer,
      note: item.note || ''
    });
    
    setShowAddItemForm(true);
    setIsEditMode(true);
    setEditingItemIndex(index);
  };

  // Reset form thêm mục
  const resetItemForm = () => {
    setCurrentItem({
      code: '',
      name: '',
      detail: '',
      unit: 'Cái',
      price: '',
      quantity: '1',
      discountPercent: '0',
      showToCustomer: true,
      note: '',
    });
  };

  // Định dạng tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Lưu báo giá
  const handleSaveQuote = async () => {
    if (quoteItems.length === 0) {
      toast.warning('Vui lòng thêm ít nhất một hàng hóa/dịch vụ vào báo giá');
      return;
    }
    
    if (!quoteInfo.quoteId || !quoteInfo.companyId) {
      toast.warning('Vui lòng điền đầy đủ thông tin báo giá (ID, Công ty)');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Thu thập dữ liệu báo giá
      const quoteData = {
        ...quoteInfo,
        vatRate: paymentInfo.vatRate,
        maintenanceFee: paymentInfo.maintenanceFee,
        publicAppFee: paymentInfo.publicAppFee,
        items: quoteItems,
        totals: totals
      };
      
      // Lưu vào localStorage
      localStorage.setItem('savedQuote', JSON.stringify(quoteData));
      
      // Chuẩn bị dữ liệu cho bảng PO
      const poData = {
        "ID_BBGTH": quoteInfo.quoteId,
        "ID_CTY": quoteInfo.companyId,
        "NGÀY BÁO GIÁ": quoteInfo.quoteDate,
        "SỐ HĐ": quoteInfo.contractNumber,
        "ƯU ĐÃI": totals.totalBeforeDiscount > 0 ? (totals.totalDiscount / totals.totalBeforeDiscount) * 100 : 0,
        "TT TRƯỚC ƯU ĐÃI": totals.totalBeforeDiscount,
        "TT ƯU ĐÃI": totals.totalDiscount,
        "TT SAU ƯU ĐÃI": totals.totalAfterDiscount,
        "PT VAT": parseFloat(paymentInfo.vatRate),
        "TT VAT": totals.vatAmount,
        "TT SAU VAT": totals.totalAfterDiscount + totals.vatAmount,
        "THỜI HẠN BÁO GIÁ": calculateExpirationDate(quoteInfo.quoteDate, quoteInfo.quoteDuration),
        "SỐ BUỔI": parseInt(quoteInfo.sessionCount) || 0,
        "THỜI HẠN": parseInt(quoteInfo.quoteDuration) || 0,
        "CHI PHÍ": 0,
        "PHÍ DUY TRÌ": parseFloat(paymentInfo.maintenanceFee) || 0,
        "PHÍ PUBLIC APP": parseFloat(paymentInfo.publicAppFee) || 0,
        "TỔNG TIỀN": totals.grandTotal
      };
      
      // Gửi dữ liệu đến API
      await authUtils.apiRequest('PO', 'Add', {
        "Rows": [poData]
      });
      
      // Chuẩn bị chi tiết báo giá cho bảng PO_DE
      const poDetailRows = quoteItems.map((item, index) => {
        const vatRate = parseFloat(paymentInfo.vatRate) || 0;
        const itemVatAmount = item.afterDiscount * (vatRate / 100);
        
        return {
          "ID_BBGTH_DE": `${quoteInfo.quoteId}_${index + 1}`,
          "ID_BBGTH": quoteInfo.quoteId,
          "Ma_HHDV": item.code,
          "TÊN HH DV": item.name,
          "CHI TIẾT": item.detail || "",
          "DVT": item.unit,
          "GIÁ BÁN": item.price,
          "SỐ LƯỢNG": item.quantity,
          "THÀNH TIỀN": item.subtotal,
          "PT ƯU ĐÃI": item.discountPercent,
          "SỐ TIỀN ƯU ĐÃI": item.discountAmount,
          "GIÁ TRỊ SAU ƯU ĐÃI": item.afterDiscount,
          "PT VAT": vatRate,
          "TIỀN VAT": itemVatAmount,
          "GIÁ TRỊ SAU VAT": item.afterDiscount + itemVatAmount,
          "GHI CHÚ": item.note || ""
        };
      });
      
      await authUtils.apiRequest('PO_DE', 'Add', {
        "Rows": poDetailRows
      });
      
      toast.success('Đã lưu báo giá thành công!');
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Có lỗi xảy ra khi lưu báo giá: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Tính toán ngày hết hạn
  const calculateExpirationDate = (dateStr, days) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + parseInt(days) || 0);
    return date.toISOString().split('T')[0];
  };



  
// Nạp báo giá đã lưu
const loadSavedQuote = (data) => {
    if (!data) return;
    
    // Nạp thông tin báo giá
    setQuoteInfo({
      quoteId: data.quoteId || '',
      companyId: data.companyId || '',
      quoteDate: data.quoteDate || new Date().toISOString().split('T')[0],
      contractNumber: data.contractNumber || '',
      quoteDuration: data.quoteDuration || '30',
      sessionCount: data.sessionCount || '',
    });
    
    // Nạp thông tin thanh toán
    setPaymentInfo({
      vatRate: data.vatRate || '10',
      maintenanceFee: data.maintenanceFee || '0',
      publicAppFee: data.publicAppFee || '0',
    });
    
    // Nạp danh sách hàng hóa
    setQuoteItems(data.items || []);
    
    toast.success('Đã nạp báo giá thành công!');
  };

  // Tạo báo giá mẫu
  const createDemoQuote = () => {
    const demoItems = [
      {
        code: 'DV001',
        name: 'Dịch vụ phát triển phần mềm',
        detail: 'Thiết kế giao diện',
        unit: 'Giờ',
        price: 500000,
        quantity: 10,
        subtotal: 5000000,
        discountPercent: 10,
        discountAmount: 500000,
        afterDiscount: 4500000,
        showToCustomer: true,
        note: ''
      },
      {
        code: 'DV002',
        name: 'Dịch vụ tư vấn',
        detail: 'Tư vấn giải pháp CNTT',
        unit: 'Buổi',
        price: 2000000,
        quantity: 2,
        subtotal: 4000000,
        discountPercent: 5,
        discountAmount: 200000,
        afterDiscount: 3800000,
        showToCustomer: true,
        note: ''
      }
    ];
    
    // Thiết lập thông tin báo giá mẫu
    setQuoteInfo({
      quoteId: 'BG' + new Date().getTime().toString().slice(-6),
      companyId: 'CTY001',
      quoteDate: new Date().toISOString().split('T')[0],
      contractNumber: 'HD' + new Date().getFullYear() + '/' + Math.floor(Math.random() * 1000),
      quoteDuration: '30',
      sessionCount: '5',
    });
    
    // Thêm hàng hóa mẫu
    setQuoteItems(demoItems);
    
    toast.success('Đã tạo báo giá mẫu!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Nút hiển thị sidebar cho thiết bị di động */}
            <button 
              className="mr-2 md:hidden text-white"
              onClick={() => setShowSidebar(prev => !prev)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">Hệ Thống Tạo Báo Giá</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleSaveQuote}
              disabled={isSaving}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition duration-300 flex items-center disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Lưu</span>
                </>
              )}
            </button>
          
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-grow relative">
        {/* Overlay cho thiết bị di động khi sidebar mở */}
        {isMobile && showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setShowSidebar(false)}
          ></div>
        )}

        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`w-80 bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] ${
            showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="font-semibold text-gray-700">Danh Mục Hàng Hóa</h2>
            <div className="flex items-center space-x-2">
              <button 
                className="text-gray-500 hover:text-gray-700 md:block hidden"
                onClick={() => setShowSidebar(false)}
              >
                <ChevronsLeft className="h-5 w-5" />
              </button>
              <button 
                className="text-gray-500 hover:text-gray-700 md:hidden"
                onClick={() => setShowSidebar(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ height: 'calc(100vh - 9rem)' }}>
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm hàng hóa..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Product Categories */}
            <div className="p-4 border-b border-gray-200">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowAllCategories(prev => !prev)}
              >
                <h3 className="font-medium text-sm text-gray-500 uppercase">Phân Loại</h3>
                <button className="text-gray-500 focus:outline-none">
                  <ChevronDown className={`h-4 w-4 transform ${showAllCategories ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className={`mt-2 ${showAllCategories ? 'max-h-96' : 'max-h-24'} overflow-y-auto transition-all duration-300`}>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategorySelect('TẤT CẢ')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === 'TẤT CẢ'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategory === category
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div 
                  className="mt-2 text-xs text-blue-500 cursor-pointer"
                  onClick={() => setShowAllCategories(true)}
                >
                  {!showAllCategories && (
                    <span>Xem tất cả phân loại</span>
                  )}
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredDmhhItems.length > 0 ? (
                    filteredDmhhItems.map((product) => (
                      <li 
                        key={product.code}
                        className="hover:bg-gray-50 cursor-pointer p-3"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">Mã: {product.code} | ĐVT: {product.unit}</div>
                          </div>
                          <div className="font-medium text-blue-600">{formatCurrency(product.price)} đ</div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {searchTerm ? 'Không tìm thấy hàng hóa phù hợp' : 'Không có hàng hóa trong danh mục'}
                    </div>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Toggle button for collapsed sidebar */}
        {!showSidebar && !isMobile && (
          <button
            className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-r-lg shadow-md text-gray-500 hover:text-gray-700 border border-l-0 border-gray-200 z-10"
            onClick={() => setShowSidebar(true)}
          >
            <ChevronsRight className="h-5 w-5" />
          </button>
        )}

        {/* Main Content */}
        <main className="flex-grow w-full md:w-auto">
          <div className="container mx-auto px-4 py-6">
            {/* Thông tin báo giá */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <BarChart className="mr-2 h-5 w-5 text-blue-500" />
                Thông tin báo giá
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Báo giá</label>
                  <input
                    type="text"
                    id="quoteId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ID_BBGTH"
                    value={quoteInfo.quoteId}
                    onChange={handleQuoteInfoChange}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Công ty</label>
                  <input
                    type="text"
                    id="companyId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ID_CTY"
                    value={quoteInfo.companyId}
                    onChange={handleQuoteInfoChange}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày báo giá</label>
                  <input
                    type="date"
                    id="quoteDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={quoteInfo.quoteDate}
                    onChange={handleQuoteInfoChange}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số hợp đồng</label>
                  <input
                    type="text"
                    id="contractNumber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Số HĐ"
                    value={quoteInfo.contractNumber}
                    onChange={handleQuoteInfoChange}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn báo giá (ngày)</label>
                  <input
                    type="number"
                    id="quoteDuration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                    value={quoteInfo.quoteDuration}
                    onChange={handleQuoteInfoChange}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số buổi</label>
                  <input
                    type="number"
                    id="sessionCount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Số buổi"
                    value={quoteInfo.sessionCount}
                    onChange={handleQuoteInfoChange}
                  />
                </div>
              </div>
            </div>

            {/* Chi tiết báo giá */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-blue-500" />
                  Chi tiết hàng hóa/dịch vụ
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={createDemoQuote}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition duration-300"
                  >
                    <i className="fas fa-magic mr-1"></i>Tạo mẫu
                  </button>
                  <button
                    onClick={() => {
                      setShowAddItemForm(true);
                      setIsEditMode(false);
                      setEditingItemIndex(-1);
                      resetItemForm();
                    }}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition duration-300"
                  >
                    <Plus className="h-4 w-4 inline mr-1" /> <span className="hidden sm:inline">Thêm hàng hóa</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã HHDV
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên HH/DV
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chi tiết
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ĐVT
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá bán
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SL
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thành tiền
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % ưu đãi
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiền ưu đãi
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sau ưu đãi
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quoteItems.length > 0 ? (
                      quoteItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.code}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.detail}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.price)} đ</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.subtotal)} đ</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.discountPercent}%</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.discountAmount)} đ</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600">{formatCurrency(item.afterDiscount)} đ</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                            <button 
                              className="text-blue-500 hover:text-blue-700 mx-1"
                              onClick={() => handleEditItem(index)}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700 mx-1"
                              onClick={() => handleDeleteItem(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="px-3 py-6 text-center text-sm text-gray-500">
                          Chưa có hàng hóa nào trong báo giá
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Form thêm hàng hóa */}
              {showAddItemForm && (
                <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-md font-medium text-gray-700 mb-3">
                    {isEditMode ? 'Cập nhật hàng hóa/dịch vụ' : 'Thêm hàng hóa/dịch vụ'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mã HHDV</label>
                      <div className="flex">
                        <input
                          type="text"
                          id="code"
                          className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Mã HHDV"
                          value={currentItem.code}
                          onChange={handleItemChange}
                        />
                        <button 
                          className="bg-blue-500 text-white px-3 py-2 rounded-r-lg"
                          onClick={handleSearchProduct}
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên hàng hóa/dịch vụ</label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tên HHDV"
                        value={currentItem.name}
                        onChange={handleItemChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chi tiết</label>
                      <input
                        type="text"
                        id="detail"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Chi tiết"
                        value={currentItem.detail}
                        onChange={handleItemChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
                      <select
                        id="unit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={currentItem.unit}
                        onChange={handleItemChange}
                      >
                        <option value="Cái">Cái</option>
                        <option value="Bộ">Bộ</option>
                        <option value="Giờ">Giờ</option>
                        <option value="Ngày">Ngày</option>
                        <option value="Tháng">Tháng</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
                      <input
                        type="number"
                        id="price"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Giá bán"
                        value={currentItem.price}
                        onChange={handleItemChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                      <input
                        type="number"
                        id="quantity"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Số lượng"
                        value={currentItem.quantity}
                        onChange={handleItemChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">% ưu đãi</label>
                      <input
                        type="number"
                        id="discountPercent"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="% ưu đãi"
                        value={currentItem.discountPercent}
                        onChange={handleItemChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lên KH</label>
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          id="showToCustomer"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={currentItem.showToCustomer}
                          onChange={handleItemChange}
                        />
                        <label className="ml-2 block text-sm text-gray-700">Hiển thị lên KH</label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                      <input
                        type="text"
                        id="note"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ghi chú"
                        value={currentItem.note}
                        onChange={handleItemChange}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setShowAddItemForm(false)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300 transition duration-300"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAddOrUpdateItem}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                      {isEditMode ? 'Cập nhật hàng hóa' : 'Thêm vào báo giá'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tổng hợp báo giá */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <BarChart className="mr-2 h-5 w-5 text-blue-500" />
                Thông tin thanh toán
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">% VAT</label>
                    <select
                      id="vatRate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={paymentInfo.vatRate}
                      onChange={handlePaymentInfoChange}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí duy trì</label>
                    <input
                      type="number"
                      id="maintenanceFee"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Chi phí duy trì"
                      value={paymentInfo.maintenanceFee}
                      onChange={handlePaymentInfoChange}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phí Public App</label>
                    <input
                      type="number"
                      id="publicAppFee"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phí Public App"
                      value={paymentInfo.publicAppFee}
                      onChange={handlePaymentInfoChange}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tổng tiền hàng:</span>
                    <span className="font-medium">{formatCurrency(totals.totalBeforeDiscount)} đ</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tổng tiền ưu đãi:</span>
                    <span className="font-medium text-red-500">-{formatCurrency(totals.totalDiscount)} đ</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Thành tiền trước VAT:</span>
                    <span className="font-medium">{formatCurrency(totals.totalAfterDiscount)} đ</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">VAT ({paymentInfo.vatRate}%):</span>
                    <span className="font-medium">{formatCurrency(totals.vatAmount)} đ</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Chi phí duy trì:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(paymentInfo.maintenanceFee) || 0)} đ</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Phí Public App:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(paymentInfo.publicAppFee) || 0)} đ</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-lg">
                    <span className="text-gray-800">TỔNG THANH TOÁN:</span>
                    <span className="text-blue-600">{formatCurrency(totals.grandTotal)} đ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          © 2025 Hệ thống Tạo Báo Giá - Mọi quyền được bảo lưu
        </div>
      </footer>

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

export default BaoGiaFrom;