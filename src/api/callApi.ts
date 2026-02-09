import apiInstance from './instance';
import type {AxiosRequestConfig} from 'axios';

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
 * @param endpoint API 주소 (예: '/models')
 * @param method HTTP 메서드 (기본값 GET)
 * @param data Body 데이터 (POST, PUT용)
 * @param params Query 파라미터 (GET용 - ?key=value)
 */
const callApi = async <T = any>(
    endpoint: string,
    method: HttpMethodType = HttpMethod.GET,
    data: any = null,
    params: any = null,
): Promise<T | null> => {
    try {
        const config: AxiosRequestConfig = {
            url: endpoint,
            method,
            params: params, // 명시적인 쿼리 파라미터
            data: data,     // Body 데이터
        };

        // GET 요청인데 data가 들어온 경우, 자동으로 params로 처리해주는 편의성 로직
        if (method === HttpMethod.GET && data && !params) {
            config.params = data;
            config.data = null;
        }

        const response = await apiInstance(config);
        return response as T;
    } catch (error) {
        console.error(`[API Error] ${endpoint} 호출 실패:`, error);
        // 에러를 상위로 던질지, 여기서 null로 처리할지 결정
        return null;
    }
};

export default callApi;