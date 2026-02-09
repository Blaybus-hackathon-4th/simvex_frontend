import { useState } from 'react'; // [추가] 상태 관리
import { useNavigate } from 'react-router-dom';
import { Search, User, Bell, LogOut, Settings } from 'lucide-react'; // [추가] 아이콘
import { useAuthStore } from '../store/authStore'; // [추가] Auth 스토어

// 샘플 데이터
const models = [
    { id: 'v4_engine', title: 'V4 Engine', desc: '내연기관의 4행정 사이클', category: '기계공학', image: 'bg-gradient-to-br from-orange-500/20 to-red-900/20' },
    { id: 'drone', title: 'Drone', desc: '회전익 항공기의 양력 발생 원리', category: '항공우주', image: 'bg-gradient-to-br from-blue-500/20 to-cyan-900/20' },
    { id: 'robot_arm', title: 'Robot Arm', desc: '직렬 매니퓰레이터 기구학', category: '로봇공학', image: 'bg-gradient-to-br from-purple-500/20 to-pink-900/20' },
    { id: 'suspension', title: 'Suspension', desc: '독립 현가장치의 진동 제어', category: '자동차공학', image: 'bg-gradient-to-br from-green-500/20 to-emerald-900/20' },
    { id: 'machine_vice', title: 'Machine Vice', desc: '나사의 역학적 원리', category: '기계공학', image: 'bg-gradient-to-br from-gray-500/20 to-slate-900/20' },
];

const DashboardPage = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout); // [추가] 로그아웃 함수 가져오기
    const [isProfileOpen, setIsProfileOpen] = useState(false); // [추가] 프로필 메뉴 토글 상태

    // [추가] 로그아웃 핸들러
    const handleLogout = () => {
        logout(); // 인증 상태 초기화
        navigate('/'); // 랜딩 페이지로 이동
    };

    return (
        <div className="min-h-screen bg-background text-white flex flex-col" onClick={() => setIsProfileOpen(false)}> {/* [추가] 배경 클릭 시 메뉴 닫기 */}

            {/* 1. Header (GNB) */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-surface/50 backdrop-blur sticky top-0 z-50">
                <div className="flex items-center gap-12">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <div className="w-6 h-6 bg-gray-300 rounded-sm" />
                        <span className="text-xl font-bold tracking-wider">SIMVEX</span>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                        <span className="text-white cursor-pointer">Home</span>
                        <span className="hover:text-white cursor-pointer transition">Study</span>
                        <span className="hover:text-white cursor-pointer transition">CAD</span>
                        <span className="hover:text-white cursor-pointer transition">Lab</span>
                    </nav>
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-6">
                    <Search className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
                    <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />

                    {/* [수정] User Profile Dropdown Area */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}> {/* 이벤트 버블링 방지 */}
                        <div
                            className="w-8 h-8 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/20 transition-all"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <User className="w-4 h-4 text-black" />
                        </div>

                        {/* Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-3 w-48 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 border-b border-white/10 mb-1">
                                    <p className="text-sm font-bold text-white">User Name</p>
                                    <p className="text-xs text-gray-400 truncate">user@simvex.com</p>
                                </div>

                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                                    <Settings className="w-4 h-4" />
                                    계정 설정
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    로그아웃
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* 2. Main Content */}
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">

                {/* Hero Text */}
                <div className="mb-12 mt-8">
                    <h1 className="text-3xl font-bold mb-2">무엇이 궁금하신가요?</h1>
                    <p className="text-gray-400">다양한 공학 시뮬레이션 모델을 3D로 탐색해보세요.</p>
                </div>

                {/* Category Filters */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                    {['전체', '기계공학', '항공우주', '로봇공학', '자동차공학'].map((tag, idx) => (
                        <button
                            key={idx}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap
                ${idx === 0 ? 'bg-white text-black' : 'bg-surface border border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* 3. Models Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {models.map((model) => (
                        <div
                            key={model.id}
                            onClick={() => navigate(`/viewer/${model.id}`)}
                            className="group bg-surface rounded-2xl border border-white/10 overflow-hidden hover:border-primary/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
                        >
                            {/* Thumbnail Area */}
                            <div className={`aspect-[4/3] ${model.image} relative flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-500`}>
                                {/* 3D Model Placeholder Icon */}
                                <div className="w-16 h-16 border-2 border-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                    <span className="text-2xl">📦</span>
                                </div>

                                {/* Badge */}
                                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur px-2 py-1 rounded text-xs text-white/80 border border-white/10">
                                    {model.category}
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{model.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2">{model.desc}</p>

                                <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                    학습 시작하기 →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;