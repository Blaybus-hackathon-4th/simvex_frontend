import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import HeroBanner from '@/components/common/HeroBanner';

type ModelItem = {
  id: string;
  title: string;
  desc: string;
  category: string;
  thumb?: string;
  tags?: string[];
};

const CATEGORIES = ['전체', '자동차공학', '기계공학', '로봇공학', '의공학', '생명공학', '항공우주', '전기전자', '토목'];

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

const AVAILABLE_MODELS: ModelItem[] = [
  {
    id: 'v4_engine',
    title: 'V4_ENGINE',
    desc: '내연기관의 4행정 사이클',
    category: '기계공학',
    thumb: '/assets/thumbs/v4_engine.png',
    tags: ['학습하기', '세션다시보기'],
  },
  {
    id: 'robot_gripper',
    title: 'ROBOT GRIPPER',
    desc: '그리퍼 구동 구조와 힘 전달',
    category: '로봇공학',
    thumb: '/assets/thumbs/robot_gripper.png',
    tags: ['학습하기', '세션다시보기'],
  },
  {
    id: 'machine_vice_2',
    title: 'MACHINE VICE',
    desc: '나사-쐐기 원리의 응용',
    category: '기계공학',
    thumb: '/assets/thumbs/machine_vice.png',
    tags: ['학습하기', '세션다시보기'],
  },
  {
    id: 'leaf_spring_2',
    title: 'LEAF SPRING',
    desc: '진동/감쇠 특성 이해',
    category: '자동차공학',
    thumb: '/assets/thumbs/leaf_spring.png',
    tags: ['학습하기', '세션다시보기'],
  },
];

const Badge = ({ children }: { children: string }) => (
  <span className='inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-medium text-white/70'>
    {children}
  </span>
);

const TagPill = ({ label, tone }: { label: string; tone: 'green' | 'yellow' }) => {
  const cls =
    tone === 'green'
      ? 'border-green-500/30 text-green-300 bg-green-500/10'
      : 'border-yellow-500/30 text-yellow-200 bg-yellow-500/10';
  return <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${cls}`}>{label}</span>;
};

const ModelCard = ({ item, onClick }: { item: ModelItem; onClick: () => void }) => (
  <button
    onClick={onClick}
    className='group text-left rounded-2xl border border-white/10 bg-[#14161B]/70 hover:border-white/20 transition overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
  >
    <div className='relative aspect-video bg-[#20242C]'>
      {item.thumb ? (
        <img src={item.thumb} alt={item.title} className='h-full w-full object-cover' />
      ) : (
        <div className='h-full w-full bg-linear-to-br from-white/5 to-white/0' />
      )}
    </div>

    <div className='p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h3 className='text-sm font-bold tracking-wide text-white/90'>{item.title}</h3>
          <p className='mt-1 text-xs text-white/50 line-clamp-2 leading-relaxed'>{item.desc}</p>
        </div>
        <Badge>{item.category}</Badge>
      </div>

      {!!item.tags?.length && (
        <div className='mt-3 flex items-center gap-2'>
          <TagPill label={item.tags[0]} tone='green' />
          {item.tags[1] && <TagPill label={item.tags[1]} tone='yellow' />}
        </div>
      )}
    </div>
  </button>
);

// title 사용해서 경고 해결 + 이미지처럼 상단에 선택 카테고리 표시
const EmptyState = ({ title }: { title: string }) => (
  <div className='flex flex-col items-center justify-center h-130'>
    <div className='mb-6'>
      <div className='w-45 h-45 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center'>
        <div className='text-6xl'>🛠️</div>
      </div>
    </div>

    {/* title 사용 */}
    <p className='text-sm font-semibold text-white/60 mb-2'>{title}</p>

    <h3 className='text-lg font-bold text-white/90'>3D 모델을 준비하고 있어요</h3>
    <p className='mt-2 text-sm text-white/50 text-center leading-relaxed'>
      곧 새로운 3D 모델을 만날 수 있어요.
      <br />
      지금은 다른 카테고리를 먼저 살펴보세요.
    </p>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [query, setQuery] = useState('');

  const filteredHistory = useMemo(() => {
    return STUDY_HISTORY.filter((m) => {
      const catOk = selectedCategory === '전체' ? true : m.category === selectedCategory;
      const qOk = query ? (m.title + m.desc).toLowerCase().includes(query.toLowerCase()) : true;
      return catOk && qOk;
    });
  }, [selectedCategory, query]);

  const filteredAvailable = useMemo(() => {
    return AVAILABLE_MODELS.filter((m) => {
      const catOk = selectedCategory === '전체' ? true : m.category === selectedCategory;
      const qOk = query ? (m.title + m.desc).toLowerCase().includes(query.toLowerCase()) : true;
      return catOk && qOk;
    });
  }, [selectedCategory, query]);

  const isEmptyForCategory =
    selectedCategory !== '전체' && filteredHistory.length === 0 && filteredAvailable.length === 0;

  return (
    <div className='min-h-screen bg-[#0E1116] text-white'>
      <div className='flex'>
        {/* Left Sidebar (이미지 스타일로 개선) */}
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
                  onClick={() => setSelectedCategory(c)}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm transition relative
                    ${active ? 'bg-white/10 text-blue-400' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
                >
                  {/* 파란 세로 강조바 (이미지처럼 좀 더 두껍게) */}
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
                <section className='mt-6'>
                  <h3 className='text-sm font-semibold text-white/80'>학습 기록</h3>
                  <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredHistory.map((m) => (
                      <ModelCard key={m.id} item={m} onClick={() => navigate(`/viewer/${m.id}`)} />
                    ))}
                  </div>
                </section>

                <section className='mt-10'>
                  <h3 className='text-sm font-semibold text-white/80'>학습 가능한 모델</h3>
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
};

export default DashboardPage;
