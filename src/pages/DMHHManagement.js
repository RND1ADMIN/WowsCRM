import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash, Search, Filter, Image, X, Upload, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';

const DMHHManagement = () => {
    // State hiện tại
    const [dmhhItems, setDmhhItems] = useState([]);
    const [currentItem, setCurrentItem] = useState({
        'Ma_HHDV': '',
        'TÊN HH DV': '',
        'CHI TIẾT': '',
        'DVT': '',
        'PHÂN LOẠI': '',
        'PHÂN LOẠI DT': '',
        'NCC ƯU TIÊN': '',
        'GIÁ MUA': '',
        'GIÁ BÁN': '',
        'HÌNH ẢNH': '',
    });

    // Thêm state cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // State hiện có
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [isEditMode, setIsEditMode] = useState(false);
    const [filterType, setFilterType] = useState('TẤT CẢ');
    const [selectedImage, setSelectedImage] = useState(null);
    const [dvtOptions, setDvtOptions] = useState([]);
    const [phanLoaiOptions, setPhanLoaiOptions] = useState([]);
    const [showDvtDropdown, setShowDvtDropdown] = useState(false);
    const [showPhanLoaiDropdown, setShowPhanLoaiDropdown] = useState(false);
    const [newDvt, setNewDvt] = useState('');
    const [newPhanLoai, setNewPhanLoai] = useState('');
    const [showAddDvt, setShowAddDvt] = useState(false);
    const [showAddPhanLoai, setShowAddPhanLoai] = useState(false);
    const [dvtSearchTerm, setDvtSearchTerm] = useState('');
    const [phanLoaiSearchTerm, setPhanLoaiSearchTerm] = useState('');

    // Refs
    const dropZoneRef = useRef(null);
    const dvtDropdownRef = useRef(null);
    const phanLoaiDropdownRef = useRef(null);
    const dvtInputRef = useRef(null);
    const phanLoaiInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [nextCodeMap, setNextCodeMap] = useState({});
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch data
    const fetchDMHH = async () => {
        try {
            const response = await authUtils.apiRequest('DMHH', 'Find', {});
            setDmhhItems(response);

            // Cập nhật tổng số trang
            setTotalPages(Math.ceil(response.length / itemsPerPage));

            // Extract unique DVT values
            const uniqueDvt = [...new Set(response.map(item => item['DVT']).filter(Boolean))];
            setDvtOptions(uniqueDvt);

            // Extract unique PHÂN LOẠI values
            const uniquePhanLoai = [...new Set(response.map(item => item['PHÂN LOẠI']).filter(Boolean))];
            setPhanLoaiOptions(uniquePhanLoai);
        } catch (error) {
            console.error('Error fetching DMHH list:', error);
            toast.error('Lỗi khi tải danh mục hàng hóa');
        }
    };

    useEffect(() => {
        fetchDMHH();
    }, []);
    useEffect(() => {
        const codeMap = {};

        // Nhóm các hàng hóa theo phân loại
        dmhhItems.forEach(item => {
            const category = item['PHÂN LOẠI'];
            if (!category) return;

            const code = item['Ma_HHDV'] || '';

            // Kiểm tra xem mã có đúng format "PHANLOAI_XXX" không
            const regex = new RegExp(`^${category}_\\d{3}$`);
            if (regex.test(code)) {
                const numStr = code.split('_')[1];
                const num = parseInt(numStr, 10);

                if (!codeMap[category] || num >= codeMap[category]) {
                    codeMap[category] = num + 1;
                }
            }
        });

        setNextCodeMap(codeMap);
    }, [dmhhItems]);
    const generateItemCode = (category) => {
        if (!category) return '';

        const nextNum = nextCodeMap[category] || 1;
        const paddedNum = nextNum.toString().padStart(3, '0');
        return `${category}_${paddedNum}`;
    };

    // Chỉnh sửa hàm xử lý khi chọn phân loại
    const handleCategorySelect = (category) => {
        handleInputChange('PHÂN LOẠI', category);

        // Nếu đang thêm mới (không phải edit) và mã hàng trống hoặc theo format cũ, tự động sinh mã mới
        if (!isEditMode && (!currentItem['Ma_HHDV'] || currentItem['Ma_HHDV'].includes(currentItem['PHÂN LOẠI'] + '_'))) {
            const newCode = generateItemCode(category);
            handleInputChange('Ma_HHDV', newCode);
        }

        setShowPhanLoaiDropdown(false);
        setPhanLoaiSearchTerm('');
    };
    // Cập nhật totalPages khi filteredItems hoặc itemsPerPage thay đổi
    useEffect(() => {
        setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
        // Reset về trang 1 khi lọc thay đổi
        setCurrentPage(1);
    }, [search, filterType, dmhhItems, itemsPerPage]);

    // Handle clicks outside dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dvtDropdownRef.current && !dvtDropdownRef.current.contains(event.target)) {
                setShowDvtDropdown(false);
            }

            if (phanLoaiDropdownRef.current && !phanLoaiDropdownRef.current.contains(event.target)) {
                setShowPhanLoaiDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Focus input when adding new option
    useEffect(() => {
        if (showAddDvt && dvtInputRef.current) {
            dvtInputRef.current.focus();
        }

        if (showAddPhanLoai && phanLoaiInputRef.current) {
            phanLoaiInputRef.current.focus();
        }
    }, [showAddDvt, showAddPhanLoai]);

    // Thêm hàm xử lý tải ảnh lên
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

    // Handle adding new DVT
    const handleAddDvt = () => {
        if (!newDvt.trim()) return;

        // Add to options if it doesn't exist already
        if (!dvtOptions.includes(newDvt.trim())) {
            setDvtOptions(prev => [...prev, newDvt.trim()]);
        }

        // Set as current value
        handleInputChange('DVT', newDvt.trim());

        // Reset state
        setNewDvt('');
        setShowAddDvt(false);
        setShowDvtDropdown(false);
    };

    // Handle adding new PHÂN LOẠI
    // Handle adding new PHÂN LOẠI
    const handleAddPhanLoai = () => {
        if (!newPhanLoai.trim()) return;

        // Add to options if it doesn't exist already
        if (!phanLoaiOptions.includes(newPhanLoai.trim())) {
            setPhanLoaiOptions(prev => [...prev, newPhanLoai.trim()]);
        }

        // Set as current value and generate code
        handleCategorySelect(newPhanLoai.trim());

        // Reset state
        setNewPhanLoai('');
        setShowAddPhanLoai(false);
    };

    // Modal handlers
    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditMode(true);
            setCurrentItem({
                'Ma_HHDV': item['Ma_HHDV'] || '',
                'TÊN HH DV': item['TÊN HH DV'] || '',
                'CHI TIẾT': item['CHI TIẾT'] || '',
                'DVT': item['DVT'] || '',
                'PHÂN LOẠI': item['PHÂN LOẠI'] || '',
                'PHÂN LOẠI DT': item['PHÂN LOẠI DT'] || '',
                'NCC ƯU TIÊN': item['NCC ƯU TIÊN'] || '',
                'GIÁ MUA': item['GIÁ MUA'] || '',
                'GIÁ BÁN': item['GIÁ BÁN'] || '',
                'HÌNH ẢNH': item['HÌNH ẢNH'] || '',
            });
            setSelectedImage(item['HÌNH ẢNH'] || null);
        } else {
            setIsEditMode(false);
            setCurrentItem({
                'Ma_HHDV': '',
                'TÊN HH DV': '',
                'CHI TIẾT': '',
                'DVT': '',
                'PHÂN LOẠI': '',
                'PHÂN LOẠI DT': '',
                'NCC ƯU TIÊN': '',
                'GIÁ MUA': '',
                'GIÁ BÁN': '',
                'HÌNH ẢNH': '',
            });
            setSelectedImage(null);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditMode(false);
        setSelectedImage(null);
        setCurrentItem({
            'Ma_HHDV': '',
            'TÊN HH DV': '',
            'CHI TIẾT': '',
            'DVT': '',
            'PHÂN LOẠI': '',
            'PHÂN LOẠI DT': '',
            'NCC ƯU TIÊN': '',
            'GIÁ MUA': '',
            'GIÁ BÁN': '',
            'HÌNH ẢNH': '',
        });
        setShowAddDvt(false);
        setShowAddPhanLoai(false);
        setNewDvt('');
        setNewPhanLoai('');
    };

    // Form handlers
    const handleInputChange = (field, value) => {
        setCurrentItem(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Cập nhật lại hàm handleImageChange
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

    const validateItem = (item) => {
        const errors = [];
        if (!item['Ma_HHDV']) errors.push('Mã hàng không được để trống');
        if (!item['TÊN HH DV']) errors.push('Tên hàng không được để trống');
        if (!item['PHÂN LOẠI']) errors.push('Phân loại không được để trống');
        return errors;
    };

    // Save item
    const handleSaveItem = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            const errors = validateItem(currentItem);
            if (errors.length > 0) {
                toast.error(errors.join('\n'));
                setIsSubmitting(false);
                return;
            }

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

            // Xóa trường FILE_IMAGE trước khi gửi đến API
            delete itemToSave['FILE_IMAGE'];

            if (isEditMode) {
                // Edit existing item
                await authUtils.apiRequest('DMHH', 'Edit', {
                    "Rows": [itemToSave]
                });
                toast.success('Cập nhật hàng hóa thành công!');
            } else {
                // Create new item
                const existingItems = await authUtils.apiRequest('DMHH', 'Find', {});

                // Check if item code already exists
                const exists = existingItems.some(item =>
                    item['Ma_HHDV'].toLowerCase() === itemToSave['Ma_HHDV'].toLowerCase()
                );

                if (exists) {
                    toast.error('Mã hàng này đã tồn tại!');
                    setIsSubmitting(false);
                    return;
                }

                await authUtils.apiRequest('DMHH', 'Add', {
                    "Rows": [itemToSave]
                });
                toast.success('Thêm hàng hóa mới thành công!');
            }

            await fetchDMHH();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving DMHH:', error);
            toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể lưu hàng hóa'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete handlers
    const handleOpenDeleteConfirmation = (item) => {
        setItemToDelete(item);
        setShowDeleteConfirmation(true);
    };

    const handleCloseDeleteConfirmation = () => {
        setShowDeleteConfirmation(false);
        setItemToDelete(null);
    };

    // Then modify the handleDeleteItem function
    const handleDeleteItem = async () => {
        if (!itemToDelete || isDeleting) return;

        try {
            setIsDeleting(true);
            await authUtils.apiRequest('DMHH', 'Delete', {
                "Rows": [{ "Ma_HHDV": itemToDelete['Ma_HHDV'] }]
            });
            toast.success('Xóa hàng hóa thành công!');
            await fetchDMHH();
            handleCloseDeleteConfirmation();
        } catch (error) {
            console.error('Error deleting DMHH:', error);
            toast.error('Có lỗi xảy ra khi xóa hàng hóa');
        } finally {
            setIsDeleting(false);
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
        const sortableItems = [...dmhhItems];
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
    }, [dmhhItems, sortConfig]);
    // Hàm chuẩn hóa chuỗi: loại bỏ dấu, chuyển thành chữ thường
    const normalizeString = (str) => {
        if (!str) return '';

        // Chuyển thành chữ thường
        let result = str.toLowerCase();

        // Loại bỏ dấu tiếng Việt
        result = result
            .normalize('NFD') // Tách các ký tự có dấu thành các phần
            .replace(/[\u0300-\u036f]/g, '') // Loại bỏ các dấu
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd');

        return result;
    };

    // Filtering
    // Sử dụng hàm chuẩn hóa trong bộ lọc
    const filteredItems = getSortedItems().filter(item => {
        const searchNormalized = normalizeString(search);

        // Nếu search rỗng, không cần kiểm tra điều kiện tìm kiếm
        const matchesSearch = search === '' || (
            normalizeString(item['Ma_HHDV']).includes(searchNormalized) ||
            normalizeString(item['TÊN HH DV']).includes(searchNormalized)
        );

        const matchesType = filterType === 'TẤT CẢ' || item['PHÂN LOẠI'] === filterType;

        return matchesSearch && matchesType;
    });

    // Phân trang
    const getCurrentPageItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredItems.slice(startIndex, endIndex);
    };

    // Chuyển trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Thay đổi số lượng item mỗi trang
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset về trang 1
    };

    // Get sort direction icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    // Get unique categories for filter
    const uniqueCategories = [...new Set(dmhhItems.map(item => item['PHÂN LOẠI']).filter(Boolean))];

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Danh Mục Hàng Hóa</h1>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                            </button>
                            <button
                                onClick={() => handleOpenModal()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm hàng hóa
                            </button>
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="mb-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã hàng, tên hàng hoặc chi tiết..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo phân loại:</h3>
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
                                    {uniqueCategories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setFilterType(category)}
                                            className={`px-3 py-1.5 rounded-full text-sm ${filterType === category
                                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tổng số hàng hóa</h3>
                            <p className="text-2xl font-bold text-blue-800">{dmhhItems.length}</p>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Số loại đơn vị tính</h3>
                            <p className="text-2xl font-bold text-green-800">
                                {dvtOptions.length}
                            </p>
                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <h3 className="text-sm text-purple-700 mb-1">Số loại phân loại</h3>
                            <p className="text-2xl font-bold text-purple-800">
                                {phanLoaiOptions.length}
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
                                        onClick={() => requestSort('Ma_HHDV')}>
                                        Mã hàng {getSortIcon('Ma_HHDV')}
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-20">
                                        Thao tác
                                    </th>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-60"
                                        onClick={() => requestSort('TÊN HH DV')}>
                                        Tên hàng {getSortIcon('TÊN HH DV')}
                                    </th>
                                    <th scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-36"
                                        onClick={() => requestSort('PHÂN LOẠI')}>
                                        Phân loại {getSortIcon('PHÂN LOẠI')}
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                        DVT
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-28"
                                        onClick={() => requestSort('GIÁ MUA')}>
                                        Giá mua {getSortIcon('GIÁ MUA')}
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-28"
                                        onClick={() => requestSort('GIÁ BÁN')}>
                                        Giá bán {getSortIcon('GIÁ BÁN')}
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                                        NCC ưu tiên
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                        Hình ảnh
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getCurrentPageItems().length > 0 ? (
                                    getCurrentPageItems().map((item) => (
                                        <tr key={item['Ma_HHDV']} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate">
                                                {item['Ma_HHDV']}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50"
                                                        title="Sửa hàng hóa"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDeleteConfirmation(item)}
                                                        className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50"
                                                        title="Xóa hàng hóa"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900 break-words">
                                                <div className="max-h-16 overflow-y-auto">
                                                    {item['TÊN HH DV']}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                                                    {item['PHÂN LOẠI']}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item['DVT'] || '—'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item['GIÁ MUA'] ? `${parseFloat(item['GIÁ MUA']).toLocaleString()} đ` : '—'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700">
                                                {item['GIÁ BÁN'] ? `${parseFloat(item['GIÁ BÁN']).toLocaleString()} đ` : '—'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700 truncate max-w-[150px]">
                                                <div className="truncate" title={item['NCC ƯU TIÊN'] || ''}>
                                                    {item['NCC ƯU TIÊN'] || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                {item['HÌNH ẢNH'] ? (
                                                    <div className="w-12 h-12 relative">
                                                        <img
                                                            src={item['HÌNH ẢNH']}
                                                            alt={item['TÊN HH DV']}
                                                            className="w-full h-full object-cover rounded-md border border-gray-200"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
                                                        <Image className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-6 text-center text-sm text-gray-500">
                                            Không tìm thấy hàng hóa nào phù hợp với tiêu chí tìm kiếm
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Section */}
                    <div className="mt-5 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-4">
                        <div className="flex items-center mb-4 sm:mb-0">
                            <span className="text-sm text-gray-700 mr-2">Hiển thị</span>
                            <select
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
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
                                                onClick={() => handlePageChange(pageNumber)}
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
                </div>
            </div>

            {/* Add/Edit DMHH Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center border-b border-gray-200 p-6 sticky top-0 bg-white rounded-t-xl z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? 'Cập nhật hàng hóa' : 'Thêm hàng hóa mới'}
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mã hàng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={currentItem['Ma_HHDV']}
                                        onChange={(e) => handleInputChange('Ma_HHDV', e.target.value)}
                                        className={`p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500 ${isEditMode ? 'bg-gray-100' : ''}`}
                                        placeholder="Nhập mã hàng"
                                        readOnly={isEditMode}
                                        required
                                    />
                                    {isEditMode && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Mã hàng không thể thay đổi sau khi đã tạo.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên hàng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={currentItem['TÊN HH DV']}
                                        onChange={(e) => handleInputChange('TÊN HH DV', e.target.value)}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nhập tên hàng"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phân loại <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative" ref={phanLoaiDropdownRef}>
                                            <div
                                                className="p-2.5 border border-gray-300 rounded-lg w-full flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                onClick={() => setShowPhanLoaiDropdown(!showPhanLoaiDropdown)}
                                            >
                                                <span className={currentItem['PHÂN LOẠI'] ? 'text-gray-900' : 'text-gray-400'}>
                                                    {currentItem['PHÂN LOẠI'] || 'Chọn phân loại'}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            </div>


                                            {showPhanLoaiDropdown && (
                                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {/* Thêm ô tìm kiếm */}
                                                    <div className="sticky top-0 p-2 bg-white border-b border-gray-100">
                                                        <input
                                                            type="text"
                                                            value={phanLoaiSearchTerm}
                                                            onChange={(e) => setPhanLoaiSearchTerm(e.target.value)}
                                                            placeholder="Tìm phân loại..."
                                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                            onClick={(e) => e.stopPropagation()} // Ngăn đóng dropdown khi click vào ô tìm kiếm
                                                        />
                                                    </div>

                                                    {/* Lọc danh sách options theo từ khóa tìm kiếm */}
                                                    {phanLoaiOptions
                                                        .filter(option => option.toLowerCase().includes(phanLoaiSearchTerm.toLowerCase()))
                                                        .map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleCategorySelect(option);
                                                                }}
                                                            >
                                                                {option}
                                                            </div>
                                                        ))}

                                                    {/* Thêm option mới */}
                                                    {!showAddPhanLoai ? (
                                                        <div
                                                            className="p-2.5 hover:bg-indigo-50 cursor-pointer text-indigo-600 flex items-center border-t border-gray-200"
                                                            onClick={() => setShowAddPhanLoai(true)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Thêm phân loại mới
                                                        </div>
                                                    ) : (
                                                        <div className="p-2.5 border-t border-gray-200">
                                                            <div className="flex items-center">
                                                                <input
                                                                    ref={phanLoaiInputRef}
                                                                    type="text"
                                                                    value={newPhanLoai}
                                                                    onChange={(e) => setNewPhanLoai(e.target.value)}
                                                                    placeholder="Nhập phân loại mới"
                                                                    className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleAddPhanLoai();
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    className="p-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
                                                                    onClick={handleAddPhanLoai}
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Đơn vị tính
                                        </label>
                                        <div className="relative" ref={dvtDropdownRef}>
                                            <div
                                                className="p-2.5 border border-gray-300 rounded-lg w-full flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                                onClick={() => setShowDvtDropdown(!showDvtDropdown)}
                                            >
                                                <span className={currentItem['DVT'] ? 'text-gray-900' : 'text-gray-400'}>
                                                    {currentItem['DVT'] || 'Chọn đơn vị tính'}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            </div>

                                            {showDvtDropdown && (
                                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {/* Thêm ô tìm kiếm */}
                                                    <div className="sticky top-0 p-2 bg-white border-b border-gray-100">
                                                        <input
                                                            type="text"
                                                            value={dvtSearchTerm}
                                                            onChange={(e) => setDvtSearchTerm(e.target.value)}
                                                            placeholder="Tìm đơn vị tính..."
                                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>

                                                    {/* Lọc danh sách options theo từ khóa tìm kiếm */}
                                                    {dvtOptions
                                                        .filter(option => option.toLowerCase().includes(dvtSearchTerm.toLowerCase()))
                                                        .map((option) => (
                                                            <div
                                                                key={option}
                                                                className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                                                                onClick={() => {
                                                                    handleInputChange('DVT', option);
                                                                    setShowDvtDropdown(false);
                                                                    setDvtSearchTerm(''); // Reset search term sau khi chọn
                                                                }}
                                                            >
                                                                {option}
                                                            </div>
                                                        ))}

                                                    {/* Thêm option mới */}
                                                    {!showAddDvt ? (
                                                        <div
                                                            className="p-2.5 hover:bg-indigo-50 cursor-pointer text-indigo-600 flex items-center border-t border-gray-200"
                                                            onClick={() => setShowAddDvt(true)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Thêm đơn vị tính mới
                                                        </div>
                                                    ) : (
                                                        <div className="p-2.5 border-t border-gray-200">
                                                            <div className="flex items-center">
                                                                <input
                                                                    ref={dvtInputRef}
                                                                    type="text"
                                                                    value={newDvt}
                                                                    onChange={(e) => setNewDvt(e.target.value)}
                                                                    placeholder="Nhập đơn vị tính mới"
                                                                    className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleAddDvt();
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    className="p-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
                                                                    onClick={handleAddDvt}
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giá mua
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={currentItem['GIÁ MUA']}
                                                onChange={(e) => handleInputChange('GIÁ MUA', e.target.value)}
                                                className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500 pr-12"
                                                placeholder="Nhập giá mua"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-gray-500">đ</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giá bán
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={currentItem['GIÁ BÁN']}
                                                onChange={(e) => handleInputChange('GIÁ BÁN', e.target.value)}
                                                className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500 pr-12"
                                                placeholder="Nhập giá bán"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-gray-500">đ</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phân loại DT
                                    </label>
                                    <input
                                        type="text"
                                        value={currentItem['PHÂN LOẠI DT']}
                                        onChange={(e) => handleInputChange('PHÂN LOẠI DT', e.target.value)}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nhập phân loại doanh thu"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        NCC ưu tiên
                                    </label>
                                    <input
                                        type="text"
                                        value={currentItem['NCC ƯU TIÊN']}
                                        onChange={(e) => handleInputChange('NCC ƯU TIÊN', e.target.value)}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nhập nhà cung cấp ưu tiên"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chi tiết
                                    </label>
                                    <textarea
                                        value={currentItem['CHI TIẾT']}
                                        onChange={(e) => handleInputChange('CHI TIẾT', e.target.value)}
                                        rows={3}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nhập chi tiết về hàng hóa"
                                    />
                                </div>

                                <div>
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
                                    onClick={handleSaveItem}
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
                                            Lưu hàng hóa
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
                                    Bạn có chắc chắn muốn xóa hàng hóa <span className="font-bold">{itemToDelete['Ma_HHDV']} - {itemToDelete['TÊN HH DV']}</span>?
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
                                    onClick={handleDeleteItem}
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
                                            Xóa hàng hóa
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

export default DMHHManagement;