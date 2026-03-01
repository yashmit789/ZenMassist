// frontend/src/components/Layout.jsx
import { NavLink, Outlet } from 'react-router-dom';
import { Target, Heart, Moon, CheckCircle, Calendar, Lightbulb, Moon as MoonIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', icon: <Target size={18} />, path: '/' },
        { name: 'Work Goals', icon: <Target size={18} />, path: '/goals' },
        { name: 'Health', icon: <Heart size={18} />, path: '/health' },
        { name: 'Sleep', icon: <Moon size={18} />, path: '/sleep' },
        { name: 'Habits', icon: <CheckCircle size={18} />, path: '/habits' },
        { name: 'Planner', icon: <Calendar size={18} />, path: '/planner' },
        { name: 'Insights', icon: <Lightbulb size={18} />, path: '/insights' }, // AI Chat goes here
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans">
            {/* Top Navigation Bar */}
            <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
                <div className="text-xl font-bold tracking-tight">ZenFlow</div>
                
                <div className="flex space-x-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    isActive 
                                    ? 'bg-[#2A3B32] text-white' // Dark green active state from screenshots
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="flex items-center space-x-4">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                        <MoonIcon size={20} />
                    </button>
                    <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-red-600">
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-8 py-10">
                <Outlet /> {/* This renders the specific page content */}
            </main>
        </div>
    );
};

export default Layout;