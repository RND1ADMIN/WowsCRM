import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Heart, RefreshCw, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authUtils from '../utils/authUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CSKHCalendar = () => {
    const [events, setEvents] = useState([]);
    const [cskhList, setCskhList] = useState([]);
    const [khtnList, setKhtnList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [eventSummary, setEventSummary] = useState({
        total: 0,
        planned: 0,
        completed: 0
    });
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateEvents, setDateEvents] = useState([]);
    const [showEventsModal, setShowEventsModal] = useState(false);

    const navigate = useNavigate();

    // Month names for display
    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Load CSKH data
                const cskhResponse = await authUtils.apiRequest('CSKH', 'Find', {
                    Properties: {
                        Locale: "vi-VN",
                        Timezone: "Asia/Ho_Chi_Minh",
                        Selector: "Filter(CSKH, true)"
                    }
                });

                if (cskhResponse) {
                    setCskhList(cskhResponse);
                }

                // Load KHTN data
                const khtnResponse = await authUtils.apiRequest('KHTN', 'Find', {
                    Properties: {
                        Locale: "vi-VN",
                        Timezone: "Asia/Ho_Chi_Minh",
                        Selector: "Filter(KHTN, true)"
                    }
                });

                if (khtnResponse) {
                    setKhtnList(khtnResponse);

                    // Process events after loading both data sets
                    if (cskhResponse) {
                        processEvents(cskhResponse, khtnResponse, currentMonth, currentYear);
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu:', error);
                setLoading(false);
                toast.error('Không thể tải dữ liệu lịch chăm sóc. Vui lòng thử lại sau.');
            }
        };

        loadData();
    }, []);

    // Process events when month or year changes
    useEffect(() => {
        if (cskhList.length > 0 && khtnList.length > 0) {
            processEvents(cskhList, khtnList, currentMonth, currentYear);
        }
    }, [currentMonth, currentYear]);

    // Get company name from ID
    const getCompanyName = (idCty) => {
        const company = khtnList.find(item => item['ID_CTY'] === idCty);
        return company ? company['TÊN CÔNG TY'] : 'Không xác định';
    };

    // Process events from CSKH data
    const processEvents = (cskhData, khtnData, month, year) => {
        const processedEvents = [];
        let plannedCount = 0;
        let completedCount = 0;
        let totalMonthCount = 0;

        cskhData.forEach(cskh => {
            // Process planned care dates
            if (cskh['NGÀY DỰ KIẾN']) {
                try {
                    const plannedDate = new Date(cskh['NGÀY DỰ KIẾN']);

                    // Check if the planned date's month matches the current month
                    if (plannedDate.getMonth() === month && plannedDate.getFullYear() === year) {
                        totalMonthCount++;

                        if (cskh['TRẠNG THÁI KH'] === 'Hoàn thành') {
                            completedCount++;
                        } else {
                            plannedCount++;
                        }

                        // Create event entry
                        processedEvents.push({
                            type: 'planned',
                            date: plannedDate,
                            company: cskh['TÊN CTY'],
                            companyId: cskh['ID_CTY'],
                            careType: cskh['LOẠI CHĂM SÓC'],
                            staff: cskh['NGƯỜI CHĂM SÓC'],
                            method: cskh['HÌNH THỨC'],
                            location: cskh['ĐỊA ĐIỂM'],
                            status: cskh['TRẠNG THÁI KH'],
                            id: cskh['ID KH_CSKH']
                        });
                    }
                } catch (error) {
                    console.error('Lỗi khi xử lý ngày dự kiến:', error);
                }
            }

            // Also process actual care dates if available
            if (cskh['NGÀY CHĂM THỰC TẾ']) {
                try {
                    const actualDate = new Date(cskh['NGÀY CHĂM THỰC TẾ']);

                    // Check if the actual date's month matches the current month
                    if (actualDate.getMonth() === month && actualDate.getFullYear() === year) {
                        // Only count if it wasn't already counted by planned date in the same month
                        const plannedDate = cskh['NGÀY DỰ KIẾN'] ? new Date(cskh['NGÀY DỰ KIẾN']) : null;
                        const alreadyCounted = plannedDate &&
                            plannedDate.getMonth() === month &&
                            plannedDate.getFullYear() === year;

                        if (!alreadyCounted) {
                            totalMonthCount++;
                            if (cskh['TRẠNG THÁI KH'] === 'Hoàn thành') {
                                completedCount++;
                            }
                        }

                        // Create event entry (if not already created for planned date on the same day)
                        const existingEvent = processedEvents.find(event =>
                            event.id === cskh['ID KH_CSKH'] &&
                            event.date.getDate() === actualDate.getDate()
                        );

                        if (!existingEvent) {
                            processedEvents.push({
                                type: 'actual',
                                date: actualDate,
                                company: cskh['TÊN CTY'],
                                companyId: cskh['ID_CTY'],
                                careType: cskh['LOẠI CHĂM SÓC'],
                                staff: cskh['NGƯỜI CHĂM SÓC'],
                                method: cskh['HÌNH THỨC'],
                                location: cskh['ĐỊA ĐIỂM'],
                                status: cskh['TRẠNG THÁI KH'],
                                id: cskh['ID KH_CSKH']
                            });
                        }
                    }
                } catch (error) {
                    console.error('Lỗi khi xử lý ngày chăm sóc thực tế:', error);
                }
            }
        });

        // Sort events by date
        processedEvents.sort((a, b) => a.date - b.date);

        setEvents(processedEvents);
        setEventSummary({
            total: totalMonthCount,
            planned: plannedCount,
            completed: completedCount
        });
    };

    // Generate calendar days for current month
    const generateCalendarDays = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
        let firstDayOfWeek = firstDay.getDay();
        // Adjust for Monday as first day of week
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({ day: null, events: [] });
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            // Find events for this day
            const dayEvents = events.filter(event => {
                return event.date.getDate() === day;
            });

            days.push({ day, date, events: dayEvents });
        }

        return days;
    };

    // Change month handlers
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Handle date click to show events
    const handleDateClick = (day) => {
        if (!day.day) return; // Skip empty cells

        setSelectedDate(day.date);
        setDateEvents(day.events);
        setShowEventsModal(true);
    };

    // Navigate to CSKH details
    const viewCSKHDetails = (id) => {
        navigate(`/cskh?idCskh=${id}`);
        setShowEventsModal(false);
    };

    // Navigate to company details
    const viewCompanyDetails = (idCty) => {
        navigate(`/khtn/${idCty}`);
        setShowEventsModal(false);
    };

    // Format date for display
    const formatDate = (date) => {
        if (!date) return '';

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    // Get status color class
    const getStatusColor = (status) => {
        switch (status) {
            case 'Hoàn thành':
                return 'bg-green-100 text-green-800';
            case 'Đang thực hiện':
                return 'bg-blue-100 text-blue-800';
            case 'Đã lên kế hoạch':
                return 'bg-amber-100 text-amber-800';
            case 'Hoãn lại':
                return 'bg-orange-100 text-orange-800';
            case 'Hủy bỏ':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            <Calendar className="w-6 h-6 mr-2 text-indigo-600" />
                            Lịch Chăm Sóc Khách Hàng
                        </h1>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate('/cskh')}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Users className="w-4 h-4" />
                                Quản lý CSKH
                            </button>
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    Promise.all([
                                        authUtils.apiRequest('CSKH', 'Find', {
                                            Properties: {
                                                Locale: "vi-VN",
                                                Timezone: "Asia/Ho_Chi_Minh",
                                                Selector: "Filter(CSKH, true)"
                                            }
                                        }),
                                        authUtils.apiRequest('KHTN', 'Find', {
                                            Properties: {
                                                Locale: "vi-VN",
                                                Timezone: "Asia/Ho_Chi_Minh",
                                                Selector: "Filter(KHTN, true)"
                                            }
                                        })
                                    ]).then(([cskhResponse, khtnResponse]) => {
                                        if (cskhResponse) setCskhList(cskhResponse);
                                        if (khtnResponse) {
                                            setKhtnList(khtnResponse);
                                            if (cskhResponse) {
                                                processEvents(cskhResponse, khtnResponse, currentMonth, currentYear);
                                            }
                                        }
                                        setLoading(false);
                                        toast.success('Đã cập nhật dữ liệu lịch chăm sóc');
                                    }).catch(error => {
                                        console.error('Lỗi khi làm mới dữ liệu:', error);
                                        setLoading(false);
                                        toast.error('Không thể cập nhật dữ liệu. Vui lòng thử lại sau.');
                                    });
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang tải...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Làm mới
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tháng hiện tại</h3>
                            <p className="text-2xl font-bold text-blue-800">
                                {monthNames[currentMonth]} {currentYear}
                            </p>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-center">
                            <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                <Heart className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-sm text-indigo-700 mb-1">Tổng số hoạt động</h3>
                                <p className="text-2xl font-bold text-indigo-800">{eventSummary.total}</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-center">
                            <div className="bg-amber-100 p-2 rounded-full mr-3">
                                <Calendar className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-sm text-amber-700 mb-1">Đã lên kế hoạch</h3>
                                <p className="text-2xl font-bold text-amber-800">{eventSummary.planned}</p>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center">
                            <div className="bg-green-100 p-2 rounded-full mr-3">
                                <RefreshCw className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-sm text-green-700 mb-1">Đã hoàn thành</h3>
                                <p className="text-2xl font-bold text-green-800">{eventSummary.completed}</p>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Controls */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2 rounded-full hover:bg-gray-100 transition"
                            title="Tháng trước"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-xl font-semibold">
                            {monthNames[currentMonth]} {currentYear}
                        </h2>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 rounded-full hover:bg-gray-100 transition"
                            title="Tháng sau"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center items-center h-60">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <div className="min-w-full">
                                {/* Weekday headers */}
                                <div className="grid grid-cols-7 gap-1 mb-1 text-center font-medium text-gray-700 bg-gray-50 rounded-lg">
                                    <div className="p-2">Thứ 2</div>
                                    <div className="p-2">Thứ 3</div>
                                    <div className="p-2">Thứ 4</div>
                                    <div className="p-2">Thứ 5</div>
                                    <div className="p-2">Thứ 6</div>
                                    <div className="p-2">Thứ 7</div>
                                    <div className="p-2">Chủ nhật</div>
                                </div>

                                {/* Calendar days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {generateCalendarDays().map((day, index) => {
                                        const isToday = day.date &&
                                            day.date.getDate() === new Date().getDate() &&
                                            day.date.getMonth() === new Date().getMonth() &&
                                            day.date.getFullYear() === new Date().getFullYear();

                                        const hasEvents = day.events && day.events.length > 0;

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => handleDateClick(day)}
                                                className={`
                          min-h-24 p-2 border rounded-lg transition-colors
                          ${!day.day ? 'bg-gray-50 border-gray-100' : 'border-gray-200 hover:bg-gray-50 cursor-pointer'} 
                          ${isToday ? 'border-indigo-300 bg-indigo-50' : ''}
                        `}
                                            >
                                                {day.day && (
                                                    <>
                                                        <div className={`text-right mb-1 ${isToday ? 'font-bold text-indigo-600' : ''}`}>
                                                            {day.day}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {day.events.map((event, eventIdx) => (
                                                                <div
                                                                    key={eventIdx}
                                                                    className={`
                                    text-xs p-1 rounded flex items-center font-medium truncate
                                    ${getStatusColor(event.status)}
                                  `}
                                                                    title={`${event.careType} - ${event.company} - ${event.status}`}
                                                                >
                                                                    <Heart className="h-3 w-3 mr-1 flex-shrink-0" />
                                                                    <span className="truncate">
                                                                        {event.careType || 'Chăm sóc KH'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Event list for current month */}
                    <div className="mt-8">
                        <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
                            Hoạt động chăm sóc trong tháng {monthNames[currentMonth]}
                        </h3>

                        {events.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {events.map((event, index) => (
                                    <div
                                        key={index}
                                        className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white"
                                        onClick={() => viewCSKHDetails(event.id)}
                                    >
                                        <div className="flex items-start">
                                            <div className={`p-3 rounded-full mr-4 flex-shrink-0 bg-indigo-100`}>
                                                <Heart className={`h-6 w-6 text-indigo-600`} />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-gray-500 text-sm">
                                                            {formatDate(event.date)}
                                                        </span>
                                                        <h4 className="font-medium text-gray-800 mt-1">
                                                            {event.careType || 'Chăm sóc khách hàng'}
                                                        </h4>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusColor(event.status)}`}>
                                                        {event.status || 'Đã lên kế hoạch'}
                                                    </span>
                                                </div>

                                                <div
                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        viewCompanyDetails(event.companyId);
                                                    }}
                                                >
                                                    {event.company}
                                                </div>

                                                {event.staff && (
                                                    <div className="flex items-center mt-2 text-sm text-gray-600">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {event.staff}
                                                    </div>
                                                )}

                                                {event.location && (
                                                    <div className="flex items-center mt-1 text-sm text-gray-600">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        {event.location}
                                                    </div>
                                                )}

                                                {event.method && (
                                                    <div className="mt-2 text-xs inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                                        {event.method}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                Không có hoạt động chăm sóc nào trong tháng này
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Day Events Modal */}
            {showEventsModal && selectedDate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="flex justify-between items-center border-b border-gray-200 p-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                Hoạt động ngày {formatDate(selectedDate)}
                            </h2>
                            <button
                                onClick={() => setShowEventsModal(false)}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 max-h-96 overflow-y-auto">
                            {dateEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {dateEvents.map((event, index) => (
                                        <div
                                            key={index}
                                            className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition bg-white"
                                            onClick={() => viewCSKHDetails(event.id)}
                                        >
                                            <div className="flex items-start">
                                                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                                    <Heart className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-medium text-gray-800">
                                                            {event.careType || 'Chăm sóc khách hàng'}
                                                        </h4>
                                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusColor(event.status)}`}>
                                                            {event.status || 'Đã lên kế hoạch'}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            viewCompanyDetails(event.companyId);
                                                        }}
                                                    >
                                                        {event.company}
                                                    </div>

                                                    {event.staff && (
                                                        <div className="flex items-center mt-2 text-sm text-gray-600">
                                                            <Users className="h-3 w-3 mr-1" />
                                                            {event.staff}
                                                        </div>
                                                    )}

                                                    {event.method && (
                                                        <div className="mt-2 text-xs inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                                            {event.method}
                                                        </div>
                                                    )}

                                                    {event.location && (
                                                        <div className="flex items-center mt-1 text-sm text-gray-600">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            {event.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    Không có hoạt động nào trong ngày này
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowEventsModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast container */}
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

export default CSKHCalendar;