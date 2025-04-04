import React, { useState, useEffect, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Search, Filter, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import authUtils from '../utils/authUtils';

const FinancialPlanningView = () => {
    // Primary state
    const [planningData, setPlanningData] = useState([]);
    const [detailData, setDetailData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtering state
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal state
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailActiveTab, setDetailActiveTab] = useState('mang');
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // All detail data cache to avoid multiple API calls
    const [detailDataCache, setDetailDataCache] = useState({});

    // Format currency helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Fetch all planning data on mount
    useEffect(() => {
        fetchPlanningData();
    }, []);

    // Fetch all detail data on mount to cache it
    useEffect(() => {
        if (planningData.length > 0) {
            fetchAllDetailData();
        }
    }, [planningData]);

    // Memoized filtered data
    const filteredData = useMemo(() => {
        return planningData.filter(plan => {
            const yearMatch = yearFilter === 'all' || plan["Năm Phân Bổ"]?.toString() === yearFilter;
            const searchLower = search.toLowerCase();
            const searchMatch = search === '' || plan["Năm Phân Bổ"]?.toString().includes(searchLower);
            return yearMatch && searchMatch;
        });
    }, [planningData, yearFilter, search]);

    // Memoized total pages
    const totalPages = useMemo(() => {
        return Math.ceil(filteredData.length / itemsPerPage);
    }, [filteredData, itemsPerPage]);

    // Memoized current page data
    const currentPageData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, itemsPerPage]);

    // Memoized unique years
    const uniqueYears = useMemo(() => {
        return [...new Set(planningData.map(item => item["Năm Phân Bổ"]))];
    }, [planningData]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, yearFilter, itemsPerPage]);

    // Fetch all planning data
    const fetchPlanningData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await authUtils.apiRequest_HIEU_XUAT('FormPhanbo', 'Find', {});

            if (Array.isArray(response)) {
                // Sort by year (newest first)
                const sortedData = response.sort((a, b) =>
                    parseInt(b["Năm Phân Bổ"] || 0) - parseInt(a["Năm Phân Bổ"] || 0)
                );

                setPlanningData(sortedData);

                // Set default filter to current year if available
                const years = [...new Set(sortedData.map(item => item["Năm Phân Bổ"]))];
                const currentYear = new Date().getFullYear().toString();
                if (years.includes(currentYear)) {
                    setYearFilter(currentYear);
                }
            } else {
                throw new Error('Dữ liệu không hợp lệ');
            }
        } catch (error) {
            console.error('Error fetching planning data:', error);
            setError('Không thể tải dữ liệu phân bổ tài chính');
            toast.error('Lỗi khi tải dữ liệu: ' + (error.message || 'Không xác định'));
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch ALL detail data at once and cache it by year
    const fetchAllDetailData = async () => {
        try {
            const years = [...new Set(planningData.map(item => item["Năm Phân Bổ"]))];
            const cache = {};

            // Create a batch promise to fetch all detail data
            const promises = years.map(async (year) => {
                const response = await authUtils.apiRequest_HIEU_XUAT('PHANBODT', 'Find', {
                    Properties: {
                        Selector: `Filter(PHANBODT, [Năm phân bổ] = "${year}")`
                    }
                });

                if (Array.isArray(response)) {
                    cache[year] = response;
                }
                return { year, response };
            });

            // Wait for all promises to resolve
            await Promise.all(promises);

            // Set the cache
            setDetailDataCache(cache);
        } catch (error) {
            console.error('Error fetching all detail data:', error);
            toast.error('Lỗi khi tải dữ liệu chi tiết: ' + (error.message || 'Không xác định'));
        }
    };

    // Load detail data from cache or fetch if needed
    const loadDetailData = async (year) => {
        setIsLoadingDetail(true);

        try {
            // If we have cached data for this year, use it
            if (detailDataCache[year]) {
                setDetailData(detailDataCache[year]);
                setIsLoadingDetail(false);
                return;
            }

            // Otherwise fetch it
            const response = await authUtils.apiRequest_HIEU_XUAT('PHANBODT', 'Find', {
                Properties: {
                    Selector: `Filter(PHANBODT, [Năm phân bổ] = "${year}")`
                }
            });

            if (Array.isArray(response)) {
                setDetailData(response);

                // Update cache
                setDetailDataCache(prev => ({
                    ...prev,
                    [year]: response
                }));
            } else {
                throw new Error('Dữ liệu chi tiết không hợp lệ');
            }
        } catch (error) {
            console.error('Error loading detail data:', error);
            toast.error('Lỗi khi tải dữ liệu chi tiết: ' + (error.message || 'Không xác định'));
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // View detail handler
    const handleViewDetail = (plan) => {
        setSelectedPlan(plan);
        loadDetailData(plan["Năm Phân Bổ"]);
        setShowDetailModal(true);
    };

    // Filter detail data by type
    const getFilteredDetailData = (type) => {
        return detailData.filter(item => item["Loại Phân Bổ"] === `Phân bổ doanh thu theo ${type}`);
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
    };

    return (
        <div className="bg-gradient-to-r min-h-screen p-4 py-8">
            <div className="bg-white rounded-xl shadow-xl p-8 w-full mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-blue-700">Danh sách Kế hoạch Phân bổ Tài chính</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Filter className="w-4 h-4" />
                            {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                        </button>
                        <a
                            href="/PhanBoDT"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <BarChart2 className="w-4 h-4" />
                            Thêm kế hoạch mới
                        </a>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mb-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo năm..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {showFilters && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo năm:</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setYearFilter('all')}
                                    className={`px-3 py-1.5 rounded-full text-sm ${yearFilter === 'all'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                {uniqueYears.map((year) => (
                                    <button
                                        key={year}
                                        onClick={() => setYearFilter(year)}
                                        className={`px-3 py-1.5 rounded-full text-sm ${yearFilter === year
                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main content */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
                        {error}
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-8 rounded-lg text-center">
                        <p className="text-lg">Không tìm thấy dữ liệu phân bổ tài chính nào.</p>
                        <p className="mt-2">
                            Hãy <a href="/PhanBoDT" className="text-blue-600 underline">tạo kế hoạch mới</a> để bắt đầu.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                        Năm
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tổng số tiền
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quý 1
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quý 2
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quý 3
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quý 4
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentPageData.map((plan, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                            {plan["Năm Phân Bổ"]}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            {formatCurrency(plan["Số tiền"] || 0)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            <div className="flex items-center">
                                                <div className="h-2 w-full bg-gray-200 rounded-full mr-2">
                                                    <div
                                                        className="h-2 bg-blue-500 rounded-full"
                                                        style={{ width: `${(plan["Quý 1"] || 0) * 100}%` }}
                                                    ></div>
                                                </div>
                                                {((plan["Quý 1"] || 0) * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatCurrency((plan["Số tiền"] || 0) * (plan["Quý 1"] || 0))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            <div className="flex items-center">
                                                <div className="h-2 w-full bg-gray-200 rounded-full mr-2">
                                                    <div
                                                        className="h-2 bg-green-500 rounded-full"
                                                        style={{ width: `${(plan["Quý 2"] || 0) * 100}%` }}
                                                    ></div>
                                                </div>
                                                {((plan["Quý 2"] || 0) * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatCurrency((plan["Số tiền"] || 0) * (plan["Quý 2"] || 0))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            <div className="flex items-center">
                                                <div className="h-2 w-full bg-gray-200 rounded-full mr-2">
                                                    <div
                                                        className="h-2 bg-yellow-500 rounded-full"
                                                        style={{ width: `${(plan["Quý 3"] || 0) * 100}%` }}
                                                    ></div>
                                                </div>
                                                {((plan["Quý 3"] || 0) * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatCurrency((plan["Số tiền"] || 0) * (plan["Quý 3"] || 0))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            <div className="flex items-center">
                                                <div className="h-2 w-full bg-gray-200 rounded-full mr-2">
                                                    <div
                                                        className="h-2 bg-purple-500 rounded-full"
                                                        style={{ width: `${(plan["Quý 4"] || 0) * 100}%` }}
                                                    ></div>
                                                </div>
                                                {((plan["Quý 4"] || 0) * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatCurrency((plan["Số tiền"] || 0) * (plan["Quý 4"] || 0))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-center">
                                            <button
                                                onClick={() => handleViewDetail(plan)}
                                                className="inline-flex items-center px-3 py-1.5 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition-colors"
                                            >
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && !error && filteredData.length > 0 && (
                    <div className="mt-5 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-4">
                        <div className="flex items-center mb-4 sm:mb-0">
                            <span className="text-sm text-gray-700 mr-2">Hiển thị</span>
                            <select
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-700 ml-2">mục mỗi trang</span>
                        </div>

                        <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-4">
                                Trang {currentPage} / {totalPages || 1}
                            </span>
                            <nav className="flex space-x-1">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                >
                                    Đầu
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNumber;

                                    if (totalPages <= 5) {
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + i;
                                    } else {
                                        pageNumber = currentPage - 2 + i;
                                    }

                                    if (pageNumber > 0 && pageNumber <= totalPages) {
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => handlePageChange(pageNumber)}
                                                className={`px-3 py-1 rounded-md ${currentPage === pageNumber
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                    }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                >
                                    Cuối
                                </button>
                            </nav>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center border-b border-gray-200 p-6 sticky top-0 bg-white rounded-t-xl z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                Chi tiết phân bổ tài chính năm {selectedPlan["Năm Phân Bổ"]}
                            </h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {isLoadingDetail ? (
                                <div className="flex justify-center items-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Overview */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Thông tin tổng quan</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Tổng số tiền:</p>
                                                <p className="font-semibold text-gray-800">
                                                    {formatCurrency(selectedPlan["Số tiền"] || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Quý 1:</p>
                                                <p className="font-semibold text-gray-800">
                                                    {((selectedPlan["Quý 1"] || 0) * 100).toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Quý 2:</p>
                                                <p className="font-semibold text-gray-800">
                                                    {((selectedPlan["Quý 2"] || 0) * 100).toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Quý 3:</p>
                                                <p className="font-semibold text-gray-800">
                                                    {((selectedPlan["Quý 3"] || 0) * 100).toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Quý 4:</p>
                                                <p className="font-semibold text-gray-800">
                                                    {((selectedPlan["Quý 4"] || 0) * 100).toFixed(2)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly allocation */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Phân bổ theo tháng</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[...Array(12)].map((_, i) => (
                                                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm text-gray-600">Tháng {i + 1}:</p>
                                                    <p className="font-semibold text-gray-800">
                                                        {((selectedPlan[`Tháng ${i + 1}`] || 0) * 100).toFixed(2)}%
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatCurrency((selectedPlan["Số tiền"] || 0) * (selectedPlan[`Tháng ${i + 1}`] || 0))}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Detail Tabs */}
                                    <div className="mt-6">
                                        <div className="border-b border-gray-200">
                                            <nav className="-mb-px flex">
                                                <button
                                                    className={`tab-button bg-white inline-block p-4 text-blue-600 hover:text-blue-800 font-medium ${detailActiveTab === 'mang' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                                                        }`}
                                                    onClick={() => setDetailActiveTab('mang')}
                                                >
                                                    Phân bổ theo mảng
                                                </button>
                                                <button
                                                    className={`tab-button bg-white inline-block p-4 text-blue-600 hover:text-blue-800 font-medium ${detailActiveTab === 'nhanvien' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                                                        }`}
                                                    onClick={() => setDetailActiveTab('nhanvien')}
                                                >
                                                    Phân bổ theo nhân viên
                                                </button>
                                                <button
                                                    className={`tab-button bg-white inline-block p-4 text-blue-600 hover:text-blue-800 font-medium ${detailActiveTab === 'nguon' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                                                        }`}
                                                    onClick={() => setDetailActiveTab('nguon')}
                                                >
                                                    Phân bổ theo nguồn
                                                </button>
                                            </nav>
                                        </div>

                                        <div className="mt-4">
                                            {/* Tab Content - MẢNG */}
                                            <div className={detailActiveTab === 'mang' ? 'block' : 'hidden'}>
                                                {/* Tổng quan theo năm và quý */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                                                    <h4 className="font-medium text-gray-800 mb-4">Tổng quan phân bổ theo mảng</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%Năm</th>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền năm</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 1</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 2</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 3</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 4</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q1</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q2</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q3</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q4</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('mảng').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {((item['%Năm'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {formatCurrency(item['Số tiền năm'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 1'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 2'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 3'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 4'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 1'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 2'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 3'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 4'] || 0)}
                                                                        </td>
                                                                    </tr>
                                                                ))}

                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {(getFilteredDetailData('mảng')
                                                                            .reduce((sum, item) => sum + (item['%Năm'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('mảng')
                                                                                .reduce((sum, item) => sum + (item['Số tiền năm'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('mảng')
                                                                            .reduce((sum, item) => sum + (item['%Quý 1'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('mảng')
                                                                            .reduce((sum, item) => sum + (item['%Quý 2'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('mảng')
                                                                            .reduce((sum, item) => sum + (item['%Quý 3'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('mảng')
                                                                            .reduce((sum, item) => sum + (item['%Quý 4'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('mảng')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 1'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('mảng')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 2'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('mảng')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 3'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('mảng')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 4'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Chi tiết theo tháng (phần trăm) */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                                    <h4 className="font-medium text-gray-800 mb-4">Phân bổ phần trăm theo tháng</h4>

                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            %Tháng {i + 1}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('mảng').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        {[...Array(12)].map((_, i) => (
                                                                            <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                                {((item[`%Tháng ${i + 1}`] || 0) * 100).toFixed(2)}%
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                            {(getFilteredDetailData('mảng')
                                                                                .reduce((sum, item) => sum + (item[`%Tháng ${i + 1}`] || 0), 0) * 100)
                                                                                .toFixed(2)}%
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Chi tiết theo tháng (số tiền) */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                                    <h4 className="font-medium text-gray-800 mb-4">Phân bổ số tiền theo tháng</h4>

                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Tháng {i + 1}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('mảng').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        {[...Array(12)].map((_, i) => (
                                                                            <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                                {formatCurrency(item[`Số tiền tháng ${i + 1}`] || 0)}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}

                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                            {formatCurrency(
                                                                                getFilteredDetailData('mảng')
                                                                                    .reduce((sum, item) => sum + (item[`Số tiền tháng ${i + 1}`] || 0), 0)
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tab Content - NHÂN VIÊN */}
                                            <div className={detailActiveTab === 'nhanvien' ? 'block' : 'hidden'}>
                                                {/* Tổng quan theo năm và quý */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                                                    <h4 className="font-medium text-gray-800 mb-4">Tổng quan phân bổ theo nhân viên</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%Năm</th>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền năm</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 1</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 2</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 3</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 4</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q1</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q2</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q3</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q4</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('nhân viên').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {((item['%Năm'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {formatCurrency(item['Số tiền năm'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 1'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 2'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 3'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 4'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 1'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 2'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 3'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 4'] || 0)}
                                                                        </td>
                                                                    </tr>
                                                                ))}

                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {(getFilteredDetailData('nhân viên')
                                                                            .reduce((sum, item) => sum + (item['%Năm'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nhân viên')
                                                                                .reduce((sum, item) => sum + (item['Số tiền năm'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('nhân viên')
                                                                            .reduce((sum, item) => sum + (item['%Quý 1'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('nhân viên')
                                                                            .reduce((sum, item) => sum + (item['%Quý 2'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('nhân viên')
                                                                            .reduce((sum, item) => sum + (item['%Quý 3'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('nhân viên')
                                                                            .reduce((sum, item) => sum + (item['%Quý 4'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nhân viên')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 1'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nhân viên')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 2'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nhân viên')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 3'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nhân viên')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 4'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Chi tiết theo tháng (phần trăm) */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                                    <h4 className="font-medium text-gray-800 mb-4">Phân bổ phần trăm theo tháng</h4>

                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            %Tháng {i + 1}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('nhân viên').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        {[...Array(12)].map((_, i) => (
                                                                            <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                                {((item[`%Tháng ${i + 1}`] || 0) * 100).toFixed(2)}%
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                            {(getFilteredDetailData('nhân viên')
                                                                                .reduce((sum, item) => sum + (item[`%Tháng ${i + 1}`] || 0), 0) * 100)
                                                                                .toFixed(2)}%
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Chi tiết theo tháng (số tiền) */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                                    <h4 className="font-medium text-gray-800 mb-4">Phân bổ số tiền theo tháng</h4>

                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Tháng {i + 1}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('nhân viên').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        {[...Array(12)].map((_, i) => (
                                                                            <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                                {formatCurrency(item[`Số tiền tháng ${i + 1}`] || 0)}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}

                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                            {formatCurrency(
                                                                                getFilteredDetailData('nhân viên')
                                                                                    .reduce((sum, item) => sum + (item[`Số tiền tháng ${i + 1}`] || 0), 0)
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tab Content - NGUỒN */}
                                            <div className={detailActiveTab === 'nguon' ? 'block' : 'hidden'}>
                                                {/* Tổng quan theo năm và quý */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                                                    <h4 className="font-medium text-gray-800 mb-4">Tổng quan phân bổ theo nguồn</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%Năm</th>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền năm</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 1</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 2</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 3</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%Quý 4</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q1</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q2</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q3</th>
                                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền Q4</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('nguồn').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {((item['%Năm'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {formatCurrency(item['Số tiền năm'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 1'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 2'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 3'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {((item['%Quý 4'] || 0) * 100).toFixed(2)}%
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 1'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 2'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 3'] || 0)}
                                                                        </td>
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                            {formatCurrency(item['Số tiền quý 4'] || 0)}
                                                                        </td>
                                                                    </tr>
                                                                ))}

                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {(getFilteredDetailData('nguồn')
                                                                            .reduce((sum, item) => sum + (item['%Năm'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nguồn')
                                                                                .reduce((sum, item) => sum + (item['Số tiền năm'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('nguồn')
                                                                            .reduce((sum, item) => sum + (item['%Quý 1'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('nguồn')
                                                                            .reduce((sum, item) => sum + (item['%Quý 2'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('nguồn')
                                                                            .reduce((sum, item) => sum + (item['%Quý 3'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {(getFilteredDetailData('nguồn')
                                                                            .reduce((sum, item) => sum + (item['%Quý 4'] || 0), 0) * 100)
                                                                            .toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nguồn')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 1'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nguồn')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 2'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nguồn')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 3'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {formatCurrency(
                                                                            getFilteredDetailData('nguồn')
                                                                                .reduce((sum, item) => sum + (item['Số tiền quý 4'] || 0), 0)
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Chi tiết theo tháng (phần trăm) */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                                    <h4 className="font-medium text-gray-800 mb-4">Phân bổ phần trăm theo tháng</h4>

                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            %Tháng {i + 1}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('nguồn').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        {[...Array(12)].map((_, i) => (
                                                                            <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                                {((item[`%Tháng ${i + 1}`] || 0) * 100).toFixed(2)}%
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                            {(getFilteredDetailData('nguồn')
                                                                                .reduce((sum, item) => sum + (item[`%Tháng ${i + 1}`] || 0), 0) * 100)
                                                                                .toFixed(2)}%
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Chi tiết theo tháng (số tiền) */}
                                                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                                    <h4 className="font-medium text-gray-800 mb-4">Phân bổ số tiền theo tháng</h4>

                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Tháng {i + 1}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {getFilteredDetailData('nguồn').map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {item['Chi Tiết']}
                                                                        </td>
                                                                        {[...Array(12)].map((_, i) => (
                                                                            <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                                                                {formatCurrency(item[`Số tiền tháng ${i + 1}`] || 0)}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}

                                                                {/* Total row */}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        Tổng cộng
                                                                    </td>
                                                                    {[...Array(12)].map((_, i) => (
                                                                        <td key={i} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                            {formatCurrency(
                                                                                getFilteredDetailData('nguồn')
                                                                                    .reduce((sum, item) => sum + (item[`Số tiền tháng ${i + 1}`] || 0), 0)
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Allocation Chart */}
                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Biểu đồ phân bổ theo tháng</h3>
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="space-y-3">
                                                {[...Array(12)].map((_, i) => {
                                                    const percentage = (selectedPlan[`Tháng ${i + 1}`] || 0) * 100;

                                                    return (
                                                        <div key={i} className="flex items-center">
                                                            <span className="w-16 text-sm text-gray-600">Tháng {i + 1}:</span>
                                                            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full flex items-center ${i < 3 ? 'bg-blue-500' :
                                                                        i < 6 ? 'bg-green-500' :
                                                                            i < 9 ? 'bg-yellow-500' :
                                                                                'bg-purple-500'
                                                                        }`}
                                                                    style={{ width: `${percentage}%` }}
                                                                >
                                                                    {percentage >= 5 && (
                                                                        <span className="ml-2 text-xs text-white font-medium">
                                                                            {percentage.toFixed(1)}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {percentage < 5 && (
                                                                <span className="ml-2 text-xs text-gray-600 font-medium w-12">
                                                                    {percentage.toFixed(1)}%
                                                                </span>
                                                            )}
                                                            <span className="ml-2 text-xs text-gray-500 w-24">
                                                                {formatCurrency((selectedPlan["Số tiền"] || 0) * (selectedPlan[`Tháng ${i + 1}`] || 0))}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 p-4 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

export default FinancialPlanningView;