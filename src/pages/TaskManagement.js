import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Edit, Trash, Search, Filter, Calendar as CalendarIcon,
    List, Trello, Clock, X, Upload, Eye,
    CheckCircle, AlertTriangle, AlertCircle
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import Select from 'react-select';
// Import FullCalendar components
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';


const TaskManagement = () => {
    // State Management
    const [tasks, setTasks] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [currentTask, setCurrentTask] = useState({
        IDCV: '',
        'Loại công việc': '',
        'Ngày giao việc': new Date().toISOString().split('T')[0],
        'Người giao việc': '',
        'Dự án': '',
        'Công việc': '',
        'Ghi chú': '',
        'Phòng ban phụ trách': '',
        'Nhân viên phụ trách': [],
        'Ngày dự kiến bắt đầu': new Date().toISOString().split('T')[0],
        'Ngày bắt đầu': '',
        'Ngày mong muốn hoàn thành': new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        'Ngày hoàn thành': '',
        'Mức độ ưu tiên': 'Trung bình',
        'Tiến độ hoàn thành': 0,
        'Tình trạng': 'Chưa bắt đầu'
    });
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [isEditMode, setIsEditMode] = useState(false);
    const [filterPriority, setFilterPriority] = useState('TẤT CẢ');
    const [filterStatus, setFilterStatus] = useState('TẤT CẢ');
    const [filterDepartment, setFilterDepartment] = useState('TẤT CẢ');
    const [filterAssignee, setFilterAssignee] = useState('TẤT CẢ');
    const [employees, setEmployees] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [departments, setDepartments] = useState([]);
    const fileInputRef = useRef(null);
    const calendarRef = useRef(null);
    // New states for progress reporting
    const [showReportModal, setShowReportModal] = useState(false);
    const [taskToReport, setTaskToReport] = useState(null);
    const [progressReport, setProgressReport] = useState({
        'Tiến độ hoàn thành': 0,
        'Ngày bắt đầu': '',
        'Ngày hoàn thành': '',
        'Tình trạng': '',
        'Ghi chú báo cáo': ''
    });

    // Status columns
    const statusColumns = [
        'Chưa bắt đầu',
        'Đang thực hiện',
        'Tạm dừng',
        'Hoàn thành',
        'Hủy bỏ'
    ];

    // Load initial data
    useEffect(() => {
        const checkAdminPermission = () => {
            const userData = authUtils.getUserData();
            const isAdminUser = userData && userData['Phân quyền'] === 'Admin';
            setIsAdmin(isAdminUser);
        };

        checkAdminPermission();
        fetchTasks();
        fetchEmployees();
    }, []);

    // Fetch data
    const fetchTasks = async () => {
        try {
            const response = await authUtils.apiRequest('CONGVIEC', 'Find', {});
            setTasks(response || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Lỗi khi tải danh sách công việc');
        }
    };
    const handleDateClick = (arg) => {
        // Pre-fill the task form with the selected date
        const selectedDate = arg.dateStr;
        handleOpenModal({
            ...currentTask,
            'Ngày dự kiến bắt đầu': selectedDate,
            'Ngày mong muốn hoàn thành': new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 7)).toISOString().split('T')[0]
        });
    };

    const handleEventClick = (arg) => {
        const taskId = arg.event.id;
        const selectedTask = tasks.find(task => task.IDCV === taskId);
        if (selectedTask) {
            handleOpenModal(selectedTask);
        }
    };
    const fetchEmployees = async () => {
        try {
            const response = await authUtils.apiRequest('DSNV', 'Find', {});
            setEmployees(response || []);

            // Extract unique departments from employees
            const uniqueDepartments = [...new Set(response.map(emp => emp['Phòng']).filter(Boolean))];
            setDepartments(uniqueDepartments);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
            setDepartments([]);
        }
    };
    const getCalendarEvents = () => {
        return tasks.map(task => {
            // Determine colors based on priority
            let backgroundColor, borderColor;
            switch(task['Mức độ ưu tiên']) {
                case 'Cao':
                    backgroundColor = '#FEE2E2'; // Light red background
                    borderColor = '#DC2626'; // Red border
                    break;
                case 'Trung bình':
                    backgroundColor = '#FEF3C7'; // Light orange background
                    borderColor = '#F59E0B'; // Orange border
                    break;
                case 'Thấp':
                    backgroundColor = '#D1FAE5'; // Light green background
                    borderColor = '#10B981'; // Green border
                    break;
                default:
                    backgroundColor = '#E5E7EB'; // Light gray background
                    borderColor = '#6B7280'; // Gray border
            }

            // Determine text color based on status
            let textColor;
            switch(task['Tình trạng']) {
                case 'Hoàn thành':
                    textColor = '#10B981'; // Green text
                    break;
                case 'Tạm dừng':
                    textColor = '#F59E0B'; // Orange text
                    break;
                case 'Hủy bỏ':
                    textColor = '#DC2626'; // Red text
                    break;
                default:
                    textColor = '#1F2937'; // Default text color
            }

            // Format the event
            return {
                id: task.IDCV,
                title: task['Công việc'],
                start: task['Ngày dự kiến bắt đầu'] || null,
                end: task['Ngày mong muốn hoàn thành'] || null,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                textColor: textColor,
                extendedProps: {
                    department: task['Phòng ban phụ trách'],
                    assignees: formatAssignees(task['Nhân viên phụ trách']),
                    priority: task['Mức độ ưu tiên'],
                    progress: task['Tiến độ hoàn thành'],
                    status: task['Tình trạng'],
                    project: task['Dự án'] || 'N/A',
                }
            };
        }).filter(event => event.start && event.end); // Only include events with valid dates
    };
    const renderViewSwitcher = () => (
        <div className="mb-6">
            <div className="border border-gray-200 rounded-lg inline-flex overflow-hidden">
                <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-4 py-2 flex items-center gap-2 ${viewMode === 'kanban'
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    <Trello className="w-4 h-4" />
                    Kanban
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 flex items-center gap-2 border-l border-gray-200 ${viewMode === 'list'
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    <List className="w-4 h-4" />
                    Danh sách
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-2 flex items-center gap-2 border-l border-gray-200 ${viewMode === 'calendar'
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    <CalendarIcon className="w-4 h-4" />
                    Lịch
                </button>
            </div>
        </div>
    );
     // Render the Calendar View
     const renderCalendarView = () => (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={getCalendarEvents()}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                locale="vi"
                buttonText={{
                    today: 'Hôm nay',
                    month: 'Tháng',
                    week: 'Tuần',
                    day: 'Ngày',
                }}
                eventContent={(eventInfo) => (
                    <div className="p-1">
                        <div className="font-medium text-xs md:text-sm truncate">{eventInfo.event.title}</div>
                        {eventInfo.view.type !== 'dayGridMonth' && (
                            <div className="text-xs truncate">
                                {eventInfo.event.extendedProps.project}
                            </div>
                        )}
                        {eventInfo.view.type === 'timeGridWeek' || eventInfo.view.type === 'timeGridDay' ? (
                            <>
                                <div className="text-xs mt-1 flex items-center gap-1">
                                    <span className="font-medium">Trạng thái:</span> {eventInfo.event.extendedProps.status}
                                </div>
                                <div className="text-xs flex items-center gap-1">
                                    <span className="font-medium">Tiến độ:</span> {eventInfo.event.extendedProps.progress}%
                                </div>
                                <div className="text-xs flex items-center gap-1">
                                    <span className="font-medium">Phụ trách:</span> {eventInfo.event.extendedProps.assignees}
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: false,
                    hour12: false
                }}
                allDayText="Cả ngày"
                height="auto"
                aspectRatio={1.8}
                contentHeight={800}
            />
        </div>
    );
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        } catch (error) {
            return dateString;
        }
    };

    // Hàm chuyển đổi từ dd/MM/yyyy sang yyyy-MM-dd cho input date
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';

        // Kiểm tra nếu đã đúng định dạng yyyy-MM-dd
        if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
            return dateString;
        }

        try {
            // Xử lý định dạng dd/MM/yyyy
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parts[0];
                const month = parts[1];
                const year = parts[2];
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }

            // Nếu không phải định dạng dd/MM/yyyy, thử chuyển đổi thông thường
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    // Hàm ngược lại để hiển thị lên UI (từ yyyy-MM-dd sang dd/MM/yyyy)
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            // Nếu là định dạng yyyy-MM-dd
            if (dateString.includes('-')) {
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }

            // Trường hợp khác
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        } catch (error) {
            return dateString;
        }
    };

    // Modal handlers for task assignment/editing
    const handleOpenModal = (task = null) => {
        if (task) {
            setIsEditMode(true);
            // Convert single string to array for multi-select
            let assignees = [];
            if (task['Nhân viên phụ trách']) {
                if (typeof task['Nhân viên phụ trách'] === 'string') {
                    assignees = task['Nhân viên phụ trách'].split(',').map(name => ({
                        label: name.trim(),
                        value: name.trim()
                    }));
                } else if (Array.isArray(task['Nhân viên phụ trách'])) {
                    assignees = task['Nhân viên phụ trách'].map(name => ({
                        label: name,
                        value: name
                    }));
                }
            }

            setCurrentTask({
                ...task,
                'Ngày giao việc': formatDateForInput(task['Ngày giao việc']) || new Date().toISOString().split('T')[0],
                'Ngày dự kiến bắt đầu': formatDateForInput(task['Ngày dự kiến bắt đầu']) || new Date().toISOString().split('T')[0],
                'Ngày bắt đầu': formatDateForInput(task['Ngày bắt đầu']) || '',
                'Ngày mong muốn hoàn thành': formatDateForInput(task['Ngày mong muốn hoàn thành']) || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
                'Ngày hoàn thành': formatDateForInput(task['Ngày hoàn thành']) || '',
                'Tiến độ hoàn thành': parseInt(task['Tiến độ hoàn thành'] || 0),
                'Nhân viên phụ trách': assignees
            });
            if (task['File đính kèm']) {
                setSelectedFiles(task['File đính kèm'].split(',').filter(Boolean));
            } else {
                setSelectedFiles([]);
            }
        } else {
            setIsEditMode(false);
            const userData = authUtils.getUserData();
            setCurrentTask({
                IDCV: '',
                'Loại công việc': 'Giao việc',
                'Ngày giao việc': new Date().toISOString().split('T')[0],
                'Người giao việc': userData ? userData['Họ và Tên'] : '',
                'Dự án': '',
                'Công việc': '',
                'Ghi chú': '',
                'Phòng ban phụ trách': '',
                'Nhân viên phụ trách': [],
                'Ngày dự kiến bắt đầu': new Date().toISOString().split('T')[0],
                'Ngày bắt đầu': '',
                'Ngày mong muốn hoàn thành': new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
                'Ngày hoàn thành': '',
                'Mức độ ưu tiên': 'Trung bình',
                'Tiến độ hoàn thành': 0,
                'Tình trạng': 'Chưa bắt đầu'
            });
            setSelectedFiles([]);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditMode(false);
    };

    // Progress reporting modal handlers
    const handleOpenReportModal = (task) => {
        setTaskToReport(task);
        setProgressReport({
            'Tiến độ hoàn thành': task['Tiến độ hoàn thành'] || 0,
            'Ngày bắt đầu': formatDateForInput(task['Ngày bắt đầu']) || '',
            'Ngày hoàn thành': formatDateForInput(task['Ngày hoàn thành']) || '',
            'Tình trạng': task['Tình trạng'] || 'Chưa bắt đầu',
            'Ghi chú báo cáo': ''
        });
        setShowReportModal(true);
    };

    const handleCloseReportModal = () => {
        setShowReportModal(false);
        setTaskToReport(null);
    };

    // Handle task type change
    const handleTaskTypeChange = (value) => {
        const userData = authUtils.getUserData();

        if (value === 'Lên lịch làm việc') {
            // For self-scheduled tasks, set department and assignee to current user
            setCurrentTask(prev => ({
                ...prev,
                'Loại công việc': value,
                'Phòng ban phụ trách': userData ? userData['Phòng'] : '',
                'Nhân viên phụ trách': userData ? [{ value: userData['Họ và Tên'], label: userData['Họ và Tên'] }] : []
            }));
        } else {
            // For task assignment to others, reset these fields
            setCurrentTask(prev => ({
                ...prev,
                'Loại công việc': value,
                'Phòng ban phụ trách': '',
                'Nhân viên phụ trách': []
            }));
        }
    };

    // Form handlers
    const handleInputChange = (field, value) => {
        setCurrentTask(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const toastId = toast.loading(`Đang tải ${file.name}...`);
                try {
                    const result = await authUtils.uploadFile(file);
                    if (result && result.success && result.url) {
                        toast.update(toastId, {
                            render: `Tải ${file.name} thành công`,
                            type: "success",
                            isLoading: false,
                            autoClose: 2000
                        });
                        return result.url;
                    } else {
                        throw new Error("Không thể tải file");
                    }
                } catch (error) {
                    toast.update(toastId, {
                        render: `Lỗi khi tải ${file.name}: ${error.message}`,
                        type: "error",
                        isLoading: false,
                        autoClose: 3000
                    });
                    return null;
                }
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            const validUrls = uploadedUrls.filter(Boolean);

            if (validUrls.length > 0) {
                const newFileList = [...selectedFiles, ...validUrls];
                setSelectedFiles(newFileList);
                handleInputChange('File đính kèm', newFileList.join(','));
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            toast.error('Lỗi khi tải files');
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (fileUrl) => {
        const newFiles = selectedFiles.filter(url => url !== fileUrl);
        setSelectedFiles(newFiles);
        handleInputChange('File đính kèm', newFiles.join(','));
    };

    const validateTask = (task) => {
        const errors = [];
        if (!task['Công việc']) errors.push('Tên công việc không được để trống');
        if (!task['Ngày dự kiến bắt đầu']) errors.push('Ngày dự kiến bắt đầu không được để trống');
        if (!task['Ngày mong muốn hoàn thành']) errors.push('Ngày mong muốn hoàn thành không được để trống');
        if (!task['Phòng ban phụ trách']) errors.push('Phòng ban phụ trách không được để trống');

        if (task['Ngày dự kiến bắt đầu'] && task['Ngày mong muốn hoàn thành']) {
            if (new Date(task['Ngày dự kiến bắt đầu']) > new Date(task['Ngày mong muốn hoàn thành'])) {
                errors.push('Ngày dự kiến bắt đầu không thể sau ngày mong muốn hoàn thành');
            }
        }

        return errors;
    };

    // Handle submit progress report
    const handleSubmitProgressReport = async () => {
        try {
            if (!taskToReport) return;

            const updatedTask = {
                ...taskToReport,
                'Tiến độ hoàn thành': progressReport['Tiến độ hoàn thành'],
                'Ngày bắt đầu': progressReport['Ngày bắt đầu'],
                'Ngày hoàn thành': progressReport['Ngày hoàn thành'],
                'Tình trạng': progressReport['Tình trạng'],
                'Ghi chú': progressReport['Ghi chú báo cáo']
                    ? `${taskToReport['Ghi chú'] || ''}\n\nBáo cáo (${new Date().toLocaleDateString('vi-VN')}): ${progressReport['Ghi chú báo cáo']}`
                    : taskToReport['Ghi chú']
            };

            await authUtils.apiRequest('CONGVIEC', 'Edit', {
                "Rows": [updatedTask]
            });

            toast.success('Cập nhật tiến độ công việc thành công!');
            await fetchTasks();
            setShowReportModal(false);
        } catch (error) {
            console.error('Error updating task progress:', error);
            toast.error('Có lỗi xảy ra khi cập nhật tiến độ công việc');
        }
    };

    // Save task
    const handleSaveTask = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            const errors = validateTask(currentTask);
            if (errors.length > 0) {
                toast.error(errors.join('\n'));
                setIsSubmitting(false);
                return;
            }

            // Create a copy of task to process
            let taskToSave = { ...currentTask };

            // Convert array of assignees to string
            if (Array.isArray(taskToSave['Nhân viên phụ trách']) && taskToSave['Nhân viên phụ trách'].length > 0) {
                taskToSave['Nhân viên phụ trách'] = taskToSave['Nhân viên phụ trách']
                    .map(item => item.value || item)
                    .join(', ');
            } else {
                taskToSave['Nhân viên phụ trách'] = '';
            }

            if (isEditMode) {
                // Edit existing task
                await authUtils.apiRequest('CONGVIEC', 'Edit', {
                    "Rows": [taskToSave]
                });
                toast.success('Cập nhật công việc thành công!');
            } else {
                // Generate a unique ID for new task
                taskToSave.IDCV = `CV${Date.now()}`;

                await authUtils.apiRequest('CONGVIEC', 'Add', {
                    "Rows": [taskToSave]
                });
                toast.success('Thêm công việc mới thành công!');
            }

            await fetchTasks();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving task:', error);
            toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể lưu công việc'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete handlers
    const handleOpenDeleteConfirmation = (task) => {
        setTaskToDelete(task);
        setShowDeleteConfirmation(true);
    };

    const handleCloseDeleteConfirmation = () => {
        setShowDeleteConfirmation(false);
        setTaskToDelete(null);
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;

        try {
            await authUtils.apiRequest('CONGVIEC', 'Delete', {
                "Rows": [{ "IDCV": taskToDelete.IDCV }]
            });
            toast.success('Xóa công việc thành công!');
            await fetchTasks();
            handleCloseDeleteConfirmation();
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Có lỗi xảy ra khi xóa công việc');
        }
    };

    // Update task status (for Kanban view)
    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const taskToUpdate = tasks.find(task => task.IDCV === taskId);
            if (!taskToUpdate) return;

            const updatedTask = {
                ...taskToUpdate,
                'Tình trạng': newStatus
            };

            // Update in database
            await authUtils.apiRequest('CONGVIEC', 'Edit', {
                "Rows": [updatedTask]
            });

            // Update local state
            setTasks(prev => prev.map(task =>
                task.IDCV === taskId ? updatedTask : task
            ));

            toast.success(`Đã chuyển "${taskToUpdate['Công việc']}" sang trạng thái "${newStatus}"`);
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Lỗi khi cập nhật trạng thái công việc');
        }
    };

    // Sorting and filtering
    const getSortedItems = () => {
        const sortableItems = [...tasks];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let valueA = a[sortConfig.key];
                let valueB = b[sortConfig.key];

                // Handle date comparison
                if (sortConfig.key.includes('Ngày') && valueA && valueB) {
                    valueA = new Date(valueA);
                    valueB = new Date(valueB);
                }

                // Handle string comparison
                if (typeof valueA === 'string') {
                    valueA = valueA.toLowerCase();
                }
                if (typeof valueB === 'string') {
                    valueB = valueB.toLowerCase();
                }

                if (valueA < valueB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    };

    const filteredTasks = getSortedItems().filter(task => {
        const matchesSearch = !search || (
            (task['Công việc']?.toLowerCase().includes(search.toLowerCase())) ||
            (task['Dự án']?.toLowerCase().includes(search.toLowerCase())) ||
            (task['Ghi chú']?.toLowerCase().includes(search.toLowerCase()))
        );

        const matchesPriority = filterPriority === 'TẤT CẢ' || task['Mức độ ưu tiên'] === filterPriority;
        const matchesStatus = filterStatus === 'TẤT CẢ' || task['Tình trạng'] === filterStatus;
        const matchesDepartment = filterDepartment === 'TẤT CẢ' || task['Phòng ban phụ trách'] === filterDepartment;

        // Handle array or string for assignee filtering
        const matchesAssignee = filterAssignee === 'TẤT CẢ' ||
            (typeof task['Nhân viên phụ trách'] === 'string' &&
                task['Nhân viên phụ trách'].includes(filterAssignee)) ||
            (Array.isArray(task['Nhân viên phụ trách']) &&
                task['Nhân viên phụ trách'].includes(filterAssignee));

        return matchesSearch && matchesPriority && matchesStatus && matchesDepartment && matchesAssignee;
    });

    // Group tasks by status for Kanban view
    const tasksGroupedByStatus = statusColumns.reduce((acc, status) => {
        acc[status] = filteredTasks.filter(task => task['Tình trạng'] === status);
        return acc;
    }, {});

    // Helper to get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Cao':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'Trung bình':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Thấp':
                return 'text-green-600 bg-green-50 border-green-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Helper to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Chưa bắt đầu':
                return 'text-gray-700 bg-gray-100 border-gray-200';
            case 'Đang thực hiện':
                return 'text-blue-700 bg-blue-100 border-blue-200';
            case 'Tạm dừng':
                return 'text-yellow-700 bg-yellow-100 border-yellow-200';
            case 'Hoàn thành':
                return 'text-green-700 bg-green-100 border-green-200';
            case 'Hủy bỏ':
                return 'text-red-700 bg-red-100 border-red-200';
            default:
                return 'text-gray-700 bg-gray-100 border-gray-200';
        }
    };

    // Helper to get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Chưa bắt đầu':
                return <Clock className="h-4 w-4" />;
            case 'Đang thực hiện':
                return <AlertCircle className="h-4 w-4" />;
            case 'Tạm dừng':
                return <AlertTriangle className="h-4 w-4" />;
            case 'Hoàn thành':
                return <CheckCircle className="h-4 w-4" />;
            case 'Hủy bỏ':
                return <X className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    // Format assignee display
    const formatAssignees = (assignees) => {
        if (!assignees) return '—';
        if (typeof assignees === 'string') return assignees;
        if (Array.isArray(assignees)) {
            if (assignees.length === 0) return '—';
            return assignees.map(a => a.value || a).join(', ');
        }
        return '—';
    };

    // Get unique values for filters
    const priorities = ['TẤT CẢ', 'Cao', 'Trung bình', 'Thấp'];
    const statuses = ['TẤT CẢ', ...statusColumns];

    // Extract unique assignees from tasks
    const allAssignees = tasks.reduce((acc, task) => {
        if (task['Nhân viên phụ trách']) {
            if (typeof task['Nhân viên phụ trách'] === 'string') {
                const names = task['Nhân viên phụ trách'].split(',').map(name => name.trim());
                names.forEach(name => {
                    if (name && !acc.includes(name)) {
                        acc.push(name);
                    }
                });
            } else if (Array.isArray(task['Nhân viên phụ trách'])) {
                task['Nhân viên phụ trách'].forEach(name => {
                    const nameValue = typeof name === 'object' ? name.value : name;
                    if (nameValue && !acc.includes(nameValue)) {
                        acc.push(nameValue);
                    }
                });
            }
        }
        return acc;
    }, []);

    const assignees = ['TẤT CẢ', ...allAssignees];
    const departmentList = ['TẤT CẢ', ...departments];

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Công Việc</h1>
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
                                Thêm công việc
                            </button>
                        </div>
                    </div>

                    {/* View Switcher */}
                    {renderViewSwitcher()}
                    {/* Search and Filter Section */}
                    <div className="mb-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm công việc, dự án..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Priority filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo mức độ ưu tiên:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {priorities.map((priority, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setFilterPriority(priority)}
                                                    className={`px-3 py-1.5 rounded-full text-sm ${filterPriority === priority
                                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {priority}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo trạng thái:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {statuses.map((status, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setFilterStatus(status)}
                                                    className={`px-3 py-1.5 rounded-full text-sm ${filterStatus === status
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Department filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo phòng ban:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {departmentList.map((dept, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setFilterDepartment(dept)}
                                                    className={`px-3 py-1.5 rounded-full text-sm ${filterDepartment === dept
                                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {dept}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Assignee filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lọc theo người phụ trách:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {assignees.map((assignee, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setFilterAssignee(assignee)}
                                                    className={`px-3 py-1.5 rounded-full text-sm ${filterAssignee === assignee
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {assignee || "Chưa phân công"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tổng số công việc</h3>
                            <p className="text-2xl font-bold text-blue-800">{tasks.length}</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                            <h3 className="text-sm text-yellow-700 mb-1">Đang thực hiện</h3>
                            <p className="text-2xl font-bold text-yellow-800">
                                {tasks.filter(task => task['Tình trạng'] === 'Đang thực hiện').length}
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Hoàn thành</h3>
                            <p className="text-2xl font-bold text-green-800">
                                {tasks.filter(task => task['Tình trạng'] === 'Hoàn thành').length}
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <h3 className="text-sm text-red-700 mb-1">Quá hạn</h3>
                            <p className="text-2xl font-bold text-red-800">
                                {tasks.filter(task =>
                                    new Date(task['Ngày mong muốn hoàn thành']) < new Date() &&
                                    task['Tình trạng'] !== 'Hoàn thành' &&
                                    task['Tình trạng'] !== 'Hủy bỏ'
                                ).length}
                            </p>
                        </div>
                    </div>
                                  {/* Calendar View */}
                    {viewMode === 'calendar' && renderCalendarView()}
                    {/* Kanban View */}
                    {viewMode === 'kanban' && (
                        <div className="flex space-x-5 overflow-x-auto pb-6 pt-2">
                            {statusColumns.map(status => (
                                <div key={status} className="min-w-[300px] flex-shrink-0 rounded-xl shadow-sm border border-gray-100">
                                    <div className={`rounded-t-xl px-4 py-3 ${getStatusColor(status)}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                {getStatusIcon(status)}
                                                <h3 className="font-semibold text-gray-800">{status}</h3>
                                            </div>
                                            <span className="text-sm px-2.5 py-1 bg-white bg-opacity-30 rounded-full font-medium">
                                                {tasksGroupedByStatus[status]?.length || 0}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-b-xl p-3 min-h-[75vh] transition-all">
                                        {tasksGroupedByStatus[status]?.length > 0 ? (
                                            <div className="space-y-3">
                                                {tasksGroupedByStatus[status]?.map((task, index) => (
                                                    <div
                                                        key={index}
                                                        className="group bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                                                        onClick={() => handleOpenModal(task)}
                                                    >
                                                        <div className="flex justify-between items-start mb-2.5">
                                                            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task['Mức độ ưu tiên'])}`}>
                                                                {task['Mức độ ưu tiên']}
                                                            </div>
                                                            {task['Dự án'] && (
                                                                <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                                                    {task['Dự án']}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{task['Công việc']}</h4>

                                                        {task['Ghi chú'] && (
                                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task['Ghi chú']}</p>
                                                        )}

                                                        {task['Tiến độ hoàn thành'] > 0 && (
                                                            <div className="mt-2 mb-3">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs text-gray-500">Tiến độ</span>
                                                                    <span className="text-xs font-medium text-blue-600">{task['Tiến độ hoàn thành']}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                                                        style={{ width: `${task['Tiến độ hoàn thành']}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                <span>
                                                                    {formatDate(task['Ngày dự kiến bắt đầu'])} - {formatDate(task['Ngày mong muốn hoàn thành'])}
                                                                </span>
                                                            </div>

                                                            {task['Nhân viên phụ trách'] && (
                                                                <div className="px-2.5 py-1 bg-gray-100 rounded-full">
                                                                    {formatAssignees(task['Nhân viên phụ trách'])}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-end mt-3 pt-2 border-t border-gray-100 space-x-2 opacity-80 group-hover:opacity-100">
                                                            {status !== 'Hoàn thành' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newStatus = status === 'Chưa bắt đầu' ? 'Đang thực hiện' :
                                                                            status === 'Đang thực hiện' ? 'Hoàn thành' : status;
                                                                        if (newStatus !== status) {
                                                                            handleStatusChange(task.IDCV, newStatus);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                                                >
                                                                    {status === 'Chưa bắt đầu' ? 'Bắt đầu' :
                                                                        status === 'Đang thực hiện' ? 'Hoàn thành' : ''}
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenReportModal(task);
                                                                }}
                                                                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                                                            >
                                                                Báo cáo
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                                <div className="mb-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium">Không có công việc nào</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List View */}
                    {viewMode === 'list' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Công việc')}>
                                            Công việc {getSortIcon('Công việc')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Dự án')}>
                                            Dự án {getSortIcon('Dự án')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Phòng ban phụ trách')}>
                                            Phòng ban {getSortIcon('Phòng ban phụ trách')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Nhân viên phụ trách')}>
                                            Người phụ trách {getSortIcon('Nhân viên phụ trách')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Ngày mong muốn hoàn thành')}>
                                            Hạn cuối {getSortIcon('Ngày mong muốn hoàn thành')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Mức độ ưu tiên')}>
                                            Ưu tiên {getSortIcon('Mức độ ưu tiên')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Tình trạng')}>
                                            Trạng thái {getSortIcon('Tình trạng')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tiến độ
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTasks.length > 0 ? (
                                        filteredTasks.map((task, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {task['Công việc']}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {task['Dự án'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {task['Phòng ban phụ trách'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatAssignees(task['Nhân viên phụ trách'])}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatDate(task['Ngày mong muốn hoàn thành'])}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task['Mức độ ưu tiên'])}`}>
                                                        {task['Mức độ ưu tiên']}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(task['Tình trạng'])}`}>
                                                        {getStatusIcon(task['Tình trạng'])}
                                                        {task['Tình trạng']}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${task['Tiến độ hoàn thành']}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-xs text-right mt-1 text-gray-500">
                                                        {task['Tiến độ hoàn thành']}%
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleOpenModal(task)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50"
                                                            title="Chỉnh sửa công việc"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenReportModal(task)}
                                                            className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50"
                                                            title="Báo cáo tiến độ"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenDeleteConfirmation(task);
                                                            }}
                                                            className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50"
                                                            title="Xóa công việc"
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
                                                Không tìm thấy công việc nào phù hợp với tiêu chí tìm kiếm
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full p-6">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? 'Cập nhật công việc' : 'Thêm công việc mới'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Task Details */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên công việc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={currentTask['Công việc']}
                                        onChange={(e) => handleInputChange('Công việc', e.target.value)}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nhập tên công việc"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dự án
                                    </label>
                                    <input
                                        type="text"
                                        value={currentTask['Dự án'] || ''}
                                        onChange={(e) => handleInputChange('Dự án', e.target.value)}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nhập tên dự án"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả chi tiết
                                    </label>
                                    <textarea
                                        value={currentTask['Ghi chú'] || ''}
                                        onChange={(e) => handleInputChange('Ghi chú', e.target.value)}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Mô tả chi tiết về công việc này"
                                        rows="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Loại công việc
                                    </label>
                                    <div className="flex space-x-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="taskType"
                                                value="Lên lịch làm việc"
                                                checked={currentTask['Loại công việc'] === 'Lên lịch làm việc'}
                                                onChange={(e) => handleTaskTypeChange(e.target.value)}
                                                className="mr-2 h-4 w-4 text-indigo-600"
                                            />
                                            <span className="text-gray-800">Lên lịch làm việc</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="taskType"
                                                value="Giao việc"
                                                checked={currentTask['Loại công việc'] === 'Giao việc'}
                                                onChange={(e) => handleTaskTypeChange(e.target.value)}
                                                className="mr-2 h-4 w-4 text-indigo-600"
                                            />
                                            <span className="text-gray-800">Giao việc</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        File đính kèm
                                    </label>
                                    <div className="mt-1 flex items-center">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            multiple
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Tải file lên
                                        </button>
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm text-gray-700 truncate max-w-xs">
                                                                {decodeURIComponent(file.split('/').pop())}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <a
                                                            href={file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50 mr-1"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFile(file)}
                                                            className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Assignment and Scheduling */}
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phòng ban phụ trách <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={currentTask['Phòng ban phụ trách'] || ''}
                                            onChange={(e) => handleInputChange('Phòng ban phụ trách', e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                            disabled={currentTask['Loại công việc'] === 'Lên lịch làm việc'}
                                        >
                                            <option value="">Chọn phòng ban</option>
                                            {departments.map((dept, index) => (
                                                <option key={index} value={dept}>
                                                    {dept}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nhân viên phụ trách
                                        </label>
                                        <Select
                                            isMulti
                                            name="employees"
                                            options={employees
                                                .filter(emp => !currentTask['Phòng ban phụ trách'] ||
                                                    emp['Phòng'] === currentTask['Phòng ban phụ trách'])
                                                .map(emp => ({
                                                    value: emp['Họ và Tên'],
                                                    label: emp['Họ và Tên']
                                                }))}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                            value={currentTask['Nhân viên phụ trách']}
                                            onChange={(selectedOptions) => handleInputChange('Nhân viên phụ trách', selectedOptions || [])}
                                            placeholder="Chọn nhân viên phụ trách"
                                            isDisabled={currentTask['Loại công việc'] === 'Lên lịch làm việc'}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Người giao việc
                                        </label>
                                        <input
                                            type="text"
                                            value={currentTask['Người giao việc'] || ''}
                                            onChange={(e) => handleInputChange('Người giao việc', e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Người giao việc"
                                            readOnly
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày giao việc
                                        </label>
                                        <input
                                            type="date"
                                            value={currentTask['Ngày giao việc']}
                                            onChange={(e) => handleInputChange('Ngày giao việc', e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày dự kiến bắt đầu <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={currentTask['Ngày dự kiến bắt đầu']}
                                            onChange={(e) => handleInputChange('Ngày dự kiến bắt đầu', e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày mong muốn hoàn thành <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={currentTask['Ngày mong muốn hoàn thành']}
                                            onChange={(e) => handleInputChange('Ngày mong muốn hoàn thành', e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày bắt đầu
                                        </label>
                                        <input
                                            type="date"
                                            value={currentTask['Ngày bắt đầu'] || ''}
                                            onChange={(e) => handleInputChange('Ngày bắt đầu', e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày hoàn thành
                                        </label>
                                        <input
                                            type="date"
                                            value={currentTask['Ngày hoàn thành'] || ''}
                                            onChange={(e) => handleInputChange('Ngày hoàn thành', e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mức độ ưu tiên
                                        </label>
                                        <div className="flex space-x-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="priority"
                                                    value="Cao"
                                                    checked={currentTask['Mức độ ưu tiên'] === 'Cao'}
                                                    onChange={(e) => handleInputChange('Mức độ ưu tiên', e.target.value)}
                                                    className="mr-2 h-4 w-4 text-red-600"
                                                />
                                                <span className="text-gray-800">Cao</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="priority"
                                                    value="Trung bình"
                                                    checked={currentTask['Mức độ ưu tiên'] === 'Trung bình'}
                                                    onChange={(e) => handleInputChange('Mức độ ưu tiên', e.target.value)}
                                                    className="mr-2 h-4 w-4 text-orange-600"
                                                />
                                                <span className="text-gray-800">Trung bình</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="priority"
                                                    value="Thấp"
                                                    checked={currentTask['Mức độ ưu tiên'] === 'Thấp'}
                                                    onChange={(e) => handleInputChange('Mức độ ưu tiên', e.target.value)}
                                                    className="mr-2 h-4 w-4 text-green-600"
                                                />
                                                <span className="text-gray-800">Thấp</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tình trạng
                                        </label>
                                        <select
                                            value={currentTask['Tình trạng'] || 'Chưa bắt đầu'}
                                            onChange={(e) => handleInputChange('Tình trạng', e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            {statusColumns.map((status, index) => (
                                                <option key={index} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiến độ hoàn thành (%)
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={currentTask['Tiến độ hoàn thành'] || 0}
                                            onChange={(e) => handleInputChange('Tiến độ hoàn thành', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                                            {currentTask['Tiến độ hoàn thành'] || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${currentTask['Tiến độ hoàn thành'] || 0}%` }}
                                        ></div>
                                    </div>
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
                                onClick={handleSaveTask}
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
                                        Lưu công việc
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Reporting Modal */}
            {showReportModal && taskToReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
                            <h2 className="text-xl font-bold text-gray-800">Báo cáo tiến độ công việc</h2>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                                    <h3 className="font-medium text-gray-800 mb-1">{taskToReport['Công việc']}</h3>
                                    <p className="text-sm text-gray-600">
                                        {taskToReport['Dự án'] && <span className="mr-2">Dự án: {taskToReport['Dự án']}</span>}
                                        <span>Hạn: {formatDate(taskToReport['Ngày mong muốn hoàn thành'])}</span>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tiến độ hoàn thành (%)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={progressReport['Tiến độ hoàn thành']}
                                        onChange={(e) => setProgressReport(prev => ({ ...prev, 'Tiến độ hoàn thành': parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                                        {progressReport['Tiến độ hoàn thành']}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${progressReport['Tiến độ hoàn thành']}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Trạng thái công việc
                                </label>
                                <select
                                    value={progressReport['Tình trạng']}
                                    onChange={(e) => setProgressReport(prev => ({ ...prev, 'Tình trạng': e.target.value }))}
                                    className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {statusColumns.map((status, index) => (
                                        <option key={index} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày bắt đầu thực tế
                                    </label>
                                    <input
                                        type="date"
                                        value={progressReport['Ngày bắt đầu'] || ''}
                                        onChange={(e) => setProgressReport(prev => ({ ...prev, 'Ngày bắt đầu': e.target.value }))}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày hoàn thành thực tế
                                    </label>
                                    <input
                                        type="date"
                                        value={progressReport['Ngày hoàn thành'] || ''}
                                        onChange={(e) => setProgressReport(prev => ({ ...prev, 'Ngày hoàn thành': e.target.value }))}
                                        className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ghi chú báo cáo
                                </label>
                                <textarea
                                    value={progressReport['Ghi chú báo cáo']}
                                    onChange={(e) => setProgressReport(prev => ({ ...prev, 'Ghi chú báo cáo': e.target.value }))}
                                    className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Mô tả chi tiết về tiến độ, khó khăn gặp phải hoặc kết quả đạt được..."
                                    rows="3"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSubmitProgressReport}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Cập nhật tiến độ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && taskToDelete && (
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
                                    Bạn có chắc chắn muốn xóa công việc <span className="font-bold">"{taskToDelete['Công việc']}"</span>?
                                </p>
                                <p className="text-sm text-red-600 mt-2">
                                    Hành động này không thể hoàn tác và sẽ xóa tất cả thông tin của công việc này.
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
                                    onClick={handleDeleteTask}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Trash className="h-4 w-4" />
                                    Xóa công việc
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

export default TaskManagement;