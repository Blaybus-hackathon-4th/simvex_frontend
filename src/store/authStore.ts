import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    institutionId: string | null;
    login: (institutionId: string, code: string) => Promise<boolean>; // 실제로는 API 호출
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            institutionId: null,
            login: async (institutionId, code) => {
                // [F-00] Mock API Call logic
                if (code === "123456") { // 임시 검증 로직
                    set({ isAuthenticated: true, institutionId });
                    return true;
                }
                return false;
            },
            logout: () => set({ isAuthenticated: false, institutionId: null }),
        }),
        { name: 'simvex-auth' } // LocalStorage 저장
    )
);