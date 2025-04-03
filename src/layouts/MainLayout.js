import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    UtensilsCrossed,
    Table,
    Receipt,
    User,
    FileBox,
    Gauge,
    ChartArea,
    LayoutList,
    Wallet,
    ChevronLeft,
    ChartPie,
    NotebookPen,
    BookUser,
    LogOut,
    Menu as MenuIcon,
    X,
    Settings
} from 'lucide-react';
import authUtils from '../utils/authUtils';

const isMobileDevice = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize sidebar state based on screen size - open by default on desktop, closed on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobileDevice());
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const [pageActions, setPageActions] = useState([]);

    const userData = authUtils.getUserData();

    // Add resize listener with debounce for better performance
    useEffect(() => {
        let resizeTimer;
        
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const mobile = isMobileDevice();
                setIsMobile(mobile);
    
                // Automatically adjust sidebar based on screen size
                if (mobile && isSidebarOpen) {
                    setIsSidebarOpen(false);
                } else if (!mobile && !isSidebarOpen && !localStorage.getItem('sidebarClosed')) {
                    setIsSidebarOpen(true);
                }
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, [isSidebarOpen]);

    // Register page actions method for child components
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

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileMenuOpen && !event.target.closest('.profile-menu-container')) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileMenuOpen]);

    // Remember sidebar state
    useEffect(() => {
        if (!isMobile) {
            if (isSidebarOpen) {
                localStorage.removeItem('sidebarClosed');
            } else {
                localStorage.setItem('sidebarClosed', 'true');
            }
        }
    }, [isSidebarOpen, isMobile]);

    const menuItems = [
        { text: 'Tổng quan', icon: Gauge, path: '/dashboard' },
        { text: 'Quản lý sản phẩm', icon: FileBox, path: '/dmhh' },
        { text: 'Quản lý khách hàng', icon: BookUser, path: '/khtn' },
        { text: 'Tạo báo giá', icon: Receipt, path: '/baogiafrom' },
        { text: 'CSKH', icon: NotebookPen, path: '/cskh-calendar' },
        { text: 'Công việc', icon: ChartPie, path: '/task' },
        { text: 'PhanBoDT', icon: LayoutList, path: '/PhanBoDTview' },
        { text: 'Quản lý người dùng', icon: User, path: '/users' },
        { text: 'Đăng xuất', icon: LogOut, path: '/', isLogout: true }
    ];

    const handleLogout = () => {
        authUtils.logout();
        navigate('/');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const userInitial = userData?.username?.[0]?.toUpperCase() || '?';

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 transition-colors duration-200">
            {/* Logo & Brand */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                <div className="flex items-center">
                    <img src="/logo1.png" alt="Logo" className="h-8" />
                    <h1 className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">
                        WOWS CRM
                    </h1>
                </div>
                {isMobile && (
                    <button
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                        onClick={toggleSidebar}
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* User Info */}
            <div className="px-6 py-4 border-b dark:border-gray-700">
                <div
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors duration-150"
                    onClick={() => {
                        navigate('/profile');
                        isMobile && setIsSidebarOpen(false);
                    }}
                >
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shadow-sm">
                        {userInitial}
                    </div>
                    <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                            {userData?.['Họ và Tên'] || userData?.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {userData?.['Chức vụ'] || 'Nhân viên'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.text}
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
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                isActive 
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                            <span className={`font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {item.text}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-gray-800/50 dark:bg-black/50 z-40 backdrop-blur-sm"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full transform transition-transform duration-300 ease-in-out z-50 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:shadow-lg`}
                style={{ width: '18rem' }}
            >
                <SidebarContent />
            </aside>

            {/* Mini Sidebar for collapsed state on desktop */}
            {!isMobile && !isSidebarOpen && (
                <aside className="fixed top-0 left-0 h-full z-30 w-16 bg-white dark:bg-gray-800 shadow-lg hidden lg:block">
                    <div className="flex flex-col items-center py-4">
                        <img src="/logo1.png" alt="Logo" className="h-8 w-8 mb-6" />
                        
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (item.isLogout) {
                                            handleLogout();
                                        } else if (item.isExternal) {
                                            window.open(item.path, '_blank');
                                        } else {
                                            navigate(item.path);
                                        }
                                    }}
                                    className={`w-12 h-12 flex items-center justify-center rounded-lg mb-2 transition-all duration-200 group relative ${
                                        isActive 
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                    
                                    {/* Tooltip */}
                                    <span className="absolute left-full ml-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                                        {item.text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <div className={`transition-all duration-300 ${
                isSidebarOpen 
                    ? 'lg:pl-72' 
                    : (!isMobile ? 'lg:pl-16' : 'pl-0')
            }`}>
                {/* Header */}
                <header className={`fixed top-0 right-0 left-0 ${
                    isSidebarOpen 
                        ? 'lg:left-72' 
                        : (!isMobile ? 'lg:left-16' : 'left-0')
                } z-20 transition-all duration-300`}>
                    <div className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 flex items-center justify-between shadow-sm">
                        {/* Sidebar Toggle */}
                        <div className="flex items-center space-x-2">
                            <button
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                                onClick={toggleSidebar}
                                aria-label={isSidebarOpen ? "Đóng menu" : "Mở menu"}
                            >
                                {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                            </button>

                            {/* Page title based on current route */}
                            <h2 className="text-lg font-medium hidden md:block text-gray-800 dark:text-white">
                                {menuItems.find(item => item.path === location.pathname)?.text || 'Trang chủ'}
                            </h2>
                        </div>

                        {/* Các nút tùy chỉnh từ trang con */}
                        <div className="flex-1 flex justify-center">
                            <div className="flex items-center space-x-2 overflow-x-auto max-w-[90%] px-4 scrollbar-hide">
                                {pageActions.map((action, index) => (
                                    action.component ? (
                                        <div key={index} className="flex-shrink-0">
                                            {action.component}
                                        </div>
                                    ) : (
                                        <button
                                            key={index}
                                            onClick={action.onClick}
                                            className={`${action.className || 'px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow transition-all duration-150'} flex items-center space-x-1 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
                                            title={action.title || action.text}
                                            disabled={action.disabled}
                                        >
                                            {action.icon && (
                                                <span className="flex-shrink-0">{action.icon}</span>
                                            )}
                                            {action.text && (
                                                <span className={isMobile && action.mobileHideText ? 'hidden sm:inline' : ''}>
                                                    {action.text}
                                                </span>
                                            )}
                                        </button>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="relative profile-menu-container">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors duration-150"
                                aria-label="Menu người dùng"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                                    {userInitial}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-50 animate-fadeIn">
                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setIsProfileMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
                                    >
                                        <User className="h-4 w-4" />
                                        <span>Thông tin cá nhân</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/settings');
                                            setIsProfileMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span>Cài đặt</span>
                                    </button>
                                    <div className="border-t dark:border-gray-700 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className={`pt-16 transition-all duration-300 px-4 pb-8`}>
                    <div className="max-w-8xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

// Add this to your CSS or tailwind config
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
*/

export default MainLayout;