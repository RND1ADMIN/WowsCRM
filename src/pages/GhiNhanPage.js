import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash, Search, Filter, Upload, Download, X, Calendar, ChevronDown, DollarSign, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';
import ExcelImporter from './ExcelImporter';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { registerLocale } from "react-datepicker";
import vi from 'date-fns/locale/vi';

// Đăng ký locale tiếng Việt
registerLocale('vi', vi);

const GhiNhanPage = () => {
    // State Management
    const [records, setRecords] = useState([]);
    const [currentRecord, setCurrentRecord] = useState({
        'IDGHINHAN': '',
        'NGÀY': new Date(),
        'ĐƠN VỊ': '',
        'KHOẢN MỤC': '',
        'PHÂN LOẠI': '',
        'HẠNG MỤC': '',
        'SỐ TIỀN': '',
        'THỰC TẾ': ''
    });
    const [showExcelImporter, setShowExcelImporter] = useState(false);


    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    // Update the initial sortConfig state to default to sorting by date in descending order
const [sortConfig, setSortConfig] = useState({ key: 'NGÀY', direction: 'descending' });
    const [isEditMode, setIsEditMode] = useState(false);
    const [filterUnit, setFilterUnit] = useState('TẤT CẢ');
    const [filterCategory, setFilterCategory] = useState('TẤT CẢ');
    const [filterType, setFilterType] = useState('TẤT CẢ');
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [showImporter, setShowImporter] = useState(false);
    const [filterUnits, setFilterUnits] = useState([]);
    const [filterCategories, setFilterCategories] = useState([]);
    const [filterTypes, setFilterTypes] = useState([]);
    const [dateFilterType, setDateFilterType] = useState('range'); // 'range', 'monthYear', 'year'
    const [selectedMonthYear, setSelectedMonthYear] = useState([]); // Array of {month, year} objects
    const [selectedYears, setSelectedYears] = useState([]);
    const monthYearOptions = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    // References for Choices.js
    const unitRef = useRef(null);
    const categoryRef = useRef(null);
    const typeRef = useRef(null);
    const itemRef = useRef(null);
    const unitChoices = useRef(null);
    const categoryChoices = useRef(null);
    const typeChoices = useRef(null);
    const itemChoices = useRef(null);
    const [groupConfig, setGroupConfig] = useState({
        enabled: false,
        levels: ['NGÀY', 'KHOẢN MỤC'], // Cấp độ group mặc định
        expandedGroups: {} // Lưu trữ trạng thái mở/đóng của các nhóm
    });

    const handleOpenExcelImporter = () => {
        setShowExcelImporter(true);
    };
    // In the GhiNhanPage component
    // Trong GhiNhanPage
    const handleFilterChange = (selectedOptions, setterFunction) => {
        setterFunction(selectedOptions || []);
    };

    // Create options for month and year selectors
    const monthOptions = [
        { value: 0, label: 'Tháng 1' },
        { value: 1, label: 'Tháng 2' },
        { value: 2, label: 'Tháng 3' },
        { value: 3, label: 'Tháng 4' },
        { value: 4, label: 'Tháng 5' },
        { value: 5, label: 'Tháng 6' },
        { value: 6, label: 'Tháng 7' },
        { value: 7, label: 'Tháng 8' },
        { value: 8, label: 'Tháng 9' },
        { value: 9, label: 'Tháng 10' },
        { value: 10, label: 'Tháng 11' },
        { value: 11, label: 'Tháng 12' }
    ];
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => {
        const year = currentYear - 5 + i;
        return { value: year, label: `Năm ${year}` };
    });
    for (let yearOffset = 0; yearOffset <= 2; yearOffset++) {
        const year = currentYear - yearOffset;
        const monthLimit = yearOffset === 0 ? currentMonth + 1 : 12; // Current year only shows up to current month

        for (let month = 0; month < monthLimit; month++) {
            monthYearOptions.push({
                value: `${year}-${month}`,
                label: `${month + 1}/${year}`, // Display as MM/YYYY
                monthValue: month,
                yearValue: year
            });
        }
    }

    const handleImportConfirm = async (data) => {
        try {
            setLoading(true);

            // Generate IDs for new records
            const timestamp = new Date().getTime();
            const dataWithIds = data.map((item, index) => {
                // Format the date properly for API
                if (item['NGÀY']) {
                    const parts = item['NGÀY'].split(/[\/\-\.]/);
                    if (parts.length === 3) {
                        item['NGÀY'] = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
                    }
                }

                // Format SỐ TIỀN
                if (item['SỐ TIỀN']) {
                    item['SỐ TIỀN'] = item['SỐ TIỀN'].toString().replace(/[,.]/g, '');
                }

                return {
                    ...item,
                    'IDGHINHAN': item['IDGHINHAN'] || `GN${timestamp}${index}`
                };
            });

            // Send to API
            await authUtils.apiRequest('GHINHAN', 'Add', {
                "Rows": dataWithIds
            });

            toast.success(`Đã nhập ${dataWithIds.length} ghi nhận từ file`);
            await fetchAllData();
            setShowExcelImporter(false); // Đảm bảo đóng modal sau khi nhập thành công
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            toast.error('Lỗi khi nhập dữ liệu');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleCancelImport = () => {
        setShowExcelImporter(false);
    };
    // Master data
    const [masterData, setMasterData] = useState({
        units: [],
        categories: ['CHI PHÍ', 'DOANH THU'],
        types: {}, // Will be populated from API
        items: {} // Will be populated from API
    });
    const userData = authUtils.getUserData();
    const isAdminUser = userData.username && userData['Phân quyền'] === 'Admin' || userData['Phân quyền'] === 'Ban điều hành';
    // Fetch all data in one call
    const fetchAllData = async () => {
        try {
            setLoading(true);

            const response = await authUtils.apiRequest('GHINHAN', 'Find', {});



            // Set records
            setRecords(response || []);

            // Process master data from the same response
            const uniqueUnits = Array.from(new Set(response.map(item => item['ĐƠN VỊ']).filter(Boolean)));

            // Build types structure
            const types = {};
            response.forEach(item => {
                const unit = item['ĐƠN VỊ'];
                const category = item['KHOẢN MỤC'];
                const type = item['PHÂN LOẠI'];

                if (!unit || !category || !type) return;

                if (!types[unit]) {
                    types[unit] = {};
                }

                if (!types[unit][category]) {
                    types[unit][category] = [];
                }

                if (!types[unit][category].includes(type)) {
                    types[unit][category].push(type);
                }
            });

            // Build items structure
            const items = {};
            response.forEach(item => {
                const unit = item['ĐƠN VỊ'];
                const category = item['KHOẢN MỤC'];
                const type = item['PHÂN LOẠI'];
                const itemValue = item['HẠNG MỤC'];

                if (!unit || !category || !type || !itemValue) return;

                if (!items[unit]) {
                    items[unit] = {};
                }

                if (!items[unit][category]) {
                    items[unit][category] = {};
                }

                if (!items[unit][category][type]) {
                    items[unit][category][type] = [];
                }

                if (!items[unit][category][type].includes(itemValue)) {
                    items[unit][category][type].push(itemValue);
                }
            });

            setMasterData({
                units: uniqueUnits,
                categories: ['CHI PHÍ', 'DOANH THU'],
                types,
                items
            });

            // Set total pages
            setTotalPages(Math.ceil((response || []).length / recordsPerPage));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        fetchAllData();
    }, []);

    // Update total pages when records or records per page changes
    useEffect(() => {
        const filteredCount = filteredItems.length;
        setTotalPages(Math.ceil(filteredCount / recordsPerPage));

        // Reset to first page if current page is out of bounds
        if (currentPage > Math.ceil(filteredCount / recordsPerPage)) {
            setCurrentPage(1);
        }
    }, [records, recordsPerPage, search, filterUnit, filterCategory, filterType, dateRange]);

    // Effect to update dropdowns when dependencies change
    useEffect(() => {
        if (showModal) updateTypeDropdown();
    }, [currentRecord['ĐƠN VỊ'], currentRecord['KHOẢN MỤC'], showModal]);

    useEffect(() => {
        if (showModal) updateItemDropdown();
    }, [currentRecord['ĐƠN VỊ'], currentRecord['KHOẢN MỤC'], currentRecord['PHÂN LOẠI'], showModal]);

    // Initialize Choices.js when modal is shown
    useEffect(() => {
        if (showModal) {
            initializeChoices();

            // Cleanup function to destroy choices instances when modal closes
            return () => {
                if (unitChoices.current) unitChoices.current.destroy();
                if (categoryChoices.current) categoryChoices.current.destroy();
                if (typeChoices.current) typeChoices.current.destroy();
                if (itemChoices.current) itemChoices.current.destroy();
            };
        }
    }, [showModal]);

    const initializeChoices = () => {
        if (!unitRef.current) return;

        // Initialize unit dropdown
        if (unitChoices.current) unitChoices.current.destroy();
        unitChoices.current = new Choices(unitRef.current, {
            placeholder: true,
            placeholderValue: 'Chọn đơn vị',
            removeItemButton: true,
            searchEnabled: true,
            itemSelectText: ''
        });

        unitChoices.current.setChoices(
            masterData.units.map(unit => ({ value: unit, label: unit })),
            'value',
            'label',
            false
        );

        // Handle unit change events
        unitRef.current.addEventListener('choice', (event) => {
            if (event.detail.choice) {
                setCurrentRecord(prev => ({
                    ...prev,
                    'ĐƠN VỊ': event.detail.choice.value,
                    'PHÂN LOẠI': '',
                    'HẠNG MỤC': ''
                }));
            }
        });

        // Initialize category dropdown
        if (categoryChoices.current) categoryChoices.current.destroy();
        categoryChoices.current = new Choices(categoryRef.current, {
            placeholder: true,
            placeholderValue: 'Chọn khoản mục',
            removeItemButton: true,
            searchEnabled: true,
            itemSelectText: ''
        });

        categoryChoices.current.setChoices(
            masterData.categories.map(category => ({ value: category, label: category })),
            'value',
            'label',
            false
        );

        // Handle category change events
        categoryRef.current.addEventListener('choice', (event) => {
            if (event.detail.choice) {
                setCurrentRecord(prev => ({
                    ...prev,
                    'KHOẢN MỤC': event.detail.choice.value,
                    'PHÂN LOẠI': '',
                    'HẠNG MỤC': ''
                }));
            }
        });

        // Set values if in edit mode
        if (isEditMode) {
            if (currentRecord['ĐƠN VỊ'] && masterData.units.includes(currentRecord['ĐƠN VỊ'])) {
                unitChoices.current.setChoiceByValue(currentRecord['ĐƠN VỊ']);
            }

            if (currentRecord['KHOẢN MỤC'] && masterData.categories.includes(currentRecord['KHOẢN MỤC'])) {
                categoryChoices.current.setChoiceByValue(currentRecord['KHOẢN MỤC']);
            }
        }
    };

    const updateTypeDropdown = () => {
        const unit = currentRecord['ĐƠN VỊ'];
        const category = currentRecord['KHOẢN MỤC'];

        if (!typeRef.current || !unit || !category) return;

        // Get available types based on selected unit and category
        const availableTypes = (masterData.types[unit] && masterData.types[unit][category]) || [];

        // Initialize or update type dropdown
        if (typeChoices.current) typeChoices.current.destroy();
        typeChoices.current = new Choices(typeRef.current, {
            placeholder: true,
            placeholderValue: 'Chọn phân loại',
            removeItemButton: true,
            searchEnabled: true,
            itemSelectText: ''
        });

        typeChoices.current.setChoices(
            availableTypes.map(type => ({ value: type, label: type })),
            'value',
            'label',
            false
        );

        // Handle type change events
        typeRef.current.addEventListener('choice', (event) => {
            if (event.detail.choice) {
                setCurrentRecord(prev => ({
                    ...prev,
                    'PHÂN LOẠI': event.detail.choice.value,
                    'HẠNG MỤC': ''
                }));
            }
        });

        // Set value if in edit mode
        if (isEditMode && currentRecord['PHÂN LOẠI'] && availableTypes.includes(currentRecord['PHÂN LOẠI'])) {
            typeChoices.current.setChoiceByValue(currentRecord['PHÂN LOẠI']);
        }
    };

    const updateItemDropdown = () => {
        const unit = currentRecord['ĐƠN VỊ'];
        const category = currentRecord['KHOẢN MỤC'];
        const type = currentRecord['PHÂN LOẠI'];

        if (!itemRef.current || !unit || !category || !type) return;

        // Get available items based on selected unit, category, and type
        const availableItems = (masterData.items[unit] &&
            masterData.items[unit][category] &&
            masterData.items[unit][category][type]) || [];

        // Initialize or update item dropdown
        if (itemChoices.current) itemChoices.current.destroy();
        itemChoices.current = new Choices(itemRef.current, {
            placeholder: true,
            placeholderValue: 'Chọn hạng mục',
            removeItemButton: true,
            searchEnabled: true,
            itemSelectText: ''
        });

        itemChoices.current.setChoices(
            availableItems.map(item => ({ value: item, label: item })),
            'value',
            'label',
            false
        );

        // Handle item change events
        itemRef.current.addEventListener('choice', (event) => {
            if (event.detail.choice) {
                setCurrentRecord(prev => ({
                    ...prev,
                    'HẠNG MỤC': event.detail.choice.value
                }));
            }
        });

        // Set value if in edit mode
        if (isEditMode && currentRecord['HẠNG MỤC'] && availableItems.includes(currentRecord['HẠNG MỤC'])) {
            itemChoices.current.setChoiceByValue(currentRecord['HẠNG MỤC']);
        }
    };

    // Modal handlers
    const handleOpenModal = (record = null) => {
        if (record) {
            setIsEditMode(true);
            setCurrentRecord({
                'IDGHINHAN': record['IDGHINHAN'] || '',
                'NGÀY': record['NGÀY'] ? new Date(record['NGÀY']) : new Date(),
                'ĐƠN VỊ': record['ĐƠN VỊ'] || '',
                'KHOẢN MỤC': record['KHOẢN MỤC'] || '',
                'PHÂN LOẠI': record['PHÂN LOẠI'] || '',
                'HẠNG MỤC': record['HẠNG MỤC'] || '',
                'SỐ TIỀN': record['SỐ TIỀN'] || '',
                'THỰC TẾ': record['THỰC TẾ'] || ''
            });
        } else {
            setIsEditMode(false);
            setCurrentRecord({
                'IDGHINHAN': '',
                'NGÀY': new Date(),
                'ĐƠN VỊ': '',
                'KHOẢN MỤC': '',
                'PHÂN LOẠI': '',
                'HẠNG MỤC': '',
                'SỐ TIỀN': '',
                'THỰC TẾ': ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditMode(false);
    };

    // Form handlers
    const handleInputChange = (field, value) => {
        setCurrentRecord(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateRecord = (record) => {
        const errors = [];
        if (!record['NGÀY']) errors.push('Ngày không được để trống');
        if (!record['ĐƠN VỊ']) errors.push('Đơn vị không được để trống');
        if (!record['KHOẢN MỤC']) errors.push('Khoản mục không được để trống');
        if (!record['PHÂN LOẠI']) errors.push('Phân loại không được để trống');
        if (!record['HẠNG MỤC']) errors.push('Hạng mục không được để trống');

        if (!record['SỐ TIỀN']) {
            errors.push('Số tiền không được để trống');
        } else {
            // Clean amount string and check if it's a number
            const cleanAmount = record['SỐ TIỀN'].toString().replace(/[,.]/g, '');
            if (isNaN(Number(cleanAmount))) {
                errors.push('Số tiền phải là số');
            }
        }

        return errors;
    };

    // Save record
    const handleSaveRecord = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            const errors = validateRecord(currentRecord);
            if (errors.length > 0) {
                toast.error(errors.join('\n'));
                setIsSubmitting(false);
                return;
            }

            // Create a copy of record to process
            let recordToSave = { ...currentRecord };

            // Format date for API
            if (recordToSave['NGÀY'] instanceof Date) {
                recordToSave['NGÀY'] = recordToSave['NGÀY'].toISOString().split('T')[0];
            }

            // Format amount - remove formatting but keep as string for API
            if (recordToSave['SỐ TIỀN']) {
                // Keep as string but normalize format
                recordToSave['SỐ TIỀN'] = recordToSave['SỐ TIỀN'].toString().replace(/,/g, '');
            }

            if (isEditMode) {
                // Edit existing record
                await authUtils.apiRequest('GHINHAN', 'Edit', {
                    "Rows": [recordToSave]
                });
                toast.success('Cập nhật ghi nhận thành công!');
            } else {
                // Generate new ID if needed
                if (!recordToSave['IDGHINHAN']) {
                    const timestamp = new Date().getTime();
                    recordToSave['IDGHINHAN'] = `GN${timestamp}`;
                }

                // Create new record
                await authUtils.apiRequest('GHINHAN', 'Add', {
                    "Rows": [recordToSave]
                });
                toast.success('Thêm ghi nhận mới thành công!');
            }

            await fetchAllData();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving record:', error);
            toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể lưu ghi nhận'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete handlers
    const handleOpenDeleteConfirmation = (record) => {
        setRecordToDelete(record);
        setShowDeleteConfirmation(true);
    };

    const handleCloseDeleteConfirmation = () => {
        setShowDeleteConfirmation(false);
        setRecordToDelete(null);
    };

    const handleSelectRecord = (record) => {
        setSelectedRecords(prev => {
            const isSelected = prev.some(r => r['IDGHINHAN'] === record['IDGHINHAN']);
            if (isSelected) {
                return prev.filter(r => r['IDGHINHAN'] !== record['IDGHINHAN']);
            } else {
                return [...prev, record];
            }
        });
    };

    const handleSelectAllRecords = () => {
        if (selectedRecords.length === currentRecords.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords([...currentRecords]);
        }
    };

    const handleDeleteMultiple = async () => {
        if (selectedRecords.length === 0) return;

        try {
            setIsDeleting(true);
            await authUtils.apiRequest('GHINHAN', 'Delete', {
                "Rows": selectedRecords.map(record => ({ "IDGHINHAN": record['IDGHINHAN'] }))
            });
            toast.success(`Đã xóa ${selectedRecords.length} ghi nhận thành công!`);
            await fetchAllData();
            setSelectedRecords([]);
            setShowDeleteConfirmation(false);
        } catch (error) {
            console.error('Error deleting records:', error);
            toast.error('Có lỗi xảy ra khi xóa ghi nhận');
        } finally {
            setIsDeleting(false);
        }
    };

    // Excel import/export
    const handleExportExcel = () => {
        try {
            // Export only filtered data
            const worksheet = XLSX.utils.json_to_sheet(filteredItems);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Ghi nhận");
            XLSX.writeFile(workbook, "Ghi_Nhan_Doanh_Thu_Chi_Phi.xlsx");
            toast.success('Xuất Excel thành công!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Lỗi khi xuất Excel');
        }
    };

    // Thêm hàm tính ngày cuối tháng
    const getLastDayOfMonth = (month, year) => {
        return new Date(year, month + 1, 0);
    };

    // Sửa lại hàm xử lý nhập từ Excel
    const handleImportExcel = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    setLoading(true);
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // Validate data before importing
                    const validData = jsonData.filter(item => {
                        // Basic validation
                        return item['NGÀY'] && item['ĐƠN VỊ'] && item['KHOẢN MỤC'] &&
                            item['PHÂN LOẠI'] && item['HẠNG MỤC'] && item['SỐ TIỀN'];
                    });

                    if (validData.length === 0) {
                        toast.error('Không có dữ liệu hợp lệ để nhập');
                        setLoading(false);
                        return;
                    }

                    // Generate IDs for new records
                    const timestamp = new Date().getTime();
                    const dataWithIds = validData.map((item, index) => {
                        // Format the date properly
                        let formattedItem = { ...item };

                        // Ensure NGÀY is in correct format
                        if (formattedItem['NGÀY']) {
                            // If Excel date (number)
                            if (typeof formattedItem['NGÀY'] === 'number') {
                                const excelDate = XLSX.SSF.parse_date_code(formattedItem['NGÀY']);
                                const lastDay = getLastDayOfMonth(excelDate.m - 1, excelDate.y);
                                formattedItem['NGÀY'] = lastDay.toISOString().split('T')[0];
                            }
                            // If string, check format and convert if needed
                            else if (typeof formattedItem['NGÀY'] === 'string') {
                                const parts = formattedItem['NGÀY'].split(/[\/\-\.]/);
                                if (parts.length === 3) {
                                    // Assuming DD/MM/YYYY format in Excel
                                    if (parts[0].length <= 2 && parts[1].length <= 2) {
                                        const month = parseInt(parts[1]) - 1;
                                        const year = parseInt(parts[2]);
                                        const lastDay = getLastDayOfMonth(month, year);
                                        formattedItem['NGÀY'] = lastDay.toISOString().split('T')[0];
                                    }
                                }
                            }
                        }

                        // Format SỐ TIỀN to be numeric without formatting
                        if (formattedItem['SỐ TIỀN']) {
                            formattedItem['SỐ TIỀN'] = formattedItem['SỐ TIỀN'].toString().replace(/[,.]/g, '');
                        }

                        return {
                            ...formattedItem,
                            'IDGHINHAN': formattedItem['IDGHINHAN'] || `GN${timestamp}${index}`
                        };
                    });

                    // Send to API
                    await authUtils.apiRequest('GHINHAN', 'Add', {
                        "Rows": dataWithIds
                    });

                    toast.success(`Đã nhập ${dataWithIds.length} ghi nhận từ Excel`);
                    await fetchAllData();
                } catch (error) {
                    console.error('Error processing Excel file:', error);
                    toast.error('Lỗi khi xử lý file Excel');
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error reading Excel file:', error);
            toast.error('Lỗi khi đọc file Excel');
            setLoading(false);
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
        const sortableItems = [...records];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const keyA = a[sortConfig.key] || '';
                const keyB = b[sortConfig.key] || '';

                if (sortConfig.key === 'NGÀY') {
                    // Sort dates
                    return sortConfig.direction === 'ascending'
                        ? new Date(keyA) - new Date(keyB)
                        : new Date(keyB) - new Date(keyA);
                } else if (sortConfig.key === 'SỐ TIỀN') {
                    // Sort numbers
                    const numA = parseFloat(keyA.toString().replace(/[,.]/g, '')) || 0;
                    const numB = parseFloat(keyB.toString().replace(/[,.]/g, '')) || 0;
                    return sortConfig.direction === 'ascending'
                        ? numA - numB
                        : numB - numA;
                } else {
                    // Sort strings
                    if (keyA < keyB) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (keyA > keyB) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                    return 0;
                }
            });
        }
        return sortableItems;
    }, [records, sortConfig]);

    // Filtering
    const filteredItems = getSortedItems().filter(record => {
        // Search filter
        const matchesSearch =
            search === '' ||
            (record['IDGHINHAN']?.toLowerCase().includes(search.toLowerCase()) ||
                record['ĐƠN VỊ']?.toLowerCase().includes(search.toLowerCase()) ||
                record['PHÂN LOẠI']?.toLowerCase().includes(search.toLowerCase()) ||
                record['HẠNG MỤC']?.toLowerCase().includes(search.toLowerCase()));

        // Multi-select category filters
        const matchesUnit = filterUnits.length === 0 ||
            filterUnits.some(option => option.value === record['ĐƠN VỊ']);

        const matchesCategory = filterCategories.length === 0 ||
            filterCategories.some(option => option.value === record['KHOẢN MỤC']);

        const matchesType = filterTypes.length === 0 ||
            filterTypes.some(option => option.value === record['PHÂN LOẠI']);

        // Date filtering based on filter type
        let matchesDateRange = true;

        if (dateFilterType === 'range' && startDate && endDate) {
            const recordDate = new Date(record['NGÀY']);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDateRange = recordDate >= start && recordDate <= end;
        }
        else if (dateFilterType === 'monthYear' && selectedMonthYear.length > 0) {
            const recordDate = new Date(record['NGÀY']);
            const recordMonth = recordDate.getMonth();
            const recordYear = recordDate.getFullYear();

            matchesDateRange = selectedMonthYear.some(option =>
                option.monthValue === recordMonth && option.yearValue === recordYear
            );
        }
        else if (dateFilterType === 'year' && selectedYears.length > 0) {
            const recordDate = new Date(record['NGÀY']);
            const recordYear = recordDate.getFullYear();
            matchesDateRange = selectedYears.some(option => option.value === recordYear);
        }

        return matchesSearch && matchesUnit && matchesCategory && matchesType && matchesDateRange;
    });

    // Pagination
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredItems.slice(indexOfFirstRecord, indexOfLastRecord);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Get unique values for filtering
    const units = ['TẤT CẢ', ...new Set(records.map(rec => rec['ĐƠN VỊ']).filter(Boolean))];
    const categories = ['TẤT CẢ', ...new Set(records.map(rec => rec['KHOẢN MỤC']).filter(Boolean))];
    const types = ['TẤT CẢ', ...new Set(records.map(rec => rec['PHÂN LOẠI']).filter(Boolean))];

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount) return '0 ₫';

        try {
            const numAmount = typeof amount === 'number'
                ? amount
                : parseFloat(amount.toString().replace(/[,.]/g, ''));

            if (isNaN(numAmount)) return '0 ₫';

            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(numAmount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return '0 ₫';
        }
    };

    // Get sort direction icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            return date.toLocaleDateString('vi-VN');
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    };

    // Get statistics
    const totalRevenue = filteredItems
        .filter(item => item['KHOẢN MỤC'] === 'DOANH THU')
        .reduce((sum, item) => {
            try {
                const amount = typeof item['SỐ TIỀN'] === 'number'
                    ? item['SỐ TIỀN']
                    : parseFloat(item['SỐ TIỀN'].toString().replace(/[,.]/g, ''));

                return sum + (isNaN(amount) ? 0 : amount);
            } catch {
                return sum;
            }
        }, 0);

    const totalExpense = filteredItems
        .filter(item => item['KHOẢN MỤC'] === 'CHI PHÍ')
        .reduce((sum, item) => {
            try {
                const amount = typeof item['SỐ TIỀN'] === 'number'
                    ? item['SỐ TIỀN']
                    : parseFloat(item['SỐ TIỀN'].toString().replace(/[,.]/g, ''));

                return sum + (isNaN(amount) ? 0 : amount);
            } catch {
                return sum;
            }
        }, 0);

    const profit = totalRevenue - totalExpense;

    // Thêm hàm format tháng/năm
    const formatMonthYear = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
        } catch (error) {
            console.error('Error formatting month year:', error);
            return dateString;
        }
    };

    // Sửa lại hàm group dữ liệu
    const groupData = (data, levels) => {
        if (!levels || levels.length === 0) return data;

        const groupedData = {};
        const currentLevel = levels[0];
        const remainingLevels = levels.slice(1);

        // Group theo level hiện tại
        data.forEach(item => {
            let groupKey = item[currentLevel];
            
            // Nếu là trường NGÀY, chuyển thành tháng/năm
            if (currentLevel === 'NGÀY') {
                const date = new Date(item[currentLevel]);
                groupKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
            }

            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    items: [],
                    doanhThu: 0,
                    chiPhi: 0,
                    loiNhuan: 0
                };
            }
            groupedData[groupKey].items.push(item);
            
            // Tính tổng doanh thu và chi phí
            const soTien = parseFloat(item['SỐ TIỀN']?.toString().replace(/[,.]/g, '') || 0);
            if (item['KHOẢN MỤC'] === 'DOANH THU') {
                groupedData[groupKey].doanhThu += soTien;
            } else if (item['KHOẢN MỤC'] === 'CHI PHÍ') {
                groupedData[groupKey].chiPhi += soTien;
            }
            
            // Tính lợi nhuận
            groupedData[groupKey].loiNhuan = groupedData[groupKey].doanhThu - groupedData[groupKey].chiPhi;
        });

        // Nếu còn level khác, tiếp tục group
        if (remainingLevels.length > 0) {
            Object.keys(groupedData).forEach(groupKey => {
                groupedData[groupKey].items = groupData(groupedData[groupKey].items, remainingLevels);
            });
        }

        return groupedData;
    };

    // Sửa lại hàm render bảng với group
    const renderGroupedTable = (data, level = 0, parentPath = '') => {
        if (!data || typeof data !== 'object') return null;

        return Object.entries(data).map(([groupKey, group]) => {
            const currentPath = parentPath ? `${parentPath}.${groupKey}` : groupKey;
            const isExpanded = isGroupExpanded(currentPath);

            // Format lại key nếu là tháng/năm
            let formattedGroupKey = groupKey;
            if (groupKey.includes('/')) {
                const [month, year] = groupKey.split('/');
                formattedGroupKey = `Tháng ${month}/${year}`;
            }

            return (
                <React.Fragment key={`${level}-${groupKey}`}>
                    <tr className="bg-gray-50">
                        <td colSpan="9" className="px-4 py-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => toggleGroup(currentPath)}
                                        className="mr-2"
                                    >
                                        {isExpanded ? '▼' : '▶'}
                                    </button>
                                    <span className="font-medium">
                                        {formattedGroupKey}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-green-600 font-medium">
                                        DT: {formatCurrency(group.doanhThu)}
                                    </span>
                                    <span className="text-red-600 font-medium">
                                        CP: {formatCurrency(group.chiPhi)}
                                    </span>
                                    <span className={`font-medium ${group.loiNhuan >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                        LN: {formatCurrency(group.loiNhuan)}
                                    </span>
                                </div>
                            </div>
                        </td>
                    </tr>
                    {isExpanded && (
                        <>
                            {Array.isArray(group.items)
                                ? group.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        {/* Render các cột như bình thường */}
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {formatDate(item['NGÀY'])}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {item['ĐƠN VỊ'] || '—'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item['KHOẢN MỤC'] === 'DOANH THU'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {item['KHOẢN MỤC']}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {item['PHÂN LOẠI'] || '—'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {item['HẠNG MỤC'] || '—'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(item['SỐ TIỀN'])}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {item['THỰC TẾ'] || '—'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
                                                    title="Xóa ghi nhận"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                                : renderGroupedTable(group.items, level + 1, currentPath)}
                        </>
                    )}
                </React.Fragment>
            );
        });
    };

    // Hàm xử lý mở/đóng nhóm
    const toggleGroup = (path) => {
        setGroupConfig(prev => ({
            ...prev,
            expandedGroups: {
                ...prev.expandedGroups,
                [path]: !prev.expandedGroups[path]
            }
        }));
    };

    // Hàm kiểm tra trạng thái mở/đóng của nhóm
    const isGroupExpanded = (path) => {
        return groupConfig.expandedGroups[path] !== false;
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Ghi Nhận Doanh Thu & Chi Phí</h1>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setGroupConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                className={`px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm ${
                                    groupConfig.enabled ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : ''
                                }`}
                            >
                                <ChevronDown className="w-4 h-4" />
                                {groupConfig.enabled ? 'Tắt nhóm' : 'Bật nhóm'}
                            </button>

                            {selectedRecords.length > 0 && (
                                <button
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Trash className="w-4 h-4" />
                                    Xóa ({selectedRecords.length})
                                </button>
                            )}

                            {groupConfig.enabled && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Filter className="w-4 h-4" />
                                        Cấu hình nhóm
                                    </button>
                                    {showFilters && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Cấu hình nhóm</h3>
                                            <div className="space-y-2">
                                                {['NGÀY', 'KHOẢN MỤC', 'ĐƠN VỊ', 'PHÂN LOẠI'].map(level => (
                                                    <label key={level} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={groupConfig.levels.includes(level)}
                                                            onChange={(e) => {
                                                                const newLevels = e.target.checked
                                                                    ? [...groupConfig.levels, level]
                                                                    : groupConfig.levels.filter(l => l !== level);
                                                                setGroupConfig(prev => ({ ...prev, levels: newLevels }));
                                                            }}
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{level}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                            </button>

                            <label
                                onClick={handleOpenExcelImporter}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                Import Excel
                            </label>

                            <button
                                onClick={handleExportExcel}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="mb-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo ID, đơn vị, phân loại, hạng mục..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Date filter type selector */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo thời gian:</h3>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <button
                                                onClick={() => setDateFilterType('range')}
                                                className={`px-3 py-1.5 rounded-full text-sm ${dateFilterType === 'range'
                                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Khoảng thời gian
                                            </button>
                                            <button
                                                onClick={() => setDateFilterType('monthYear')}
                                                className={`px-3 py-1.5 rounded-full text-sm ${dateFilterType === 'monthYear'
                                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Theo tháng/năm
                                            </button>
                                            <button
                                                onClick={() => setDateFilterType('year')}
                                                className={`px-3 py-1.5 rounded-full text-sm ${dateFilterType === 'year'
                                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Theo năm
                                            </button>
                                        </div>

                                        {/* Date range picker */}
                                        {dateFilterType === 'range' && (
                                            <DatePicker
                                                selectsRange={true}
                                                startDate={startDate}
                                                endDate={endDate}
                                                onChange={(update) => {
                                                    setDateRange(update);
                                                }}
                                                isClearable={true}
                                                placeholderText="Chọn khoảng thời gian"
                                                className="w-full p-2.5 border border-gray-300 rounded-lg"
                                                dateFormat="dd/MM/yyyy"
                                            />
                                        )}

                                        {/* Month/Year selector */}
                                        {dateFilterType === 'monthYear' && (
                                            <Select
                                                closeMenuOnSelect={false}
                                                components={makeAnimated()}
                                                isMulti
                                                options={monthYearOptions}
                                                className="basic-multi-select"
                                                classNamePrefix="select"
                                                placeholder="Chọn tháng/năm"
                                                value={selectedMonthYear}
                                                onChange={(selectedOptions) => setSelectedMonthYear(selectedOptions || [])}
                                            />
                                        )}

                                        {/* Year selector */}
                                        {dateFilterType === 'year' && (
                                            <Select
                                                closeMenuOnSelect={false}
                                                components={makeAnimated()}
                                                isMulti
                                                options={yearOptions}
                                                className="basic-multi-select"
                                                classNamePrefix="select"
                                                placeholder="Chọn năm"
                                                value={selectedYears}
                                                onChange={(selectedOptions) => setSelectedYears(selectedOptions || [])}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Unit filter - multi-select */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo đơn vị:</h3>
                                        <Select
                                            closeMenuOnSelect={false}
                                            components={makeAnimated()}
                                            isMulti
                                            options={units.filter(u => u !== 'TẤT CẢ').map(unit => ({ value: unit, label: unit }))}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                            placeholder="Chọn đơn vị"
                                            value={filterUnits}
                                            onChange={(selectedOptions) => handleFilterChange(selectedOptions, setFilterUnits)}
                                        />
                                    </div>

                                    {/* Category filter - multi-select */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo khoản mục:</h3>
                                        <Select
                                            closeMenuOnSelect={false}
                                            components={makeAnimated()}
                                            isMulti
                                            options={categories.filter(c => c !== 'TẤT CẢ').map(category => ({ value: category, label: category }))}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                            placeholder="Chọn khoản mục"
                                            value={filterCategories}
                                            onChange={(selectedOptions) => handleFilterChange(selectedOptions, setFilterCategories)}
                                        />
                                    </div>

                                    {/* Type filter - multi-select */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo phân loại:</h3>
                                        <Select
                                            closeMenuOnSelect={false}
                                            components={makeAnimated()}
                                            isMulti
                                            options={types.filter(t => t !== 'TẤT CẢ').map(type => ({ value: type, label: type }))}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                            placeholder="Chọn phân loại"
                                            value={filterTypes}
                                            onChange={(selectedOptions) => handleFilterChange(selectedOptions, setFilterTypes)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Tổng doanh thu</h3>
                            <p className="text-2xl font-bold text-green-800">{formatCurrency(totalRevenue)}</p>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <h3 className="text-sm text-red-700 mb-1">Tổng chi phí</h3>
                            <p className="text-2xl font-bold text-red-800">{formatCurrency(totalExpense)}</p>
                        </div>

                        <div className={`${profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-yellow-50 border-yellow-100'} border rounded-lg p-4`}>
                            <h3 className={`text-sm ${profit >= 0 ? 'text-blue-700' : 'text-yellow-700'} mb-1`}>Lợi nhuận</h3>
                            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-800' : 'text-yellow-800'}`}>
                                {formatCurrency(profit)}
                            </p>
                        </div>
                    </div>

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span className="ml-3 text-indigo-600">Đang tải dữ liệu...</span>
                        </div>
                    )}

                    {/* Table Section */}
                    {!loading && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecords.length === currentRecords.length}
                                                onChange={handleSelectAllRecords}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                        </th>
                                        <th scope="col" hidden
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('IDGHINHAN')}>
                                            ID {getSortIcon('IDGHINHAN')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('NGÀY')}>
                                            Ngày {getSortIcon('NGÀY')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('ĐƠN VỊ')}>
                                            Đơn vị {getSortIcon('ĐƠN VỊ')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('KHOẢN MỤC')}>
                                            Khoản mục {getSortIcon('KHOẢN MỤC')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('PHÂN LOẠI')}>
                                            Phân loại {getSortIcon('PHÂN LOẠI')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('HẠNG MỤC')}>
                                            Hạng mục {getSortIcon('HẠNG MỤC')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('SỐ TIỀN')}>
                                            Số tiền {getSortIcon('SỐ TIỀN')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('THỰC TẾ')}>
                                            Thực tế {getSortIcon('THỰC TẾ')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentRecords.length > 0 ? (
                                        groupConfig.enabled
                                            ? renderGroupedTable(groupData(currentRecords, groupConfig.levels))
                                            : currentRecords.map((record, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRecords.some(r => r['IDGHINHAN'] === record['IDGHINHAN'])}
                                                            onChange={() => handleSelectRecord(record)}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                        />
                                                    </td>
                                                    <td hidden className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {record['IDGHINHAN']}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {formatDate(record['NGÀY'])}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {record['ĐƠN VỊ'] || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record['KHOẢN MỤC'] === 'DOANH THU'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {record['KHOẢN MỤC']}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {record['PHÂN LOẠI'] || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {record['HẠNG MỤC'] || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatCurrency(record['SỐ TIỀN'])}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {record['THỰC TẾ'] || '—'}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                        <div className="flex justify-center space-x-2">
                                                            <button
                                                                onClick={() => handleOpenModal(record)}
                                                                className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50"
                                                                title="Sửa thông tin"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenDeleteConfirmation(record)}
                                                                className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50"
                                                                title="Xóa ghi nhận"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-6 text-center text-sm text-gray-500">
                                                Không tìm thấy dữ liệu ghi nhận nào phù hợp với tiêu chí tìm kiếm
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredItems.length > 0 && (
                        <div className="flex items-center justify-between mt-6 border-t border-gray-200 pt-4">
                            <div className="flex items-center text-sm text-gray-700">
                                <span>
                                    Hiển thị <span className="font-medium">{indexOfFirstRecord + 1}</span> đến{' '}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastRecord, filteredItems.length)}
                                    </span>{' '}
                                    trong tổng số <span className="font-medium">{filteredItems.length}</span> ghi nhận
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <select
                                    className="p-2 border border-gray-300 rounded-md text-sm"
                                    value={recordsPerPage}
                                    onChange={(e) => {
                                        setRecordsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page
                                    }}
                                >
                                    {[10, 20, 50, 100].map(size => (
                                        <option key={size} value={size}>
                                            {size} dòng
                                        </option>
                                    ))}
                                </select>

                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={prevPage}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">Trang trước</span>
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>

                                    {/* Page numbers */}
                                    {[...Array(totalPages)].map((_, i) => {
                                        // Show limited page numbers with ellipsis
                                        if (
                                            totalPages <= 7 ||
                                            i === 0 ||
                                            i === totalPages - 1 ||
                                            (i >= currentPage - 2 && i <= currentPage + 2)
                                        ) {
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => paginate(i + 1)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                                                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            );
                                        } else if (
                                            (i === 1 && currentPage > 4) ||
                                            (i === totalPages - 2 && currentPage < totalPages - 3)
                                        ) {
                                            return (
                                                <span
                                                    key={i}
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }
                                        return null;
                                    })}

                                    <button
                                        onClick={nextPage}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">Trang sau</span>
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Record Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? 'Cập nhật ghi nhận' : 'Thêm ghi nhận mới'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-5">
                                {isEditMode && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ID
                                        </label>
                                        <input
                                            type="text"
                                            value={currentRecord['IDGHINHAN']}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full bg-gray-100"
                                            readOnly
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tháng/Năm <span className="text-red-500">*</span>
                                    </label>
                                    <DatePicker
                                        selected={currentRecord['NGÀY']}
                                        onChange={(date) => {
                                            if (date) {
                                                const lastDay = getLastDayOfMonth(date.getMonth(), date.getFullYear());
                                                handleInputChange('NGÀY', lastDay);
                                            }
                                        }}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        dateFormat="MM/yyyy"
                                        showMonthYearPicker
                                        placeholderText="Chọn tháng/năm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Đơn vị <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        ref={unitRef}
                                        className="choices-select p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Khoản mục <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        ref={categoryRef}
                                        className="choices-select p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phân loại <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        ref={typeRef}
                                        className="choices-select p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hạng mục <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        ref={itemRef}
                                        className="choices-select p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số tiền <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={currentRecord['SỐ TIỀN']}
                                            onChange={(e) => {
                                                // Only allow numbers with commas and periods
                                                const val = e.target.value.replace(/[^0-9.,]/g, '');
                                                handleInputChange('SỐ TIỀN', val);
                                            }}
                                            className="p-2.5 pl-10 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Nhập số tiền"
                                            required
                                        />
                                    </div>
                                    {/* Format preview */}
                                    {currentRecord['SỐ TIỀN'] && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Hiển thị: {formatCurrency(currentRecord['SỐ TIỀN'].toString().replace(/,/g, ''))}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thực tế
                                    </label>
                                    <input
                                        type="text"
                                        value={currentRecord['THỰC TẾ']}
                                        onChange={(e) => handleInputChange('THỰC TẾ', e.target.value)}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nhập ghi chú thực tế"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer with buttons */}
                        <div className="flex justify-end gap-3 pt-5 mt-6 border-t border-gray-200">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center"
                                disabled={isSubmitting}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveRecord}
                                disabled={isSubmitting}
                                className={`px-5 py-2 bg-indigo-600 text-white rounded-lg ${isSubmitting
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-indigo-700 hover:shadow-md'
                                    } flex items-center gap-2 transition-all`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Lưu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
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
                                    Bạn có chắc chắn muốn xóa {selectedRecords.length} ghi nhận đã chọn?
                                </p>
                                <p className="text-sm text-red-600 mt-2">
                                    Hành động này không thể hoàn tác và sẽ xóa tất cả thông tin của các ghi nhận này.
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
                                    onClick={handleDeleteMultiple}
                                    disabled={isDeleting}
                                    className={`px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm ${
                                        isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                                    }`}
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xóa...
                                        </>
                                    ) : (
                                        <>
                                            <Trash className="h-4 w-4" />
                                            Xóa ({selectedRecords.length})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Excel Importer Modal */}
            {showExcelImporter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <ExcelImporter
                        onImport={handleImportConfirm}
                        onCancel={handleCancelImport}
                    />
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
export default GhiNhanPage;