import {
    ChartPie, Home, IdCard, BriefcaseBusiness, FileBadge2,
    Wallet, Settings, User, AppWindow, FileBox, Edit,
    ArrowRight, LayoutGrid, ExternalLink
} from 'lucide-react';

// Các menu item cho taskbar
export const taskbarMenuItems = [
    {
        text: 'Trang chủ',
        icon: Home,
        path: '/dashboard',
        description: 'Tổng hợp chức năng',
        permissions: { all: true } // Everyone can see Home
    },
    {
        text: 'Quản lý người dùng',
        icon: User,
        path: '/users',
        description: 'Quản lý người dùng',
        permissions: {
            roles: ["Admin"],
            departments: ["Giám đốc", "Hành chánh"],
            positions: ["Kế toán"]
        }
    }
    // Thêm các menu item khác nếu cần
];

// Cấu trúc menu cho dashboard
export const dashboardMenuItems = [
    {
        groupId: 1,
        groupName: "APPS",
        icon: AppWindow,
        permissions: { PhanQuyen: ["All"] },
        items: [
            {
                text: 'APP HCNS',
                icon: Home,
                path: 'https://www.appsheet.com/start/f0dd0d6d-ecff-43d2-955e-f1043372dcf3',
                description: 'WOWS HÀNH CHÍNH NHÂN SỰ',
                count: 0,
                isExternal: true,
                permissions: { PhanQuyen: ["All"] }
            }, {
                text: 'Chấm công wows',
                icon: Home,
                path: 'https://drive.wows.vn/WowsChamCong/',
                description: 'Chấm công',
                count: 0,
                isExternal: true,
                permissions: { PhanQuyen: ["All"] }
            }
        ]
    },
    {
        groupId: 5,
        groupName: "Kế hoạch",
        icon: Wallet,
        permissions: {
            PhanQuyen: ["Admin", "All"],
            Phong: ["Hành chánh", "Giám đốc"],
        },
        items: [
            {
                text: 'Kế hoạch doanh thu ',
                icon: ChartPie,
                path: '/PhanBoDTview',
                description: 'Kế hoạch doanh thu',
                permissions: {
                    PhanQuyen: ["Admin", "All"],
                    Phong: ["Giám đốc"],
                }
            },
            {
                text: 'Tạo kế hoạch doanh thu',
                icon: ChartPie,
                path: '/PhanBoDT',
                description: 'Kế hoạch doanh thu',
                permissions: {
                    PhanQuyen: ["Admin", "All"],
                    Phong: ["Giám đốc"],
                }
            },
        ]
    },
    {
        groupId: 2,
        groupName: "Khách hàng",
        icon: Wallet,
        permissions: {
            PhanQuyen: ["Admin", "All"],
            Phong: ["Hành chánh", "Giám đốc"],
        },
        items: [
            {
                text: 'Quản lý khách hàng',
                icon: ChartPie,
                path: '/khtn',
                description: 'Báo cáo dự án',
                permissions: {
                    PhanQuyen: ["Admin", "All"],
                    Phong: ["Giám đốc"],
                }
            },
            {
                text: 'Bản đồ phân bổ khách hàng',
                icon: ChartPie,
                path: '/khtn-map',
                description: 'Báo cáo dự án',
                permissions: {
                    PhanQuyen: ["Admin", "All"],
                    Phong: ["Giám đốc"],
                }
            },
            {
                text: 'Kỷ niệm',
                icon: ChartPie,
                path: '/khtn-calendar',
                description: 'Sinh nhật/Kỷ niệm',
                permissions: {
                    PhanQuyen: ["Admin", "All"],
                    Phong: ["Giám đốc"],
                }
            },
            {
                text: 'Chăm sóc khách hàng',
                icon: ChartPie,
                path: '/cskh',
                description: '',
                permissions: {
                    PhanQuyen: ["Admin", "All"],
                    Phong: ["Giám đốc"],
                }
            }
        ]
    },
    {
        groupId: 3,
        groupName: "Danh mục hàng hóa",
        icon: Wallet,
        permissions: {
            PhanQuyen: ["Admin", "All"],
            Phong: ["Hành chánh", "Giám đốc"],
        },
        items: [
            {
                text: 'DMHH WOWS',
                icon: Wallet,
                path: '/dmhh',
                description: 'Quản lý hàng hóa',
                permissions: {
                    PhanQuyen: ["Admin", "All"],
                    Phong: ["Hành chánh", "Giám đốc"],
                }
            },
            {
                text: 'DMHH LEA',
                icon: Wallet,
                path: '/Chamcong',
                description: 'Hoàng hóa lea',
                permissions: {
                    PhanQuyen: ["Admin", "All"],
                    Phong: ["Hành chánh", "Giám đốc"],
                }
            },
        ]
    },
    {
        groupId: 7,
        groupName: "Cài Đặt",
        icon: Settings,
        permissions: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"] },
        items: [
            {
                text: 'Nhân viên',
                icon: User,
                path: '/users',
                description: 'Nhân viên',
                permissions: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"], }
            }
        ]
    }
];

// Hàm helper để lấy title của page dựa trên path
export const getPageTitleByPath = (path) => {
    // Kiểm tra các path cố định
    if (path === '/profile') return 'Thông tin cá nhân';
    if (path === '/notifications') return 'Thông báo';
    if (path === '/support') return 'Hỗ trợ';
    if (path === '/settings') return 'Cài đặt';

    // Tìm trong taskbar menu
    const taskbarItem = taskbarMenuItems.find(item => item.path === path);
    if (taskbarItem) return taskbarItem.text;

    // Tìm trong dashboard menu
    for (const group of dashboardMenuItems) {
        const item = group.items.find(item => item.path === path);
        if (item) return item.text;
    }

    return 'Trang khác';
};

// Hàm kiểm tra quyền truy cập cho menu dashboard
export const checkDashboardPermission = (item, user) => {
    // If permissions are not specified, deny access
    if (!item.permissions) return false;

    // If "All" is included in PhanQuyen, allow access to everyone
    if (item.permissions.PhanQuyen && item.permissions.PhanQuyen.includes("All")) {
        return true;
    }

    // Check by employee code
    if (item.permissions.employeeCodes && user['Họ và Tên']) {
        if (item.permissions.employeeCodes.includes(user['Họ và Tên'])) {
            return true;
        }
    }

    // Check by role
    if (item.permissions.PhanQuyen && user['Phân quyền']) {
        if (item.permissions.PhanQuyen.includes(user['Phân quyền'])) {
            return true;
        }
    }

    // Check by department
    if (item.permissions.Phong && user['Phòng']) {
        if (item.permissions.Phong.includes(user['Phòng'])) {
            return true;
        }
    }

    // Check by position
    if (item.permissions.ChucVu && user['Chức vụ']) {
        if (item.permissions.ChucVu.includes(user['Chức vụ'])) {
            return true;
        }
    }

    // If none of the conditions match, deny access
    return false;
};