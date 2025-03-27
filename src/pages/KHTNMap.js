import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Download, RefreshCw, Map, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import authUtils from '../utils/authUtils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Fix icon issues with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map view when center changes
const ChangeView = ({ center }) => {
    const map = useMap();
    map.setView(center, 13);
    return null;
};

const KHTNMap = () => {
    const [khtnList, setKhtnList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]); // Ho Chi Minh City default
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState('TẤT CẢ');
    const [showFilters, setShowFilters] = useState(false);
    const [searchAddress, setSearchAddress] = useState('');
    const [statusFilter, setStatusFilter] = useState('TẤT CẢ');
    const [ratingFilter, setRatingFilter] = useState('TẤT CẢ');
    const navigate = useNavigate();

    // Fetch customer data
    useEffect(() => {
        loadKHTNList();
    }, []);

    const loadKHTNList = async () => {
        try {
            setIsLoading(true);

            const response = await authUtils.apiRequest('KHTN', 'Find', {
                Properties: {
                    Locale: "vi-VN",
                    Timezone: "Asia/Ho_Chi_Minh",
                    Selector: "Filter(KHTN, true)"
                }
            });

            if (response) {
                setKhtnList(response);
                setFilteredList(response);
                
                // Get coordinates for each customer with lat/lng data
                const markersData = response
                    .filter(customer => customer['LAT'] && customer['LNG'])
                    .map(customer => ({
                        id: customer['ID_CTY'],
                        position: [parseFloat(customer['LAT']), parseFloat(customer['LNG'])],
                        title: customer['TÊN CÔNG TY'],
                        address: customer['ĐỊA CHỈ'],
                        contact: customer['NGƯỜI LIÊN HỆ'],
                        phone: customer['SỐ ĐT NGƯỜI LIÊN HỆ'],
                        status: customer['CHỐT THÀNH KH'],
                        source: customer['NGUỒN'],
                        rating: customer['ĐÁNH GIÁ TIỂM NĂNG'],
                    }));

                setMarkers(markersData);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Lỗi khi tải danh sách KHTN:', error);
            setIsLoading(false);
            toast.error('Không thể tải danh sách khách hàng tiềm năng. Vui lòng thử lại sau.');
        }
    };

    // Search address using Nominatim OpenStreetMap
    const searchAddressOnMap = async () => {
        if (!searchAddress) {
            toast.warning('Vui lòng nhập địa chỉ để tìm kiếm');
            return;
        }

        try {
            setIsLoading(true);
            
            // Use OpenStreetMap Nominatim for geocoding (free)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setMapCenter([lat, lng]);
                toast.success('Đã tìm thấy địa chỉ');
            } else {
                toast.error('Không tìm thấy địa chỉ');
            }
            
            setIsLoading(false);
        } catch (error) {
            console.error('Lỗi khi tìm kiếm địa chỉ:', error);
            setIsLoading(false);
            toast.error('Không thể tìm kiếm địa chỉ. Vui lòng thử lại sau.');
        }
    };

    // Apply all filters
    useEffect(() => {
        let filtered = [...khtnList];
        
        // Apply source filter
        if (filterType !== 'TẤT CẢ') {
            filtered = filtered.filter(customer => customer['NGUỒN'] === filterType);
        }
        
        // Apply status filter
        if (statusFilter !== 'TẤT CẢ') {
            filtered = filtered.filter(customer => {
                const status = customer['CHỐT THÀNH KH'];
                if (statusFilter === 'Đã chốt') return status === 'Đã thành khách hàng';
                if (statusFilter === 'Đang tiếp cận') return status === 'Khách hàng tiềm năng';
                if (statusFilter === 'Chưa tiếp cận') return !status || status === '';
                return true;
            });
        }
        
        // Apply rating filter
        if (ratingFilter !== 'TẤT CẢ') {
            filtered = filtered.filter(customer => {
                return customer['ĐÁNH GIÁ TIỂM NĂNG'] === ratingFilter;
            });
        }
        
        setFilteredList(filtered);
        
        // Update markers based on filtered list
        const filteredMarkers = markers.filter(marker => {
            const matchingCustomer = filtered.find(customer => customer['ID_CTY'] === marker.id);
            return !!matchingCustomer;
        });
        
        // Only update markers if filteredList has been changed
        setMarkers(filteredMarkers);
        
    }, [filterType, statusFilter, ratingFilter, khtnList]);

    // Get unique sources for filter
    const uniqueSources = [...new Set(khtnList.map(item => item['NGUỒN']).filter(Boolean))];
    
    // Get unique ratings for filter
    const uniqueRatings = [...new Set(khtnList.map(item => item['ĐÁNH GIÁ TIỂM NĂNG']).filter(Boolean))];

    // Reset all filters
    const resetFilters = () => {
        setFilterType('TẤT CẢ');
        setStatusFilter('TẤT CẢ');
        setRatingFilter('TẤT CẢ');
    };

    // Get marker icon based on status
    const getMarkerIcon = (status) => {
        if (status === 'Đã thành khách hàng') {
            return new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: iconShadow,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
        } else if (status === 'Khách hàng tiềm năng') {
            return new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
                shadowUrl: iconShadow,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
        }
        
        // Default marker
        return DefaultIcon;
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center">
                            <button 
                                onClick={() => navigate('/khtn')}
                                className="mr-3 p-2 rounded-full hover:bg-gray-100"
                                title="Quay lại quản lý KHTN"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800">Bản Đồ Phân Bổ Khách Hàng Tiềm Năng</h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                            </button>
                            <button
                                onClick={loadKHTNList}
                                className={`px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>
                        </div>
                    </div>

                    {/* Search Address */}
                    <div className="mb-6">
                        <div className="flex">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm địa chỉ..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={searchAddress}
                                    onChange={(e) => setSearchAddress(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchAddressOnMap()}
                                />
                            </div>
                            <button
                                onClick={searchAddressOnMap}
                                className="px-4 py-3 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors"
                                disabled={isLoading}
                            >
                                Tìm kiếm
                            </button>
                        </div>
                    </div>

                    {/* Filter Section - Optimized Version */}
                    {showFilters && (
                        <div className="mb-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                <h3 className="text-base font-semibold text-gray-800 mb-2 md:mb-0">Bộ lọc</h3>
                                <div className="text-sm text-gray-500">
                                    Hiển thị: {filteredList.length} / {khtnList.length} khách hàng
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Filter by Source */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Nguồn khách hàng:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setFilterType('TẤT CẢ')}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                                filterType === 'TẤT CẢ'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Tất cả
                                        </button>
                                        {uniqueSources.map((source) => (
                                            <button
                                                key={source}
                                                onClick={() => setFilterType(source)}
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                                    filterType === source
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {source}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Status Filter */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Trạng thái:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setStatusFilter('TẤT CẢ')}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                                statusFilter === 'TẤT CẢ'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('Đã chốt')}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                                statusFilter === 'Đã chốt'
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Đã chốt
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('Đang tiếp cận')}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                                statusFilter === 'Đang tiếp cận'
                                                ? 'bg-yellow-500 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Đang tiếp cận
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('Chưa tiếp cận')}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                                statusFilter === 'Chưa tiếp cận'
                                                ? 'bg-blue-500 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Chưa tiếp cận
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Rating Filter */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Đánh giá tiềm năng:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setRatingFilter('TẤT CẢ')}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                                ratingFilter === 'TẤT CẢ'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Tất cả
                                        </button>
                                        {uniqueRatings.map((rating) => (
                                            <button
                                                key={rating}
                                                onClick={() => setRatingFilter(rating)}
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                                    ratingFilter === rating
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {rating}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Filter Actions */}
                                <div className="flex justify-end pt-3 mt-2 border-t border-gray-100">
                                    <button 
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 mr-2"
                                        onClick={resetFilters}
                                    >
                                        Đặt lại
                                    </button>
                                    <button 
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                        onClick={() => setShowFilters(false)}
                                    >
                                        Áp dụng
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tổng số khách hàng tiềm năng</h3>
                            <p className="text-2xl font-bold text-blue-800">{khtnList.length}</p>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Đã hiển thị trên bản đồ</h3>
                            <p className="text-2xl font-bold text-green-800">
                                {markers.length}
                            </p>
                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <h3 className="text-sm text-purple-700 mb-1">Độ phủ địa lý</h3>
                            <p className="text-2xl font-bold text-purple-800">
                                {khtnList.length > 0 ? Math.round((markers.length / khtnList.length) * 100) : 0}%
                            </p>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: "700px" }}>
                        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <ChangeView center={mapCenter} />
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <MarkerClusterGroup>
                                {markers.map(marker => (
                                    <Marker 
                                        key={marker.id} 
                                        position={marker.position}
                                        icon={getMarkerIcon(marker.status)}
                                    >
                                        <Popup>
                                            <div className="p-1 max-w-xs">
                                                <h3 className="font-bold text-gray-800">{marker.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{marker.address}</p>
                                                <div className="mt-2 text-sm">
                                                    <p><span className="font-medium">Liên hệ:</span> {marker.contact}</p>
                                                    <p><span className="font-medium">SĐT:</span> {marker.phone}</p>
                                                    <p><span className="font-medium">Nguồn:</span> {marker.source}</p>
                                                    <p><span className="font-medium">Đánh giá:</span> {marker.rating}</p>
                                                </div>
                                                <div className="mt-2">
                                                    <button 
                                                        onClick={() => navigate(`/khtn/${marker.id}`)}
                                                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MarkerClusterGroup>
                        </MapContainer>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Chú thích:</h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                                <span className="text-sm">Khách hàng tiềm năng</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm">Đã chốt thành khách hàng</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                                <span className="text-sm">Đang tiếp cận</span>
                            </div>
                        </div>
                    </div>

                    {/* Note about adding location data */}
                    <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h3 className="text-sm font-medium text-yellow-700 mb-2">Lưu ý:</h3>
                        <p className="text-sm text-yellow-800">
                            Để hiển thị khách hàng trên bản đồ, vui lòng cập nhật thông tin LAT (vĩ độ) và LNG (kinh độ) cho khách hàng trong phần chỉnh sửa thông tin.
                            Bạn có thể lấy tọa độ từ Google Maps hoặc các công cụ định vị khác.
                        </p>
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

export default KHTNMap;