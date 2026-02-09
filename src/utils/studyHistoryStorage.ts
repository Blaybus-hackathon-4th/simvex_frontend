import { STUDY_HISTORY_CHANGED_EVENT, STUDY_HISTORY_STORAGE_KEY } from '@/constants';

const MAX_HISTORY = 20;

// 안전하게 JSON 파싱
function safeParseArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function getStudyHistoryIds(): string[] {
  return safeParseArray(localStorage.getItem(STUDY_HISTORY_STORAGE_KEY));
}

/**
 * 클릭한 objectId를 "최근 본 순"으로 저장
 * - 중복 제거
 * - 최대 MAX_HISTORY개 유지
 * - 같은 탭에서도 대시보드가 자동 갱신되도록 커스텀 이벤트 발생
 */
export function pushStudyHistoryId(objectId: string | number) {
  const id = String(objectId);
  const prev = getStudyHistoryIds();

  const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_HISTORY);

  localStorage.setItem(STUDY_HISTORY_STORAGE_KEY, JSON.stringify(next));

  // 같은 탭에서도 즉시 갱신되도록 이벤트 발생
  window.dispatchEvent(new Event(STUDY_HISTORY_CHANGED_EVENT));
}

export function clearStudyHistory() {
  localStorage.removeItem(STUDY_HISTORY_STORAGE_KEY);
  window.dispatchEvent(new Event(STUDY_HISTORY_CHANGED_EVENT));
}
