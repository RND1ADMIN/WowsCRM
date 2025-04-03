import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';

const FinancialPlanningForm = () => {
    // State cho form chính
    const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
    const [totalAmount, setTotalAmount] = useState('');
    const [formattedTotalAmount, setFormattedTotalAmount] = useState('');
    
    // State cho phân bổ quý
    const [quarterAllocations, setQuarterAllocations] = useState({
        q1: 0, q2: 0, q3: 0, q4: 0
    });
    const [quarterAmounts, setQuarterAmounts] = useState({
        q1: 0, q2: 0, q3: 0, q4: 0
    });
    const [remainingQuarterPercentage, setRemainingQuarterPercentage] = useState(100);
    const [remainingQuarterAmount, setRemainingQuarterAmount] = useState(0);
    
    // State cho phân bổ tháng
    const [monthAllocations, setMonthAllocations] = useState({
        m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, 
        m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0
    });
    const [monthAmounts, setMonthAmounts] = useState({
        m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, 
        m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0
    });
    const [remainingMonthPercentages, setRemainingMonthPercentages] = useState({
        q1: 100, q2: 100, q3: 100, q4: 100
    });
    const [remainingMonthAmounts, setRemainingMonthAmounts] = useState({
        q1: 0, q2: 0, q3: 0, q4: 0
    });
    
    // State cho tabs
    const [activeTab, setActiveTab] = useState('mang');
    
    // Dữ liệu phân bổ
    const phanBoInfo = [
        { LoaiPhanBo: "Phân bổ doanh thu theo mảng", ChiTiet: "LEA Tiếng Anh trung tâm" },
        { LoaiPhanBo: "Phân bổ doanh thu theo mảng", ChiTiet: "LEA Tiếng Anh theo yêu cầu" },
        { LoaiPhanBo: "Phân bổ doanh thu theo mảng", ChiTiet: "LEA Tiếng Anh doanh nghiệp" },
        { LoaiPhanBo: "Phân bổ doanh thu theo mảng", ChiTiet: "VIS Tư vấn doanh nghiệp" },
        { LoaiPhanBo: "Phân bổ doanh thu theo mảng", ChiTiet: "VIS Phần mềm" },
        { LoaiPhanBo: "Phân bổ doanh thu theo mảng", ChiTiet: "VIS Tuyển dụng" },
        { LoaiPhanBo: "Phân bổ doanh thu theo mảng", ChiTiet: "LEA Doanh thu LEA khác" },
        { LoaiPhanBo: "Phân bổ doanh thu theo mảng", ChiTiet: "VIS Doanh thu VIS khác" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nhân viên", ChiTiet: "Lã Văn Tiến" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nhân viên", ChiTiet: "Đỗ Thị Kim Thuỷ" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nhân viên", ChiTiet: "Trần Thị Cẩm Nhung" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nhân viên", ChiTiet: "Nguyễn Thị Mỹ Diên" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nhân viên", ChiTiet: "Huỳnh Anh Tuấn" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nguồn", ChiTiet: "01. Tìm kiếm online" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nguồn", ChiTiet: "02. Giới thiệu/ Cộng tác viên" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nguồn", ChiTiet: "03. Sự kiện trực tiếp" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nguồn", ChiTiet: "04. KH cũ đăng ký lại" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nguồn", ChiTiet: "05. Quảng cáo ngoài trời" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nguồn", ChiTiet: "06. Hiệp hội" },
        { LoaiPhanBo: "Phân bổ doanh thu theo nguồn", ChiTiet: "07. Khác" }
    ];
    
    // State cho dữ liệu phân bổ
    const [phanBoValues, setPhanBoValues] = useState({});
    const [phanBoAmounts, setPhanBoAmounts] = useState({});
    
    // State cho tổng phần trăm và số tiền phân bổ
    const [totals, setTotals] = useState({
        mang: { percent: 0, amount: 0 },
        nhanvien: { percent: 0, amount: 0 },
        nguon: { percent: 0, amount: 0 }
    });
    
    // State cho phần còn lại phải phân bổ
    const [remainings, setRemainings] = useState({
        mang: { percent: 100, amount: 0 },
        nhanvien: { percent: 100, amount: 0 },
        nguon: { percent: 100, amount: 0 }
    });
    
    // State cho loading
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        initializePhanBoValues();
    }, []);
    
    // Khởi tạo giá trị phân bổ
    const initializePhanBoValues = () => {
        const initialValues = {};
        const initialAmounts = {};
        
        phanBoInfo.forEach((item, index) => {
            initialValues[`phanBo${index}`] = 0;
            initialAmounts[`phanBo${index}`] = 0;
        });
        
        setPhanBoValues(initialValues);
        setPhanBoAmounts(initialAmounts);
    };
    
    // Định dạng tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
        }).format(amount);
    };
    
    // Parse số tiền từ chuỗi đã định dạng
    const parseAmount = (value) => {
        return parseFloat(value.replace(/[^\d]/g, '')) || 0;
    };
    
    // Xử lý thay đổi tổng số tiền
    const handleTotalAmountChange = (e) => {
        const rawValue = e.target.value.replace(/[^\d]/g, '');
        setTotalAmount(rawValue);
        
        if (rawValue) {
            const formattedValue = formatCurrency(rawValue);
            setFormattedTotalAmount(formattedValue);
        } else {
            setFormattedTotalAmount('');
        }
        
        updateCalculations(rawValue);
    };
    
    // Cập nhật tất cả các tính toán
    const updateCalculations = (rawAmount = totalAmount) => {
        const amount = parseFloat(rawAmount) || 0;
        
        // Cập nhật số tiền quý
        updateQuarterAmounts(amount);
        
        // Cập nhật số tiền tháng
        updateMonthAmounts(amount);
        
        // Cập nhật số tiền phân bổ
        updatePhanBoAmounts(amount);
    };
    
    // Xử lý thay đổi phân bổ quý
    const handleQuarterChange = (quarter, value) => {
        const parsedValue = parseFloat(value) || 0;
        
        setQuarterAllocations(prev => ({
            ...prev,
            [quarter]: parsedValue
        }));
        
        const newQuarterAllocations = {
            ...quarterAllocations,
            [quarter]: parsedValue
        };
        
        updateQuarterAmounts(totalAmount, newQuarterAllocations);
    };
    
    // Cập nhật số tiền quý
    const updateQuarterAmounts = (amount, quarters = quarterAllocations) => {
        const newQuarterAmounts = {};
        let totalPercentage = 0;
        
        Object.entries(quarters).forEach(([quarter, percentage]) => {
            totalPercentage += percentage;
            newQuarterAmounts[quarter] = amount * (percentage / 100);
        });
        
        setQuarterAmounts(newQuarterAmounts);
        setRemainingQuarterPercentage(100 - totalPercentage);
        setRemainingQuarterAmount(amount * ((100 - totalPercentage) / 100));
        
        // Cập nhật lại phân bổ tháng khi thay đổi quý
        updateMonthAmounts(amount, quarters);
    };
    
    // Xử lý thay đổi phân bổ tháng
    const handleMonthChange = (month, value, quarterIndex) => {
        const parsedValue = parseFloat(value) || 0;
        
        setMonthAllocations(prev => ({
            ...prev,
            [month]: parsedValue
        }));
        
        updateMonthAmounts(totalAmount, quarterAllocations, {
            ...monthAllocations,
            [month]: parsedValue
        }, quarterIndex);
    };
    
    // Cập nhật số tiền tháng
    const updateMonthAmounts = (amount, quarters = quarterAllocations, months = monthAllocations, specificQuarter = null) => {
        const newMonthAmounts = { ...monthAmounts };
        const newRemainingMonthPercentages = { ...remainingMonthPercentages };
        const newRemainingMonthAmounts = { ...remainingMonthAmounts };
        
        // Cập nhật cho tất cả các quý hoặc chỉ quý cụ thể
        const quartersToUpdate = specificQuarter !== null 
            ? [`q${specificQuarter + 1}`] 
            : ['q1', 'q2', 'q3', 'q4'];
        
        quartersToUpdate.forEach(quarter => {
            const quarterIndex = parseInt(quarter.substr(1), 10) - 1;
            const quarterPercentage = quarters[quarter] || 0;
            const quarterAmount = amount * (quarterPercentage / 100);
            
            let totalMonthPercentage = 0;
            
            // Tính toán cho 3 tháng trong quý
            for (let i = 1; i <= 3; i++) {
                const monthIndex = quarterIndex * 3 + i;
                const monthKey = `m${monthIndex}`;
                const monthPercentage = months[monthKey] || 0;
                
                totalMonthPercentage += monthPercentage;
                newMonthAmounts[monthKey] = quarterAmount * (monthPercentage / 100);
            }
            
            // Cập nhật phần còn lại của quý
            newRemainingMonthPercentages[quarter] = 100 - totalMonthPercentage;
            newRemainingMonthAmounts[quarter] = quarterAmount * ((100 - totalMonthPercentage) / 100);
        });
        
        setMonthAmounts(newMonthAmounts);
        setRemainingMonthPercentages(newRemainingMonthPercentages);
        setRemainingMonthAmounts(newRemainingMonthAmounts);
    };
    
    // Xử lý thay đổi phân bổ
    const handlePhanBoChange = (index, value) => {
        const parsedValue = parseFloat(value) || 0;
        
        setPhanBoValues(prev => ({
            ...prev,
            [`phanBo${index}`]: parsedValue
        }));
        
        updatePhanBoAmounts(totalAmount, {
            ...phanBoValues,
            [`phanBo${index}`]: parsedValue
        });
    };
    
    // Cập nhật số tiền phân bổ
    const updatePhanBoAmounts = (amount, values = phanBoValues) => {
        const newPhanBoAmounts = {};
        const newTotals = {
            mang: { percent: 0, amount: 0 },
            nhanvien: { percent: 0, amount: 0 },
            nguon: { percent: 0, amount: 0 }
        };
        
        phanBoInfo.forEach((item, index) => {
            const key = `phanBo${index}`;
            const percentage = values[key] || 0;
            const phanBoAmount = amount * (percentage / 100);
            
            newPhanBoAmounts[key] = phanBoAmount;
            
            // Phân loại theo mảng
            if (item.LoaiPhanBo === "Phân bổ doanh thu theo mảng") {
                newTotals.mang.percent += percentage;
                newTotals.mang.amount += phanBoAmount;
            }
            // Phân loại theo nhân viên
            else if (item.LoaiPhanBo === "Phân bổ doanh thu theo nhân viên") {
                newTotals.nhanvien.percent += percentage;
                newTotals.nhanvien.amount += phanBoAmount;
            }
            // Phân loại theo nguồn
            else if (item.LoaiPhanBo === "Phân bổ doanh thu theo nguồn") {
                newTotals.nguon.percent += percentage;
                newTotals.nguon.amount += phanBoAmount;
            }
        });
        
        setPhanBoAmounts(newPhanBoAmounts);
        setTotals(newTotals);
        
        // Cập nhật phần còn lại phải phân bổ
        setRemainings({
            mang: { 
                percent: 100 - newTotals.mang.percent,
                amount: amount * ((100 - newTotals.mang.percent) / 100)
            },
            nhanvien: { 
                percent: 100 - newTotals.nhanvien.percent,
                amount: amount * ((100 - newTotals.nhanvien.percent) / 100)
            },
            nguon: { 
                percent: 100 - newTotals.nguon.percent,
                amount: amount * ((100 - newTotals.nguon.percent) / 100)
            }
        });
    };
    
    // Gửi dữ liệu lên AppSheet
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            
            // Kiểm tra dữ liệu trước khi gửi
            if (!fiscalYear) {
                toast.error('Vui lòng nhập năm tài chính');
                setIsSubmitting(false);
                return;
            }
            
            if (!totalAmount || parseFloat(totalAmount) <= 0) {
                toast.error('Vui lòng nhập tổng số tiền hợp lệ');
                setIsSubmitting(false);
                return;
            }
            
            // Chuẩn bị dữ liệu cho FormPhanbo
            const duAnData = {
                "Năm Phân Bổ": fiscalYear,
                "Số tiền": parseFloat(totalAmount),
                "Quý 1": quarterAllocations.q1 / 100,
                "Quý 2": quarterAllocations.q2 / 100,
                "Quý 3": quarterAllocations.q3 / 100,
                "Quý 4": quarterAllocations.q4 / 100,
                "Tháng 1": monthAllocations.m1 / 100,
                "Tháng 2": monthAllocations.m2 / 100,
                "Tháng 3": monthAllocations.m3 / 100,
                "Tháng 4": monthAllocations.m4 / 100,
                "Tháng 5": monthAllocations.m5 / 100,
                "Tháng 6": monthAllocations.m6 / 100,
                "Tháng 7": monthAllocations.m7 / 100,
                "Tháng 8": monthAllocations.m8 / 100,
                "Tháng 9": monthAllocations.m9 / 100,
                "Tháng 10": monthAllocations.m10 / 100,
                "Tháng 11": monthAllocations.m11 / 100,
                "Tháng 12": monthAllocations.m12 / 100
            };
            
            // Gửi dữ liệu FormPhanbo
            const duAnResponse = await authUtils.apiRequest_HIEU_XUAT('FormPhanbo', 'Add', {
                Rows: [duAnData]
            });
            
            // Chuẩn bị dữ liệu cho PHANBODT
            const phanBoDuAnData = phanBoInfo.map((item, index) => ({
                'Năm phân bổ': duAnData["Năm Phân Bổ"],
                'Loại Phân Bổ': item.LoaiPhanBo,
                'Chi Tiết': item.ChiTiet,
                '%Năm': (phanBoValues[`phanBo${index}`] || 0) / 100
            }));
            
            // Gửi dữ liệu PHANBODT
            const phanBoDuAnResponse = await authUtils.apiRequest_HIEU_XUAT('PHANBODT', 'Add', {
                Rows: phanBoDuAnData
            });
            
            toast.success('Gửi dữ liệu thành công!');
            
            // Reset form sau khi gửi thành công (tuỳ chọn)
            // resetForm();
            
        } catch (error) {
            console.error('Error submitting data:', error);
            toast.error('Lỗi khi gửi dữ liệu: ' + (error.message || 'Không xác định'));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Optional: Reset form
    const resetForm = () => {
        setFiscalYear(new Date().getFullYear());
        setTotalAmount('');
        setFormattedTotalAmount('');
        setQuarterAllocations({ q1: 0, q2: 0, q3: 0, q4: 0 });
        setMonthAllocations({
            m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, 
            m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0
        });
        initializePhanBoValues();
    };
    
    return (
        <div className="bg-gradient-to-r p-4 py-8">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-8xl w-full mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">Biểu mẫu Phân bổ Năm Tài chính</h1>
                
                <div className="space-y-8">
                    {/* Form chính */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label htmlFor="fiscalYear" className="block text-sm font-medium text-gray-700">
                                Năm Tài chính
                            </label>
                            <input
                                type="number"
                                id="fiscalYear"
                                value={fiscalYear}
                                onChange={(e) => setFiscalYear(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg p-2 border"
                                placeholder="Nhập năm tài chính"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
                                Tổng số tiền
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    type="text"
                                    id="totalAmount"
                                    value={formattedTotalAmount}
                                    onChange={handleTotalAmountChange}
                                    className="block w-full pr-12 rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg p-2 border"
                                    placeholder="0"
                                    required
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-lg">VNĐ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Phân bổ Quý */}
                    <div className="space-y-4 bg-blue-50 p-6 rounded-lg">
                        <h2 className="text-2xl font-semibold text-blue-800">Phân bổ Quý</h2>
                        <p className="text-blue-600 font-medium text-lg">
                            Còn phải phân bổ: {remainingQuarterPercentage.toFixed(2)}% ({formatCurrency(remainingQuarterAmount)})
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {['q1', 'q2', 'q3', 'q4'].map((quarter, idx) => (
                                <div key={quarter} className="space-y-2">
                                    <label htmlFor={quarter} className="block text-sm font-medium text-gray-700">
                                        %Quý {idx + 1}
                                    </label>
                                    <input
                                        type="number"
                                        id={quarter}
                                        value={quarterAllocations[quarter] || ''}
                                        onChange={(e) => handleQuarterChange(quarter, e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg p-2 border"
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                    />
                                    <p className="mt-1 text-sm text-gray-600 font-medium">
                                        {formatCurrency(quarterAmounts[quarter] || 0)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Phân bổ Tháng */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-blue-800">Phân bổ Tháng</h2>
                        
                        {/* Hiển thị phân bổ tháng cho từng quý có phần trăm > 0 */}
                        {Object.entries(quarterAllocations).map(([quarter, percentage], quarterIdx) => {
                            if (percentage <= 0) return null;
                            
                            const quarterAmount = quarterAmounts[quarter] || 0;
                            const quarterName = `Quý ${quarterIdx + 1}`;
                            
                            return (
                                <div key={quarter} className="bg-blue-50 p-6 rounded-lg space-y-4">
                                    <h3 className="text-xl font-semibold text-blue-700">
                                        {quarterName} ({formatCurrency(quarterAmount)})
                                    </h3>
                                    <p className="text-blue-600 font-medium">
                                        Còn phải phân bổ: {remainingMonthPercentages[quarter].toFixed(2)}% 
                                        ({formatCurrency(remainingMonthAmounts[quarter])})
                                    </p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[1, 2, 3].map((monthOffset) => {
                                            const monthIdx = quarterIdx * 3 + monthOffset;
                                            const monthKey = `m${monthIdx}`;
                                            
                                            return (
                                                <div key={monthKey} className="space-y-2">
                                                    <label htmlFor={monthKey} className="block text-sm font-medium text-gray-700">
                                                        %Tháng {monthIdx}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id={monthKey}
                                                        value={monthAllocations[monthKey] || ''}
                                                        onChange={(e) => handleMonthChange(monthKey, e.target.value, quarterIdx)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg p-2 border"
                                                        placeholder="0"
                                                        min="0"
                                                        max="100"
                                                    />
                                                    <p className="mt-1 text-sm text-gray-600 font-medium">
                                                        {formatCurrency(monthAmounts[monthKey] || 0)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Tabs phân bổ */}
                    <div className="mt-8">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex" aria-label="Tabs">
                                {['mang', 'nhanvien', 'nguon'].map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        className={`tab-button bg-white inline-block p-4 text-blue-600 hover:text-blue-800 font-medium ${
                                            activeTab === tab ? 'border-b-2 border-blue-500' : ''
                                        }`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab === 'mang' ? 'Phân bổ theo mảng' : 
                                         tab === 'nhanvien' ? 'Phân bổ theo nhân viên' : 
                                         'Phân bổ theo nguồn'}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        <div className="mt-4">
                            {/* Tab Mảng */}
                            <div className={activeTab === 'mang' ? 'block' : 'hidden'}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Chi tiết
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                % Năm
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Số tiền
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {phanBoInfo
                                            .filter(item => item.LoaiPhanBo === "Phân bổ doanh thu theo mảng")
                                            .map((item, idx) => {
                                                const index = phanBoInfo.findIndex(x => x.ChiTiet === item.ChiTiet);
                                                return (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {item.ChiTiet}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <input
                                                                type="number"
                                                                id={`phanBo${index}`}
                                                                value={phanBoValues[`phanBo${index}`] || ''}
                                                                onChange={(e) => handlePhanBoChange(index, e.target.value)}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatCurrency(phanBoAmounts[`phanBo${index}`] || 0)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        
                                        {/* Hàng tổng cộng */}
                                        <tr className="bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                Tổng cộng
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {totals.mang.percent.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {formatCurrency(totals.mang.amount)}
                                            </td>
                                        </tr>
                                        
                                        {/* Hàng còn phải phân bổ */}
                                        <tr className="bg-blue-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                                                Còn phải phân bổ
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                                                {remainings.mang.percent.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                                                {formatCurrency(remainings.mang.amount)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Tab Nhân viên */}
                            <div className={activeTab === 'nhanvien' ? 'block' : 'hidden'}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Chi tiết
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                % Năm
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Số tiền
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {phanBoInfo
                                            .filter(item => item.LoaiPhanBo === "Phân bổ doanh thu theo nhân viên")
                                            .map((item, idx) => {
                                                const index = phanBoInfo.findIndex(x => x.ChiTiet === item.ChiTiet);
                                                return (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {item.ChiTiet}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <input
                                                                type="number"
                                                                id={`phanBo${index}`}
                                                                value={phanBoValues[`phanBo${index}`] || ''}
                                                                onChange={(e) => handlePhanBoChange(index, e.target.value)}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatCurrency(phanBoAmounts[`phanBo${index}`] || 0)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        
                                        {/* Hàng tổng cộng */}
                                        <tr className="bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                Tổng cộng
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {totals.nhanvien.percent.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {formatCurrency(totals.nhanvien.amount)}
                                            </td>
                                        </tr>
                                        
                                        {/* Hàng còn phải phân bổ */}
                                        <tr className="bg-blue-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                                                Còn phải phân bổ
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                                                {remainings.nhanvien.percent.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                                                {formatCurrency(remainings.nhanvien.amount)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Tab Nguồn */}
                            <div className={activeTab === 'nguon' ? 'block' : 'hidden'}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Chi tiết
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                % Năm
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Số tiền
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {phanBoInfo
                                            .filter(item => item.LoaiPhanBo === "Phân bổ doanh thu theo nguồn")
                                            .map((item, idx) => {
                                                const index = phanBoInfo.findIndex(x => x.ChiTiet === item.ChiTiet);
                                                return (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {item.ChiTiet}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <input
                                                                type="number"
                                                                id={`phanBo${index}`}
                                                                value={phanBoValues[`phanBo${index}`] || ''}
                                                                onChange={(e) => handlePhanBoChange(index, e.target.value)}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatCurrency(phanBoAmounts[`phanBo${index}`] || 0)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        
                                        {/* Hàng tổng cộng */}
                                        <tr className="bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                Tổng cộng
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {totals.nguon.percent.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {formatCurrency(totals.nguon.amount)}
                                            </td>
                                        </tr>
                                        
                                        {/* Hàng còn phải phân bổ */}
                                        <tr className="bg-blue-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                                                Còn phải phân bổ
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                                                {remainings.nguon.percent.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                                                {formatCurrency(remainings.nguon.amount)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    {/* Button Gửi */}
                    <div className="flex justify-center mt-8">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`px-6 py-3 ${
                                isSubmitting 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 flex items-center gap-2`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang gửi dữ liệu...
                                </>
                            ) : (
                                'Gửi dữ liệu lên AppSheet'
                            )}
                        </button>
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
        </div>
    );
};

export default FinancialPlanningForm;