// WOWS CRM Login Page component
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authUtils from '../utils/authUtils';
import config from '../config/config';
import { toast } from 'react-toastify';
import { Card, CardContent } from '../components/ui/card';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    useEffect(() => {
        if (authUtils.isAuthenticated()) {
            const returnUrl = localStorage.getItem('returnUrl');
            if (returnUrl) {
                localStorage.removeItem('returnUrl');
                navigate(returnUrl);
            } else {
                navigate(config.ROUTES.DASHBOARD);
            }
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            toast.error('Vui lòng nhập đầy đủ thông tin đăng nhập!');
            return;
        }

        setLoading(true);
        try {
            const user = await authUtils.login(formData.username, formData.password);
            toast.success(`Chào mừng ${user.username} đã quay trở lại!`);

            setTimeout(() => {
                const returnUrl = localStorage.getItem('returnUrl');
                if (returnUrl) {
                    localStorage.removeItem('returnUrl');
                    navigate(returnUrl);
                } else {
                    navigate(config.ROUTES.DASHBOARD);
                }
            }, 300);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // WOWS Colors
    // Main brown: #8b6144
    // Secondary copper: #c18456
    // Light background: #f9f6f2
    // Text dark: #5a4030
    // Text light: #ffffff

    return (
        <div className="min-h-screen flex items-center justify-center" 
             style={{ 
                 backgroundImage: 'linear-gradient(135deg, #f9f6f2 0%, #ede4d7 100%)',
                 backgroundSize: 'cover',
             }}>
            <div className="w-full max-w-md mx-4">
                <Card className="shadow-lg border-0 bg-white/95">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            {/* WOWS Logo */}
                            <img
                                src="/logo1.png" 
                                alt="WOWS Logo"
                                className="h-28 mx-auto mb-3"
                            />
                        </div>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-semibold text-[#8b6144] mb-2">
                                Đăng nhập 
                            </h1>
                            <p className="text-[#5a4030]">
                                Vui lòng đăng nhập để tiếp tục
                            </p>
                        </div>

                        {location.state?.from && (
                            <div className="mb-6 p-4 bg-[#f9f6f2] border border-[#d5c3b2] text-[#5a4030] rounded-lg">
                                Bạn cần đăng nhập để truy cập trang {location.state.from}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-[#5a4030]"
                                >
                                    Tên đăng nhập
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-[#c18456]" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        placeholder="Nhập tên đăng nhập"
                                        className="w-full h-11 pl-10 rounded-lg border border-[#d5c3b2] focus:border-[#c18456] focus:ring-2 focus:ring-[#c18456]/20 transition-colors outline-none bg-white"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-[#5a4030]"
                                >
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-[#c18456]" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="Nhập mật khẩu"
                                        className="w-full h-11 pl-10 pr-12 rounded-lg border border-[#d5c3b2] focus:border-[#c18456] focus:ring-2 focus:ring-[#c18456]/20 transition-colors outline-none bg-white"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#8b6144] hover:text-[#5a4030] transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-[#c18456] hover:bg-[#8b6144] text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-70"
                                style={{boxShadow: '0 2px 8px rgba(193, 132, 86, 0.4)'}}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </button>
                        </form>
                    </CardContent>
                </Card>
                <div className="text-center mt-4 text-[#5a4030] text-sm">
                    © 2025 WOWS Group. Tất cả quyền được bảo lưu.
                </div>
            </div>
        </div>
    );
};

export default LoginPage;