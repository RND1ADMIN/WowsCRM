import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Edit, Trash, Search, Filter, X, Calendar, ChevronDown, Eye, Upload,
    ChevronLeft, ChevronRight, RefreshCw, MapPin, Image, Activity, Users
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';

const CSKHManagement = () => {
    const { idCty } = useParams(); // Get ID_CTY from URL if available
    const [cskhList, setCskhList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [khtnList, setKhtnList] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentItem, setCurrentItem] = useState({
        'ID KH_CSKH': '',
        'ID_CTY': idCty || '',
        'PHÂN LOẠI KH': '',
        'LOẠI CHĂM SÓC': '',
        'NGÀY DỰ KIẾN': '',
        'HÌNH THỨC': '',
        'ĐỊA ĐIỂM': '',
        'NGÀY CHĂM THỰC TẾ': '',
        'NGƯỜI CHĂM SÓC': '',
        'HÌNH ẢNH': null,
        'DỊCH VỤ QUAN TÂM': '',
        'NỘI DUNG TRAO ĐỔI': '',
        'GHI CHÚ NHU CẦU': '',
        'TRẠNG THÁI KH': '',
        'DỰ KIẾN HOÀN THÀNH': ''
    });
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();
    const dropZoneRef = useRef(null);
    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // State for filters, search, and sorting
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('TẤT CẢ');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // State for UI
    const [isEditMode, setIsEditMode] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // State for loading indicators
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // State for dropdown selectors
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showCareTypeDropdown, setShowCareTypeDropdown] = useState(false);
    const [showMethodDropdown, setShowMethodDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [companySearchTerm, setCompanySearchTerm] = useState('');

    // Refs for handling outside clicks
    const companyDropdownRef = useRef(null);
    const typeDropdownRef = useRef(null);
    const careTypeDropdownRef = useRef(null);
    const methodDropdownRef = useRef(null);
    const statusDropdownRef = useRef(null);
    const staffDropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    // Options for dropdowns
    const typeOptions = [
        'Khách mới', 'Khách đang giao dịch', 'Khách tiềm năng mới', 'Khách cũ'
    ];

    const careTypeOptions = [
        '1. Telesale', '2. Gửi tài liệu', '3. Gửi Báo giá', '4. Gặp tư vấn offline', '5. Gửi hợp đồng đã chốt', '6. Ký kết HĐ offline',
        '7. Gặp xử lý khiếu nại', '8. Gặp thu hồi nợ', '9. Ngưng chăm sóc', '10. Tư vấn theo HĐ tại DN'
    ];

    const methodOptions = [
        'Gặp mặt trực tiếp', 'Gọi điện thoại', 'Email', 'Tin nhắn', 'Quà tặng',
        'Tiệc/Sự kiện', 'Khảo sát', 'Hội thảo', 'Khác'
    ];

    const statusOptions = [
        'Đã lên kế hoạch', 'Đang thực hiện', 'Hoàn thành', 'Hoãn lại', 'Hủy bỏ', 'Đang chờ'
    ];

    // Effect hooks
    useEffect(() => {
        loadCSKHList();
        loadKHTNList();
        loadStaffList();
        generateId();
    }, [idCty]);

    useEffect(() => {
        const sortedAndFiltered = getSortedAndFilteredItems();
        setFilteredList(sortedAndFiltered);
        setTotalPages(Math.ceil(sortedAndFiltered.length / itemsPerPage));
    }, [cskhList, search, filterType, sortConfig, idCty, itemsPerPage]);
    // Then modify getCurrentPageItems to not update state
    const getCurrentPageItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredList.slice(startIndex, endIndex);
    };

    // Handle outside clicks for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setShowCompanyDropdown(false);
            }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
                setShowTypeDropdown(false);
            }
            if (careTypeDropdownRef.current && !careTypeDropdownRef.current.contains(event.target)) {
                setShowCareTypeDropdown(false);
            }
            if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target)) {
                setShowMethodDropdown(false);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setShowStatusDropdown(false);
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
    // Add this useEffect near your other useEffect hooks
    useEffect(() => {
        // If we have an idCskh in the URL, open the edit modal for that item
        const params = new URLSearchParams(window.location.search);
        const idCskh = params.get('idCskh');
        const idCtyFromQuery = params.get('idCty');

        if (idCskh) {
            const cskh = cskhList.find(k => k['ID KH_CSKH'] === idCskh);
            if (cskh) {
                editCSKH(idCskh);
            }
        }
        else if (idCtyFromQuery || idCty) {
            setCurrentItem(prevItem => ({
                ...prevItem,
                'ID_CTY': idCtyFromQuery || idCty
            }));
            handleOpenModal();
        }
    }, [cskhList, idCty]);// Add cskhList as dependency so this runs after data is loaded
    // Helper function to format dates
    const formatDate = (date) => {
        if (!date) return '';

        if (typeof date === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
            date = new Date(date);
        }

        if (!(date instanceof Date) || isNaN(date)) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // Generate unique ID 
    const generateId = () => {
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2);
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        return `CSKH${year}${month}${day}${random}`;
    };

    // Load data functions
    const loadCSKHList = async () => {
        try {
            setIsLoading(true);

            const response = await authUtils.apiRequest('CSKH', 'Find', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh",
                    Selector: "Filter(CSKH, true)"
                }
            });

            if (response) {
                setCskhList(response);

                // If we have an idCty from params, filter by that company
                if (idCty) {
                    const filtered = response.filter(item => item['ID_CTY'] === idCty);
                    setFilteredList(filtered);
                } else {
                    setFilteredList(response);
                }
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Lỗi khi tải danh sách CSKH:', error);
            setIsLoading(false);
            toast.error('Không thể tải danh sách chăm sóc khách hàng. Vui lòng thử lại sau.');
        }
    };

    const loadKHTNList = async () => {
        try {
            const response = await authUtils.apiRequest('KHTN', 'Find', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh",
                    Selector: "Filter(KHTN, true)"
                }
            });

            if (response) {
                setKhtnList(response);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách KHTN:', error);
            toast.error('Không thể tải danh sách khách hàng. Vui lòng thử lại sau.');
        }
    };

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

    // Sorting function
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Normalize text for searching
    const normalizeString = (str) => {
        if (!str) return '';

        let result = str.toLowerCase();
        result = result
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd');

        return result;
    };

    // Get company name by ID
    const getCompanyName = (idCty) => {
        const company = khtnList.find(item => item['ID_CTY'] === idCty);
        return company ? company['TÊN CÔNG TY'] : 'Không xác định';
    };

    // Filter and sort items
    const getSortedAndFilteredItems = () => {
        const searchNormalized = normalizeString(search);

        // Filter by search term and type
        const filtered = cskhList.filter(item => {
            // Filter by ID_CTY if provided in URL
            if (idCty && item['ID_CTY'] !== idCty) {
                return false;
            }

            // Filter by search term
            const matchesSearch = search === '' || (
                normalizeString(item['ID KH_CSKH']).includes(searchNormalized) ||
                normalizeString(getCompanyName(item['ID_CTY'])).includes(searchNormalized) ||
                normalizeString(item['PHÂN LOẠI KH'] || '').includes(searchNormalized) ||
                normalizeString(item['LOẠI CHĂM SÓC'] || '').includes(searchNormalized) ||
                normalizeString(item['NGƯỜI CHĂM SÓC'] || '').includes(searchNormalized)
            );

            // Filter by type
            const matchesType = filterType === 'TẤT CẢ' || item['PHÂN LOẠI KH'] === filterType;

            return matchesSearch && matchesType;
        });

        // Sort filtered items
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Special case for company name (referenced by ID)
                if (sortConfig.key === 'ID_CTY') {
                    aValue = getCompanyName(a[sortConfig.key]);
                    bValue = getCompanyName(b[sortConfig.key]);
                }

                // Handle null values
                if (!aValue) aValue = '';
                if (!bValue) bValue = '';

                // Compare values
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    };

    // Pagination


    // Get icon for sort direction
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    // Form handling
    const handleInputChange = (field, value) => {
        setCurrentItem(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle file upload for images
    const handleImageUpload = async (file) => {
        if (!file) return;

        try {
            // Hiển thị trước ảnh ngay lập tức để UX tốt hơn
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);

            // Hiển thị thông báo đang tải
            const toastId = toast.loading("Đang tải ảnh lên...");

            // Gọi API upload ảnh
            const result = await authUtils.uploadImage(file);

            if (result && result.success && result.url) {
                // Cập nhật URL ảnh từ kết quả upload
                handleInputChange('HÌNH ẢNH', result.url);
                setSelectedImage(result.url);
                toast.update(toastId, {
                    render: "Tải ảnh thành công",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000
                });
            } else {
                throw new Error("Không thể lấy URL ảnh");
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Lỗi khi tải ảnh: ' + error.message);
            // Nếu upload thất bại, xóa ảnh preview
            setSelectedImage(null);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];

            // Validate file before proceeding
            const validation = authUtils.validateImage(file);

            if (!validation.isValid) {
                toast.error(validation.errors.join('\n'));
                return;
            }

            // Handle the dropped file
            setCurrentItem(prev => ({
                ...prev,
                'FILE_IMAGE': file
            }));

            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload the image right away if needed
            if (authUtils.shouldUploadImmediately) {
                handleImageUpload(file);
            }
        }
    };
    // Reset form
    const resetForm = () => {
        const currentUser = authUtils.getUserData();
        const currentUserName = currentUser ? currentUser['Họ và Tên'] : '';

        setCurrentItem({
            'ID KH_CSKH': generateId(),
            'ID_CTY': idCty || '',
            'PHÂN LOẠI KH': 'Khách hàng tiềm năng',
            'LOẠI CHĂM SÓC': '',
            'NGÀY DỰ KIẾN': formatDate(new Date()),
            'HÌNH THỨC': '',
            'ĐỊA ĐIỂM': '',
            'NGÀY CHĂM THỰC TẾ': '',
            'NGƯỜI CHĂM SÓC': currentUserName,
            'HÌNH ẢNH': null,
            'DỊCH VỤ QUAN TÂM': '',
            'NỘI DUNG TRAO ĐỔI': '',
            'GHI CHÚ NHU CẦU': '',
            'TRẠNG THÁI KH': 'Đã lên kế hoạch',
            'DỰ KIẾN HOÀN THÀNH': formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days from now
        });
    };

    // CRUD operations
    const saveCSKH = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        // Validate required fields
        const idCty = currentItem['ID_CTY'];
        const loaiChamSoc = currentItem['LOẠI CHĂM SÓC'];
        const ngayDuKien = currentItem['NGÀY DỰ KIẾN'];

        if (!idCty || !loaiChamSoc || !ngayDuKien) {
            toast.error('Vui lòng điền đầy đủ công ty, loại chăm sóc và ngày dự kiến');
            return;
        }

        try {
            setIsSubmitting(true);

            // Tạo một bản sao của item để xử lý
            let itemToSave = { ...currentItem };

            // Nếu có file ảnh mới, upload lên server
            if (itemToSave['FILE_IMAGE']) {
                try {
                    const uploadResult = await authUtils.uploadImage(itemToSave['FILE_IMAGE']);
                    if (uploadResult && uploadResult.success && uploadResult.url) {
                        // Cập nhật URL ảnh từ kết quả upload
                        itemToSave['HÌNH ẢNH'] = uploadResult.url;
                    } else {
                        throw new Error("Không thể lấy URL ảnh");
                    }
                } catch (error) {
                    toast.error('Lỗi khi tải ảnh: ' + error.message);
                    setIsSubmitting(false);
                    return;
                }
            }
            delete itemToSave['FILE_IMAGE'];

            if (isEditMode) {
                // Edit existing item
                await authUtils.apiRequest('CSKH', 'Edit', {
                    Properties: {
                        Locale: "vi-VN",
                        Timezone: "Asia/Ho_Chi_Minh"
                    },
                    Rows: [itemToSave]
                });

                toast.success('Cập nhật thành công!');
            } else {
                // Create new item
                await authUtils.apiRequest('CSKH', 'Add', {
                    Properties: {
                        Locale: "vi-VN",
                        Timezone: "Asia/Ho_Chi_Minh"
                    },
                    Rows: [itemToSave]
                });

                toast.success('Thêm mới thành công!');
            }

            // Refresh list
            await loadCSKHList();

            setIsSubmitting(false);
            setShowModal(false);

            // Reset form if adding new
            if (!isEditMode) {
                resetForm();
            }

        } catch (error) {
            console.error('Lỗi khi lưu CSKH:', error);
            setIsSubmitting(false);

            toast.error('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.');
        }
    };
    const handleImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            // Validate file trước khi lưu vào state
            const validation = authUtils.validateImage(file);

            if (!validation.isValid) {
                toast.error(validation.errors.join('\n'));
                return;
            }

            // Lưu file vào state
            setCurrentItem(prev => ({
                ...prev,
                'FILE_IMAGE': file // Lưu file để upload sau
            }));

            // Hiển thị preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const editCSKH = (id) => {
        const cskh = cskhList.find(k => k['ID KH_CSKH'] === id);

        if (!cskh) {
            toast.error('Không tìm thấy thông tin chăm sóc khách hàng');
            return;
        }

        setIsEditMode(true);
        setCurrentItem({
            'ID KH_CSKH': cskh['ID KH_CSKH'] || '',
            'ID_CTY': cskh['ID_CTY'] || '',
            'PHÂN LOẠI KH': cskh['PHÂN LOẠI KH'] || '',
            'LOẠI CHĂM SÓC': cskh['LOẠI CHĂM SÓC'] || '',
            'NGÀY DỰ KIẾN': formatDate(cskh['NGÀY DỰ KIẾN']),
            'HÌNH THỨC': cskh['HÌNH THỨC'] || '',
            'ĐỊA ĐIỂM': cskh['ĐỊA ĐIỂM'] || '',
            'NGÀY CHĂM THỰC TẾ': formatDate(cskh['NGÀY CHĂM THỰC TẾ']),
            'NGƯỜI CHĂM SÓC': cskh['NGƯỜI CHĂM SÓC'] || '',
            'HÌNH ẢNH': cskh['HÌNH ẢNH'] || null,
            'DỊCH VỤ QUAN TÂM': cskh['DỊCH VỤ QUAN TÂM'] || '',
            'NỘI DUNG TRAO ĐỔI': cskh['NỘI DUNG TRAO ĐỔI'] || '',
            'GHI CHÚ NHU CẦU': cskh['GHI CHÚ NHU CẦU'] || '',
            'TRẠNG THÁI KH': cskh['TRẠNG THÁI KH'] || '',
            'DỰ KIẾN HOÀN THÀNH': formatDate(cskh['DỰ KIẾN HOÀN THÀNH'])
        });

        setShowModal(true);
    };

    const deleteCSKH = async () => {
        if (!itemToDelete || isDeleting) return;

        try {
            setIsDeleting(true);

            await authUtils.apiRequest('CSKH', 'Delete', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh"
                },
                Rows: [
                    { 'ID KH_CSKH': itemToDelete['ID KH_CSKH'] }
                ]
            });

            setShowDeleteConfirmation(false);
            setItemToDelete(null);

            toast.success('Hoạt động chăm sóc đã được xóa thành công');

            // Refresh list
            await loadCSKHList();

        } catch (error) {
            console.error('Lỗi khi xóa CSKH:', error);
            toast.error('Không thể xóa hoạt động chăm sóc. Vui lòng thử lại sau.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Modal handlers
    const handleOpenModal = (item = null) => {
        if (item) {
            editCSKH(item['ID KH_CSKH']);
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

    // Get unique customer types for filter
    const uniqueTypes = [...new Set(cskhList.map(item => item['PHÂN LOẠI KH']).filter(Boolean))];

    return (
        <div className=" h-[calc(100vh-7rem)]">
            <div className="mx-auto">
                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Quản Lý Chăm Sóc Khách Hàng
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                            </button>

                            <button
                                onClick={() => navigate('/cskh-calendar')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Calendar className="w-4 h-4" />
                                Lịch chăm sóc
                            </button>

                            {idCty && (
                                <button
                                    onClick={() => navigate(`/khtn/${idCty}`)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Users className="w-4 h-4" />
                                    Thông tin khách hàng
                                </button>
                            )}

                            <button
                                onClick={() => handleOpenModal()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm hoạt động CSKH
                            </button>
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="mb-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã, công ty, loại chăm sóc..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo phân loại khách hàng:</h3>
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
                                    {uniqueTypes.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={`px-3 py-1.5 rounded-full text-sm ${filterType === type
                                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tổng số hoạt động CSKH</h3>
                            <p className="text-2xl font-bold text-blue-800">
                                {idCty
                                    ? cskhList.filter(item => item['ID_CTY'] === idCty).length
                                    : cskhList.length}
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Hoạt động đã hoàn thành</h3>
                            <p className="text-2xl font-bold text-green-800">
                                {cskhList.filter(item =>
                                    item['TRẠNG THÁI KH'] === 'Hoàn thành' &&
                                    (idCty ? item['ID_CTY'] === idCty : true)
                                ).length}
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <h3 className="text-sm text-amber-700 mb-1">Đang lên kế hoạch</h3>
                            <p className="text-2xl font-bold text-amber-800">
                                {cskhList.filter(item =>
                                    item['TRẠNG THÁI KH'] === 'Đã lên kế hoạch' &&
                                    (idCty ? item['ID_CTY'] === idCty : true)
                                ).length}
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
                                        onClick={() => requestSort('ID KH_CSKH')}>
                                        ID {getSortIcon('ID KH_CSKH')}
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-20">
                                        Thao tác
                                    </th>
                                    {!idCty && (
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-60"
                                            onClick={() => requestSort('ID_CTY')}>
                                            Tên công ty {getSortIcon('ID_CTY')}
                                        </th>
                                    )}
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-32"
                                        onClick={() => requestSort('PHÂN LOẠI KH')}>
                                        Phân loại KH {getSortIcon('PHÂN LOẠI KH')}
                                    </th>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-36"
                                        onClick={() => requestSort('LOẠI CHĂM SÓC')}>
                                        Loại chăm sóc {getSortIcon('LOẠI CHĂM SÓC')}
                                    </th>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-32"
                                        onClick={() => requestSort('NGÀY DỰ KIẾN')}>
                                        Ngày dự kiến {getSortIcon('NGÀY DỰ KIẾN')}
                                    </th>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-28"
                                        onClick={() => requestSort('TRẠNG THÁI KH')}>
                                        Trạng thái {getSortIcon('TRẠNG THÁI KH')}
                                    </th>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-32"
                                        onClick={() => requestSort('NGƯỜI CHĂM SÓC')}>
                                        Người chăm sóc {getSortIcon('NGƯỜI CHĂM SÓC')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getCurrentPageItems().length > 0 ? (
                                    getCurrentPageItems().map((item) => (
                                        <tr key={item['ID KH_CSKH']} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate">
                                                {item['ID KH_CSKH']}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                                <div className="flex justify-center space-x-2">

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
                                                        title="Xóa hoạt động"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            {!idCty && (
                                                <td className="px-4 py-4 text-sm text-gray-900 break-words">
                                                    <div className="max-h-16 overflow-y-auto">
                                                        {getCompanyName(item['ID_CTY'])}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item['PHÂN LOẠI KH'] || '—'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item['LOẠI CHĂM SÓC'] || '—'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item['NGÀY DỰ KIẾN'] ? new Date(item['NGÀY DỰ KIẾN']).toLocaleDateString('vi-VN') : '—'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${item['TRẠNG THÁI KH'] === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                                                        item['TRẠNG THÁI KH'] === 'Đang thực hiện' ? 'bg-blue-100 text-blue-800' :
                                                            item['TRẠNG THÁI KH'] === 'Đã lên kế hoạch' ? 'bg-amber-100 text-amber-800' :
                                                                item['TRẠNG THÁI KH'] === 'Hoãn lại' ? 'bg-orange-100 text-orange-800' :
                                                                    item['TRẠNG THÁI KH'] === 'Hủy bỏ' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item['TRẠNG THÁI KH'] || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700 truncate max-w-[150px]">
                                                <div className="truncate" title={item['NGƯỜI CHĂM SÓC'] || ''}>
                                                    {item['NGƯỜI CHĂM SÓC'] || '—'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={idCty ? "7" : "8"} className="px-4 py-6 text-center text-sm text-gray-500">
                                            Không tìm thấy hoạt động chăm sóc khách hàng nào phù hợp với tiêu chí tìm kiếm
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Section */}
                    {filteredList.length > 0 && (
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

                                        if (totalPages <= 5) {
                                            pageNumber = index + 1;
                                        } else if (currentPage <= 3) {
                                            pageNumber = index + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNumber = totalPages - 4 + index;
                                        } else {
                                            pageNumber = currentPage - 2 + index;
                                        }

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

            {/* Add/Edit CSKH Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center border-b border-gray-200 p-6 sticky top-0 bg-white rounded-t-xl z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? 'Cập nhật hoạt động chăm sóc khách hàng' : 'Thêm hoạt động chăm sóc mới'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 pt-4 pb-28">
                            <div className="space-y-6">
                                {/* Thông tin cơ bản */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                                        Thông tin cơ bản
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ID hoạt động
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['ID KH_CSKH']}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                readOnly
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Công ty <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative" ref={companyDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => !idCty && setShowCompanyDropdown(!showCompanyDropdown)}
                                                >
                                                    <span className={currentItem['ID_CTY'] ? '' : 'text-gray-500'}>
                                                        {currentItem['ID_CTY'] ? getCompanyName(currentItem['ID_CTY']) : 'Chọn công ty'}
                                                    </span>
                                                    {!idCty && <ChevronDown className="h-4 w-4 text-gray-500" />}
                                                </div>
                                                {showCompanyDropdown && !idCty && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                                                            <input
                                                                type="text"
                                                                placeholder="Tìm kiếm công ty..."
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                onClick={e => e.stopPropagation()}
                                                                value={companySearchTerm}
                                                                onChange={e => {
                                                                    setCompanySearchTerm(e.target.value);
                                                                }}
                                                            />
                                                        </div>
                                                        {khtnList
                                                            .filter(company =>
                                                                normalizeString(company['TÊN CÔNG TY']).includes(normalizeString(companySearchTerm))
                                                            )
                                                            .map((company) => (
                                                                <div
                                                                    key={company['ID_CTY']}
                                                                    className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                    onClick={() => {
                                                                        handleInputChange('ID_CTY', company['ID_CTY']);
                                                                        setShowCompanyDropdown(false);
                                                                        setCompanySearchTerm(''); // Reset search when selecting
                                                                    }}
                                                                >
                                                                    {company['TÊN CÔNG TY']}
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phân loại khách hàng
                                            </label>
                                            <div className="relative" ref={typeDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                                >
                                                    <span className={currentItem['PHÂN LOẠI KH'] ? '' : 'text-gray-500'}>
                                                        {currentItem['PHÂN LOẠI KH'] || 'Chọn phân loại'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showTypeDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {typeOptions.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('PHÂN LOẠI KH', option);
                                                                    setShowTypeDropdown(false);
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
                                                Loại chăm sóc <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative" ref={careTypeDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowCareTypeDropdown(!showCareTypeDropdown)}
                                                >
                                                    <span className={currentItem['LOẠI CHĂM SÓC'] ? '' : 'text-gray-500'}>
                                                        {currentItem['LOẠI CHĂM SÓC'] || 'Chọn loại chăm sóc'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showCareTypeDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {careTypeOptions.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('LOẠI CHĂM SÓC', option);
                                                                    setShowCareTypeDropdown(false);
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
                                                Trạng thái
                                            </label>
                                            <div className="relative" ref={statusDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                                >
                                                    <span className={currentItem['TRẠNG THÁI KH'] ? '' : 'text-gray-500'}>
                                                        {currentItem['TRẠNG THÁI KH'] || 'Chọn trạng thái'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showStatusDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {statusOptions.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('TRẠNG THÁI KH', option);
                                                                    setShowStatusDropdown(false);
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
                                                Ngày dự kiến <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={currentItem['NGÀY DỰ KIẾN']}
                                                onChange={(e) => handleInputChange('NGÀY DỰ KIẾN', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Dự kiến hoàn thành
                                            </label>
                                            <input
                                                type="date"
                                                value={currentItem['DỰ KIẾN HOÀN THÀNH']}
                                                onChange={(e) => handleInputChange('DỰ KIẾN HOÀN THÀNH', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ngày chăm sóc thực tế
                                            </label>
                                            <input
                                                type="date"
                                                value={currentItem['NGÀY CHĂM THỰC TẾ']}
                                                onChange={(e) => handleInputChange('NGÀY CHĂM THỰC TẾ', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin chi tiết */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                                        Thông tin chi tiết
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Hình thức
                                            </label>
                                            <div className="relative" ref={methodDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                                                >
                                                    <span className={currentItem['HÌNH THỨC'] ? '' : 'text-gray-500'}>
                                                        {currentItem['HÌNH THỨC'] || 'Chọn hình thức'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                </div>
                                                {showMethodDropdown && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {methodOptions.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('HÌNH THỨC', option);
                                                                    setShowMethodDropdown(false);
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
                                                Địa điểm
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['ĐỊA ĐIỂM']}
                                                onChange={(e) => handleInputChange('ĐỊA ĐIỂM', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập địa điểm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Người chăm sóc
                                            </label>
                                            <div className="relative" ref={staffDropdownRef}>
                                                <div
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                                                >
                                                    <span className={currentItem['NGƯỜI CHĂM SÓC'] ? '' : 'text-gray-500'}>
                                                        {currentItem['NGƯỜI CHĂM SÓC'] || 'Chọn người chăm sóc'}
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
                                                                    handleInputChange('NGƯỜI CHĂM SÓC', staff['Họ và Tên']);
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
                                                Dịch vụ quan tâm
                                            </label>
                                            <input
                                                type="text"
                                                value={currentItem['DỊCH VỤ QUAN TÂM']}
                                                onChange={(e) => handleInputChange('DỊCH VỤ QUAN TÂM', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Nhập dịch vụ khách quan tâm"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nội dung trao đổi
                                            </label>
                                            <textarea
                                                value={currentItem['NỘI DUNG TRAO ĐỔI']}
                                                onChange={(e) => handleInputChange('NỘI DUNG TRAO ĐỔI', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg resize-none bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                rows="2"
                                                placeholder="Nhập nội dung đã trao đổi với khách hàng"
                                            ></textarea>
                                        </div>

                                        <div className="sm:col-span-2">
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

                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Hình ảnh
                                            </label>
                                            <div
                                                className={`border ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} border-dashed rounded-lg p-4 text-center`}
                                                onDragEnter={handleDragEnter}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                ref={dropZoneRef}
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    {selectedImage ? (
                                                        <div className="w-32 h-32 mb-3 relative">
                                                            <img
                                                                src={selectedImage}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover rounded"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-32 h-32 flex items-center justify-center bg-gray-100 mb-3 rounded">
                                                            <Image className="h-10 w-10 text-gray-300" />
                                                        </div>
                                                    )}

                                                    <p className="text-sm text-gray-500 mb-3">
                                                        Kéo và thả ảnh vào đây hoặc
                                                    </p>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                                                            onClick={() => document.getElementById('fileInput').click()}
                                                        >
                                                            <Upload className="h-4 w-4 inline mr-1" />
                                                            Chọn ảnh
                                                        </button>
                                                        <input
                                                            id="fileInput"
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                        />

                                                        {selectedImage && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedImage(null);
                                                                    handleInputChange('HÌNH ẢNH', '');
                                                                }}
                                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <X className="h-4 w-4 inline mr-1" />
                                                                Xóa ảnh
                                                            </button>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Hình ảnh nên có kích thước vuông, tối đa 5MB.
                                                    </p>
                                                </div>
                                            </div>
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
                                    onClick={saveCSKH}
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
                                            Lưu hoạt động
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
                                    Bạn có chắc chắn muốn xóa hoạt động chăm sóc khách hàng <span className="font-bold">{itemToDelete['LOẠI CHĂM SÓC']}</span> cho công ty <span className="font-bold">{getCompanyName(itemToDelete['ID_CTY'])}</span>?
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
                                    onClick={deleteCSKH}
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
                                            Xóa hoạt động
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

export default CSKHManagement;