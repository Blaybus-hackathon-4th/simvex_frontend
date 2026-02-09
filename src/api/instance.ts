import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// 환경 변수에서 URL 가져오기
const baseURL = import.meta.env.VITE_API_BASE_URL;

const apiInstance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// [요청 인터셉터]
apiInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // TODO: 나중에 로그인 기능 구현 시, 토큰을 여기서 넣습니다.
        // const token = localStorage.getItem('accessToken');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// [응답 인터셉터]
apiInstance.interceptors.response.use(
    (response) => {
        // 백엔드에서 주는 데이터 구조에 따라 response.data만 리턴할지 결정
        return response.data;
    },
    async (error: AxiosError) => {
        const status = error.response?.status;

        if (status === 401) {
            console.error('인증 실패: 로그인이 필요합니다.');
            // TODO: 토큰 갱신 로직 or 로그아웃 처리
            // window.location.href = '/';
        } else if (status === 403) {
            console.error('권한 없음');
        } else if (status === 500) {
            console.error('서버 에러 발생');
        }

        return Promise.reject(error);
    }
);

export default apiInstance;