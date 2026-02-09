import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import callApi, { HttpMethod } from '../api/callApi';

import logoImg from '../assets/logo.png';
import type { Institution } from '@/types';

const Logo = () => (
  <div className='flex items-center gap-3'>
    <img src={logoImg} alt='SIMVEX Logo' className='w-10 h-10 object-contain rounded-sm' />
    <span className='text-2xl font-bold text-gray-300 tracking-wider'>SIMVEX</span>
  </div>
);

type LoginResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string; // "로그인 성공" 등
};

const LandingPage = () => {
  const navigate = useNavigate();

  const [instId, setInstId] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await callApi<{ result: Institution[] }>('/members/institutions', HttpMethod.GET);
        if (response?.result) setInstitutions(response.result);
      } catch (error) {
        console.error('Failed to fetch institutions:', error);
      }
    };
    fetchInstitutions();
  }, []);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  // POST /members/login 호출로 변경
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = otp.join('');
    if (!instId || code.length !== 6) return;

    try {
      const body = {
        institutionId: Number(instId), // Long
        verificationCode: code, // String
      };

      const res = await callApi<LoginResponse>('/members/login', HttpMethod.POST, body);

      if (res?.isSuccess) {
        // ✅ accessToken은 Set-Cookie로 저장되므로 여기서는 성공만 처리
        navigate('/dashboard');
      } else {
        alert(res?.message ?? '인증 코드를 확인해주세요.');
      }
    } catch (err) {
      console.error('Login failed:', err);
      alert('로그인 요청에 실패했습니다.');
    }
  };

  const isFormValid = instId !== '' && otp.every((digit) => digit !== '');

  return (
    <div className='flex h-screen w-full bg-background overflow-hidden'>
      <div className='w-1/2 h-full relative bg-black flex flex-col justify-end p-12'>
        <div className='absolute inset-0 overflow-hidden flex items-center justify-center'>
          <img src={logoImg} alt='Hero Background' className='w-full h-full object-cover opacity-80' />
          <div className='absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent' />
        </div>
        <div className='relative z-10 mb-8'>
          <Logo />
        </div>
      </div>

      <div className='w-1/2 h-full bg-[#111111] flex flex-col justify-center px-24 relative'>
        <div className='max-w-md w-full mx-auto'>
          <h1 className='text-4xl font-bold text-white mb-4'>인증 코드 입력</h1>
          <p className='text-gray-400 text-sm mb-12 leading-relaxed'>
            선택한 기관에서 제공받은 인증 코드를 입력해 주세요.
            <br />
            인증이 완료되면 서비스 이용이 가능합니다.
          </p>

          <form onSubmit={handleLogin} className='space-y-8'>
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-300'>기관</label>
              <div className='relative'>
                <select
                  className='w-full bg-[#2A2A2A] text-gray-300 text-sm rounded-lg p-4 pr-10 appearance-none outline-none focus:ring-1 focus:ring-gray-500 transition-all cursor-pointer'
                  value={instId}
                  onChange={(e) => setInstId(e.target.value)}
                >
                  <option value='' disabled>
                    해당하는 기관을 선택해주세요
                  </option>
                  {institutions.map((inst) => (
                    <option key={inst.institutionId} value={inst.institutionId.toString()}>
                      {inst.institutionName}
                    </option>
                  ))}
                </select>
                <ChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5' />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-300'>코드 입력</label>
              <div className='flex justify-between gap-3'>
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type='text'
                    maxLength={1}
                    className='w-full aspect-square bg-[#2A2A2A] text-white text-center text-xl font-bold rounded-lg focus:bg-[#333] outline-none focus:ring-1 focus:ring-gray-500 transition-all'
                    value={data}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>
            </div>

            <button
              type='submit'
              disabled={!isFormValid}
              className={`w-full cursor-pointer py-4 rounded-lg font-bold text-sm transition-all duration-200 mt-8
                ${
                  isFormValid
                    ? 'bg-gray-200 text-black hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'bg-[#2A2A2A] text-gray-500 cursor-not-allowed'
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
