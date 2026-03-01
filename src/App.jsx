import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard'; 
import Login from './pages/Login';
import WorkGoals from './pages/WorkGoals'; 
import Insights from './pages/Insights'; // 1. Imported perfectly
import Health from './pages/Health';
import Sleep from './pages/Sleep';
import Habits from './pages/Habits';
import Planner from './pages/Planner';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>; 
    return user ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* All routes inside here share the Sidebar/Navbar and are protected */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} /> 
                <Route path="/goals" element={<WorkGoals />} /> 
                <Route path="/insights" element={<Insights />} /> {/* 2. Placed safely inside the Routes! */}
                <Route path="/health" element={<Health />} /> 
                <Route path="/sleep" element={<Sleep />} /> 
                <Route path="/habits" element={<Habits />} /> 
                <Route path="/planner" element={<Planner />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;