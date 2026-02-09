import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import HeroBanner from '@/components/common/HeroBanner';
import callApi, { HttpMethod } from '@/api/callApi';

import emptyReadyImg from '@/assets/empty/ready.png';
import { CATEGORIES, type CategoryKo } from '@/constants';
import { OBJECT_IDS_BY_CATEGORY, type ModelItem, type ObjectsByIdsResponse } from '@/types';

// ---- (임시) 학습 기록 더미 ----
const STUDY_HISTORY: ModelItem[] = [
  {
    id: 'drone',
    title: 'DRONE',
    desc: '회전익 항공기의 양력 발생 원리',
    category: '항공우주',
    thumb: '/assets/thumbs/drone.png',
    tags: ['세션보기', '메모보기'],
  },
  {
    id: 'leaf_spring',
    title: 'LEAF SPRING',
    desc: '현가장치의 탄성 변형과 힘 전달',
    category: '자동차공학',
    thumb: '/assets/thumbs/leaf_spring.png',
    tags: ['세션보기', '메모보기'],
  },
  {
    id: 'machine_vice',
    title: 'MACHINE VICE',
    desc: '나사의 역학적 원리',
    category: '기계공학',
    thumb: '/assets/thumbs/machine_vice.png',
    tags: ['세션보기', '메모보기'],
  },
];

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
    {/* 썸네일 */}
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

    {/* 콘텐츠 */}
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

  // API로 받아온 모델 목록
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // React StrictMode에서 effect 2번 실행 방지(개발환경)
  const lastRequestKey = useRef<string>('');

  // /objects/by-ids 호출
  useEffect(() => {
    const fetchObjectsByIds = async () => {
      const ids = OBJECT_IDS_BY_CATEGORY[selectedCategory] ?? [];

      // ids 없으면 비우고 종료 (EmptyState 보이게)
      if (ids.length === 0) {
        setAvailableModels([]);
        return;
      }

      const requestKey = `BY_IDS:${ids.join(',')}`;
      if (lastRequestKey.current === requestKey) return;
      lastRequestKey.current = requestKey;

      setIsLoading(true);
      try {
        const url = `/objects/by-ids?ids=${ids.join(',')}`;
        const res = await callApi<ObjectsByIdsResponse>(url, HttpMethod.GET);

        const mapped: ModelItem[] =
          res?.result?.map((o) => ({
            id: String(o.objectId),
            title: o.objectNameEn || o.objectNameKr,
            desc: o.objectcontent,
            category: selectedCategory, // by-ids 응답엔 category가 없으니 선택값으로 표시
            thumb: o.objectImageUrl,
            tags: (o.objectTags ?? []).slice(0, 2),
          })) ?? [];

        setAvailableModels(mapped);
      } catch (e) {
        console.error('Failed to fetch objects by ids:', e);
        setAvailableModels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchObjectsByIds();
  }, [selectedCategory]);

  const filteredHistory = useMemo(() => {
    return STUDY_HISTORY.filter((m) => {
      const catOk = selectedCategory === '전체' ? true : m.category === selectedCategory;
      const qOk = query ? (m.title + m.desc).toLowerCase().includes(query.toLowerCase()) : true;
      return catOk && qOk;
    });
  }, [selectedCategory, query]);

  const filteredAvailable = useMemo(() => {
    return availableModels.filter((m) => {
      const qOk = query ? (m.title + m.desc).toLowerCase().includes(query.toLowerCase()) : true;
      return qOk;
    });
  }, [availableModels, query]);

  const isEmptyForCategory =
    selectedCategory !== '전체' && filteredHistory.length === 0 && !isLoading && filteredAvailable.length === 0;

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
                    lastRequestKey.current = '';
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
                  <h3 className='text-sm font-semibold text-white/80'>학습 기록</h3>
                  <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredHistory.map((m) => (
                      <ModelCard key={m.id} item={m} onClick={() => navigate(`/viewer/${m.id}`)} />
                    ))}
                  </div>
                </section>

                {/* 학습 가능한 모델 (API 데이터) */}
                <section className='mt-10'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-semibold text-white/80'>학습 가능한 모델</h3>
                    {isLoading && <span className='text-xs text-white/50'>불러오는 중...</span>}
                  </div>

                  <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {filteredAvailable.map((m) => (
                      <ModelCard key={m.id} item={m} onClick={() => navigate(`/viewer/${m.id}`)} />
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
