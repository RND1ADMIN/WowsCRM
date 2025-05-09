import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Gift, Cake, Users, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authUtils from '../utils/authUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const KHTNCalendar = () => {
  const [events, setEvents] = useState([]);
  const [khtnList, setKhtnList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [eventSummary, setEventSummary] = useState({ birthdays: 0, foundingDays: 0 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateEvents, setDateEvents] = useState([]);
  const [showEventsModal, setShowEventsModal] = useState(false);
  
  const navigate = useNavigate();

  // Month names for display
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Load KHTN data
  useEffect(() => {
    const loadKHTNList = async () => {
      try {
        setLoading(true);
        const response = await authUtils.apiRequest('KHTN', 'Find', {
          Properties: {
            Locale: "vi-VN",
            Timezone: "Asia/Ho_Chi_Minh",
            Selector: "Filter(KHTN, true)"
          }
        });

        if (response) {
          setKhtnList(response);
          processEvents(response, currentMonth, currentYear);
        }
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải danh sách KHTN:', error);
        setLoading(false);
        toast.error('Không thể tải danh sách khách hàng tiềm năng. Vui lòng thử lại sau.');
      }
    };

    loadKHTNList();
  }, []);

  // Process events when month or year changes
  useEffect(() => {
    if (khtnList.length > 0) {
      processEvents(khtnList, currentMonth, currentYear);
    }
  }, [currentMonth, currentYear]);

  // Process events from KHTN data
  const processEvents = (data, month, year) => {
    const processedEvents = [];
    let birthdayCount = 0;
    let foundingDayCount = 0;

    data.forEach(khtn => {
      // Process company founding dates
      if (khtn['NGÀY THÀNH LẬP CTY']) {
        try {
          const foundingDate = new Date(khtn['NGÀY THÀNH LẬP CTY']);
          
          // Check if the founding date's month matches the current month
          if (foundingDate.getMonth() === month) {
            foundingDayCount++;
            
            // Create a new date with the current year but same month and day
            const eventDate = new Date(year, foundingDate.getMonth(), foundingDate.getDate());
            
            processedEvents.push({
              type: 'founding',
              date: eventDate,
              company: khtn['TÊN CÔNG TY'],
              contact: khtn['NGƯỜI LIÊN HỆ'],
              phone: khtn['SỐ ĐT NGƯỜI LIÊN HỆ'],
              originalDate: foundingDate,
              age: year - foundingDate.getFullYear(),
              id: khtn['ID_CTY']
            });
          }
        } catch (error) {
          console.error('Lỗi khi xử lý ngày thành lập công ty:', error);
        }
      }

      // Process contact birthdays
      if (khtn['SINH NHẬT NGƯỜI LIÊN HỆ']) {
        try {
          const birthDate = new Date(khtn['SINH NHẬT NGƯỜI LIÊN HỆ']);
          
          // Check if the birth date's month matches the current month
          if (birthDate.getMonth() === month) {
            birthdayCount++;
            
            // Create a new date with the current year but same month and day
            const eventDate = new Date(year, birthDate.getMonth(), birthDate.getDate());
            
            processedEvents.push({
              type: 'birthday',
              date: eventDate,
              company: khtn['TÊN CÔNG TY'],
              contact: khtn['NGƯỜI LIÊN HỆ'],
              phone: khtn['SỐ ĐT NGƯỜI LIÊN HỆ'],
              originalDate: birthDate,
              age: year - birthDate.getFullYear(),
              id: khtn['ID_CTY']
            });
          }
        } catch (error) {
          console.error('Lỗi khi xử lý ngày sinh nhật:', error);
        }
      }
    });

    // Sort events by date
    processedEvents.sort((a, b) => a.date - b.date);
    
    setEvents(processedEvents);
    setEventSummary({
      birthdays: birthdayCount,
      foundingDays: foundingDayCount
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

  // Navigate to client details
  const viewClientDetails = (idCty) => {
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

  return (
    <div className=" h-[calc(100vh-7rem)]">
      <div className="mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-indigo-600" />
              Lịch Sự Kiện Khách Hàng
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/khtn')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
              >
                <Users className="w-4 h-4" />
                Quản lý KHTN
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm text-blue-700 mb-1">Tháng hiện tại</h3>
              <p className="text-2xl font-bold text-blue-800">
                {monthNames[currentMonth]} {currentYear}
              </p>
            </div>

            <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 flex items-center">
              <div className="bg-pink-100 p-2 rounded-full mr-3">
                <Cake className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="text-sm text-pink-700 mb-1">Sinh nhật trong tháng</h3>
                <p className="text-2xl font-bold text-pink-800">{eventSummary.birthdays} người</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm text-purple-700 mb-1">Kỷ niệm thành lập</h3>
                <p className="text-2xl font-bold text-purple-800">{eventSummary.foundingDays} công ty</p>
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
                                    ${event.type === 'birthday' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'}
                                  `}
                                  title={event.type === 'birthday' 
                                    ? `Sinh nhật của ${event.contact} - ${event.company}`
                                    : `Kỷ niệm thành lập ${event.company}`
                                  }
                                >
                                  {event.type === 'birthday' ? (
                                    <Cake className="h-3 w-3 mr-1 flex-shrink-0" />
                                  ) : (
                                    <Gift className="h-3 w-3 mr-1 flex-shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {event.type === 'birthday' ? event.contact : event.company}
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
              Sự kiện trong tháng {monthNames[currentMonth]}
            </h3>
            
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((event, index) => (
                  <div 
                    key={index}
                    className={`
                      border rounded-lg p-4 flex items-start hover:shadow-md transition cursor-pointer
                      ${event.type === 'birthday' ? 'border-pink-200 bg-pink-50' : 'border-purple-200 bg-purple-50'}
                    `}
                    onClick={() => viewClientDetails(event.id)}
                  >
                    <div 
                      className={`
                        p-3 rounded-full mr-4 flex-shrink-0
                        ${event.type === 'birthday' ? 'bg-pink-100' : 'bg-purple-100'}
                      `}
                    >
                      {event.type === 'birthday' ? (
                        <Cake className={`h-6 w-6 text-pink-600`} />
                      ) : (
                        <Gift className={`h-6 w-6 text-purple-600`} />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">
                          {formatDate(event.date)}
                        </span>
                        {event.age && (
                          <span className={`
                            text-xs px-2 py-1 rounded-full font-bold
                            ${event.type === 'birthday' ? 'bg-pink-200 text-pink-800' : 'bg-purple-200 text-purple-800'}
                          `}>
                            {event.age} năm
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-800 mt-1">
                        {event.type === 'birthday' 
                          ? `Sinh nhật của ${event.contact}`
                          : `Kỷ niệm thành lập ${event.company}`
                        }
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {event.type === 'birthday' 
                          ? event.company
                          : `Người liên hệ: ${event.contact || 'Chưa có'}`
                        }
                      </div>
                      {event.phone && (
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {event.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không có sự kiện nào trong tháng này
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
                Sự kiện ngày {formatDate(selectedDate)}
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
                      className={`
                        p-3 border rounded-lg cursor-pointer hover:shadow-md transition
                        ${event.type === 'birthday' ? 'border-pink-200 bg-pink-50' : 'border-purple-200 bg-purple-50'}
                      `}
                      onClick={() => viewClientDetails(event.id)}
                    >
                      <div className="flex items-center">
                        <div
                          className={`
                            p-2 rounded-full mr-3
                            ${event.type === 'birthday' ? 'bg-pink-100' : 'bg-purple-100'}
                          `}
                        >
                          {event.type === 'birthday' ? (
                            <Cake className={`h-5 w-5 ${event.type === 'birthday' ? 'text-pink-600' : 'text-purple-600'}`} />
                          ) : (
                            <Gift className={`h-5 w-5 ${event.type === 'birthday' ? 'text-pink-600' : 'text-purple-600'}`} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {event.type === 'birthday'
                              ? `Sinh nhật của ${event.contact}`
                              : `Kỷ niệm thành lập ${event.company}`
                            }
                          </h4>
                          {event.age && (
                            <div className="text-sm text-gray-600">
                              Tròn {event.age} năm
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 pl-10">
                        <div className="text-sm text-gray-700">
                          {event.type === 'birthday'
                            ? `Công ty: ${event.company}`
                            : `Người liên hệ: ${event.contact || 'Chưa có'}`
                          }
                        </div>
                        {event.phone && (
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            <a href={`tel:${event.phone}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                              {event.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Không có sự kiện nào trong ngày này
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

export default KHTNCalendar;