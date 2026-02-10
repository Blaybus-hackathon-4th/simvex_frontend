import apiInstance from './instance';
import type { AxiosRequestConfig } from 'axios';

// HTTP 메서드 상수
export const HttpMethod = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
} as const;

export type HttpMethodType = typeof HttpMethod[keyof typeof HttpMethod];

/**
 * 공통 API 호출 함수
 * @param endpoint API 주소
 * @param method HTTP 메서드
 * @param data Body 데이터
 * @param params Query 파라미터
 * @param extraConfig 추가 Axios 설정 (timeout, headers, responseType 등) [추가됨]
 */
const callApi = async <T = any>(
    endpoint: string,
    method: HttpMethodType = HttpMethod.GET,
    data: any = null,
    params: any = null,
    // [수정 1] 5번째 인자로 추가 설정 받기 (기본값 빈 객체)
    extraConfig: AxiosRequestConfig = {}
): Promise<T | null> => {
    try {
        const config: AxiosRequestConfig = {
            url: endpoint,
            method,
            params: params,
            data: data,
            // [수정 2] 전달받은 추가 설정을 여기에 병합 (timeout 등이 여기서 들어감)
            ...extraConfig
        };

        // GET 요청 편의성 로직 (data를 params로 이동)
        if (method === HttpMethod.GET && data && !params) {
            config.params = data;
            config.data = null;
        }

        const response = await apiInstance(config);
        return response as T;
    } catch (error) {
        console.error(`[API Error] ${endpoint} 호출 실패:`, error);
        // 필요하다면 여기서 throw error를 해서 컴포넌트가 에러를 잡게 할 수도 있음
        // throw error;
        return null;
    }
};

export default callApi;