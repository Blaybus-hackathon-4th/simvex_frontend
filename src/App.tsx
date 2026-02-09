import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from '@/pages/LandingPage';
import ViewerPage from '@/pages/ViewerPage';
import DashboardPage from '@/pages/DashboardPage';
import { useAuthStore } from '@/store/authStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    // 인증되지 않았다면 랜딩 페이지("/")로 리다이렉트
    return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 공개 라우트 (랜딩) */}
                <Route path="/" element={<LandingPage />} />

                {/* 보호된 라우트 (로그인 필요) */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/viewer/:id"
                    element={
                        <ProtectedRoute>
                            <ViewerPage />
                        </ProtectedRoute>
                    }
                />

                {/* 잘못된 경로는 랜딩으로 리다이렉트 (선택 사항) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;