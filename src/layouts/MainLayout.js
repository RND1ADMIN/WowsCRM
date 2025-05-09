import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FileBox,
    User,
    Gauge, IdCard, BriefcaseBusiness, FileBadge2, Wallet,
    ChevronLeft,
    ChartPie,
    LogOut,
    Menu as MenuIcon,
    Warehouse,
    Truck,
    ClipboardList,
    Settings,
    Bell,
    Search,
    HelpCircle,
    Home,
    ChevronDown,
    ChevronRight,
    Mail,
    Phone,
    Calendar,
    Clock,
    Shield,
    Globe
} from 'lucide-react';
import authUtils from '../utils/authUtils';
import { taskbarMenuItems, getPageTitleByPath } from '../config/menuConfig';

const isMobileDevice = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Hàm kiểm tra quyền truy cập cho menu item
export const hasPermission = (item, userData) => {
    // Nếu không có thông tin phân quyền trong menu hoặc item đó cho phép tất cả
    if (!item.permissions || item.permissions.all === true) {
        return true;
    }

    // Nếu là ADMIN, luôn được quyền truy cập
    if (userData?.['Phân quyền'] === 'Admin') {
        return true;
    }

    // Kiểm tra quyền dựa trên phân quyền (ADMIN/USER)
    if (item.permissions.roles && item.permissions.roles.includes(userData?.['Phân quyền'])) {
        return true;
    }

    // Kiểm tra quyền dựa trên phòng ban
    if (item.permissions.departments) {
        if (item.permissions.departments.includes(userData?.['Phòng']) ||
            item.permissions.departments.includes('ALL')) {
            return true;
        }
    }

    // Kiểm tra quyền dựa trên chức vụ
    if (item.permissions.positions) {
        if (item.permissions.positions.includes(userData?.['Chức vụ']) ||
            item.permissions.positions.includes('ALL')) {
            return true;
        }
    }

    // Kiểm tra quyền dựa trên khu vực
    if (item.permissions.areas) {
        if (item.permissions.areas.includes(userData?.['Khu vực']) ||
            item.permissions.areas.includes('ALL')) {
            return true;
        }
    }

    return false;
};

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize sidebar state based on screen size
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobileDevice());
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const [searchQuery, setSearchQuery] = useState('');

    // State for page actions from child components
    const [pageActions, setPageActions] = useState([]);

    const userData = authUtils.getUserData();

    // Use menu items from config
    const menuItems = taskbarMenuItems;

    // Add resize listener
    useEffect(() => {
        const handleResize = () => {
            const mobile = isMobileDevice();
            setIsMobile(mobile);

            // Automatically close sidebar on mobile when resizing
            if (mobile && isSidebarOpen) {
                setIsSidebarOpen(false);
            } else if (!mobile && !isSidebarOpen) {
                // Don't auto-open on desktop to respect user preference
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    // Method for child pages to register buttons
    useEffect(() => {
        window.registerPageActions = (actions) => {
            setPageActions(actions);
        };

        window.clearPageActions = () => {
            setPageActions([]);
        };

        return () => {
            delete window.registerPageActions;
            delete window.clearPageActions;
        };
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileMenuOpen && !event.target.closest('.profile-menu-container')) {
                setIsProfileMenuOpen(false);
            }
            if (isNotificationsOpen && !event.target.closest('.notifications-container')) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileMenuOpen, isNotificationsOpen]);

    const handleLogout = () => {
        authUtils.logout();
        navigate('/');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const userInitial = userData?.username?.[0]?.toUpperCase() || '?';

    // Sample notifications for demo
    const notifications = [
        { id: 1, title: 'Chức năng đang xây dựng', message: 'Chức năng đang xây dựng', time: 'vừa xong', unread: true },
    ];

    const Sidebar = () => (
        <div className={`flex flex-col h-full bg-white shadow-xl transition-all duration-300 ${isSidebarOpen ? 'w-[280px]' : 'w-[68px]'}`}>
            {/* Logo & Brand */}
            <div className={`px-4 py-4 border-b bg-gradient-to-r from-[#ffffff] to-[#ffffff] transition-all duration-300 ${isSidebarOpen ? 'px-6' : 'flex justify-center'}`}>
                <div className="flex items-center">
                    <img src="/logo1.png" alt="NZ Logo" className="h-8 drop-shadow-md" />
                    {isSidebarOpen && (
                        <div className="ml-2 transition-opacity duration-300">
                            <h1 className="text-[12px] font-bold text-[#000000]">WOWS CRM</h1>
                            <p className="text-[11px] text-[#000000]/80">Hệ thống quản lý doanh nghiệp</p>
                        </div>
                    )}
                </div>
            </div>

            {isSidebarOpen && (
                <div className="px-6 py-4 border-b bg-gradient-to-r from-[#f4f6fa] to-white">
                    <div
                        className="flex items-center space-x-3 cursor-pointer hover:bg-white/90 p-2 rounded-lg transition-all duration-200"
                        onClick={() => {
                            navigate('/profile');
                            isMobile && setIsSidebarOpen(false);
                        }}
                    >
                        {userData?.Image ? (
                            <img
                                src={userData?.Image}
                                alt="Profile Picture"
                                className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-white"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#b7a035] to-[#d99c07] flex items-center justify-center text-white font-semibold shadow-md">
                                {userInitial}
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-gray-800">
                                {userData?.['Họ và Tên'] || userData?.username}
                            </p>
                            <p className="text-sm text-[#7c5b2f]">
                                {userData?.['Email'] || 'Không xác định'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mini user profile for collapsed sidebar */}
            {!isSidebarOpen && (
                <div className="py-4 border-b flex justify-center">
                    <div
                        className="cursor-pointer hover:scale-110 transition-all duration-200"
                        onClick={() => {
                            navigate('/profile');
                            isMobile && setIsSidebarOpen(false);
                        }}
                    >
                        {userData?.Image ? (
                            <img
                                src={userData?.Image}
                                alt="Profile Picture"
                                className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-white"
                                title={`${userData?.['Họ và Tên'] || userData?.username} - ${userData?.['Chức vụ'] || 'Nhân viên'}`}
                            />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-full bg-gradient-to-r from-[#b7a035] to-[#d99c07] flex items-center justify-center text-white font-semibold shadow-md"
                                title={`${userData?.['Họ và Tên'] || userData?.username} - ${userData?.['Chức vụ'] || 'Nhân viên'}`}
                            >
                                {userInitial}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className={`flex-1 py-3 space-y-1 overflow-y-auto ${isSidebarOpen ? 'px-3' : 'px-2'}`}>
                {/* Render all menu items in a flat structure */}
                {menuItems
                    .filter(item => hasPermission(item, userData))
                    .map((item, index) => {
                        const Icon = item.icon;
                        const isItemActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.isLogout) {
                                        handleLogout();
                                    }
                                    else if (item.isExternal) {
                                        if (item.requiresUserParam && userData) {
                                            const finalUrl = `${item.path}`;
                                            window.location.href = finalUrl;
                                        } else {
                                            window.open(item.path, '_blank');
                                        }
                                    } else {
                                        navigate(item.path);
                                    }
                                    isMobile && setIsSidebarOpen(false);
                                }}
                                className={`w-full flex ${!isSidebarOpen ? 'justify-center' : 'items-center space-x-3'} px-3 py-3 rounded-lg transition-all duration-200 group mb-1
                                    ${isItemActive
                                        ? 'bg-gradient-to-r from-[#002266]/10 to-[#003399]/10 text-[#7c5b2f] shadow-sm' +
                                        (isSidebarOpen ? ' border-l-3 border-[#7c5b2f]' : '')
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }
                                `}
                                title={item.description || item.text}
                            >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isItemActive ? 'bg-gradient-to-r from-[#7c5b2f] to-[#694515] text-white' : 'bg-gray-100 text-gray-500 group-hover:text-[#7c603b] group-hover:bg-gray-200'} transition-colors`}>
                                    <Icon className="h-4.5 w-4.5" />
                                </div>
                                {isSidebarOpen && (
                                    <div className="flex flex-col items-start">
                                        <span className={`font-medium ${isItemActive ? 'text-[#61421a]' : 'text-gray-500'}`}>
                                            {item.text}
                                        </span>
                                        {isItemActive && item.description && (
                                            <span className="text-xs text-gray-400 mt-0.5">{item.description}</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
            </nav>

            {/* Footer */}
            {isSidebarOpen ? (
                <div className="px-6 py-3 border-t bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col items-center text-center">
                        <p className="text-xs text-gray-500">© Wows Group by developer Phước Ninh</p>
                    </div>
                </div>
            ) : (
                <div className="px-2 py-3 border-t bg-gradient-to-r from-gray-50 to-white flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                        title="Đăng xuất"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-gray-800/60 z-40 backdrop-blur-sm"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full transform transition-all duration-300 ease-in-out z-50 shadow-xl overflow-hidden
                ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : (isSidebarOpen ? 'w-[280px]' : 'w-[68px]')}`}
            >
                <Sidebar />
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${isMobile ? '' : (isSidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[68px]')}`}>
                {/* Header */}
                <header className={`fixed top-0 right-0 left-0 ${isMobile ? '' : (isSidebarOpen ? 'lg:left-[280px]' : 'lg:left-[68px]')} z-20 transition-all duration-300`}>
                    <div className="h-16 bg-white border-b px-4 flex items-center justify-between shadow-sm">
                        {/* Sidebar Toggle & Page Title */}
                        <div className="flex items-center space-x-3">
                            <button
                                className="p-1.5 rounded-lg text-[#7c5b2f] hover:bg-[#002266]/10 hover:text-[#7c5b2f] transition-colors"
                                onClick={toggleSidebar}
                                aria-label={isSidebarOpen ? "Đóng menu" : "Mở menu"}
                            >
                                {isSidebarOpen ? <ChevronLeft className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                            </button>

                            {/* Breadcrumb & Page title */}
                            <div className="flex items-center space-x-2">
                                <a onClick={() => {
                                    navigate('/dashboard');
                                    setIsProfileMenuOpen(false);
                                }} className="text-sm text-gray-500 hover:text-[#7c5b2f] transition-colors cursor-pointer ">Trang chủ</a>
                                {location.pathname !== '/dashboard' && (
                                    <>
                                        <span className="text-gray-400">/</span>
                                        <h2 className="text-base font-medium text-gray-800">
                                            {getPageTitleByPath(location.pathname)}
                                        </h2>
                                    </>
                                )}
                            </div>
                        </div>


                        {/* Right - Notifications & User Menu */}
                        <div className="flex items-center space-x-1">
                            {/* Current time */}
                            <div className="hidden md:flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full mr-1">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                <span>
                                    {`${new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}, ${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                                </span>
                                <span className="mx-1.5 text-gray-300">|</span>
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                <span>
                                    {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Notifications */}
                            <div className="relative notifications-container">
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="p-2 rounded-full hover:bg-[#002266]/5 relative"
                                    aria-label="Thông báo"
                                >
                                    <Bell className="h-5 w-5 text-gray-600" />
                                    {notifications.some(n => n.unread) && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {isNotificationsOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border py-1 z-50">
                                        <div className="px-4 py-2 border-b">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-medium text-gray-800">Thông báo</h3>
                                                <button className="text-xs text-[#7c5b2f] hover:underline">
                                                    Đánh dấu tất cả đã đọc
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map(notification => (
                                                    <div
                                                        key={notification.id}
                                                        className={`px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${notification.unread ? 'bg-[#002266]/5' : ''}`}
                                                    >
                                                        <div className="flex items-start">
                                                            <div className={`w-2 h-2 rounded-full mt-2 mr-2 ${notification.unread ? 'bg-[#7c5b2f]' : 'bg-gray-300'}`}></div>
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-medium text-gray-800">{notification.title}</h4>
                                                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center text-gray-500">
                                                    <p>Không có thông báo mới</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-4 py-2 border-t">
                                            <button
                                                className="w-full text-center text-sm text-[#7c5b2f] hover:underline"
                                                onClick={() => navigate('/dashboard')}
                                            >
                                                Xem tất cả thông báo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Menu */}
                            <div className="relative profile-menu-container">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center space-x-2 hover:bg-[#002266]/5 rounded-lg py-1.5 pl-2 pr-3 ml-1"
                                    aria-label="Menu người dùng"
                                >
                                    {userData?.Image ? (
                                        <img
                                            src={userData?.Image}
                                            alt="Profile Picture"
                                            className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7c5b2f] to-[#d99c07] flex items-center justify-center text-white font-semibold shadow-sm">
                                            {userInitial}
                                        </div>
                                    )}
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-700 leading-tight">
                                            {userData?.['Họ và Tên']?.split(' ').pop() || userData?.username || 'Người dùng'}
                                        </p>
                                        <p className="text-xs text-gray-500 leading-tight">
                                            {userData?.['Chức vụ'] || 'Nhân viên'}
                                        </p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
                                </button>

                                {/* User Dropdown Menu */}
                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border py-1 z-50">
                                        <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
                                            <div className="flex items-center space-x-3">
                                                {userData?.Image ? (
                                                    <img
                                                        src={userData?.Image}
                                                        alt="Profile Picture"
                                                        className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#b7a035] to-[#d99c07] flex items-center justify-center text-white text-lg font-semibold shadow-md">
                                                        {userInitial}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {userData?.['Họ và Tên'] || userData?.username}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {userData?.Email || 'Không xác định'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-1">
                                                <div className="text-xs text-gray-500 flex items-center">
                                                    <Shield className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span>{userData?.['Phân quyền'] || 'User'}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center">
                                                    <BriefcaseBusiness className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span>{userData?.['Phòng'] || 'Chưa có'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setIsProfileMenuOpen(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#002266]/5 flex items-center space-x-2"
                                            >
                                                <User className="h-4 w-4 text-gray-500" />
                                                <span>Thông tin cá nhân</span>
                                            </button>

                                        </div>

                                        <div className="border-t my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                        >
                                            <LogOut className="h-4 w-4 text-red-500" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Page actions bar - only show when actions are available */}
                    {pageActions.length > 0 && (
                        <div className="h-12 bg-white border-b shadow-sm px-4 flex items-center space-x-2 overflow-x-auto">
                            {pageActions.map((action, index) => (
                                action.component ? (
                                    <div key={index} className="flex-shrink-0">
                                        {action.component}
                                    </div>
                                ) : (
                                    <button
                                        key={index}
                                        onClick={action.onClick}
                                        className={`${action.className || 'px-3 py-1.5 bg-gradient-to-r from-[#b7a035] to-[#d99c07] hover:from-[#d99c07] hover:to-[#e4ac16] text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all'} 
                                        flex items-center space-x-2 flex-shrink-0`}
                                        title={action.title || action.text}
                                        disabled={action.disabled}
                                    >
                                        {action.icon && action.icon}
                                        <span className={isMobile && action.text && action.icon ? 'hidden sm:inline' : ''}>
                                            {action.text}
                                        </span>
                                    </button>
                                )
                            ))}
                        </div>
                    )}
                </header>

                    <main className={`mt-16 ${pageActions.length > 0 ? 'pt-12' : 'pt-0'} h-[calc(100vh-4rem)] overflow-hidden transition-all duration-300`}>
                    <div className="p-4 h-full overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;