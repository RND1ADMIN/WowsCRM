import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Check, AlertTriangle, ChevronLeft, ChevronRight, FileText, Download, FileSpreadsheet, Loader, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

const ExcelImporter = ({ onImport, onCancel }) => {
    const [previewData, setPreviewData] = useState([]);
    const [fileName, setFileName] = useState('');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [fileType, setFileType] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const sampleFileURLs = [
        {
            name: "Mẫu WOWS",
            url: "/WOWS.xlsx"
        },
        {
            name: "Mẫu LEA",
            url: "/LEA.xlsx"
        },

       
    ];
    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        valid: 0,
        invalid: 0,
        revenue: 0,
        expense: 0
    });
    const [editingRow, setEditingRow] = useState(null);
    const [editedData, setEditedData] = useState({});

    const downloadSampleFile = (fileUrl, fileName) => {
        fetch(fileUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo URL tạm thời để tải file
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success(`Đã tải xuống ${fileName}`);
            })
            .catch(error => {
                console.error('Lỗi khi tải file mẫu:', error);
                toast.error('Không thể tải file mẫu');
            });
    };
    useEffect(() => {
        if (previewData.length > 0) {
            // Update total pages
            setTotalPages(Math.ceil(previewData.length / recordsPerPage));

            // Calculate statistics
            const totalRecords = previewData.length;
            const validRecords = previewData.filter(item => !item._hasErrors).length;
            const invalidRecords = totalRecords - validRecords;

            // Calculate total revenue and expense
            let totalRevenue = 0;
            let totalExpense = 0;

            previewData.forEach(item => {
                if (item._hasErrors) return;

                try {
                    const amount = parseFloat(String(item['SỐ TIỀN']).replace(/[,.]/g, '')) || 0;

                    if (item['KHOẢN MỤC'] === 'DOANH THU') {
                        totalRevenue += amount;
                    } else if (item['KHOẢN MỤC'] === 'CHI PHÍ') {
                        totalExpense += amount;
                    }
                } catch (error) {
                    // Skip invalid amounts
                }
            });

            setStats({
                total: totalRecords,
                valid: validRecords,
                invalid: invalidRecords,
                revenue: totalRevenue,
                expense: totalExpense
            });
        }
    }, [previewData, recordsPerPage]);

    const getLastDayOfMonth = (month, year) => {
        return new Date(year, month + 1, 0);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);

        // Determine file type by extension
        const extension = file.name.split('.').pop().toLowerCase();
        setFileType(extension);

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    let jsonData = [];
                    const data = new Uint8Array(e.target.result);

                    if (extension === 'csv') {
                        // Parse CSV
                        const csv = XLSX.read(data, { type: 'array' });
                        // Get first sheet
                        const sheetName = csv.SheetNames[0];
                        const worksheet = csv.Sheets[sheetName];
                        // Convert to JSON
                        jsonData = XLSX.utils.sheet_to_json(worksheet);
                    } else {
                        // Parse Excel
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        jsonData = XLSX.utils.sheet_to_json(worksheet);
                    }

                    // Validate each row
                    const validationErrors = [];
                    const validatedData = jsonData.map((item, index) => {
                        const rowErrors = [];

                        // Check required fields
                        if (!item['NGÀY']) rowErrors.push(`Dòng ${index + 2}: Thiếu NGÀY`);
                        if (!item['ĐƠN VỊ']) rowErrors.push(`Dòng ${index + 2}: Thiếu ĐƠN VỊ`);
                        if (!item['KHOẢN MỤC']) rowErrors.push(`Dòng ${index + 2}: Thiếu KHOẢN MỤC`);
                        if (!item['PHÂN LOẠI']) rowErrors.push(`Dòng ${index + 2}: Thiếu PHÂN LOẠI`);
                        if (!item['HẠNG MỤC']) rowErrors.push(`Dòng ${index + 2}: Thiếu HẠNG MỤC`);
                        if (!item['SỐ TIỀN']) rowErrors.push(`Dòng ${index + 2}: Thiếu SỐ TIỀN`);

                        // Validate amount format
                        if (item['SỐ TIỀN'] && isNaN(Number(String(item['SỐ TIỀN']).replace(/[,.]/g, '')))) {
                            rowErrors.push(`Dòng ${index + 2}: SỐ TIỀN không đúng định dạng`);
                        }

                        // Validate KHOẢN MỤC values
                        if (item['KHOẢN MỤC'] && !['DOANH THU', 'CHI PHÍ'].includes(item['KHOẢN MỤC'])) {
                            rowErrors.push(`Dòng ${index + 2}: KHOẢN MỤC phải là "DOANH THU" hoặc "CHI PHÍ"`);
                        }

                        if (rowErrors.length > 0) {
                            validationErrors.push(...rowErrors);
                        }

                        // Format date for preview and convert to last day of month
                        let formattedDate = item['NGÀY'];
                        if (typeof item['NGÀY'] === 'number') {
                            // Excel date format
                            const excelDate = XLSX.SSF.parse_date_code(item['NGÀY']);
                            const lastDay = getLastDayOfMonth(excelDate.m - 1, excelDate.y);
                            formattedDate = lastDay.toISOString().split('T')[0];
                        } else if (typeof item['NGÀY'] === 'string') {
                            // String date format (DD/MM/YYYY)
                            const parts = item['NGÀY'].split(/[\/\-\.]/);
                            if (parts.length === 3) {
                                const day = parseInt(parts[0]);
                                const month = parseInt(parts[1]) - 1;
                                const year = parseInt(parts[2]);
                                const lastDay = getLastDayOfMonth(month, year);
                                formattedDate = lastDay.toISOString().split('T')[0];
                            }
                        }

                        // Create a new object with only the required fields
                        const cleanItem = {
                            'NGÀY': formattedDate,
                            'ĐƠN VỊ': item['ĐƠN VỊ'] || '',
                            'KHOẢN MỤC': item['KHOẢN MỤC'] || '',
                            'PHÂN LOẠI': item['PHÂN LOẠI'] || '',
                            'HẠNG MỤC': item['HẠNG MỤC'] || '',
                            'SỐ TIỀN': item['SỐ TIỀN'] || '',
                            'THỰC TẾ': item['THỰC TẾ'] || ''
                        };

                        return {
                            ...cleanItem,
                            '_row': index + 2, // Keep track of Excel row for error messages
                            '_hasErrors': rowErrors.length > 0
                        };
                    });

                    setPreviewData(validatedData);
                    setErrors(validationErrors);
                    setCurrentPage(1); // Reset to first page when new data is loaded
                    setLoading(false);
                } catch (error) {
                    console.error('Error parsing file:', error);
                    toast.error(`Lỗi khi đọc file ${extension.toUpperCase()}`);
                    setLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error reading file:', error);
            toast.error('Không thể đọc file');
            setLoading(false);
        }
    };

    const handleConfirmImport = () => {
        if (errors.length > 0) {
            toast.error('Vui lòng sửa lỗi trước khi nhập dữ liệu');
            return;
        }

        if (previewData.length === 0) {
            toast.error('Không có dữ liệu để nhập');
            return;
        }

        // Show loading state
        setIsImporting(true);

        // Prepare data for import - strip out internal fields and format date
        const cleanData = previewData.map(item => {
            const cleanItem = { ...item };
            delete cleanItem._row;
            delete cleanItem._hasErrors;

            // Convert date from YYYY-MM-DD to DD/MM/YYYY
            if (cleanItem['NGÀY']) {
                const [year, month, day] = cleanItem['NGÀY'].split('-');
                cleanItem['NGÀY'] = `${day}/${month}/${year}`;
            }

            return cleanItem;
        });

        // Pass data to parent component for actual import
        onImport(cleanData)
            .then(() => {
                // Modal sẽ được đóng bởi component cha
                // Không cần gọi onCancel ở đây
            })
            .catch(error => {
                console.error('Import error:', error);
                toast.error('Đã xảy ra lỗi khi nhập dữ liệu');
                setIsImporting(false);
            });
    }
    // Format currency for display
    const formatCurrency = (amount) => {
        if (!amount) return '0 ₫';

        try {
            const numAmount = typeof amount === 'number'
                ? amount
                : parseFloat(amount.toString().replace(/[,.]/g, ''));

            if (isNaN(numAmount)) return '—';

            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(numAmount);
        } catch (error) {
            return '—';
        }
    };

    // Pagination utils
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = previewData.slice(indexOfFirstRecord, indexOfLastRecord);

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

    // Export templates
    const exportExcelTemplate = () => {
        try {
            const template = [
                {
                    'NGÀY': '01/04/2025',
                    'ĐƠN VỊ': 'WOWS',
                    'KHOẢN MỤC': 'DOANH THU',
                    'PHÂN LOẠI': 'Phân loại mẫu',
                    'HẠNG MỤC': 'Hạng mục mẫu',
                    'SỐ TIỀN': 1000000,
                    'THỰC TẾ': '0'
                },
                {
                    'NGÀY': '01/04/2025',
                    'ĐƠN VỊ': 'WOWS',
                    'KHOẢN MỤC': 'DOANH THU',
                    'PHÂN LOẠI': 'Phân loại mẫu',
                    'HẠNG MỤC': 'Hạng mục mẫu',
                    'SỐ TIỀN': 1000000,
                    'THỰC TẾ': '0'
                }
            ];

            const ws = XLSX.utils.json_to_sheet(template);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");

            // Add column widths
            ws['!cols'] = [
                { wch: 12 }, // NGÀY
                { wch: 15 }, // ĐƠN VỊ
                { wch: 15 }, // KHOẢN MỤC
                { wch: 15 }, // PHÂN LOẠI
                { wch: 20 }, // HẠNG MỤC
                { wch: 12 }, // SỐ TIỀN
                { wch: 30 }  // THỰC TẾ
            ];

            XLSX.writeFile(wb, "Template_Ghi_Nhan.xlsx");
            toast.success('Đã tải xuống file Excel mẫu');
        } catch (error) {
            console.error('Error exporting template:', error);
            toast.error('Không thể tạo file mẫu');
        }
    };

    const exportCSVTemplate = () => {
        try {
            const template = [
                {
                    'NGÀY': '01/04/2025',
                    'ĐƠN VỊ': 'Đơn vị mẫu',
                    'KHOẢN MỤC': 'DOANH THU',
                    'PHÂN LOẠI': 'Phân loại mẫu',
                    'HẠNG MỤC': 'Hạng mục mẫu',
                    'SỐ TIỀN': 1000000,
                    'THỰC TẾ': '0'
                }
            ];

            const ws = XLSX.utils.json_to_sheet(template);
            const csv = XLSX.utils.sheet_to_csv(ws);

            // Create blob and download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', 'Template_Ghi_Nhan.csv');
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Đã tải xuống file CSV mẫu');
        } catch (error) {
            console.error('Error exporting CSV template:', error);
            toast.error('Không thể tạo file CSV mẫu');
        }
    };

    const handleEditRow = (rowIndex) => {
        setEditingRow(rowIndex);
        setEditedData(currentRecords[rowIndex]);
    };

    const handleSaveEdit = (rowIndex) => {
        const updatedData = [...previewData];
        const originalIndex = indexOfFirstRecord + rowIndex;
        
        // Validate edited data
        const errors = validateRow(editedData);
        if (errors.length > 0) {
            toast.error(errors.join('\n'));
            return;
        }

        updatedData[originalIndex] = {
            ...editedData,
            '_hasErrors': false
        };

        setPreviewData(updatedData);
        setEditingRow(null);
        setEditedData({});
        toast.success('Đã cập nhật dữ liệu thành công');
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
        setEditedData({});
    };

    const validateRow = (row) => {
        const errors = [];
        if (!row['NGÀY']) errors.push('Ngày không được để trống');
        if (!row['ĐƠN VỊ']) errors.push('Đơn vị không được để trống');
        if (!row['KHOẢN MỤC']) errors.push('Khoản mục không được để trống');
        if (!row['PHÂN LOẠI']) errors.push('Phân loại không được để trống');
        if (!row['HẠNG MỤC']) errors.push('Hạng mục không được để trống');
        if (!row['SỐ TIỀN']) errors.push('Số tiền không được để trống');
        
        if (row['KHOẢN MỤC'] && !['DOANH THU', 'CHI PHÍ'].includes(row['KHOẢN MỤC'])) {
            errors.push('Khoản mục phải là "DOANH THU" hoặc "CHI PHÍ"');
        }

        if (row['SỐ TIỀN'] && isNaN(Number(String(row['SỐ TIỀN']).replace(/[,.]/g, '')))) {
            errors.push('Số tiền không đúng định dạng');
        }

        return errors;
    };

    return (
        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5 sticky top-0 bg-white z-10">
                <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 text-indigo-600 mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">Nhập Dữ Liệu Từ Excel/CSV</h2>
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 hover:bg-gray-100 rounded-full"
                    disabled={isImporting}
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* File selector - chỉnh sửa để thêm các file mẫu có sẵn */}
            {!previewData.length && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center">
                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-700 mb-1">Chọn file để nhập dữ liệu</h3>
                        <p className="text-sm text-gray-500 mb-4">Hỗ trợ định dạng .xlsx, .xls và .csv</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors">
                                Chọn file
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                />
                            </label>
                           
                        </div>

                        {/* File mẫu có sẵn */}
                        <div className="mt-6 w-full max-w-md">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Hoặc tải file mẫu có sẵn:</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {sampleFileURLs.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => downloadSampleFile(file.url, `${file.name}.xlsx`)}
                                        className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Download className="h-4 w-4 text-indigo-600" />
                                        <span>{file.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* File Format Information - giữ nguyên */}
                    <div className="mt-8 bg-gray-50 rounded-lg p-4 max-w-2xl mx-auto">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Yêu cầu định dạng file:</h4>
                        <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                            <li>File phải có các cột: NGÀY, ĐƠN VỊ, KHOẢN MỤC, PHÂN LOẠI, HẠNG MỤC, SỐ TIỀN, THỰC TẾ</li>
                            <li>NGÀY phải có định dạng ngày (DD/MM/YYYY)</li>
                            <li>KHOẢN MỤC chỉ chấp nhận giá trị: "DOANH THU" hoặc "CHI PHÍ"</li>
                            <li>SỐ TIỀN phải là số, không chứa ký tự đặc biệt ngoài dấu phân cách (,.) </li>
                            <li>Tải về file mẫu để biết cách định dạng chính xác</li>
                        </ul>
                    </div>
                </div>
            )}


            {/* Loading indicator */}
            {loading && (
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-indigo-600">Đang xử lý file...</span>
                </div>
            )}

            {/* Data preview */}
            {previewData.length > 0 && !loading && (
                <div>
                    {/* Preview header with stats */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Xem trước dữ liệu</h3>
                                <p className="text-sm text-gray-500">
                                    File: <span className="font-medium">{fileName}</span>
                                    <span className="ml-1">({fileType.toUpperCase()}) •</span>
                                    <span className="ml-1">{stats.total} dòng dữ liệu</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setPreviewData([]);
                                        setFileName('');
                                        setErrors([]);
                                        setFileType('');
                                    }}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    disabled={isImporting}
                                >
                                    Chọn file khác
                                </button>
                            </div>
                        </div>

                        {/* Statistics cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tổng số dòng</p>
                                    <p className="text-lg font-semibold">{stats.total}</p>
                                </div>
                            </div>

                            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg mr-3">
                                    <Check className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Hợp lệ</p>
                                    <p className="text-lg font-semibold text-green-600">{stats.valid}</p>
                                </div>
                            </div>

                            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 flex items-center">
                                <div className="bg-red-100 p-2 rounded-lg mr-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Lỗi</p>
                                    <p className="text-lg font-semibold text-red-600">{stats.invalid}</p>
                                </div>
                            </div>

                            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3">
                                <p className="text-sm text-gray-500 mb-1">Tổng giá trị</p>
                                <div className="flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-green-600">Doanh thu:</span>
                                        <span className="text-sm font-medium">{formatCurrency(stats.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-red-600">Chi phí:</span>
                                        <span className="text-sm font-medium">{formatCurrency(stats.expense)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                <div>
                                    <h4 className="text-red-800 font-medium">Có {errors.length} lỗi cần được sửa:</h4>
                                    <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                                        {errors.slice(0, 5).map((error, idx) => (
                                            <li key={idx}>{error}</li>
                                        ))}
                                        {errors.length > 5 && (
                                            <li>...và {errors.length - 5} lỗi khác</li>
                                        )}
                                    </ul>
                                    <p className="text-xs text-red-600 mt-2">
                                        Vui lòng sửa các lỗi trong file và tải lại để tiếp tục
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table header */}
                    <div className="bg-gray-50 border border-gray-200 border-b-0 rounded-t-lg px-4 py-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-700">Dữ liệu chi tiết</h4>

                            <div className="flex items-center gap-2">
                                <select
                                    className="text-sm border border-gray-300 rounded p-1.5"
                                    value={recordsPerPage}
                                    onChange={(e) => {
                                        setRecordsPerPage(parseInt(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    disabled={isImporting}
                                >
                                    <option value="10">10 dòng</option>
                                    <option value="20">20 dòng</option>
                                    <option value="50">50 dòng</option>
                                    <option value="100">100 dòng</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Data table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-b-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoản mục</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phân loại</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng mục</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thực tế</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentRecords.map((item, index) => (
                                    <tr key={index} className={item._hasErrors ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{indexOfFirstRecord + index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {editingRow === index ? (
                                                <input
                                                    type="text"
                                                    value={editedData['NGÀY'] || ''}
                                                    onChange={(e) => setEditedData({...editedData, 'NGÀY': e.target.value})}
                                                    className="p-1 border rounded"
                                                />
                                            ) : item['NGÀY'] || '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {editingRow === index ? (
                                                <input
                                                    type="text"
                                                    value={editedData['ĐƠN VỊ'] || ''}
                                                    onChange={(e) => setEditedData({...editedData, 'ĐƠN VỊ': e.target.value})}
                                                    className="p-1 border rounded"
                                                />
                                            ) : item['ĐƠN VỊ'] || '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            {editingRow === index ? (
                                                <select
                                                    value={editedData['KHOẢN MỤC'] || ''}
                                                    onChange={(e) => setEditedData({...editedData, 'KHOẢN MỤC': e.target.value})}
                                                    className="p-1 border rounded"
                                                >
                                                    <option value="">Chọn khoản mục</option>
                                                    <option value="DOANH THU">DOANH THU</option>
                                                    <option value="CHI PHÍ">CHI PHÍ</option>
                                                </select>
                                            ) : item['KHOẢN MỤC'] ? (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    item['KHOẢN MỤC'] === 'DOANH THU'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {item['KHOẢN MỤC']}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {editingRow === index ? (
                                                <input
                                                    type="text"
                                                    value={editedData['PHÂN LOẠI'] || ''}
                                                    onChange={(e) => setEditedData({...editedData, 'PHÂN LOẠI': e.target.value})}
                                                    className="p-1 border rounded"
                                                />
                                            ) : item['PHÂN LOẠI'] || '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {editingRow === index ? (
                                                <input
                                                    type="text"
                                                    value={editedData['HẠNG MỤC'] || ''}
                                                    onChange={(e) => setEditedData({...editedData, 'HẠNG MỤC': e.target.value})}
                                                    className="p-1 border rounded"
                                                />
                                            ) : item['HẠNG MỤC'] || '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                                            {editingRow === index ? (
                                                <input
                                                    type="text"
                                                    value={editedData['SỐ TIỀN'] || ''}
                                                    onChange={(e) => setEditedData({...editedData, 'SỐ TIỀN': e.target.value})}
                                                    className="p-1 border rounded"
                                                />
                                            ) : formatCurrency(item['SỐ TIỀN'])}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {editingRow === index ? (
                                                <input
                                                    type="text"
                                                    value={editedData['THỰC TẾ'] || ''}
                                                    onChange={(e) => setEditedData({...editedData, 'THỰC TẾ': e.target.value})}
                                                    className="p-1 border rounded"
                                                />
                                            ) : item['THỰC TẾ'] || '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {editingRow === index ? (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(index)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Lưu"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Hủy"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditRow(index)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {currentRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-6 text-center text-sm text-gray-500">
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {previewData.length > recordsPerPage && (
                        <div className="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
                            <div className="flex items-center text-sm text-gray-700">
                                <span>
                                    Hiển thị <span className="font-medium">{indexOfFirstRecord + 1}</span> đến{' '}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastRecord, previewData.length)}
                                    </span>{' '}
                                    trong tổng số <span className="font-medium">{previewData.length}</span> dòng
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={prevPage}
                                        disabled={currentPage === 1 || isImporting}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 || isImporting
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">Trang trước</span>
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>

                                    {/* Page numbers */}
                                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                        let pageNum;

                                        // Calculate which page numbers to show
                                        if (totalPages <= 5) {
                                            // If 5 or fewer pages, show all
                                            pageNum = i + 1;
                                        } else {
                                            // If more than 5 pages, show proper window around current page
                                            if (currentPage <= 3) {
                                                // Near the start
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                // Near the end
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                // Somewhere in the middle
                                                pageNum = currentPage - 2 + i;
                                            }
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => paginate(pageNum)}
                                                disabled={isImporting}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    } ${isImporting ? 'cursor-not-allowed opacity-70' : ''}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={nextPage}
                                        disabled={currentPage === totalPages || isImporting}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages || isImporting
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

                    {/* Footer with action buttons */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={isImporting}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleConfirmImport}
                            disabled={errors.length > 0 || isImporting}
                            className={`px-5 py-2 text-white rounded-lg flex items-center gap-2 transition-colors ${errors.length > 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : isImporting
                                    ? 'bg-indigo-500 cursor-wait'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {isImporting ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Đang nhập dữ liệu...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    {errors.length > 0 ? 'Sửa lỗi để tiếp tục' : 'Xác nhận nhập dữ liệu'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExcelImporter;