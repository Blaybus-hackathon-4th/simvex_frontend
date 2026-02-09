import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import HeroBanner from '@/components/common/HeroBanner';
import callApi, { HttpMethod } from '@/api/callApi';
import emptyReadyImg from '@/assets/empty/ready.png';

import { CATEGORIES, STUDY_HISTORY_CHANGED_EVENT, STUDY_HISTORY_STORAGE_KEY, type CategoryKo } from '@/constants';
import type { ModelItem, ObjectsByIdsResponse, ObjectsListResponse } from '@/types';

import { getStudyHistoryIds, pushStudyHistoryId } from '@/utils/studyHistoryStorage';

//  검색 API 응답 타입 (result 구조가 목록조회와 동일하다고 가정)
type ObjectsSearchResponse = ObjectsListResponse;

// Swagger enum(서버) 매핑
const CATEGORY_TO_ENUM: Record<Exclude<CategoryKo, '전체'>, string> = {
  자동차공학: 'AUTOMOTIVE_ENGINEERING',
  기계공학: 'MECHANICAL_ENGINEERING',
  로봇공학: 'ROBOTICS_ENGINEERING',
  의공학: 'BIOMEDICAL_ENGINEERING',
  생명공학: 'BIOTECHNOLOGY',
  항공우주: 'AEROSPACE_ENGINEERING',
  전기전자: 'ELECTRICAL_ELECTRONIC_ENGINEERING',
  토목: 'CIVIL_ENGINEERING',
};

