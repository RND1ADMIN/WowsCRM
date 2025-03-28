import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus, Edit, Trash, Search, Filter, X, Upload, ChevronDown, Eye,
    ChevronLeft, ChevronRight, RefreshCw, FileText, Map, Cake
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import authUtils from '../utils/authUtils';

const KHTNManagement = () => {
    // State cho danh sách khách hàng
    const [khtnList, setKhtnList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);

    // State cho form
    const [currentItem, setCurrentItem] = useState({
        'ID_CTY': '',
        'NGÀY GHI NHẬN': '',
        'TÊN CÔNG TY': '',
        'TÊN VIẾT TẮT': '',
        'EMAIL CÔNG TY': '',
        'MST': '',
        'NGÀY THÀNH LẬP CTY': '',
        'ĐỊA CHỈ': '',
        'NGƯỜI LIÊN HỆ': '',
        'SỐ ĐT NGƯỜI LIÊN HỆ': '',
        'EMAIL NGƯỜI LIÊN HỆ': '',
        'SINH NHẬT NGƯỜI LIÊN HỆ': '',
        'CHỨC VỤ': '',
        'NGUỒN': '',
        'TÊN NGƯỜI GIỚI THIỆU': '',
        'SỐ ĐT NGƯỜI GIỚI THIỆU': '',
        'SALES PHỤ TRÁCH': '',
        'CHỐT THÀNH KH': '',
        'NGÀY CHỐT THÀNH KH': '',
        'NHU CẦU': '',
        'GHI CHÚ NHU CẦU': '',
        'ĐÁNH GIÁ TIỂM NĂNG': '',
        'NHÂN VIÊN CHĂM SÓC': '',
        'SỐ CHỨNG TỪ': '',
        'SỐ TIỀN': '',
        'LỊCH SỬ': '',
        'LAT': '',
        'LNG': ''
    });
    const navigate = useNavigate();

    // Add this function to navigate to the details page
    const viewKHTNDetails = (idCty) => {
        navigate(`/khtn/${idCty}`);
    };

    // State cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [isDeleting, setIsDeleting] = useState(false);

    const [loading, setIsExporting] = useState(false);
    const [search, setSearch] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('TẤT CẢ');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    // Then make sure each action has its own loading state:
    const [isExporting, setLoading] = useState(false); // New - for Excel export
    const [isImporting, setIsImporting] = useState(false); // New - for Excel import 
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false); // New - for template download
    const [isRefreshing, setIsRefreshing] = useState(false); // New - for refreshing data
    // State cho dropdown
    const [showNguonDropdown, setShowNguonDropdown] = useState(false);
    const [showTrangThaiDropdown, setShowTrangThaiDropdown] = useState(false);
    const [showDanhGiaDropdown, setShowDanhGiaDropdown] = useState(false);
    const [showNhuCauDropdown, setShowNhuCauDropdown] = useState(false);

    // State cho Excel import
    const [excelData, setExcelData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);
    const staffDropdownRef = useRef(null);
    // Refs
    const nguonDropdownRef = useRef(null);
    const trangThaiDropdownRef = useRef(null);
    const danhGiaDropdownRef = useRef(null);
    const nhuCauDropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    // Options
    const nguonOptions = [
        'Facebook', 'Zalo OA', 'Google Ads', 'Hotline', 'Sales tự tìm',
        'CTV/ Referrals', 'Giới thiệu', 'Hội chợ/ Hội thảo', 'Hiệp hội', 'BGĐ giao', 'Khác'
    ];

    const trangThaiOptions = [
        'Khách hàng tiềm năng', 'Đã thành khách hàng'
    ];

    const danhGiaOptions = [
        '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'
    ];

    const nhuCauOptions = [
        'TCC', '1. Ý tưởng sơ bộ', '2. Đã tìm hiểu một số thông tin',
        '3. Đã có nhiều kiến thức về SP/DV', 'Khác'
    ];

    // Effect hooks
    useEffect(() => {
        // Tải danh sách khách hàng khi component được render
        loadKHTNList();

        // Tải danh sách nhân viên
        loadStaffList();

        // Thiết lập ID công ty mới và ngày ghi nhận là ngày hiện tại
        resetForm();
    }, []);
    const loadStaffList = async () => {
        try {
            const response = await authUtils.apiRequest('DSNV', 'Find', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh",
                    Selector: "Filter(DSNV, true)"
                }
            });

            if (response) {
                setStaffList(response);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách nhân viên:', error);
            toast.error('Không thể tải danh sách nhân viên. Vui lòng thử lại sau.');
        }
    };
    // Cập nhật totalPages khi filteredList hoặc itemsPerPage thay đổi
    useEffect(() => {
        setTotalPages(Math.ceil(filteredList.length / itemsPerPage));
        // Reset về trang 1 khi lọc thay đổi
        setCurrentPage(1);
    }, [filteredList, itemsPerPage]);

    // Xử lý click bên ngoài dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (nguonDropdownRef.current && !nguonDropdownRef.current.contains(event.target)) {
                setShowNguonDropdown(false);
            }
            if (trangThaiDropdownRef.current && !trangThaiDropdownRef.current.contains(event.target)) {
                setShowTrangThaiDropdown(false);
            }
            if (danhGiaDropdownRef.current && !danhGiaDropdownRef.current.contains(event.target)) {
                setShowDanhGiaDropdown(false);
            }
            if (nhuCauDropdownRef.current && !nhuCauDropdownRef.current.contains(event.target)) {
                setShowNhuCauDropdown(false);
            }
            if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target)) {
                setShowStaffDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Helper functions
    const formatDate = (date) => {
        if (!date) return '';

        if (typeof date === 'string') {
            // Nếu đã là chuỗi định dạng yyyy-mm-dd thì trả về
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

            // Nếu là chuỗi khác định dạng, chuyển thành đối tượng Date
            date = new Date(date);
        }

        // Nếu date không hợp lệ
        if (!(date instanceof Date) || isNaN(date)) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const generateIdCty = () => {
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2);
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CTY${year}${month}${day}${random}`;
    };

    // Debounce function
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Update the loadKHTNList function to use isRefreshing instead of loading
    const loadKHTNList = async (forceRefresh = false) => {
        try {
            setIsRefreshing(true);

            const response = await authUtils.apiRequest('KHTN', 'Find', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh",
                    Selector: "Filter(KHTN, true)"
                }
            });

            if (response) {
                setKhtnList(response);
                setFilteredList(response);
            }

            setIsRefreshing(false);
        } catch (error) {
            console.error('Lỗi khi tải danh sách KHTN:', error);
            setIsRefreshing(false);
            toast.error('Không thể tải danh sách khách hàng tiềm năng. Vui lòng thử lại sau.');
        }
    };
    // Sorting
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortedItems = useCallback(() => {
        const sortableItems = [...khtnList];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const keyA = a[sortConfig.key] || '';
                const keyB = b[sortConfig.key] || '';

                if (keyA < keyB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (keyA > keyB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [khtnList, sortConfig]);

    // Hàm chuẩn hóa chuỗi để tìm kiếm không phân biệt dấu
    const normalizeString = (str) => {
        if (!str) return '';

        // Chuyển thành chữ thường
        let result = str.toLowerCase();

        // Loại bỏ dấu tiếng Việt
        result = result
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd');

        return result;
    };

    // Search and filter functions
    const filteredItems = getSortedItems().filter(item => {
        const searchNormalized = normalizeString(search);

        // Nếu search rỗng, không cần kiểm tra điều kiện tìm kiếm
        const matchesSearch = search === '' || (
            normalizeString(item['ID_CTY']).includes(searchNormalized) ||
            normalizeString(item['TÊN CÔNG TY']).includes(searchNormalized) ||
            normalizeString(item['NGƯỜI LIÊN HỆ']).includes(searchNormalized) ||
            normalizeString(item['MST'] || '').includes(searchNormalized) ||
            normalizeString(item['SỐ ĐT NGƯỜI LIÊN HỆ'] || '').includes(searchNormalized)
        );

        const matchesType = filterType === 'TẤT CẢ' || item['NGUỒN'] === filterType;

        return matchesSearch && matchesType;
    });

    // Phân trang
    const getCurrentPageItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredItems.slice(startIndex, endIndex);
    };

    // Get unique sources for filter
    const uniqueSources = [...new Set(khtnList.map(item => item['NGUỒN']).filter(Boolean))];

    // Get sort direction icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    // Reset form
    const resetForm = () => {
        // Lấy thông tin người dùng hiện tại
        const currentUser = authUtils.getUserData();
        const currentUserName = currentUser ? currentUser['Họ và Tên'] : '';

        setCurrentItem({
            'ID_CTY': generateIdCty(),
            'NGÀY GHI NHẬN': formatDate(new Date()),
            'TÊN CÔNG TY': '',
            'TÊN VIẾT TẮT': '',
            'EMAIL CÔNG TY': '',
            'MST': '',
            'NGÀY THÀNH LẬP CTY': '',
            'ĐỊA CHỈ': '',
            'NGƯỜI LIÊN HỆ': '',
            'SỐ ĐT NGƯỜI LIÊN HỆ': '',
            'EMAIL NGƯỜI LIÊN HỆ': '',
            'SINH NHẬT NGƯỜI LIÊN HỆ': '',
            'CHỨC VỤ': '',
            'NGUỒN': '',
            'TÊN NGƯỜI GIỚI THIỆU': '',
            'SỐ ĐT NGƯỜI GIỚI THIỆU': '',
            'SALES PHỤ TRÁCH': currentUserName,
            'CHỐT THÀNH KH': 'Khách hàng tiềm năng',
            'NGÀY CHỐT THÀNH KH': '',
            'NHU CẦU': '',
            'GHI CHÚ NHU CẦU': 'TCC',
            'ĐÁNH GIÁ TIỂM NĂNG': '⭐⭐⭐',
            'NHÂN VIÊN CHĂM SÓC': currentUserName, // Thiết lập mặc định
            'SỐ CHỨNG TỪ': '',
            'SỐ TIỀN': '',
            'LỊCH SỬ': '',
        });
    };


    // Edit KHTN
    const editKHTN = (idCty) => {
        const khtn = khtnList.find(k => k['ID_CTY'] === idCty);

        if (!khtn) {
            toast.error('Không tìm thấy thông tin khách hàng tiềm năng');
            return;
        }

        setIsEditMode(true);
        setCurrentItem({
            'ID_CTY': khtn['ID_CTY'] || '',
            'NGÀY GHI NHẬN': formatDate(khtn['NGÀY GHI NHẬN']),
            'TÊN CÔNG TY': khtn['TÊN CÔNG TY'] || '',
            'TÊN VIẾT TẮT': khtn['TÊN VIẾT TẮT'] || '',
            'EMAIL CÔNG TY': khtn['EMAIL CÔNG TY'] || '',
            'MST': khtn['MST'] || '',
            'NGÀY THÀNH LẬP CTY': formatDate(khtn['NGÀY THÀNH LẬP CTY']),
            'ĐỊA CHỈ': khtn['ĐỊA CHỈ'] || '',
            'NGƯỜI LIÊN HỆ': khtn['NGƯỜI LIÊN HỆ'] || '',
            'SỐ ĐT NGƯỜI LIÊN HỆ': khtn['SỐ ĐT NGƯỜI LIÊN HỆ'] || '',
            'EMAIL NGƯỜI LIÊN HỆ': khtn['EMAIL NGƯỜI LIÊN HỆ'] || '',
            'SINH NHẬT NGƯỜI LIÊN HỆ': formatDate(khtn['SINH NHẬT NGƯỜI LIÊN HỆ']),
            'CHỨC VỤ': khtn['CHỨC VỤ'] || '',
            'NGUỒN': khtn['NGUỒN'] || '',
            'TÊN NGƯỜI GIỚI THIỆU': khtn['TÊN NGƯỜI GIỚI THIỆU'] || '',
            'SỐ ĐT NGƯỜI GIỚI THIỆU': khtn['SỐ ĐT NGƯỜI GIỚI THIỆU'] || '',
            'SALES PHỤ TRÁCH': khtn['SALES PHỤ TRÁCH'] || '',
            'CHỐT THÀNH KH': khtn['CHỐT THÀNH KH'] || 'Chưa',
            'NGÀY CHỐT THÀNH KH': formatDate(khtn['NGÀY CHỐT THÀNH KH']),
            'NHU CẦU': khtn['NHU CẦU'] || '',
            'GHI CHÚ NHU CẦU': khtn['GHI CHÚ NHU CẦU'] || '',
            'ĐÁNH GIÁ TIỂM NĂNG': khtn['ĐÁNH GIÁ TIỂM NĂNG'] || '',
            'NHÂN VIÊN CHĂM SÓC': khtn['NHÂN VIÊN CHĂM SÓC'] || '',
            'SỐ CHỨNG TỪ': khtn['SỐ CHỨNG TỪ'] || '',
            'SỐ TIỀN': khtn['SỐ TIỀN'] || '',
            'LỊCH SỬ': khtn['LỊCH SỬ'] || '',
        });

        setShowModal(true);
    };

    // Delete KHTN
    const deleteKHTN = async () => {
        if (!itemToDelete || isDeleting) return;

        try {
            setIsDeleting(true);

            await authUtils.apiRequest('KHTN', 'Delete', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh"
                },
                Rows: [
                    { 'ID_CTY': itemToDelete['ID_CTY'] }
                ]
            });

            setShowDeleteConfirmation(false);
            setItemToDelete(null);

            toast.success('Khách hàng tiềm năng đã được xóa thành công');

            // Cập nhật lại danh sách
            await loadKHTNList(true);

        } catch (error) {
            console.error('Lỗi khi xóa KHTN:', error);
            toast.error('Không thể xóa khách hàng tiềm năng. Vui lòng thử lại sau.');
        } finally {
            setIsDeleting(false);
        }
    };


    // Save KHTN
    const saveKHTN = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        // Kiểm tra dữ liệu bắt buộc
        const tenCongTy = currentItem['TÊN CÔNG TY'].trim();
        const nguoiLienHe = currentItem['NGƯỜI LIÊN HỆ'].trim();
        const sdtNguoiLienHe = currentItem['SỐ ĐT NGƯỜI LIÊN HỆ'].trim();

        if (!tenCongTy || !nguoiLienHe || !sdtNguoiLienHe) {
            toast.error('Vui lòng điền đầy đủ tên công ty, người liên hệ và số điện thoại');
            return;
        }

        try {
            setIsSubmitting(true);
            setIsExporting(true);

            if (isEditMode) {
                // Edit existing item
                await authUtils.apiRequest('KHTN', 'Edit', {
                    Properties: {
                        Locale: "vi-VN",
                        Timezone: "Asia/Ho_Chi_Minh"
                    },
                    Rows: [currentItem]
                });

                toast.success('Cập nhật thành công!');
            } else {
                // Create new item
                await authUtils.apiRequest('KHTN', 'Add', {
                    Properties: {
                        Locale: "vi-VN",
                        Timezone: "Asia/Ho_Chi_Minh"
                    },
                    Rows: [currentItem]
                });

                toast.success('Thêm mới thành công!');
            }

            // Cập nhật lại danh sách
            await loadKHTNList(true);

            setIsSubmitting(false);
            setIsExporting(false);
            setShowModal(false);

            // Reset form nếu là thêm mới
            if (!isEditMode) {
                resetForm();
            }

        } catch (error) {
            console.error('Lỗi khi lưu KHTN:', error);
            setIsSubmitting(false);
            setIsExporting(false);

            toast.error('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.');
        }
    };

    // Fetch company info
    const fetchCompanyInfo = async (taxCode) => {
        if (!taxCode || taxCode.trim() === '') {
            toast.warning('Vui lòng nhập mã số thuế trước khi tra cứu');
            return;
        }

        setIsExporting(true);

        try {
            const response = await fetch(`https://api.vietqr.io/v2/business/${taxCode}`);
            const data = await response.json();

            if (data && data.code === '00' && data.data) {
                const companyData = data.data;

                setCurrentItem(prev => ({
                    ...prev,
                    'TÊN CÔNG TY': companyData.name || prev['TÊN CÔNG TY'],
                    'TÊN VIẾT TẮT': companyData.shortName || prev['TÊN VIẾT TẮT'],
                    'ĐỊA CHỈ': companyData.address || prev['ĐỊA CHỈ']
                }));

                setIsExporting(false);
                toast.success('Đã cập nhật thông tin công ty từ mã số thuế');
            } else {
                throw new Error('Không tìm thấy thông tin doanh nghiệp');
            }
        } catch (error) {
            console.error('Lỗi khi tra cứu MST:', error);
            setIsExporting(false);

            toast.error('Không thể tìm thấy thông tin doanh nghiệp với mã số thuế này');
        }
    };

    // Excel functions
    const handleExcelFileChange = async (e) => {
        if (e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsExporting(true);

        try {
            const data = await readExcelFile(file);

            if (!data || data.length <= 1) {
                throw new Error('File không chứa dữ liệu hợp lệ');
            }

            // Extract header row
            const headers = data[0];
            const requiredColumns = ['TÊN CÔNG TY', 'NGƯỜI LIÊN HỆ', 'SỐ ĐT NGƯỜI LIÊN HỆ'];

            // Validate required columns
            let missingColumns = [];
            requiredColumns.forEach(col => {
                if (!headers.includes(col)) {
                    missingColumns.push(col);
                }
            });

            if (missingColumns.length > 0) {
                throw new Error(`File thiếu các cột bắt buộc: ${missingColumns.join(', ')}`);
            }

            // Prepare data for preview (up to 5 rows)
            const previewRows = data.slice(1, 6);

            setExcelData({
                headers: headers,
                rows: data.slice(1) // Skip header row
            });

            setShowPreview(true);
            setIsExporting(false);

        } catch (error) {
            console.error('Error reading Excel file:', error);
            setIsExporting(false);

            toast.error(error.message || 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.');

            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const readExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to array of arrays
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = function (error) {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    };

    const importExcelData = async () => {
        if (!excelData || !excelData.rows || excelData.rows.length === 0) {
            toast.error('Không có dữ liệu để nhập');
            return;
        }

        try {
            setIsImporting(true);

            const headers = excelData.headers;
            const rows = excelData.rows;

            // Convert rows to customer objects
            const khtnItems = rows.map(row => {
                // Generate ID for each company
                const idCty = generateIdCty();

                // Create object with all possible fields
                const khtn = {
                    'ID_CTY': idCty
                };

                // Map data from Excel to corresponding fields
                headers.forEach((header, index) => {
                    if (index < row.length) {
                        khtn[header] = row[index] || '';
                    }
                });

                return khtn;
            });

            // Filter out invalid items (must have company name and contact person with phone)
            const validItems = khtnItems.filter(item =>
                item['TÊN CÔNG TY'] &&
                item['NGƯỜI LIÊN HỆ'] &&
                item['SỐ ĐT NGƯỜI LIÊN HỆ']
            );

            if (validItems.length === 0) {
                throw new Error('Không có dữ liệu khách hàng tiềm năng hợp lệ để nhập');
            }

            // Call API to add customers
            await authUtils.apiRequest('KHTN', 'Add', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh"
                },
                Rows: validItems
            });

            // Reset and hide preview
            setShowPreview(false);
            setExcelData(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Reload list
            await loadKHTNList(true);

            setIsImporting(false);

            // Show success message
            toast.success(`Đã nhập ${validItems.length} khách hàng tiềm năng từ file Excel`);

        } catch (error) {
            console.error('Lỗi khi nhập dữ liệu:', error);
            setIsImporting(false);

            toast.error(error.message || 'Không thể nhập dữ liệu khách hàng tiềm năng. Vui lòng thử lại sau.');
        }
    };

    const exportToExcel = () => {
        if (khtnList.length === 0) {
            toast.warning('Không có dữ liệu khách hàng tiềm năng để xuất');
            return;
        }

        setIsExporting(true);


        // Prepare data for export
        setTimeout(() => {
            try {
                const exportData = [
                    ['ID_CTY', 'NGÀY GHI NHẬN', 'TÊN CÔNG TY', 'TÊN VIẾT TẮT', 'EMAIL CÔNG TY', 'MST',
                        'NGÀY THÀNH LẬP CTY', 'ĐỊA CHỈ', 'NGƯỜI LIÊN HỆ', 'SỐ ĐT NGƯỜI LIÊN HỆ', 'EMAIL NGƯỜI LIÊN HỆ',
                        'SINH NHẬT NGƯỜI LIÊN HỆ', 'CHỨC VỤ', 'NGUỒN', 'TÊN NGƯỜI GIỚI THIỆU', 'SỐ ĐT NGƯỜI GIỚI THIỆU',
                        'SALES PHỤ TRÁCH', 'CHỐT THÀNH KH', 'NGÀY CHỐT THÀNH KH', 'NHU CẦU', 'GHI CHÚ NHU CẦU',
                        'ĐÁNH GIÁ TIỂM NĂNG', 'NHÂN VIÊN CHĂM SÓC', 'SỐ CHỨNG TỪ', 'SỐ TIỀN', 'LỊCH SỬ']
                ];

                khtnList.forEach(khtn => {
                    exportData.push([
                        khtn['ID_CTY'] || '',
                        formatDate(khtn['NGÀY GHI NHẬN']),
                        khtn['TÊN CÔNG TY'] || '',
                        khtn['TÊN VIẾT TẮT'] || '',
                        khtn['EMAIL CÔNG TY'] || '',
                        khtn['MST'] || '',
                        formatDate(khtn['NGÀY THÀNH LẬP CTY']),
                        khtn['ĐỊA CHỈ'] || '',
                        khtn['NGƯỜI LIÊN HỆ'] || '',
                        khtn['SỐ ĐT NGƯỜI LIÊN HỆ'] || '',
                        khtn['EMAIL NGƯỜI LIÊN HỆ'] || '',
                        formatDate(khtn['SINH NHẬT NGƯỜI LIÊN HỆ']),
                        khtn['CHỨC VỤ'] || '',
                        khtn['NGUỒN'] || '',
                        khtn['TÊN NGƯỜI GIỚI THIỆU'] || '',
                        khtn['SỐ ĐT NGƯỜI GIỚI THIỆU'] || '',
                        khtn['SALES PHỤ TRÁCH'] || '',
                        khtn['CHỐT THÀNH KH'] || '',
                        formatDate(khtn['NGÀY CHỐT THÀNH KH']),
                        khtn['NHU CẦU'] || '',
                        khtn['GHI CHÚ NHU CẦU'] || '',
                        khtn['ĐÁNH GIÁ TIỂM NĂNG'] || '',
                        khtn['NHÂN VIÊN CHĂM SÓC'] || '',
                        khtn['SỐ CHỨNG TỪ'] || '',
                        khtn['SỐ TIỀN'] || '',
                        khtn['LỊCH SỬ'] || ''
                    ]);
                });

                // Create worksheet with better styling
                const ws = XLSX.utils.aoa_to_sheet(exportData);

                // Set column widths
                const colWidths = [
                    { wch: 15 }, // ID_CTY
                    { wch: 15 }, // NGÀY GHI NHẬN
                    { wch: 30 }, // TÊN CÔNG TY
                    { wch: 15 }, // TÊN VIẾT TẮT
                    { wch: 25 }, // EMAIL CÔNG TY
                    { wch: 15 }, // MST
                    { wch: 15 }, // NGÀY THÀNH LẬP CTY
                    { wch: 40 }, // ĐỊA CHỈ
                    { wch: 20 }, // NGƯỜI LIÊN HỆ
                    { wch: 15 }, // SỐ ĐT NGƯỜI LIÊN HỆ
                    { wch: 25 }, // EMAIL NGƯỜI LIÊN HỆ
                    { wch: 15 }, // SINH NHẬT NGƯỜI LIÊN HỆ
                    { wch: 15 }, // CHỨC VỤ
                    { wch: 15 }, // NGUỒN
                    { wch: 20 }, // TÊN NGƯỜI GIỚI THIỆU
                    { wch: 15 }, // SỐ ĐT NGƯỜI GIỚI THIỆU
                    { wch: 20 }, // SALES PHỤ TRÁCH
                    { wch: 15 }, // CHỐT THÀNH KH
                    { wch: 15 }, // NGÀY CHỐT THÀNH KH
                    { wch: 15 }, // NHU CẦU
                    { wch: 40 }, // GHI CHÚ NHU CẦU
                    { wch: 15 }, // ĐÁNH GIÁ TIỂM NĂNG
                    { wch: 20 }, // NHÂN VIÊN CHĂM SÓC
                    { wch: 15 }, // SỐ CHỨNG TỪ
                    { wch: 15 }, // SỐ TIỀN
                    { wch: 40 }  // LỊCH SỬ
                ];

                ws['!cols'] = colWidths;

                // Create workbook
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Danh sách KHTN");

                // Generate filename with date
                const now = new Date();
                const fileName = `Danh_sach_KHTN_${formatDate(now)}.xlsx`;

                // Export file
                XLSX.writeFile(wb, fileName);

                setIsExporting(false);

                toast.success(`Đã xuất ${khtnList.length} khách hàng tiềm năng ra file Excel`);

            } catch (error) {
                console.error('Lỗi khi xuất dữ liệu:', error);
                setIsExporting(false);

                toast.error('Không thể xuất dữ liệu ra file Excel. Vui lòng thử lại sau.');
            }
        }, 500);
    };

    const createExcelTemplate = () => {
        // Create template data structure

        setIsLoadingTemplate(true);
        try {
            const templateData = [
                // Header row
                ['NGÀY GHI NHẬN', 'TÊN CÔNG TY', 'TÊN VIẾT TẮT', 'EMAIL CÔNG TY', 'MST', 'NGÀY THÀNH LẬP CTY',
                    'ĐỊA CHỈ', 'NGƯỜI LIÊN HỆ', 'SỐ ĐT NGƯỜI LIÊN HỆ', 'EMAIL NGƯỜI LIÊN HỆ', 'SINH NHẬT NGƯỜI LIÊN HỆ',
                    'CHỨC VỤ', 'NGUỒN', 'TÊN NGƯỜI GIỚI THIỆU', 'SỐ ĐT NGƯỜI GIỚI THIỆU', 'SALES PHỤ TRÁCH',
                    'NHU CẦU', 'GHI CHÚ NHU CẦU', 'ĐÁNH GIÁ TIỂM NĂNG'],

                // Example row 1
                [formatDate(new Date()), 'Công ty TNHH ABC', 'ABC', 'contact@abc.com', '0123456789',
                    '2020-01-01', 'Số 123 Đường XYZ, Quận 1, TP. HCM', 'Nguyễn Văn A', '0912345678',
                    'nguyenvana@abc.com', '1985-05-15', 'Giám đốc', 'Website', '', '', 'Nguyễn Thị B',
                    'TCC', 'Khách hàng quan tâm đến sản phẩm X, Y, Z', '⭐⭐'],

                // Example row 2
                [formatDate(new Date()), 'Công ty Cổ phần XYZ', 'XYZ', 'info@xyz.com', '9876543210',
                    '2018-06-10', '456 Đường ABC, Quận 2, TP. HCM', 'Trần Văn C', '0987654321',
                    'tranvanc@xyz.com', '1990-10-20', 'Trưởng phòng', 'Giới thiệu', 'Lê Văn D', '0976543210',
                    'Phạm Thị E', 'TCC', 'Khách hàng cần tư vấn về dịch vụ A, B, C', '⭐']
            ];

            // Create a worksheet with better styling
            const ws = XLSX.utils.aoa_to_sheet(templateData);

            // Set column widths for better visibility
            const colWidths = [
                { wch: 15 }, // NGÀY GHI NHẬN
                { wch: 30 }, // TÊN CÔNG TY
                { wch: 15 }, // TÊN VIẾT TẮT
                { wch: 25 }, // EMAIL CÔNG TY
                { wch: 15 }, // MST
                { wch: 15 }, // NGÀY THÀNH LẬP CTY
                { wch: 40 }, // ĐỊA CHỈ
                { wch: 20 }, // NGƯỜI LIÊN HỆ
                { wch: 15 }, // SỐ ĐT NGƯỜI LIÊN HỆ
                { wch: 25 }, // EMAIL NGƯỜI LIÊN HỆ
                { wch: 15 }, // SINH NHẬT NGƯỜI LIÊN HỆ
                { wch: 15 }, // CHỨC VỤ
                { wch: 15 }, // NGUỒN
                { wch: 20 }, // TÊN NGƯỜI GIỚI THIỆU
                { wch: 15 }, // SỐ ĐT NGƯỜI GIỚI THIỆU
                { wch: 20 }, // SALES PHỤ TRÁCH
                { wch: 15 }, // NHU CẦU
                { wch: 40 }, // GHI CHÚ NHU CẦU
                { wch: 15 }, // ĐÁNH GIÁ TIỂM NĂNG
            ];

            ws['!cols'] = colWidths;

            // Create a workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Mẫu KHTN");

            // Generate Excel file and trigger download
            XLSX.writeFile(wb, "Mau_Nhap_Khach_Hang_Tiem_Nang.xlsx");

            // Show notification
            toast.success('Mẫu nhập khách hàng tiềm năng đã được tải xuống');
            setIsLoadingTemplate(false);
        } catch (error) {
            console.error('Lỗi khi tạo mẫu Excel:', error);
            toast.error('Không thể tạo mẫu Excel. Vui lòng thử lại sau.');
            setIsLoadingTemplate(false);
        }

    };

    // Handle input change
    const handleInputChange = (field, value) => {
        setCurrentItem(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Modal handlers
    const handleOpenModal = (item = null) => {
        if (item) {
            editKHTN(item['ID_CTY']);
        } else {
            setIsEditMode(false);
            resetForm();
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditMode(false);
    };

    // Delete confirmation
    const handleOpenDeleteConfirmation = (item) => {
        setItemToDelete(item);
        setShowDeleteConfirmation(true);
    };

    const handleCloseDeleteConfirmation = () => {
        setShowDeleteConfirmation(false);
        setItemToDelete(null);
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="mx-auto">


                {/* Header and Main Content */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Khách Hàng Tiềm Năng</h1>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                            </button>

                            {/* Thêm nút bản đồ phân bố */}
                            <button
                                onClick={() => navigate('/khtn-map')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Map className="w-4 h-4" />
                                Bản đồ phân bổ
                            </button>

                            {/* Thêm nút bản đồ phân bố */}
                            <button
                                onClick={() => navigate('/khtn-calendar')}
                                className="px-4 py-2 text-white bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Cake className="w-4 h-4" />
                                Lịch sự kiện
                            </button>
                            <button
                                onClick={() => handleOpenModal()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm khách hàng
                            </button>
                        </div>
                    </div>

                    {/* Excel Import Section */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">Nhập dữ liệu từ Excel</h2>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-sm text-gray-600 mb-3">
                                Tải lên file Excel (.xlsx, .xls) có chứa dữ liệu khách hàng tiềm năng. File cần có các cột: TÊN CÔNG TY, NGƯỜI LIÊN HỆ, SỐ ĐT NGƯỜI LIÊN HỆ, v.v.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center shadow-sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" /> Chọn file
                                </button>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleExcelFileChange}
                                />
                                <button
                                    className={`px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition flex items-center shadow-sm ${isLoadingTemplate ? 'opacity-70 cursor-wait' : ''}`}
                                    onClick={createExcelTemplate}
                                    disabled={isLoadingTemplate}
                                >
                                    {isLoadingTemplate ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang tải...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="h-4 w-4 mr-2" /> Tải mẫu nhập
                                        </>
                                    )}
                                </button>
                                <button
                                    className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition flex items-center shadow-sm ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
                                    onClick={exportToExcel}
                                    disabled={isExporting}
                                >
                                    {isExporting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xuất...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="h-4 w-4 mr-2" /> Xuất Excel
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Preview section */}
                        {showPreview && excelData && (
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-800 mb-2">Xem trước dữ liệu (5 dòng đầu tiên):</h3>
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {excelData.headers.map((header, index) => (
                                                    <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {excelData.rows.slice(0, 5).map((row, rowIndex) => (
                                                <tr key={rowIndex} className="hover:bg-gray-50">
                                                    {excelData.headers.map((_, colIndex) => (
                                                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {row[colIndex] || ''}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end space-x-3 mt-4">
                                    <button
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                                        onClick={() => {
                                            setShowPreview(false);
                                            setExcelData(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${isImporting ? 'opacity-70 cursor-wait' : ''}`}
                                        onClick={importExcelData}
                                        disabled={isImporting}
                                    >
                                        {isImporting ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang nhập...
                                            </>
                                        ) : (
                                            <>Nhập dữ liệu</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search and Filter Section */}
                    <div className="mb-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã, tên công ty, người liên hệ..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo nguồn:</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFilterType('TẤT CẢ')}
                                        className={`px-3 py-1.5 rounded-full text-sm ${filterType === 'TẤT CẢ'
                                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        Tất cả
                                    </button>
                                    {uniqueSources.map((source) => (
                                        <button
                                            key={source}
                                            onClick={() => setFilterType(source)}
                                            className={`px-3 py-1.5 rounded-full text-sm ${filterType === source
                                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {source}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tổng số khách hàng tiềm năng</h3>
                            <p className="text-2xl font-bold text-blue-800">{khtnList.length}</p>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Đã chốt thành khách hàng</h3>
                            <p className="text-2xl font-bold text-green-800">
                                {khtnList.filter(item => item['CHỐT THÀNH KH'] === 'Đã thành khách hàng').length}
                            </p>
                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <h3 className="text-sm text-purple-700 mb-1">Số nguồn khách hàng</h3>
                            <p className="text-2xl font-bold text-purple-800">
                                {uniqueSources.length}
                            </p>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-24"
                                        onClick={() => requestSort('ID_CTY')}>
                                        ID {getSortIcon('ID_CTY')}
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-20">
                                        Thao tác
                                    </th>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-60"
                                        onClick={() => requestSort('TÊN CÔNG TY')}>
                                        Tên công ty {getSortIcon('TÊN CÔNG TY')}
                                    </th>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-36"
                                        onClick={() => requestSort('NGƯỜI LIÊN HỆ')}>
                                        Người liên hệ {getSortIcon('NGƯỜI LIÊN HỆ')}
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Số điện thoại
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                                        Trạng thái
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                                        Đánh giá
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Nguồn
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getCurrentPageItems().length > 0 ? (
                                    getCurrentPageItems().map((item) => (
                                        <tr key={item['ID_CTY']} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate">
                                                {item['ID_CTY']}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        onClick={() => viewKHTNDetails(item['ID_CTY'])}
                                                        className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50"
                                                        title="Sửa thông tin"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDeleteConfirmation(item)}
                                                        className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50"
                                                        title="Xóa khách hàng"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900 break-words">
                                                <div className="max-h-16 overflow-y-auto">
                                                    {item['TÊN CÔNG TY']}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item['NGƯỜI LIÊN HỆ'] || '—'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item['SỐ ĐT NGƯỜI LIÊN HỆ'] || '—'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item['CHỐT THÀNH KH'] === 'Đã chốt'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item['CHỐT THÀNH KH'] || 'Chưa'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {item['ĐÁNH GIÁ TIỂM NĂNG'] || 'Chưa đánh giá'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700 truncate max-w-[150px]">
                                                <div className="truncate" title={item['NGUỒN'] || ''}>
                                                    {item['NGUỒN'] || '—'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-6 text-center text-sm text-gray-500">
                                            Không tìm thấy khách hàng tiềm năng nào phù hợp với tiêu chí tìm kiếm
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Section */}
                    {filteredItems.length > 0 && (
                        <div className="mt-5 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-4">
                            <div className="flex items-center mb-4 sm:mb-0">
                                <span className="text-sm text-gray-700 mr-2">Hiển thị</span>
                                <select
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-sm text-gray-700 ml-2">mục mỗi trang</span>
                            </div>

                            <div className="flex items-center">
                                <span className="text-sm text-gray-700 mr-4">
                                    Trang {currentPage} / {totalPages || 1}
                                </span>
                                <nav className="flex space-x-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded-md ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                            }`}
                                    >
                                        Đầu
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded-md ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                            }`}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {/* Page numbers */}
                                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                                        let pageNumber;

                                        // Xác định số trang hiển thị
                                        if (totalPages <= 5) {
                                            // Nếu tổng số trang <= 5, hiển thị tất cả các trang từ 1 đến totalPages
                                            pageNumber = index + 1;
                                        } else if (currentPage <= 3) {
                                            // Hiển thị 5 trang đầu tiên nếu trang hiện tại <= 3
                                            pageNumber = index + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            // Hiển thị 5 trang cuối cùng nếu trang hiện tại gần cuối
                                            pageNumber = totalPages - 4 + index;
                                        } else {
                                            // Hiển thị 2 trang trước và 2 trang sau trang hiện tại
                                            pageNumber = currentPage - 2 + index;
                                        }

                                        // Kiểm tra xem pageNumber có hợp lệ không
                                        if (pageNumber > 0 && pageNumber <= totalPages) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => setCurrentPage(pageNumber)}
                                                    className={`px-3 py-1 rounded-md ${currentPage === pageNumber
                                                        ? 'bg-indigo-600 text-white'
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
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                            }`}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
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
            </div>

            {/* Add/Edit KHTN Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
                    <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center border-b border-gray-200 p-6 sticky top-0 bg-white rounded-t-xl z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? 'Cập nhật khách hàng tiềm năng' : 'Thêm khách hàng tiềm năng mới'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 pt-4 pb-28">
                            <div className="space-y-4">
                                {/* Phần 1: Thông tin công ty */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                                        Thông tin công ty
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ID Công ty
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['ID_CTY']}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                readOnly
                                            />
                                        </div>


                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tên công ty <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['TÊN CÔNG TY']}
                                                onChange={(e) => handleInputChange('TÊN CÔNG TY', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập tên công ty"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tên viết tắt
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['TÊN VIẾT TẮT']}
                                                onChange={(e) => handleInputChange('TÊN VIẾT TẮT', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập tên viết tắt"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email công ty
                                            </label>
                                            <input
                                                type="email"
                                                value={currentItem['EMAIL CÔNG TY']}
                                                onChange={(e) => handleInputChange('EMAIL CÔNG TY', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập email công ty"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mã số thuế
                                            </label>
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    value={currentItem['MST']}
                                                    onChange={(e) => handleInputChange('MST', e.target.value)}
                                                    className="w-full p-2.5 border border-gray-300 rounded-l-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Nhập mã số thuế"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fetchCompanyInfo(currentItem['MST'])}
                                                    className="px-3 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition flex items-center"
                                                    title="Tra cứu thông tin công ty"
                                                >
                                                    <Search className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ngày ghi nhận <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={currentItem['NGÀY GHI NHẬN']}
                                                onChange={(e) => handleInputChange('NGÀY GHI NHẬN', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ngày thành lập
                                            </label>
                                            <input
                                                type="date"
                                                value={currentItem['NGÀY THÀNH LẬP CTY']}
                                                onChange={(e) => handleInputChange('NGÀY THÀNH LẬP CTY', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {/* Trường địa chỉ hiện tại */}
                                            <div className="sm:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Địa chỉ
                                                </label>
                                                <textarea
                                                    value={currentItem['ĐỊA CHỈ']}
                                                    onChange={(e) => handleInputChange('ĐỊA CHỈ', e.target.value)}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg resize-none bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                    rows="2"
                                                    placeholder="Nhập địa chỉ công ty"
                                                ></textarea>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            const address = currentItem['ĐỊA CHỈ'];
                                                            if (!address) {
                                                                toast.warning('Vui lòng nhập địa chỉ trước khi lấy tọa độ');
                                                                return;
                                                            }

                                                            setIsExporting(true);
                                                            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
                                                            const data = await response.json();

                                                            if (data && data.length > 0) {
                                                                handleInputChange('LAT', data[0].lat);
                                                                handleInputChange('LNG', data[0].lon);
                                                                toast.success('Đã lấy tọa độ thành công');
                                                            } else {
                                                                toast.error('Không tìm thấy tọa độ cho địa chỉ này');
                                                            }

                                                            setIsExporting(false);
                                                        } catch (error) {
                                                            console.error('Lỗi khi lấy tọa độ:', error);
                                                            setIsExporting(false);
                                                            toast.error('Không thể lấy tọa độ. Vui lòng thử lại sau.');
                                                        }
                                                    }}
                                                    className="text-sm text-blue-600 hover:underline flex items-center"
                                                >
                                                    <Map className="w-3 h-3 mr-1" /> Lấy tọa độ từ địa chỉ
                                                </button>
                                            </div>
                                            {/* Thêm trường tọa độ */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Vĩ độ (LAT)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={currentItem['LAT']}
                                                    onChange={(e) => handleInputChange('LAT', e.target.value)}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Ví dụ: 10.8231"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Kinh độ (LNG)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={currentItem['LNG']}
                                                    onChange={(e) => handleInputChange('LNG', e.target.value)}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Ví dụ: 106.6297"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Phần 2: Thông tin người liên hệ */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                                        Thông tin người liên hệ
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Người liên hệ <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['NGƯỜI LIÊN HỆ']}
                                                onChange={(e) => handleInputChange('NGƯỜI LIÊN HỆ', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập tên người liên hệ"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                SĐT người liên hệ <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={currentItem['SỐ ĐT NGƯỜI LIÊN HỆ']}
                                                onChange={(e) => handleInputChange('SỐ ĐT NGƯỜI LIÊN HỆ', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập số điện thoại"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email người liên hệ
                                            </label>
                                            <input
                                                type="email"
                                                value={currentItem['EMAIL NGƯỜI LIÊN HỆ']}
                                                onChange={(e) => handleInputChange('EMAIL NGƯỜI LIÊN HỆ', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập email người liên hệ"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Sinh nhật người liên hệ
                                            </label>
                                            <input
                                                type="date"
                                                value={currentItem['SINH NHẬT NGƯỜI LIÊN HỆ']}
                                                onChange={(e) => handleInputChange('SINH NHẬT NGƯỜI LIÊN HỆ', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Chức vụ
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['CHỨC VỤ']}
                                                onChange={(e) => handleInputChange('CHỨC VỤ', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập chức vụ"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Phần 3: Thông tin tiếp cận */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                                        Thông tin tiếp cận
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nguồn
                                            </label>
                                            <div className="relative" ref={nguonDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowNguonDropdown(!showNguonDropdown)}
                                                >
                                                    <span className={currentItem['NGUỒN'] ? '' : 'text-gray-500'}>
                                                        {currentItem['NGUỒN'] || 'Chọn nguồn'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showNguonDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {nguonOptions.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('NGUỒN', option);
                                                                    setShowNguonDropdown(false);
                                                                }}
                                                            >
                                                                {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tên người giới thiệu
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['TÊN NGƯỜI GIỚI THIỆU']}
                                                onChange={(e) => handleInputChange('TÊN NGƯỜI GIỚI THIỆU', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập tên người giới thiệu"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                SĐT người giới thiệu
                                            </label>
                                            <input
                                                type="tel"
                                                value={currentItem['SỐ ĐT NGƯỜI GIỚI THIỆU']}
                                                onChange={(e) => handleInputChange('SỐ ĐT NGƯỜI GIỚI THIỆU', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập số điện thoại người giới thiệu"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Sales phụ trách
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['SALES PHỤ TRÁCH']}
                                                onChange={(e) => handleInputChange('SALES PHỤ TRÁCH', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập tên sales phụ trách"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Chốt thành KH
                                            </label>
                                            <div className="relative" ref={trangThaiDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowTrangThaiDropdown(!showTrangThaiDropdown)}
                                                >
                                                    <span>
                                                        {currentItem['CHỐT THÀNH KH'] || 'Chưa'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showTrangThaiDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {trangThaiOptions.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('CHỐT THÀNH KH', option);
                                                                    setShowTrangThaiDropdown(false);
                                                                }}
                                                            >
                                                                {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ngày chốt thành KH
                                            </label>
                                            <input
                                                type="date"
                                                value={currentItem['NGÀY CHỐT THÀNH KH']}
                                                onChange={(e) => handleInputChange('NGÀY CHỐT THÀNH KH', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Phần 4: Thông tin nhu cầu và đánh giá */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                                        Nhu cầu và đánh giá
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nhu cầu
                                            </label>
                                            <div className="relative" ref={nhuCauDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowNhuCauDropdown(!showNhuCauDropdown)}
                                                >
                                                    <span className={currentItem['NHU CẦU'] ? '' : 'text-gray-500'}>
                                                        {currentItem['NHU CẦU'] || 'Chọn nhu cầu'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showNhuCauDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {nhuCauOptions.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('NHU CẦU', option);
                                                                    setShowNhuCauDropdown(false);
                                                                }}
                                                            >
                                                                {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Đánh giá tiềm năng
                                            </label>
                                            <div className="relative" ref={danhGiaDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowDanhGiaDropdown(!showDanhGiaDropdown)}
                                                >
                                                    <span className={currentItem['ĐÁNH GIÁ TIỂM NĂNG'] ? '' : 'text-gray-500'}>
                                                        {currentItem['ĐÁNH GIÁ TIỂM NĂNG'] || 'Chọn đánh giá'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showDanhGiaDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {danhGiaOptions.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('ĐÁNH GIÁ TIỂM NĂNG', option);
                                                                    setShowDanhGiaDropdown(false);
                                                                }}
                                                            >
                                                                {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nhân viên chăm sóc
                                            </label>
                                            <div className="relative" ref={staffDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                                                >
                                                    <span className={currentItem['NHÂN VIÊN CHĂM SÓC'] ? '' : 'text-gray-500'}>
                                                        {currentItem['NHÂN VIÊN CHĂM SÓC'] || 'Chọn nhân viên chăm sóc'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showStaffDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {staffList.map((staff) => (
                                                            <div
                                                                key={staff['ID_NV']}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('NHÂN VIÊN CHĂM SÓC', staff['Họ và Tên']);
                                                                    setShowStaffDropdown(false);
                                                                }}
                                                            >
                                                                {staff['Họ và Tên']}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Số chứng từ
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['SỐ CHỨNG TỪ']}
                                                onChange={(e) => handleInputChange('SỐ CHỨNG TỪ', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập số chứng từ"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Số tiền
                                            </label>
                                            <input
                                                type="number"
                                                value={currentItem['SỐ TIỀN']}
                                                onChange={(e) => handleInputChange('SỐ TIỀN', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập số tiền"
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ghi chú nhu cầu
                                            </label>
                                            <textarea
                                                value={currentItem['GHI CHÚ NHU CẦU']}
                                                onChange={(e) => handleInputChange('GHI CHÚ NHU CẦU', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg resize-none bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                rows="3"
                                                placeholder="Nhập ghi chú về nhu cầu của khách hàng"
                                            ></textarea>
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Lịch sử
                                            </label>
                                            <textarea
                                                value={currentItem['LỊCH SỬ']}
                                                onChange={(e) => handleInputChange('LỊCH SỬ', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg resize-none bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                rows="3"
                                                placeholder="Nhập lịch sử tiếp xúc với khách hàng"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="border-t border-gray-200 p-6 sticky bottom-0 bg-white rounded-b-xl z-10 shadow-md">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={saveKHTN}
                                    disabled={isSubmitting}
                                    className={`px-5 py-2 bg-indigo-600 text-white rounded-lg ${isSubmitting
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-indigo-700 hover:shadow-md'
                                        } flex items-center gap-2 transition-all`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            Lưu khách hàng
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && itemToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
                            <h2 className="text-xl font-bold text-gray-800">Xác nhận xóa</h2>
                            <button
                                onClick={handleCloseDeleteConfirmation}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                <p className="text-red-700">
                                    Bạn có chắc chắn muốn xóa khách hàng tiềm năng <span className="font-bold">{itemToDelete['TÊN CÔNG TY']}</span>?
                                </p>
                                <p className="text-sm text-red-600 mt-2">
                                    Hành động này không thể hoàn tác và có thể ảnh hưởng đến các dữ liệu liên quan.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleCloseDeleteConfirmation}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={deleteKHTN}
                                    disabled={isDeleting}
                                    className={`px-4 py-2 bg-red-600 text-white rounded-lg ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                                        } flex items-center gap-2 transition-colors shadow-sm`}
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xóa...
                                        </>
                                    ) : (
                                        <>
                                            <Trash className="h-4 w-4" />
                                            Xóa khách hàng
                                        </>
                                    )}
                                </button>
                            </div>
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

export default KHTNManagement;