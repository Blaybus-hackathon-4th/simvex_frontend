import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    institutionId: string | null;
    // 수정됨: API 호출은 컴포넌트에서 하므로, 여기서는 결과(ID)만 받아 상태를 업데이트합니다.
    login: (institutionId: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            institutionId: null,
            // 수정됨: 인자로 받은 ID를 저장하고 인증 상태를 true로 변경
            login: (institutionId) => {
                set({ isAuthenticated: true, institutionId });
            },
            logout: () => set({ isAuthenticated: false, institutionId: null }),
        }),
        { name: 'simvex-auth' } // LocalStorage에 저장하여 새로고침 해도 로그인 유지
    )
);