// ---- UI Components ----
const ModelCard = ({ item, onClick }: { item: ModelItem; onClick: () => void }) => (
  <button
    onClick={onClick}
    className='group text-left rounded-2xl bg-[#151922] border border-white/10
               transition-all duration-300
               hover:border-white/20 hover:-translate-y-1
               hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]
               overflow-hidden cursor-pointer'
  >
    <div className='p-3'>
      <div className='relative aspect-video rounded-xl overflow-hidden bg-[#20242C]'>
        {item.thumb ? (
          <img
            src={item.thumb}
            alt={item.title}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='h-full w-full bg-linear-to-br from-white/5 to-white/0' />
        )}
      </div>
    </div>

    <div className='px-4 pb-4'>
      <h3 className='text-sm font-semibold text-white/90 tracking-wide'>{item.title}</h3>
      <p className='mt-1 text-xs text-white/45 line-clamp-1'>{item.desc}</p>

      {!!item.tags?.length && (
        <div className='mt-3 flex gap-2'>
          {item.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className={`px-2 py-1 rounded-full text-[11px] font-medium
                ${
                  idx === 0
                    ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/20'
                }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </button>
);

const EmptyState = ({ title }: { title: string }) => (
  <div className='flex flex-col items-center justify-center h-130'>
    <div className='mb-6'>
      <img
        src={emptyReadyImg}
        alt='3D model preparing'
        className='w-48 h-48 object-contain select-none pointer-events-none'
      />
    </div>

    <p className='text-sm font-semibold text-white/60 mb-2'>{title}</p>

    <h3 className='text-lg font-bold text-white/90'>3D 모델을 준비하고 있어요</h3>
    <p className='mt-2 text-sm text-white/50 text-center leading-relaxed'>
      곧 새로운 3D 모델을 만날 수 있어요.
      <br />
      지금은 다른 카테고리를 먼저 살펴보세요.
    </p>
  </div>
);

// ---- Page ----
export default function DashboardPage() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<CategoryKo>('전체');
  const [query, setQuery] = useState('');

  //   학습 가능한 모델
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

  //   학습 기록 모델
  const [historyModels, setHistoryModels] = useState<ModelItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // StrictMode 중복 호출 방지 키
  const lastAvailableKey = useRef<string>('');
  const lastHistoryKey = useRef<string>('');

  //  검색 디바운스용 타이머
  const searchDebounceRef = useRef<number | null>(null);

  // ----------------------------------------------------
  // 1) 학습 가능한 모델:
  //    - query 없으면: /objects?category=...
  //    - query 있으면: /objects/search?keyword=...
  // ----------------------------------------------------
  useEffect(() => {
    const trimmed = query.trim();

    const fetchAvailable = async () => {
      const categoryEnum =
        selectedCategory === '전체' ? undefined : CATEGORY_TO_ENUM[selectedCategory as Exclude<CategoryKo, '전체'>];

      //  requestKey: query 존재 시 SEARCH 우선
      const requestKey = trimmed ? `SEARCH:${trimmed}` : `LIST:${categoryEnum ?? 'ALL'}`;

      if (lastAvailableKey.current === requestKey) return;
      lastAvailableKey.current = requestKey;

      setIsLoadingAvailable(true);

      try {
        //  검색
        if (trimmed) {
          const url = `/objects/search?keyword=${encodeURIComponent(trimmed)}`;
          const res = await callApi<ObjectsSearchResponse>(url, HttpMethod.GET);

          const mapped: ModelItem[] =
            res?.result?.map((o) => ({
              id: String(o.objectId),
              title: o.objectNameEn || o.objectNameKr,
              desc: o.objectContent ?? o.objectcontent ?? '',
              category: '검색결과',
              thumb: o.objectImageUrl,
              tags: (o.objectTags ?? []).slice(0, 2),
            })) ?? [];

          // (선택) 검색 결과를 현재 선택 카테고리로 필터링하고 싶다면
          // 서버가 category를 안 주면 여기서 불가능. category 내려주면 필터 가능.
          setAvailableModels(mapped);
          return;
        }

        //  카테고리 목록 조회
        const url = categoryEnum ? `/objects?category=${categoryEnum}` : `/objects`;
        const res = await callApi<ObjectsListResponse>(url, HttpMethod.GET);

        const mapped: ModelItem[] =
          res?.result?.map((o) => ({
            id: String(o.objectId),
            title: o.objectNameEn || o.objectNameKr,
            desc: o.objectContent ?? o.objectcontent ?? '',
            category: selectedCategory,
            thumb: o.objectImageUrl,
            tags: (o.objectTags ?? []).slice(0, 2),
          })) ?? [];

        setAvailableModels(mapped);
      } catch (e) {
        console.error('Failed to fetch available objects:', e);
        setAvailableModels([]);
      } finally {
        setIsLoadingAvailable(false);
      }
    };

    //  디바운스 적용 (query 입력 중 과도 호출 방지)
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      fetchAvailable();
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [selectedCategory, query]);

  // -----------------------------------
  // 2) 학습 기록: by-ids 호출 (자동 갱신)
  // -----------------------------------
  const fetchHistoryByIds = useCallback(async () => {
    const ids = getStudyHistoryIds(); // string[]
    if (ids.length === 0) {
      setHistoryModels([]);
      return;
    }

    const requestKey = `HISTORY_BY_IDS:${ids.join(',')}`;
    if (lastHistoryKey.current === requestKey) return;
    lastHistoryKey.current = requestKey;

    setIsLoadingHistory(true);
    try {
      const url = `/objects/by-ids?ids=${ids.join(',')}`;
      const res = await callApi<ObjectsByIdsResponse>(url, HttpMethod.GET);

      const mapped: ModelItem[] =
        res?.result?.map((o) => ({
          id: String(o.objectId),
          title: o.objectNameEn || o.objectNameKr,
          desc: o.objectContent ?? o.objectcontent ?? '',
          category: '학습기록',
          thumb: o.objectImageUrl,
          tags: (o.objectTags ?? []).slice(0, 2),
        })) ?? [];

      // ids 순서 유지(최근 본 순)
      const order = new Map(ids.map((id, idx) => [id, idx]));
      mapped.sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999));

      setHistoryModels(mapped);
    } catch (e) {
      console.error('Failed to fetch history objects by ids:', e);
      setHistoryModels([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryByIds();

    const onHistoryChanged = () => fetchHistoryByIds();

    const onStorage = (e: StorageEvent) => {
      if (e.key === STUDY_HISTORY_STORAGE_KEY) fetchHistoryByIds();
    };

    const onFocus = () => fetchHistoryByIds();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchHistoryByIds();
    };

    window.addEventListener(STUDY_HISTORY_CHANGED_EVENT, onHistoryChanged);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener(STUDY_HISTORY_CHANGED_EVENT, onHistoryChanged);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchHistoryByIds]);

  //  검색어는 학습기록도 필터(기존 유지)
  const filteredHistory = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return historyModels;
    return historyModels.filter((m) => (m.title + m.desc).toLowerCase().includes(trimmed));
  }, [historyModels, query]);

  //  availableModels는 서버 검색 결과를 그대로 쓰기 때문에 로컬 필터는 보통 불필요
  const filteredAvailable = availableModels;

  // 빈 상태 판단(카테고리별로 학습가능 모델이 없을 때)
  const isEmptyForCategory = selectedCategory !== '전체' && !isLoadingAvailable && filteredAvailable.length === 0;

  return (
    <div className='min-h-screen bg-[#0E1116] text-white'>
      <div className='flex'>
        {/* Left Sidebar */}
        <aside className='w-65 shrink-0 border-r border-white/10 bg-[#0B0E13] min-h-screen sticky top-0'>
          <div className='px-6 pt-7 pb-4'>
            <div className='text-sm font-semibold tracking-wide text-white/90'>SIMVEX</div>
          </div>

          <div className='px-6 pt-4 pb-3'>
            <div className='text-xs font-semibold text-white/40'>공학 카테고리</div>
            <div className='mt-3 border-t border-white/10' />
          </div>

          <nav className='px-4 pb-6 space-y-2'>
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c;
              return (
                <button
                  key={c}
                  onClick={() => {
                    lastAvailableKey.current = '';
                    setSelectedCategory(c);
                  }}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm transition relative cursor-pointer
                    ${active ? 'bg-white/10 text-blue-400' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
                >
                  {active && <span className='absolute left-2 top-3 bottom-3 w-0.75 rounded-full bg-blue-500' />}
                  <span className='pl-3 block'>{c}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className='flex-1'>
          {/* Top search bar */}
          <div className='sticky top-0 z-40 bg-[#0E1116]/70 backdrop-blur'>
            <div className='px-10 py-4 flex justify-end'>
              <div className='relative w-95'>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='학습하고 싶은 모델을 검색해 보세요'
                  className='w-full h-10 rounded-full bg-white/90 text-black placeholder:text-black/40 px-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-white/30'
                />
                <Search className='w-4 h-4 text-black/60 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none' />
              </div>
            </div>
          </div>

          <div className='px-10 pb-16'>
            <HeroBanner />

            <div className='mt-10'>
              <h1 className='text-xl font-bold text-white/90'>{selectedCategory}</h1>
            </div>

            {isEmptyForCategory ? (
              <EmptyState title={selectedCategory} />
            ) : (
              <>
                {/* 학습 기록 */}
                <section className='mt-6'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-semibold text-white/80'>학습 기록</h3>
                    {isLoadingHistory && <span className='text-xs text-white/50'>불러오는 중...</span>}
                  </div>

                  <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredHistory.map((m) => (
                      <ModelCard
                        key={m.id}
                        item={m}
                        onClick={() => {
                          pushStudyHistoryId(m.id);
                          navigate(`/viewer/${m.id}`);
                        }}
                      />
                    ))}
                  </div>
                </section>

                {/* 학습 가능한 모델 */}
                <section className='mt-10'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-semibold text-white/80'>
                      {query.trim() ? '검색 결과' : '학습 가능한 모델'}
                    </h3>
                    {isLoadingAvailable && <span className='text-xs text-white/50'>불러오는 중...</span>}
                  </div>

                  <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {filteredAvailable.map((m) => (
                      <ModelCard
                        key={m.id}
                        item={m}
                        onClick={() => {
                          pushStudyHistoryId(m.id);
                          navigate(`/viewer/${m.id}`);
                        }}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
