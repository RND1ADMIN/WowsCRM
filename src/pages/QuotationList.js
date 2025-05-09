import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, FileText, Eye, Edit, Trash2, Download, Printer, RefreshCw, Filter, ChevronDown, X, Calendar, User, CreditCard, CheckCircle, Clock, XCircle, ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
import authUtils from '../utils/authUtils';
import useSWR from 'swr';

// Format currency helper function
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Format date helper function
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
};

// Quotation status badge component
const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Chờ xác nhận': {
            color: 'bg-yellow-100 text-yellow-700',
            icon: <Clock className="w-3 h-3 mr-1" />
        },
        'Đã chấp nhận': {
            color: 'bg-green-100 text-green-700',
            icon: <CheckCircle className="w-3 h-3 mr-1" />
        },
        'Đã từ chối': {
            color: 'bg-red-100 text-red-700',
            icon: <XCircle className="w-3 h-3 mr-1" />
        },
        'Hết hạn': {
            color: 'bg-gray-100 text-gray-700',
            icon: <Clock className="w-3 h-3 mr-1" />
        }
    };

    const config = statusConfig[status] || statusConfig['Chờ xác nhận'];

    return (
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.icon}
            {status}
        </div>
    );
};

// Quotation list component
const QuotationList = () => {
    // States
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('NGÀY BÁO GIÁ');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('Tất cả');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Constants
    const ITEMS_PER_PAGE = 10;

    // Fetch quotations with SWR
    const fetcher = async () => {
        try {
            const res = await authUtils.apiRequest('PO', 'Find', {});
            return res || [];
        } catch (error) {
            console.error('Error fetching quotations:', error);
            throw error;
        }
    };
    // Khi khai báo useSWR cho quotation-details, bạn cần lấy hàm mutate
const { data: quoteDetailsData, mutate: refreshQuoteDetails } = useSWR('quotation-details', async () => {
    try {
        const res = await authUtils.apiRequest('PO_DE', 'Find', {});
        return res || [];
    } catch (error) {
        console.error('Error fetching quotation details:', error);
        return [];
    }
}, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 phút
});
    // Fetch quotation details
    const fetchQuoteDetails = useCallback((quoteId) => {
        if (!quoteDetailsData) return [];
        return quoteDetailsData.filter(detail => detail.ID_BBGTH === quoteId);
    }, [quoteDetailsData]);

    // Fetch customers for filter
    const fetchCustomers = async () => {
        try {
            const res = await authUtils.apiRequest('KHTN', 'Find', {});
            return res || [];
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    };

    const { data: quotationsData, error: quotationsError, mutate: refreshQuotations } = useSWR('quotations', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
    });

    const { data: customersData } = useSWR('customers', fetchCustomers, {
        revalidateOnFocus: false,
        dedupingInterval: 3600000, // 1 hour
    });

    // Derived state
    const customers = customersData || [];
    const quotations = quotationsData || [];

    // Apply filters and sorting
    const filteredQuotations = useMemo(() => {
        if (!quotations.length) return [];

        return quotations.filter(quote => {
            // Search filter
            const matchesSearch =
                searchQuery === '' ||
                quote.ID_BBGTH?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                quote.ID_CTY?.toLowerCase().includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus = filterStatus === 'Tất cả' || quote.TRANGTHAI === filterStatus;

            // Customer filter
            const matchesCustomer = selectedCustomer === '' || quote.ID_CTY === selectedCustomer;

            // Date range filter
            const quoteDate = new Date(quote["NGÀY BÁO GIÁ"]);
            const startDateMatch = !dateRange.startDate || quoteDate >= new Date(dateRange.startDate);
            const endDateMatch = !dateRange.endDate || quoteDate <= new Date(dateRange.endDate);

            return matchesSearch && matchesStatus && matchesCustomer && startDateMatch && endDateMatch;
        }).sort((a, b) => {
            // Apply sorting
            const fieldA = a[sortField];
            const fieldB = b[sortField];

            if (typeof fieldA === 'number' && typeof fieldB === 'number') {
                return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
            }

            // Handle date sorting
            if (sortField === "NGÀY BÁO GIÁ" || sortField === "THỜI HẠN BÁO GIÁ") {
                return sortDirection === 'asc'
                    ? new Date(fieldA) - new Date(fieldB)
                    : new Date(fieldB) - new Date(fieldA);
            }

            // Default string sorting
            return sortDirection === 'asc'
                ? String(fieldA).localeCompare(String(fieldB))
                : String(fieldB).localeCompare(String(fieldA));
        });
    }, [quotations, searchQuery, filterStatus, selectedCustomer, dateRange, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredQuotations.length / ITEMS_PER_PAGE);
    const currentQuotations = filteredQuotations.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Event handlers
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterStatus('Tất cả');
        setSelectedCustomer('');
        setDateRange({ startDate: '', endDate: '' });
        setCurrentPage(1);
    };

    const handleDeleteQuotation = async () => {
        if (!quoteToDelete) return;
    
        try {
            setIsLoading(true);
    
            // Then delete quotation header
            await authUtils.apiRequest('PO', 'Delete', { "Rows": [{ ID_BBGTH: quoteToDelete.ID_BBGTH }] });
    
            toast.success('Xóa báo giá thành công');
            
            // Refresh cả hai loại dữ liệu
            refreshQuotations();
            refreshQuoteDetails(); // Thay vì mutate('quotation-details')
            
            setShowDeleteModal(false);
            setQuoteToDelete(null);
        } catch (error) {
            console.error('Error deleting quotation:', error);
            toast.error('Có lỗi xảy ra khi xóa báo giá');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = async (quote) => {
        try {
            setIsLoading(true);
            // Lọc chi tiết từ dữ liệu đã tải
            const details = fetchQuoteDetails(quote.ID_BBGTH);
            setSelectedQuote({
                ...quote,
                details: details
            });
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error preparing quote details:', error);
            toast.error('Không thể tải chi tiết báo giá');
        } finally {
            setIsLoading(false);
        }
    };
    // Get customer name by ID
    const getCustomerName = (customerId) => {
        const customer = customers.find(c => c.ID_CTY === customerId);
        return customer ? customer['TÊN CÔNG TY'] : customerId;
    };

    return (
        <div className="h-[calc(100vh-7rem)] flex flex-col">
            {/* Header */}
            <div className="bg-white p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">Danh Sách Báo Giá</h1>
                    <div className="flex space-x-3">
                        <Link
                            to="/baogiafrom"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center text-sm"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Tạo báo giá mới
                        </Link>
                    </div>
                </div>
            </div>

            {/* Search and filters */}
            <div className="bg-white p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã báo giá, khách hàng..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Bộ lọc</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        <button
                            onClick={refreshQuotations}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Advanced filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="Tất cả">Tất cả</option>
                                    <option value="Chờ xác nhận">Chờ xác nhận</option>
                                    <option value="Đã chấp nhận">Đã chấp nhận</option>
                                    <option value="Đã từ chối">Đã từ chối</option>
                                    <option value="Hết hạn">Hết hạn</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                                <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                >
                                    <option value="">Tất cả khách hàng</option>
                                    {customers.map(customer => (
                                        <option key={customer.ID_CTY} value={customer.ID_CTY}>
                                            {customer['TÊN CÔNG TY']} ({customer['TÊN VIẾT TẮT'] || customer.ID_CTY})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleResetFilters}
                                className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800"
                            >
                                Đặt lại bộ lọc
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quotation list */}
            <div className="flex-1 overflow-auto bg-gray-50 p-6">
                {quotationsError ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-red-500 text-sm mb-2">Lỗi khi tải dữ liệu</div>
                        <button
                            onClick={refreshQuotations}
                            className="px-3 py-1 text-xs bg-indigo-500 text-white rounded-md flex items-center hover:bg-indigo-600"
                        >
                            <RefreshCw className="w-3 h-3 mr-1" /> Thử lại
                        </button>
                    </div>
                ) : !quotationsData ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <p className="text-gray-500 text-xs mt-3">Đang tải dữ liệu...</p>
                    </div>
                ) : filteredQuotations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                        <FileText className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Không tìm thấy báo giá nào</h3>
                        <p className="text-gray-500 mt-1">
                            {searchQuery || filterStatus !== 'Tất cả' || selectedCustomer || dateRange.startDate || dateRange.endDate
                                ? 'Hãy thử thay đổi bộ lọc để xem kết quả khác'
                                : 'Bạn chưa có báo giá nào. Hãy bắt đầu bằng cách tạo báo giá mới.'
                            }
                        </p>
                        {(searchQuery || filterStatus !== 'Tất cả' || selectedCustomer || dateRange.startDate || dateRange.endDate) && (
                            <button
                                onClick={handleResetFilters}
                                className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                                                <button
                                                    className="flex items-center space-x-1"
                                                    onClick={() => handleSort('ID_BBGTH')}
                                                >
                                                    <span>Mã báo giá</span>
                                                    {sortField === 'ID_BBGTH' && (
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button
                                                    className="flex items-center space-x-1"
                                                    onClick={() => handleSort('ID_CTY')}
                                                >
                                                    <span>Khách hàng</span>
                                                    {sortField === 'ID_CTY' && (
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                                                <button
                                                    className="flex items-center space-x-1"
                                                    onClick={() => handleSort('NGÀY BÁO GIÁ')}
                                                >
                                                    <span>Ngày BG</span>
                                                    {sortField === 'NGÀY BÁO GIÁ' && (
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                                                <button
                                                    className="flex items-center space-x-1"
                                                    onClick={() => handleSort('THỜI HẠN BÁO GIÁ')}
                                                >
                                                    <span>Hạn BG</span>
                                                    {sortField === 'THỜI HẠN BÁO GIÁ' && (
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                                <button
                                                    className="flex items-center space-x-1 ml-auto"
                                                    onClick={() => handleSort('TỔNG TIỀN')}
                                                >
                                                    <span>Tổng tiền</span>
                                                    {sortField === 'TỔNG TIỀN' && (
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                                                <button
                                                    className="flex items-center space-x-1 mx-auto"
                                                    onClick={() => handleSort('TRANGTHAI')}
                                                >
                                                    <span>Trạng thái</span>
                                                    {sortField === 'TRANGTHAI' && (
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                                <span>Thao tác</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentQuotations.map((quote) => (
                                            <tr key={quote.ID_BBGTH} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{quote.ID_BBGTH}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-900">{getCustomerName(quote.ID_CTY)}</div>
                                                    <div className="text-xs text-gray-500">{quote.ID_CTY}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatDate(quote["NGÀY BÁO GIÁ"])}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatDate(quote["THỜI HẠN BÁO GIÁ"])}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <div className="text-sm font-medium text-gray-900">{formatCurrency(quote["TỔNG TIỀN"] || 0)}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <StatusBadge status={quote["TRẠNG THÁI"] || 'Chờ xác nhận'} />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(quote)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>


                                                        <button
                                                            onClick={() => {
                                                                setQuoteToDelete(quote);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                            title="Xóa báo giá"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-500">
                                    Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} đến {Math.min(currentPage * ITEMS_PER_PAGE, filteredQuotations.length)} trong tổng số {filteredQuotations.length} báo giá
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Show pagination centered around current page
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`px-3 py-1.5 border rounded-md ${currentPage === pageNum
                                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Xác nhận xóa báo giá</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-red-700">
                                    Bạn có chắc chắn muốn xóa báo giá <span className="font-bold">{quoteToDelete?.ID_BBGTH}</span>?
                                </p>
                                <p className="text-red-600 text-sm mt-1">
                                    Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    disabled={isLoading}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleDeleteQuotation}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Xóa báo giá
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quotation detail modal */}
{showDetailModal && selectedQuote && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        Chi tiết báo giá: {selectedQuote.ID_BBGTH}
                    </h2>
                    <button
                        onClick={() => setShowDetailModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {/* Quotation information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Thông tin chung</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Mã báo giá:</span>
                                    <span className="text-sm font-medium">{selectedQuote.ID_BBGTH}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Ngày báo giá:</span>
                                    <span className="text-sm font-medium">{formatDate(selectedQuote["NGÀY BÁO GIÁ"])}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Hạn báo giá:</span>
                                    <span className="text-sm font-medium">{formatDate(selectedQuote["THỜI HẠN BÁO GIÁ"])}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Trạng thái:</span>
                                    <StatusBadge status={selectedQuote.TRANGTHAI || 'Chờ xác nhận'} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Thông tin khách hàng</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Mã KH:</span>
                                    <span className="text-sm font-medium">{selectedQuote.ID_CTY}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Tên KH:</span>
                                    <span className="text-sm font-medium">{getCustomerName(selectedQuote.ID_CTY)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Thông tin tổng hợp</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Tổng tiền:</span>
                                    <span className="text-sm font-medium">{formatCurrency(selectedQuote["TỔNG TIỀN"] || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">VAT ({selectedQuote["PT VAT"]}%):</span>
                                    <span className="text-sm font-medium">{formatCurrency(selectedQuote["TT VAT"] || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Ưu đãi ({selectedQuote["ƯU ĐÃI"]}%):</span>
                                    <span className="text-sm font-medium text-red-500">-{formatCurrency(selectedQuote["TT ƯU ĐÃI"] || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service details */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Chi tiết dịch vụ</h3>
                        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mã dịch vụ
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tên dịch vụ
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ĐVT
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SL
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Đơn giá
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thành tiền
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            % Ưu đãi
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sau ưu đãi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedQuote.details?.map((detail, index) => (
                                        <tr key={detail.ID_BBGTH_DE || index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{detail.Ma_HHDV}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900">{detail["TÊN HH DV"]}</div>
                                                {detail["CHI TIẾT"] && (
                                                    <div className="text-xs text-gray-500 mt-1">{detail["CHI TIẾT"]}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <div className="text-sm text-gray-900">{detail.DVT}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <div className="text-sm text-gray-900">{detail["SỐ LƯỢNG"]}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="text-sm text-gray-900">{formatCurrency(detail["GIÁ BÁN"])}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-gray-900">{formatCurrency(detail["THÀNH TIỀN"])}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <div className="text-sm text-gray-900">{detail["PT ƯU ĐÃI"]}%</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-gray-900">{formatCurrency(detail["GIÁ TRỊ SAU ƯU ĐÃI"])}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!selectedQuote.details?.length && (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-6 text-center text-gray-500">
                                                Không có dữ liệu chi tiết
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Additional info */}
                    {selectedQuote["GHI CHÚ"] && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Ghi chú</h3>
                            <p className="text-sm text-gray-700">{selectedQuote["GHI CHÚ"]}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                        <Link
                            to={`/quotations/${selectedQuote.ID_BBGTH}/preview`}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center text-sm"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            In báo giá
                        </Link>
                    </div>
                    <button
                        onClick={() => setShowDetailModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

            {/* Toast notifications */}
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

export default QuotationList;