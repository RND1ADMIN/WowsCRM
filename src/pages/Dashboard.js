import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    ExternalLink,
    Search,
    X,
    SlidersHorizontal
} from 'lucide-react';
import authUtils from '../utils/authUtils';
import { dashboardMenuItems, checkDashboardPermission } from '../config/menuConfig';

const MenuStructurePage = () => {
    const navigate = useNavigate();
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const userData = authUtils.getUserData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [filteredItems, setFilteredItems] = useState([]);
    
    // Sử dụng menu items từ config
    const menuItems = dashboardMenuItems;

    // Lọc items dựa trên từ khóa tìm kiếm và nhóm đã chọn
    useEffect(() => {
        const filtered = menuItems
            .filter(group => checkDashboardPermission(group, userData))
            .map(group => {
                // Lọc các item dựa trên quyền truy cập và từ khóa tìm kiếm
                const accessibleItems = group.items.filter(item => 
                    checkDashboardPermission(item, userData) && 
                    (searchQuery === '' || 
                     item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())))
                );
                
                return {
                    ...group,
                    filteredItems: accessibleItems
                };
            })
            .filter(group => selectedGroup === 'all' || group.groupId.toString() === selectedGroup);
        
        setFilteredItems(filtered);
    }, [searchQuery, selectedGroup, menuItems, userData]);

    // Hàm xử lý khi click vào menu item
    const handleItemClick = (item) => {
        if (item.isLogout) {
            localStorage.removeItem('auth_token');
            navigate('/');
        } else if (item.isExternal) {
            window.open(item.path, '_blank');
        } else {
            navigate(item.path);
        }
    };

    // Lấy tất cả các nhóm để hiển thị trong bộ lọc
    const allGroups = menuItems
        .filter(group => checkDashboardPermission(group, userData))
        .map(group => ({
            id: group.groupId,
            name: group.groupName
        }));

    // Xóa tìm kiếm
    const clearSearch = () => {
        setSearchQuery('');
    };

    // Đếm tổng số mục hiển thị
    const totalItemsShown = filteredItems.reduce((total, group) => total + group.filteredItems.length, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Khu vực tìm kiếm và lọc */}
            <div className="bg-white p-4 mb-4 rounded-lg shadow-sm border">
                <div className="flex flex-col md:flex-row gap-3 mb-2">
                    {/* Ô tìm kiếm */}
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm chức năng..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c5b2f]/30 focus:border-[#7c5b2f] transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    
                    {/* Bộ lọc theo nhóm */}
                    <div className="flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <SlidersHorizontal className="h-4 w-4 text-[#7c5b2f]" />
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c5b2f]/30 focus:border-[#7c5b2f] bg-white"
                            >
                                <option value="all">Tất cả nhóm</option>
                                {allGroups.map(group => (
                                    <option key={group.id} value={group.id.toString()}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Hiển thị số lượng kết quả */}
                <div className="text-sm text-gray-500">
                    {searchQuery ? (
                        <span>Tìm thấy {totalItemsShown} chức năng cho từ khóa "{searchQuery}"</span>
                    ) : (
                        <span>Hiển thị {totalItemsShown} chức năng {selectedGroup !== 'all' ? 'trong nhóm đã chọn' : ''}</span>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto p-4">
                {filteredItems.length === 0 || totalItemsShown === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                            <Search className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">Không tìm thấy chức năng nào</h3>
                        <p className="text-gray-500 mt-1">Vui lòng thử từ khóa khác hoặc chọn nhóm khác</p>
                        {(searchQuery || selectedGroup !== 'all') && (
                            <button 
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedGroup('all');
                                }}
                                className="mt-4 px-4 py-2 bg-[#7c5b2f] text-white rounded-lg hover:bg-[#584107] transition-colors"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    filteredItems.map((group) => {
                        if (group.filteredItems.length === 0) {
                            return null;
                        }

                        const GroupIcon = group.icon;

                        return (
                            <div key={group.groupId} className="mb-6">
                                <div className="flex items-center mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7c5b2f] to-[#584107] flex items-center justify-center text-white shadow-md mr-2">
                                        <GroupIcon className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-800">{group.groupName}</h2>
                                    <div className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                                        {group.filteredItems.length} chức năng
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {group.filteredItems.map((item, index) => {
                                        const Icon = item.icon;
                                        return (
                                            <div
                                                key={index}
                                                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-[#d99c07]/30 transition-all cursor-pointer relative group overflow-hidden"
                                                onClick={() => handleItemClick(item)}
                                            >
                                                <div className="absolute top-0 right-0 h-10 w-10 bg-gradient-to-br from-[#b7a035]/10 to-[#d99c07]/10 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform"></div>

                                                <div className="flex items-center">
                                                    {/* Icon bên trái */}
                                                    <div className="bg-gradient-to-br from-[#7c5b2f] to-[#7c5b2f] p-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow mr-3">
                                                        <Icon className="h-5 w-5 text-white" />
                                                    </div>

                                                    {/* Nội dung ở giữa */}
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-800 text-sm">{item.text}</h3>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {item.description || `Quản lý ${item.text.toLowerCase()}`}
                                                        </p>

                                                        {item.count > 0 && (
                                                            <div className="mt-1 inline-block px-2 py-0.5 bg-blue-50 text-[#003399] text-xs font-medium rounded-full">
                                                                {item.count}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action bên phải */}
                                                    <div className="ml-2">
                                                        <span className="text-[#b7a035] group-hover:text-[#d99c07] flex items-center text-xs font-medium transition-colors whitespace-nowrap">
                                                            {item.isExternal ? (
                                                                <>
                                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                                    Mở liên kết
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Truy cập
                                                                    <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MenuStructurePage;