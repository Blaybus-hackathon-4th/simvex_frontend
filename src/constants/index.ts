export const CATEGORIES = [
  '전체',
  '자동차공학',
  '기계공학',
  '로봇공학',
  '의공학',
  '생명공학',
  '항공우주',
  '전기전자',
  '토목',
] as const;

export type CategoryKo = (typeof CATEGORIES)[number];

// localStorage key (읽기/쓰기/감지 모두 동일해야 함)
export const STUDY_HISTORY_STORAGE_KEY = 'simvex:studyHistoryIds';

// 같은 탭에서 갱신을 위한 커스텀 이벤트명
export const STUDY_HISTORY_CHANGED_EVENT = 'simvex:studyHistoryChanged';
