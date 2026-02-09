import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ChevronDown } from 'lucide-react';

// 이미지 파일 불러오기
import logoImg from '../assets/logo.png';

// 로고 컴포넌트 (좌측 하단 작은 로고)
const Logo = () => (
    <div className="flex items-center gap-3">
        <img
            src={logoImg}
            alt="SIMVEX Logo"
            className="w-10 h-10 object-contain rounded-sm"
        />
        <span className="text-2xl font-bold text-gray-300 tracking-wider">SIMVEX</span>
    </div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [instId, setInstId] = useState('');
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // 6자리 코드 입력 핸들러
    const handleOtpChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        if (element.value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // 백스페이스 키 처리
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length < 6) return;

        const success = await login(instId, code);
        if (success) {
            navigate('/dashboard');
        } else {
            alert("인증 코드를 확인해주세요.");
        }
    };

    const isFormValid = instId !== "" && otp.every(digit => digit !== "");

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">

            {/* [Left Side] 3D Graphic Area */}
            <div className="w-1/2 h-full relative bg-black flex flex-col justify-end p-12">

                {/* 배경 이미지 적용 영역 */}
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                    {/* 1. 배경 이미지 (logoImg를 배경으로 사용) */}
                    <img
                        src={logoImg}
                        alt="Hero Background"
                        className="w-full h-full object-cover opacity-80"
                    />

                    {/* 2. 어두운 오버레이 (텍스트 가독성을 위해 위에 덮음) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                {/* Logo Position */}
                <div className="relative z-10 mb-8">
                    <Logo />
                </div>
            </div>

            {/* [Right Side] Login Form Area */}
            <div className="w-1/2 h-full bg-[#111111] flex flex-col justify-center px-24 relative">
                <div className="max-w-md w-full mx-auto">

                    <h1 className="text-4xl font-bold text-white mb-4">인증 코드 입력</h1>
                    <p className="text-gray-400 text-sm mb-12 leading-relaxed">
                        선택한 기관에서 제공받은 인증 코드를 입력해 주세요.<br />
                        인증이 완료되면 서비스 이용이 가능합니다.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-8">
                        {/* 1. 기관 선택 */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">기관</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-[#2A2A2A] text-gray-300 text-sm rounded-lg p-4 pr-10 appearance-none outline-none focus:ring-1 focus:ring-gray-500 transition-all cursor-pointer"
                                    value={instId}
                                    onChange={(e) => setInstId(e.target.value)}
                                >
                                    <option value="" disabled>해당하는 기관을 선택해주세요</option>
                                    <option value="univ_A">한국대학교 (Korea Univ)</option>
                                    <option value="univ_B">미래공과대학교 (Future Tech)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                            </div>
                        </div>

                        {/* 2. 코드 입력 */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">코드 입력</label>
                            <div className="flex justify-between gap-3">
                                {otp.map((data, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength={1}
                                        className="w-full aspect-square bg-[#2A2A2A] text-white text-center text-xl font-bold rounded-lg focus:bg-[#333] outline-none focus:ring-1 focus:ring-gray-500 transition-all"
                                        value={data}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        onChange={e => handleOtpChange(e.target, index)}
                                        onKeyDown={e => handleKeyDown(e, index)}
                                        onFocus={e => e.target.select()}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 3. 인증하기 버튼 */}
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className={`w-full py-4 rounded-lg font-bold text-sm transition-all duration-200 mt-8
                            ${isFormValid
                                ? "bg-gray-200 text-black hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                : "bg-[#2A2A2A] text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            인증하기
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default LandingPage;