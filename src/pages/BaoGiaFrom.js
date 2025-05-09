import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext, useTransition } from 'react';
import { Search, PlusCircle, FileSearch, Trash2, Eye, CheckCircle, Printer, Save, RefreshCw, Download, Upload, FileText, X, Calculator, Users, FileCheck, CalendarClock, Percent, Edit } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import useSWR from 'swr';

// Context API
const QuotationContext = createContext();

// Custom hooks
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Fetch service
const fetchServices = async () => {
  try {
    const res = await authUtils.apiRequest('DMHH', 'Find', {});
    return res?.map(svc => ({
      'Ma_HHDV': svc['MÃ HÀNG'] || svc['Ma_HHDV'],
      'TÊN HH DV': svc['TÊN HÀNG'] || svc['TÊN HH DV'],
      'CHI TIẾT': svc['MÔ TẢ'] || svc['CHI TIẾT'],
      'DVT': svc['ĐƠN VỊ TÍNH'] || svc['DVT'],
      'GIÁ BÁN': svc['ĐƠN GIÁ XUẤT'] || svc['GIÁ BÁN'] || 0,
      'PHÂN LOẠI': svc['PHÂN LOẠI']
    })) || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Fetch customers
const fetchCustomers = async () => {
  try {
    const res = await authUtils.apiRequest('KHTN', 'Find', {});
    return res || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Subcomponents
const ServiceCard = React.memo(({ service, isSelected, onSelect, onViewDetail }) => {
  return (
    <div
      className={`flex items-center p-3 rounded-lg border hover:bg-gray-50 cursor-pointer service-card
          ${isSelected ? 'border-2 border-blue-500 bg-blue-50' : 'border-gray-100'}`}
      onClick={onSelect}
    >
      <div className="w-12 h-12 rounded-lg bg-blue-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
        <FileText className="w-6 h-6 text-blue-500" />
      </div>
      <div className="ml-3 flex-1">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-gray-900 text-sm">{service['TÊN HH DV']}</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {formatCurrency(service['GIÁ BÁN'])}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center">
            <span className="mr-1">📋</span>
            {service['Ma_HHDV']}
          </span>
          <span className="flex items-center">
            <span className="mr-1">📦</span>
            {service['DVT']}
          </span>
        </div>
        {service['CHI TIẾT'] && (
          <div className="mt-1 text-xs text-gray-500 line-clamp-1">
            {service['CHI TIẾT']}
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewDetail();
        }}
        className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        title="Xem chi tiết"
      >
        <FileText className="w-4 h-4" />
      </button>
    </div>
  );
});

const ServiceCardCompact = React.memo(({ service, isSelected, onSelect, onViewDetail }) => {
  return (
    <div
      className={`border rounded-lg p-2 ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
        } transition-all cursor-pointer`}
    >
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          <FileText className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-800 truncate w-3/4" title={service['TÊN HH DV']}>
              {service['TÊN HH DV']}
            </h3>
            <div className="text-xs font-semibold text-indigo-600 whitespace-nowrap">
              {parseInt(service['GIÁ BÁN']).toLocaleString('vi-VN')} đ
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate" title={service.Ma_HHDV}>
            Mã: {service.Ma_HHDV}
          </div>
          <div className="flex items-center mt-1.5 justify-between">
            <div className="flex items-center">
              <span className="inline-flex items-center bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600 truncate max-w-[100px]" title={service.Loai_DV}>
                {service['PHÂN LOẠI']|| "Chưa phân loại"}
              </span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetail();
                }}
                className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
              >
                <Eye className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className={`p-1 rounded ${isSelected ? "text-indigo-600 bg-indigo-100" : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
              >
                {isSelected ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <PlusCircle className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const CategoryFilter = React.memo(({ categories, selectedCategories, onSelectCategory }) => (
  <div className="flex flex-wrap gap-2">
    {categories.map((category) => {
      const count = category === 'Tất cả'
        ? categories.length - 1 // Exclude "All" from count
        : category.count;
      const isActive = category === 'Tất cả'
        ? selectedCategories.length === 0
        : selectedCategories.includes(category.name);

      return (
        <button
          key={category.name || category}
          onClick={() => onSelectCategory(category.name || category)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-2 transition-colors
              ${isActive
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
        >
          <span>{category.name || category}</span>
          <span className={`px-1.5 py-0.5 text-xs rounded-full 
              ${isActive
              ? 'bg-blue-400 text-white'
              : 'bg-gray-200 text-gray-600'}`}>
            {count}
          </span>
        </button>
      );
    })}
  </div>
));

const ServiceTableRow = React.memo(({ item, index, onQuantityChange, onDiscountChange, onPriceChange, onNoteChange, onRemove, vatPercent, onEdit }) => {
  const subtotal = item.price * item.quantity;
  const discountAmount = Math.round(subtotal * (item.discountPercent / 100));
  const afterDiscount = subtotal - discountAmount;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-3 py-2">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{item.service['TÊN HH DV']}</div>
            <div className="text-xs text-gray-500">
              {item.service['Ma_HHDV']} | <span className="font-medium">{item.service['DVT']}</span>
              {item.service['CHI TIẾT'] && <span className="ml-1">- {item.service['CHI TIẾT']}</span>}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          className="w-14 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          value={item.quantity}
          onChange={(e) => onQuantityChange(index, parseInt(e.target.value) || 1)}
          min="1"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          value={item.price}
          onChange={(e) => onPriceChange(index, parseInt(e.target.value) || 0)}
          min="0"
        />
      </td>
      <td className="px-3 py-2 font-medium">
        {formatCurrency(subtotal)}
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          value={item.discountPercent}
          onChange={(e) => onDiscountChange(index, Math.min(parseFloat(e.target.value) || 0, 100))}
          min="0"
          max="100"
        />
      </td>
      <td className="px-3 py-2 text-red-500 font-medium">
        -{formatCurrency(discountAmount)}
      </td>
      <td className="px-3 py-2 font-medium">
        {formatCurrency(afterDiscount)}
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ghi chú"
          value={item.note}
          onChange={(e) => onNoteChange(index, e.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={() => onEdit(item, index)}
            className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded-full transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
        <button
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
          title="Xóa sản phẩm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        </div>
      </td>
    </tr>
  );
});

const ServicesTable = React.memo(({ items, onQuantityChange, onDiscountChange, onPriceChange, onNoteChange, onRemove, vatPercent, onEdit }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Chưa có dịch vụ nào được thêm vào báo giá</p>
        <p className="text-sm text-gray-400 mt-1">Chọn dịch vụ từ danh sách bên trái để thêm vào báo giá</p>
      </div>
    );
  }

  // Calculate totals
  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscounts = items.reduce((sum, item) => {
    const subtotal = item.price * item.quantity;
    return sum + (subtotal * (item.discountPercent / 100));
  }, 0);
  const totalAfterDiscount = totalBeforeDiscount - totalDiscounts;

  return (
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tên Dịch Vụ
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
            Số Lượng
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
            Đơn Giá
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
            Thành Tiền
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
            % Ưu Đãi
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
            Ưu Đãi
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
            Sau Ưu Đãi
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ghi Chú
          </th>
          <th className="px-3 py-2 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span className="sr-only">Thao Tác</span>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {items.map((item, index) => (
          <ServiceTableRow
            key={index}
            item={item}
            index={index}
            onQuantityChange={onQuantityChange}
            onDiscountChange={onDiscountChange}
            onPriceChange={onPriceChange}
            onNoteChange={onNoteChange}
            onRemove={onRemove}
            vatPercent={vatPercent}
            onEdit={onEdit}
          />
        ))}
        <tr className="bg-gray-50 font-medium">
          <td colSpan="3" className="px-3 py-2 text-right">
            Tổng cộng:
          </td>
          <td className="px-3 py-2 font-bold">
            {formatCurrency(totalBeforeDiscount)}
          </td>
          <td className="px-3 py-2">
          </td>
          <td className="px-3 py-2 text-red-500 font-bold">
            -{formatCurrency(totalDiscounts)}
          </td>
          <td className="px-3 py-2 font-bold">
            {formatCurrency(totalAfterDiscount)}
          </td>
          <td colSpan="2"></td>
        </tr>
      </tbody>
    </table>
  );
});

// Main component
const QuotationForm = () => {
  // Use SWR for data fetching with caching
  const { data: servicesData, error: servicesError, mutate: mutateServices } = useSWR('services', fetchServices, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000, // 1 hour
    suspense: false
  });

  const { data: customersData, error: customersError } = useSWR('customers', fetchCustomers, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000, // 1 hour
    suspense: false
  });

  // States with optimized structure
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [filteredServices, setFilteredServices] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const categoriesPerPage = 10;

  // Split form state into smaller chunks for better performance
  const [quoteBasics, setQuoteBasics] = useState({
    ID_BBGTH: '',
    ID_CTY: '',
    NGAYBAOGIA: new Date().toISOString().slice(0, 10),
  });

  const [quoteSettings, setQuoteSettings] = useState({
    UUDAI: 0,
    PT_VAT: 10,
    THOIHANGIA: 15,
  });

  const [additionalSettings, setAdditionalSettings] = useState({
    SOBUOI: 0,
    THOIHAN: 0,
    PHIDUYTRI: 0,
    PHIPUBLICAPP: 0,
    GHICHU: ''
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdQuotationId, setCreatedQuotationId] = useState(null);
  const [previousQuotes, setPreviousQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const services = servicesData || [];
  const customers = customersData || [];
  const printRef = useRef(null);

  // Apply debounce to search (smaller delay for better responsiveness)
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  // Memoized categories
  const categories = useMemo(() => {
    if (!services.length) return [];

    const categoryMap = services.reduce((acc, service) => {
      const category = service['PHÂN LOẠI'] || 'Khác';
      const categoryDT = service['PHÂN LOẠI DT'] || '';
      if (!acc[category]) {
        acc[category] = {
          name: category,
          dt: categoryDT,
          count: 0
        };
      }
      acc[category].count++;
      return acc;
    }, {});

    return Object.values(categoryMap);
  }, [services]);

  // Apply filter to categories
  const filteredCategories = useMemo(() => {
    const searchLower = categorySearchQuery.toLowerCase();
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchLower) ||
      cat.dt.toLowerCase().includes(searchLower)
    );
  }, [categories, categorySearchQuery]);

  // Pagination for categories
  const totalCategoryPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  const currentCategories = useMemo(() => {
    const start = (currentCategoryPage - 1) * categoriesPerPage;
    return filteredCategories.slice(start, start + categoriesPerPage);
  }, [filteredCategories, currentCategoryPage]);

  // Calculate totals with memoization
  const totals = useMemo(() => {
    const totalBeforeDiscount = selectedServices.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const totalItemDiscount = selectedServices.reduce((sum, item) => {
      const subtotal = item.price * item.quantity;
      return sum + (subtotal * (item.discountPercent / 100));
    }, 0);

    const afterItemDiscount = totalBeforeDiscount - totalItemDiscount;

    // Additional discount on total
    const generalDiscountAmount = afterItemDiscount * (quoteSettings.UUDAI / 100);
    const afterGeneralDiscount = afterItemDiscount - generalDiscountAmount;

    // VAT
    const vatAmount = afterGeneralDiscount * (quoteSettings.PT_VAT / 100);
    const afterVat = afterGeneralDiscount + vatAmount;

    // Additional fees
    const maintenanceFee = parseFloat(additionalSettings.PHIDUYTRI) || 0;
    const publicAppFee = parseFloat(additionalSettings.PHIPUBLICAPP) || 0;

    // Grand total
    const grandTotal = afterVat + maintenanceFee + publicAppFee;

    return {
      totalBeforeDiscount,
      totalItemDiscount,
      afterItemDiscount,
      generalDiscountAmount,
      afterGeneralDiscount,
      vatAmount,
      afterVat,
      maintenanceFee,
      publicAppFee,
      grandTotal
    };
  }, [selectedServices, quoteSettings.UUDAI, quoteSettings.PT_VAT, additionalSettings.PHIDUYTRI, additionalSettings.PHIPUBLICAPP]);

  // Fetch previous quotes when customer changes
  useEffect(() => {
    const fetchPreviousQuotes = async () => {
      if (selectedCustomer) {
        try {
          // Tạo mã báo giá tự động với timestamp
          const timestamp = new Date().getTime();
          const newId = `BG${timestamp}`;

          setQuoteBasics(prev => ({ ...prev, ID_BBGTH: newId }));
        } catch (error) {
          console.error('Error generating quote ID:', error);
          // Tạo ID dự phòng nếu có lỗi
          const timestamp = new Date().getTime();
          const newId = `BG${timestamp}`;
          setQuoteBasics(prev => ({ ...prev, ID_BBGTH: newId }));
        }
      }
    };

    fetchPreviousQuotes();
  }, [selectedCustomer]);

  // Update filtered services when dependencies change
  useEffect(() => {
    startTransition(() => {
      if (!services.length) return;

      const filtered = services.filter(service => {
        const matchesSearch = debouncedSearchQuery.trim() === '' ||
          service['Ma_HHDV']?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          service['TÊN HH DV']?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

        const matchesCategory = selectedCategories.length === 0 ||
          selectedCategories.includes(service['PHÂN LOẠI'] || 'Khác');

        return matchesSearch && matchesCategory;
      });

      setFilteredServices(filtered);
    });
  }, [services, debouncedSearchQuery, selectedCategories]);

  // Optimized handlers
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, []);

  const handleQuoteBasicsChange = useCallback((e) => {
    const { id, value } = e.target;
    setQuoteBasics(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleQuoteSettingsChange = useCallback((e) => {
    const { id, value } = e.target;
    setQuoteSettings(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleAdditionalSettingsChange = useCallback((e) => {
    const { id, value } = e.target;
    setAdditionalSettings(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleCustomerChange = useCallback((e) => {
    const customerId = e.target.value;
    setQuoteBasics(prev => ({ ...prev, ID_CTY: customerId }));

    const customer = customers.find(c => c.ID_CTY === customerId);
    setSelectedCustomer(customer);
  }, [customers]);

  const handleSelectCategory = useCallback((category) => {
    if (category === 'Tất cả') {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(prev => {
        if (prev.includes(category)) {
          return prev.filter(c => c !== category);
        } else {
          return [...prev, category];
        }
      });
    }
  }, []);

  const handleSelectService = useCallback((serviceId) => {
    const service = services.find(s => s['Ma_HHDV'] === serviceId);
    if (!service) return;

    setSelectedServices(prev => {
      // Check if service already exists
      const existingIndex = prev.findIndex(p => p.service['Ma_HHDV'] === serviceId);

      if (existingIndex >= 0) {
        // Update quantity if service already added
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      } else {
        // Add new service with unique ID
        return [...prev, {
          id: `SERV${Date.now()}${Math.floor(Math.random() * 1000)}`,
          service,
          quantity: 1,
          price: service['GIÁ BÁN'],
          discountPercent: 0,
          note: ''
        }];
      }
    });
  }, [services]);

  const handleRemoveService = useCallback((index) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleServiceQuantityChange = useCallback((index, value) => {
    setSelectedServices(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: value
      };
      return updated;
    });
  }, []);

  const handleServicePriceChange = useCallback((index, value) => {
    setSelectedServices(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        price: value
      };
      return updated;
    });
  }, []);

  const handleServiceDiscountChange = useCallback((index, value) => {
    setSelectedServices(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        discountPercent: value
      };
      return updated;
    });
  }, []);

  const handleServiceNoteChange = useCallback((index, value) => {
    setSelectedServices(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        note: value
      };
      return updated;
    });
  }, []);

  const resetForm = useCallback(() => {
    setQuoteBasics({
      ID_BBGTH: '',
      ID_CTY: '',
      NGAYBAOGIA: new Date().toISOString().slice(0, 10),
    });

    setQuoteSettings({
      UUDAI: 0,
      PT_VAT: 10,
      THOIHANGIA: 15,
    });

    setAdditionalSettings({
      SOBUOI: 0,
      THOIHAN: 0,
      PHIDUYTRI: 0,
      PHIPUBLICAPP: 0,
      GHICHU: ''
    });

    setSelectedServices([]);
    setSelectedCustomer(null);
  }, []);

  const refreshData = useCallback(() => {
    mutateServices();
  }, [mutateServices]);

  const validateForm = useCallback(() => {
    const errors = [];

    // Basic validations
    if (!quoteBasics.ID_BBGTH) errors.push('Mã báo giá chưa được tạo');
    if (!quoteBasics.ID_CTY) errors.push('Vui lòng chọn khách hàng');
    if (!quoteBasics.NGAYBAOGIA) errors.push('Vui lòng chọn ngày báo giá');
    if (selectedServices.length === 0) errors.push('Vui lòng thêm ít nhất một dịch vụ');

    return errors;
  }, [quoteBasics, selectedServices]);

  const calculateQuoteExpiryDate = useCallback(() => {
    if (!quoteBasics.NGAYBAOGIA || !quoteSettings.THOIHANGIA) return '';

    const date = new Date(quoteBasics.NGAYBAOGIA);
    date.setDate(date.getDate() + parseInt(quoteSettings.THOIHANGIA));
    return date.toISOString().slice(0, 10);
  }, [quoteBasics.NGAYBAOGIA, quoteSettings.THOIHANGIA]);

  const submitForm = useCallback(async () => {
    try {
      setLoading(true);

      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        toast.error(errors.join('\n'));
        setLoading(false);
        return;
      }

      // Calculate all totals for database
      const quoteExpiryDate = calculateQuoteExpiryDate();

      // Prepare quote header with merged data
      const quoteHeader = {
        ID_BBGTH: quoteBasics.ID_BBGTH,
        ID_CTY: quoteBasics.ID_CTY,
        "NGÀY BÁO GIÁ": quoteBasics.NGAYBAOGIA,
        "ƯU ĐÃI": quoteSettings.UUDAI,
        "TT TRƯỚC ƯU ĐÃI": totals.afterItemDiscount,
        "TT ƯU ĐÃI": totals.generalDiscountAmount,
        "TT SAU ƯU ĐÃI": totals.afterGeneralDiscount,
        "PT VAT": quoteSettings.PT_VAT,
        "TT VAT": totals.vatAmount,
        "TT SAU VAT": totals.afterVat,
        "THỜI HẠN BÁO GIÁ": quoteExpiryDate,
        "SỐ BUỔI": additionalSettings.SOBUOI,
        "THỜI HẠN": additionalSettings.THOIHANGIA,
        "PHÍ DUY TRÌ": additionalSettings.PHIDUYTRI,
        "PHÍ PUBLIC APP": additionalSettings.PHIPUBLICAPP,
        "TỔNG TIỀN": totals.grandTotal,
        "GHI CHÚ": additionalSettings.GHICHU
      };

      const quoteDetails = selectedServices.map((item, index) => {
        const subtotal = item.price * item.quantity;
        const discountAmount = Math.round(subtotal * (item.discountPercent / 100));
        const afterDiscount = subtotal - discountAmount;
        const vatAmount = afterDiscount * (quoteSettings.PT_VAT / 100);

        return {
          ID_BBGTH_DE: `${quoteBasics.ID_BBGTH}-${index + 1}`,
          ID_BBGTH: quoteBasics.ID_BBGTH,
          Ma_HHDV: item.service['Ma_HHDV'],
          "TÊN HH DV": item.service['TÊN HH DV'],
          "CHI TIẾT": item.service['CHI TIẾT'],
          "DVT": item.service['DVT'],
          "GIÁ BÁN": item.price,
          "SỐ LƯỢNG": item.quantity,
          "THÀNH TIỀN": subtotal,
          "PT ƯU ĐÃI": item.discountPercent,
          "SỐ TIỀN ƯU ĐÃI": discountAmount,
          "GIÁ TRỊ SAU ƯU ĐÃI": afterDiscount,
          "PT VAT": quoteSettings.PT_VAT,
          "TIỀN VAT": vatAmount,
          "GIÁ TRỊ SAU VAT": afterDiscount + vatAmount,
          "GHI CHÚ": item.note
        };
      });

      // Submit data using batch API request for better performance
      await Promise.all([
        authUtils.apiRequest('PO', 'Add', { Rows: [quoteHeader] }),
        authUtils.apiRequest('PO_DE', 'Add', { Rows: quoteDetails })
      ]);

      setCreatedQuotationId(quoteBasics.ID_BBGTH);
      setShowSuccessModal(true);
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Có lỗi xảy ra khi lưu báo giá');
    } finally {
      setLoading(false);
    }
  }, [quoteBasics, quoteSettings, additionalSettings, selectedServices, totals, validateForm, calculateQuoteExpiryDate, resetForm]);

  const handleShowCategoryModal = useCallback(() => {
    setShowCategoryModal(true);
  }, []);

  const handleCloseCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
  }, []);

  const handleShowDetailModal = useCallback((service) => {
    setSelectedService(service);
    setShowDetailModal(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setSelectedService(null);
    setShowDetailModal(false);
  }, []);

  const handleShowEditModal = useCallback((item, index) => {
    setEditingService({ ...item, index });
    setShowEditModal(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditingService(null);
    setShowEditModal(false);
  }, []);

  const handleSaveEdit = useCallback((updatedService) => {
    setSelectedServices(prev => {
      const updated = [...prev];
      updated[updatedService.index] = {
        ...updated[updatedService.index],
        quantity: updatedService.quantity,
        price: updatedService.price,
        discountPercent: updatedService.discountPercent,
        note: updatedService.note
      };
      return updated;
    });
    handleCloseEditModal();
  }, []);

  // Create a context value for child components
  const contextValue = {
    selectedServices,
    setSelectedServices,
    handleSelectService,
    handleRemoveService,
    handleServiceQuantityChange,
    handleServicePriceChange,
    handleServiceDiscountChange,
    handleServiceNoteChange
  };

  return (
    <QuotationContext.Provider value={contextValue}>
      <div className="h-[calc(100vh-7rem)]">
        {/* Main Container */}
        <div className="flex">
          {/* Sidebar with service listing */}
        
          <div className={`w-80 h-[calc(100vh-7rem)] bg-white shadow-lg flex flex-col sticky top-0 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Header - giảm padding và kích thước chữ */}
            <div className="p-3 border-b border-gray-200 bg-indigo-50">
              <h2 className="text-base font-semibold flex items-center space-x-1.5 text-indigo-700">
                <FileText className="h-5 w-5" />
                <span>Danh Mục Dịch Vụ</span>
              </h2>
            </div>

            {/* Search Section - giảm padding */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative mb-2">
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="w-full px-2 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 flex items-center justify-center space-x-1 border border-indigo-200 rounded-lg hover:bg-indigo-50"
              >
                <Search className="w-3 h-3" />
                <span>Tìm kiếm nâng cao</span>
              </button>
            </div>

            {/* Services List */}
            <div className="flex-1 overflow-hidden service-list-container">
              {servicesError ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-red-500 text-sm mb-2">Lỗi khi tải dữ liệu</div>
                  <button
                    onClick={refreshData}
                    className="px-3 py-1 text-xs bg-indigo-500 text-white rounded-md flex items-center hover:bg-indigo-600"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Thử lại
                  </button>
                </div>
              ) : !servicesData ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <p className="text-gray-500 text-xs mt-3">Đang tải dữ liệu...</p>
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="p-2">
                  <List
                    height={610}
                    itemCount={filteredServices.length}
                    itemSize={80}
                    width="100%"
                    overscanCount={3}
                    className="service-virtualized-list"
                  >
                    {({ index, style }) => (
                      <div style={{ ...style, paddingRight: '6px', paddingBottom: '8px' }}>
                        <ServiceCardCompact
                          key={filteredServices[index]['Ma_HHDV']}
                          service={filteredServices[index]}
                          isSelected={selectedServices.some(item =>
                            item.service['Ma_HHDV'] === filteredServices[index]['Ma_HHDV']
                          )}
                          onSelect={() => handleSelectService(filteredServices[index]['Ma_HHDV'])}
                          onViewDetail={() => handleShowDetailModal(filteredServices[index])}
                        />
                      </div>
                    )}
                  </List>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <FileSearch className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm">Không tìm thấy dịch vụ phù hợp</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="py-2 px-3 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-lg">
              <div className="text-xs text-gray-600">
                {isPending ? 'Đang lọc...' : `${filteredServices.length} dịch vụ`}
              </div>
              <button
                onClick={refreshData}
                className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-3">
                <span>Tạo Báo Giá</span>
              </h2>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
              <form className="space-y-4">
                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ID Báo Giá */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">Mã báo giá</label>
                    <input
                      type="text"
                      id="ID_BBGTH"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                      value={quoteBasics.ID_BBGTH}
                      readOnly
                    />
                  </div>

                  {/* Ngày Báo Giá */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">Ngày báo giá</label>
                    <input
                      type="date"
                      id="NGAYBAOGIA"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      value={quoteBasics.NGAYBAOGIA}
                      onChange={handleQuoteBasicsChange}
                      required
                    />
                  </div>

                  {/* Thời Hạn Giá */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">Thời hạn báo giá (ngày)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="THOIHANGIA"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={quoteSettings.THOIHANGIA}
                        onChange={handleQuoteSettingsChange}
                        min="1"
                      />
                      <div className="bg-gray-100 px-3 py-2 text-sm border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                        {calculateQuoteExpiryDate() ? `Hết hạn: ${calculateQuoteExpiryDate()}` : 'Ngày'}
                      </div>
                    </div>
                  </div>

                  {/* Khách Hàng */}
                  <div className="space-y-1 md:col-span-3">
                    <label className="text-sm font-medium text-gray-700 block">Khách hàng</label>
                    <select
                      id="ID_CTY"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      value={quoteBasics.ID_CTY}
                      onChange={handleCustomerChange}
                      required
                    >
                      <option value="">Chọn khách hàng</option>
                      {customers.map(customer => (
                        <option key={customer.ID_CTY} value={customer.ID_CTY}>
                          {customer['TÊN CÔNG TY']} ({customer['TÊN VIẾT TẮT'] || customer.ID_CTY})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Info - Only show if customer is selected */}
                  {selectedCustomer && (
                    <div className="md:col-span-3 p-4 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Mã số thuế</p>
                          <p className="text-sm">{selectedCustomer.MST || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Địa chỉ</p>
                          <p className="text-sm">{selectedCustomer['ĐỊA CHỈ'] || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Email</p>
                          <p className="text-sm">{selectedCustomer['EMAIL CÔNG TY'] || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Người liên hệ</p>
                          <p className="text-sm">{selectedCustomer['NGƯỜI LIÊN HỆ'] || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">SĐT liên hệ</p>
                          <p className="text-sm">{selectedCustomer['SỐ ĐT NGƯỜI LIÊN HỆ'] || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Email liên hệ</p>
                          <p className="text-sm">{selectedCustomer['EMAIL NGƯỜI LIÊN HỆ'] || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ưu đãi chung */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">% Ưu đãi chung</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="UUDAI"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={quoteSettings.UUDAI}
                        onChange={handleQuoteSettingsChange}
                        min="0"
                        max="100"
                      />
                      <div className="bg-gray-100 px-3 py-2 text-sm border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                        %
                      </div>
                    </div>
                  </div>

                  {/* VAT */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">% VAT</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="PT_VAT"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={quoteSettings.PT_VAT}
                        onChange={handleQuoteSettingsChange}
                        min="0"
                        max="100"
                      />
                      <div className="bg-gray-100 px-3 py-2 text-sm border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                        %
                      </div>
                    </div>
                  </div>

                  {/* Số buổi */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">Số buổi</label>
                    <input
                      type="number"
                      id="SOBUOI"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      value={additionalSettings.SOBUOI}
                      onChange={handleAdditionalSettingsChange}
                      min="0"
                    />
                  </div>

                

                  {/* Phí duy trì */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">Phí duy trì</label>
                    <input
                      type="number"
                      id="PHIDUYTRI"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      value={additionalSettings.PHIDUYTRI}
                      onChange={handleAdditionalSettingsChange}
                      min="0"
                    />
                  </div>

                  {/* Phí public app */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">Phí public app</label>
                    <input
                      type="number"
                      id="PHIPUBLICAPP"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      value={additionalSettings.PHIPUBLICAPP}
                      onChange={handleAdditionalSettingsChange}
                      min="0"
                    />
                  </div>

                  {/* Ghi chú */}
                  <div className="space-y-1 md:col-span-3">
                    <label className="text-sm font-medium text-gray-700 block">Ghi chú</label>
                    <textarea
                      id="GHICHU"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      value={additionalSettings.GHICHU}
                      onChange={handleAdditionalSettingsChange}
                      rows="2"
                    ></textarea>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center"
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Làm mới
                  </button>

                  <button
                    type="button"
                    onClick={submitForm}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu báo giá
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Services Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Chi Tiết Báo Giá</h2>
                <div className="text-sm text-gray-500">
                  Tổng số dịch vụ: <span className="font-medium">{selectedServices.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <ServicesTable
                  items={selectedServices}
                  onQuantityChange={handleServiceQuantityChange}
                  onDiscountChange={handleServiceDiscountChange}
                  onPriceChange={handleServicePriceChange}
                  onNoteChange={handleServiceNoteChange}
                  onRemove={handleRemoveService}
                  vatPercent={quoteSettings.PT_VAT}
                  onEdit={handleShowEditModal}
                />
              </div>

              {/* Totals Section */}
              {selectedServices.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 text-sm">
                      <div className="text-gray-600">Tổng tiền trước ưu đãi:</div>
                      <div className="text-right font-medium">{formatCurrency(totals.afterItemDiscount)}</div>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <div className="text-gray-600">Ưu đãi ({quoteSettings.UUDAI}%):</div>
                      <div className="text-right font-medium text-red-500">-{formatCurrency(totals.generalDiscountAmount)}</div>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <div className="text-gray-600">Sau ưu đãi:</div>
                      <div className="text-right font-medium">{formatCurrency(totals.afterGeneralDiscount)}</div>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <div className="text-gray-600">VAT ({quoteSettings.PT_VAT}%):</div>
                      <div className="text-right font-medium">{formatCurrency(totals.vatAmount)}</div>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <div className="text-gray-600">Sau VAT:</div>
                      <div className="text-right font-medium">{formatCurrency(totals.afterVat)}</div>
                    </div>

                    {(totals.maintenanceFee > 0 || totals.publicAppFee > 0) && (
                      <>
                        <div className="border-t border-gray-200 my-2 pt-2"></div>
                        {totals.maintenanceFee > 0 && (
                          <div className="grid grid-cols-2 text-sm">
                            <div className="text-gray-600">Phí duy trì:</div>
                            <div className="text-right font-medium">{formatCurrency(totals.maintenanceFee)}</div>
                          </div>
                        )}
                        {totals.publicAppFee > 0 && (
                          <div className="grid grid-cols-2 text-sm">
                            <div className="text-gray-600">Phí public app:</div>
                            <div className="text-right font-medium">{formatCurrency(totals.publicAppFee)}</div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t border-gray-200 my-2 pt-2"></div>
                    <div className="grid grid-cols-2 text-md">
                      <div className="font-semibold text-gray-800">TỔNG CỘNG:</div>
                      <div className="text-right font-bold text-blue-600">{formatCurrency(totals.grandTotal)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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

        {/* Advanced Search Modal */}
        {showAdvancedSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Tìm kiếm nâng cao</h2>
                  <button
                    onClick={() => setShowAdvancedSearch(false)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Phân loại */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Phân loại</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {currentCategories.map((category, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            handleSelectCategory(category.name);
                          }}
                          className={`p-4 rounded-lg border text-left transition-colors ${selectedCategories.includes(category.name)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{category.name}</div>
                              {category.dt && (
                                <div className="text-sm text-gray-500 mt-1">{category.dt}</div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {category.count} dịch vụ
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phân trang */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Hiển thị {currentCategories.length} / {filteredCategories.length} phân loại
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentCategoryPage(prev => Math.max(1, prev - 1))}
                        disabled={currentCategoryPage === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setCurrentCategoryPage(prev => Math.min(totalCategoryPages, prev + 1))}
                        disabled={currentCategoryPage === totalCategoryPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedCategories([]);
                      setShowAdvancedSearch(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                  <button
                    onClick={() => setShowAdvancedSearch(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Chọn phân loại</h2>
                  <button
                    onClick={handleCloseCategoryModal}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent will-change-contents"
                    placeholder="Tìm kiếm phân loại..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 contain-content">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {currentCategories.map((category, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleSelectCategory(category.name);
                          handleCloseCategoryModal();
                        }}
                        className={`p-4 rounded-lg border text-left transition-colors ${selectedCategories.includes(category.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{category.name}</div>
                            {category.dt && (
                              <div className="text-sm text-gray-500 mt-1">{category.dt}</div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {category.count} dịch vụ
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Hiển thị {currentCategories.length} / {filteredCategories.length} phân loại
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentCategoryPage(prev => Math.max(1, prev - 1))}
                      disabled={currentCategoryPage === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCurrentCategoryPage(prev => Math.min(totalCategoryPages, prev + 1))}
                      disabled={currentCategoryPage === totalCategoryPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Chi tiết dịch vụ</h2>
                  <button
                    onClick={handleCloseDetailModal}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 contain-content">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mã hàng hóa</label>
                      <div className="mt-1 text-gray-900">{selectedService['Ma_HHDV']}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tên hàng hóa</label>
                      <div className="mt-1 text-gray-900">{selectedService['TÊN HH DV']}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chi tiết</label>
                      <div className="mt-1 text-gray-900">{selectedService['CHI TIẾT'] || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Đơn vị tính</label>
                      <div className="mt-1 text-gray-900">{selectedService['DVT']}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phân loại</label>
                      <div className="mt-1 text-gray-900">{selectedService['PHÂN LOẠI'] || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phân loại DT</label>
                      <div className="mt-1 text-gray-900">{selectedService['PHÂN LOẠI DT'] || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">NCC ưu tiên</label>
                      <div className="mt-1 text-gray-900">{selectedService['NCC ƯU TIÊN'] || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Giá mua</label>
                      <div className="mt-1 text-gray-900">{formatCurrency(selectedService['GIÁ MUA'] || 0)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Giá bán</label>
                      <div className="mt-1 text-gray-900">{formatCurrency(selectedService['GIÁ BÁN'] || 0)}</div>
                    </div>
                    {selectedService['HÌNH ẢNH'] && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Hình ảnh</label>
                        <div className="mt-2">
                          <img
                            src={selectedService['HÌNH ẢNH']}
                            alt={selectedService['TÊN HH DV']}
                            className="max-w-full h-auto rounded-lg contain-content"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseDetailModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      handleSelectService(selectedService['Ma_HHDV']);
                      handleCloseDetailModal();
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Thêm vào báo giá
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">Tạo báo giá thành công</h2>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <p className="text-green-700">
                    Báo giá <span className="font-bold">{createdQuotationId}</span> đã được tạo thành công!
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Đóng
                  </button>
                  <Link
                    to={`/quotations/${createdQuotationId}/preview`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Xem báo giá
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa dịch vụ</h2>
                  <button
                    onClick={handleCloseEditModal}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
      </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Service Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Mã dịch vụ</p>
                        <p className="mt-1 text-gray-900">{editingService.service['Ma_HHDV']}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tên dịch vụ</p>
                        <p className="mt-1 text-gray-900">{editingService.service['TÊN HH DV']}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Đơn vị tính</p>
                        <p className="mt-1 text-gray-900">{editingService.service['DVT']}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phân loại</p>
                        <p className="mt-1 text-gray-900">{editingService.service['PHÂN LOẠI'] || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={editingService.quantity}
                        onChange={(e) => setEditingService(prev => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1
                        }))}
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đơn giá
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={editingService.price}
                        onChange={(e) => setEditingService(prev => ({
                          ...prev,
                          price: parseInt(e.target.value) || 0
                        }))}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        % Ưu đãi
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={editingService.discountPercent}
                        onChange={(e) => setEditingService(prev => ({
                          ...prev,
                          discountPercent: Math.min(parseFloat(e.target.value) || 0, 100)
                        }))}
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ghi chú
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={editingService.note}
                        onChange={(e) => setEditingService(prev => ({
                          ...prev,
                          note: e.target.value
                        }))}
                        placeholder="Nhập ghi chú..."
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Xem trước</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Thành tiền:</span>
                        <span className="font-medium">{formatCurrency(editingService.quantity * editingService.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ưu đãi ({editingService.discountPercent}%):</span>
                        <span className="font-medium text-red-500">
                          -{formatCurrency(Math.round(editingService.quantity * editingService.price * (editingService.discountPercent / 100)))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sau ưu đãi:</span>
                        <span className="font-medium">
                          {formatCurrency(editingService.quantity * editingService.price * (1 - editingService.discountPercent / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleSaveEdit(editingService)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </QuotationContext.Provider>
  );
};

const QuotationFormWithStyles = () => (
  <>
    <QuotationForm />
  </>
);

export default QuotationFormWithStyles;