// KHTNDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Printer, Building, User, DollarSign, ClipboardList, FileText, X, History, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import authUtils from '../utils/authUtils';

const KHTNDetails = () => {
    const { idCty } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [quoteHistory, setQuoteHistory] = useState([]);
    const [careHistory, setCareHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('company');
    const [selectedCare, setSelectedCare] = useState(null);
    const [showCareDetail, setShowCareDetail] = useState(false);
    
    useEffect(() => {
        loadAllData();
    }, [idCty]);
    const loadAllData = async () => {
        try {
            setLoading(true);

            // Load customer details
            const customerResponse = await authUtils.apiRequest('KHTN', 'Find', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh",
                    Selector: `Filter(KHTN, [ID_CTY] = '${idCty}')`
                }
            });

            if (customerResponse && customerResponse.length > 0) {
                setCustomer(customerResponse[0]);

                // Load quote history
                const quoteResponse = await authUtils.apiRequest('PO', 'Find', {
                    Properties: {
                        Locale: "vi-VN",
                        Timezone: "Asia/Ho_Chi_Minh",
                        Selector: `Filter(PO, [ID_CTY] = '${idCty}')`
                    }
                });

                if (quoteResponse) {
                    setQuoteHistory(quoteResponse);
                }

                // Load care history
                const careResponse = await authUtils.apiRequest('CSKH', 'Find', {
                    Properties: {
                        Locale: "vi-VN",
                        Timezone: "Asia/Ho_Chi_Minh",
                        Selector: `Filter(CSKH, [ID_CTY] = '${idCty}')`
                    }
                });

                if (careResponse) {
                    setCareHistory(careResponse);
                }
            } else {
                toast.error('Không tìm thấy thông tin khách hàng tiềm năng');
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin:', error);
            toast.error('Không thể tải thông tin khách hàng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'Chưa có';

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin khách hàng...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">!</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy thông tin</h2>
                    <p className="text-gray-600 mb-6">Không tìm thấy khách hàng với mã {idCty}</p>
                    <button
                        onClick={() => navigate('/khtn')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="mx-auto px-4 py-8">
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{customer['TÊN CÔNG TY']}</h1>
                            <p className="text-gray-500">ID: {customer['ID_CTY']}</p>
                        </div>
                        <div className="flex mt-4 md:mt-0 no-print">
                            <button
                                onClick={() => navigate('/khtn')}
                                className="inline-flex items-center px-4 py-2 mr-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Quay lại
                            </button>
                           
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6 no-print">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('company')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'company'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <Building className="h-4 w-4 mr-2" />
                                Thông tin công ty
                            </button>
                            <button
                                onClick={() => setActiveTab('contact')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'contact'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Người liên hệ
                            </button>
                            <button
                                onClick={() => setActiveTab('status')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'status'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Trạng thái & Nhu cầu
                            </button>
                            <button
                                onClick={() => setActiveTab('quotes')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'quotes'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Lịch sử báo giá ({quoteHistory.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('care')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'care'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Lịch sử CSKH ({careHistory.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'notes'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Ghi chú & Lịch sử
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div>
                        {/* Company Information Tab */}
                        {activeTab === 'company' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Thông tin công ty
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Tên công ty</p>
                                            <p className="font-medium">{customer['TÊN CÔNG TY'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Tên viết tắt</p>
                                            <p className="font-medium">{customer['TÊN VIẾT TẮT'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Email công ty</p>
                                            <p className="font-medium">{customer['EMAIL CÔNG TY'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Mã số thuế</p>
                                            <p className="font-medium">{customer['MST'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Ngày thành lập</p>
                                            <p className="font-medium">{formatDate(customer['NGÀY THÀNH LẬP CTY'])}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Thông tin liên hệ & địa chỉ
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                                            <p className="font-medium">{customer['ĐỊA CHỈ'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Ngày ghi nhận</p>
                                            <p className="font-medium">{formatDate(customer['NGÀY GHI NHẬN'])}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Nguồn</p>
                                            <p className="font-medium">{customer['NGUỒN'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Sales phụ trách</p>
                                            <p className="font-medium">{customer['SALES PHỤ TRÁCH'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Nhân viên chăm sóc</p>
                                            <p className="font-medium">{customer['NHÂN VIÊN CHĂM SÓC'] || 'Chưa có'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact Information Tab */}
                        {activeTab === 'contact' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Thông tin người liên hệ
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Người liên hệ</p>
                                            <p className="font-medium">{customer['NGƯỜI LIÊN HỆ'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                                            <p className="font-medium">{customer['SỐ ĐT NGƯỜI LIÊN HỆ'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Email</p>
                                            <p className="font-medium">{customer['EMAIL NGƯỜI LIÊN HỆ'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Chức vụ</p>
                                            <p className="font-medium">{customer['CHỨC VỤ'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Sinh nhật</p>
                                            <p className="font-medium">{formatDate(customer['SINH NHẬT NGƯỜI LIÊN HỆ'])}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Thông tin người giới thiệu
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Người giới thiệu</p>
                                            <p className="font-medium">{customer['TÊN NGƯỜI GIỚI THIỆU'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">SĐT người giới thiệu</p>
                                            <p className="font-medium">{customer['SỐ ĐT NGƯỜI GIỚI THIỆU'] || 'Chưa có'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status & Needs Tab */}
                        {activeTab === 'status' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Trạng thái
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                                            <p className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${customer['CHỐT THÀNH KH'] === 'Đã thành khách hàng'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {customer['CHỐT THÀNH KH'] || 'Khách hàng tiềm năng'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Ngày chốt thành KH</p>
                                            <p className="font-medium">{formatDate(customer['NGÀY CHỐT THÀNH KH'])}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Đánh giá tiềm năng</p>
                                            <p className="font-medium">{customer['ĐÁNH GIÁ TIỂM NĂNG'] || 'Chưa đánh giá'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Nhu cầu
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Nhu cầu</p>
                                            <p className="font-medium">{customer['NHU CẦU'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Ghi chú nhu cầu</p>
                                            <p className="font-medium whitespace-pre-wrap">{customer['GHI CHÚ NHU CẦU'] || 'Chưa có ghi chú nhu cầu'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Thông tin tài chính
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Số chứng từ</p>
                                            <p className="font-medium">{customer['SỐ CHỨNG TỪ'] || 'Chưa có'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Số tiền</p>
                                            <p className="font-medium">{formatCurrency(customer['SỐ TIỀN'])}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quote History Tab */}
                        {activeTab === 'quotes' && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Lịch sử báo giá
                                </h2>

                                {quoteHistory.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày báo giá</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số HĐ</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời hạn</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số buổi</th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {quoteHistory.map((quote) => (
                                                    <tr key={quote['ID_BBGTH']} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {quote['ID_BBGTH']}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(quote['NGÀY BÁO GIÁ'])}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {quote['SỐ HĐ'] || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {quote['THỜI HẠN'] || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {quote['SỐ BUỔI'] || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                            {formatCurrency(quote['TỔNG TIỀN'])}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                                        <p className="text-gray-500">Chưa có lịch sử báo giá nào</p>
                                    </div>
                                )}

                                {quoteHistory.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3">Chi tiết báo giá gần nhất</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Thời hạn báo giá</p>
                                                    <p className="font-medium">{formatDate(quoteHistory[0]['THỜI HẠN BÁO GIÁ'])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Ưu đãi</p>
                                                    <p className="font-medium">{quoteHistory[0]['ƯU ĐÃI'] || '0%'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Phần trăm VAT</p>
                                                    <p className="font-medium">{quoteHistory[0]['PT VAT'] || '10%'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Trước ưu đãi</p>
                                                    <p className="font-medium">{formatCurrency(quoteHistory[0]['TT TRƯỚC ƯU ĐÃI'])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Tiền ưu đãi</p>
                                                    <p className="font-medium">{formatCurrency(quoteHistory[0]['TT ƯU ĐÃI'])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Sau ưu đãi</p>
                                                    <p className="font-medium">{formatCurrency(quoteHistory[0]['TT SAU ƯU ĐÃI'])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Tiền VAT</p>
                                                    <p className="font-medium">{formatCurrency(quoteHistory[0]['TT VAT'])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Sau VAT</p>
                                                    <p className="font-medium">{formatCurrency(quoteHistory[0]['TT SAU VAT'])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                                                    <p className="font-medium text-green-600">{formatCurrency(quoteHistory[0]['TỔNG TIỀN'])}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Chi phí</p>
                                                    <p className="font-medium">{formatCurrency(quoteHistory[0]['CHI PHÍ'])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Phí duy trì</p>
                                                    <p className="font-medium">{formatCurrency(quoteHistory[0]['PHÍ DUY TRÌ'])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Phí public app</p>
                                                    <p className="font-medium">{formatCurrency(quoteHistory[0]['PHÍ PUBLIC APP'])}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Care History Tab */}
                        {activeTab === 'care' && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Lịch sử chăm sóc khách hàng
                                </h2>

                                {careHistory.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phân loại KH</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại chăm sóc</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày dự kiến</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày thực tế</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình thức</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {careHistory.map((care) => (
                                                    <tr key={care['ID KH_CSKH']} className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => {
                                                            // When clicking on a care history row, show detailed view
                                                            setSelectedCare(care);
                                                            setShowCareDetail(true);
                                                        }}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {care['ID KH_CSKH']}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {care['PHÂN LOẠI KH'] || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {care['LOẠI CHĂM SÓC'] || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(care['NGÀY DỰ KIẾN'])}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(care['NGÀY CHĂM THỰC TẾ'])}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {care['HÌNH THỨC'] || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                ${care['TRẠNG THÁI KH'] === 'Đã hoàn thành'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : care['TRẠNG THÁI KH'] === 'Đang tiến hành'
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {care['TRẠNG THÁI KH'] || 'Chưa thực hiện'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                                        <p className="text-gray-500">Chưa có lịch sử chăm sóc khách hàng nào</p>
                                    </div>
                                )}

                                {/* Modal for care details */}
                                {showCareDetail && selectedCare && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                                <h3 className="text-lg font-semibold text-gray-800">Chi tiết chăm sóc khách hàng</h3>
                                                <button
                                                    onClick={() => setShowCareDetail(false)}
                                                    className="text-gray-400 hover:text-gray-500"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">ID chăm sóc</p>
                                                        <p className="font-medium">{selectedCare['ID KH_CSKH']}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Phân loại khách hàng</p>
                                                        <p className="font-medium">{selectedCare['PHÂN LOẠI KH'] || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Loại chăm sóc</p>
                                                        <p className="font-medium">{selectedCare['LOẠI CHĂM SÓC'] || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Hình thức</p>
                                                        <p className="font-medium">{selectedCare['HÌNH THỨC'] || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Địa điểm</p>
                                                        <p className="font-medium">{selectedCare['ĐỊA ĐIỂM'] || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Ngày dự kiến</p>
                                                        <p className="font-medium">{formatDate(selectedCare['NGÀY DỰ KIẾN'])}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Ngày thực hiện</p>
                                                        <p className="font-medium">{formatDate(selectedCare['NGÀY CHĂM THỰC TẾ'])}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Dự kiến hoàn thành</p>
                                                        <p className="font-medium">{formatDate(selectedCare['DỰ KIẾN HOÀN THÀNH'])}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Người chăm sóc</p>
                                                        <p className="font-medium">{selectedCare['NGƯỜI CHĂM SÓC'] || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                                                        <p className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full 
                                                            ${selectedCare['TRẠNG THÁI KH'] === 'Đã hoàn thành'
                                                                ? 'bg-green-100 text-green-800'
                                                                : selectedCare['TRẠNG THÁI KH'] === 'Đang tiến hành'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {selectedCare['TRẠNG THÁI KH'] || 'Chưa thực hiện'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-500 mb-1">Dịch vụ quan tâm</p>
                                                    <p className="font-medium bg-gray-50 p-3 rounded-lg">
                                                        {selectedCare['DỊCH VỤ QUAN TÂM'] || '—'}
                                                    </p>
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-500 mb-1">Nội dung trao đổi</p>
                                                    <div className="bg-gray-50 p-3 rounded-lg min-h-[100px]">
                                                        <p className="whitespace-pre-wrap">{selectedCare['NỘI DUNG TRAO ĐỔI'] || '—'}</p>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-500 mb-1">Ghi chú nhu cầu</p>
                                                    <div className="bg-gray-50 p-3 rounded-lg min-h-[100px]">
                                                        <p className="whitespace-pre-wrap">{selectedCare['GHI CHÚ NHU CẦU'] || '—'}</p>
                                                    </div>
                                                </div>

                                                {selectedCare['HÌNH ẢNH'] && (
                                                    <div className="mb-4">
                                                        <p className="text-sm text-gray-500 mb-1">Hình ảnh</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                                            {selectedCare['HÌNH ẢNH'].split(',').map((imageUrl, index) => (
                                                                <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                                                    <img
                                                                        src={imageUrl.trim()}
                                                                        alt={`Hình ảnh ${index + 1}`}
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = 'https://via.placeholder.com/300x200?text=Không+tải+được+ảnh';
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                                                <button
                                                    onClick={() => setShowCareDetail(false)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                                >
                                                    Đóng
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes & History Tab */}
                        {activeTab === 'notes' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Ghi chú nhu cầu
                                    </h2>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[100px]">
                                        <p className="whitespace-pre-wrap">{customer['GHI CHÚ NHU CẦU'] || 'Chưa có ghi chú nhu cầu'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Lịch sử tiếp xúc
                                    </h2>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[100px]">
                                        <p className="whitespace-pre-wrap">{customer['LỊCH SỬ'] || 'Chưa có lịch sử tiếp xúc'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Tổng quan hoạt động
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                                            <div className="flex items-center">
                                                <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                    <User className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Lần tiếp xúc đầu tiên</p>
                                                    <p className="text-sm text-gray-500">Từ nguồn: {customer['NGUỒN'] || 'Không xác định'}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600">{formatDate(customer['NGÀY GHI NHẬN'])}</p>
                                        </div>

                                        {careHistory.length > 0 && (
                                            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="bg-green-100 p-2 rounded-full mr-3">
                                                        <Calendar className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Lần chăm sóc gần nhất</p>
                                                        <p className="text-sm text-gray-500">{careHistory[0]['LOẠI CHĂM SÓC'] || 'Chăm sóc khách hàng'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600">{formatDate(careHistory[0]['NGÀY CHĂM THỰC TẾ'])}</p>
                                            </div>
                                        )}

                                        {quoteHistory.length > 0 && (
                                            <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                                                        <DollarSign className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Báo giá gần nhất</p>
                                                        <p className="text-sm text-gray-500">Số HĐ: {quoteHistory[0]['SỐ HĐ'] || 'Chưa có'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600">{formatDate(quoteHistory[0]['NGÀY BÁO GIÁ'])}</p>
                                            </div>
                                        )}

                                        {customer['CHỐT THÀNH KH'] === 'Đã thành khách hàng' && (
                                            <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                                        <ClipboardList className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Chốt thành khách hàng</p>
                                                        <p className="text-sm text-gray-500">Sales phụ trách: {customer['SALES PHỤ TRÁCH'] || 'Không xác định'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600">{formatDate(customer['NGÀY CHỐT THÀNH KH'])}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          
            
        </div>
    );
};

export default KHTNDetails;