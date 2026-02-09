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
