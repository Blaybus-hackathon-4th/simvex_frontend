import bigRing from '@/assets/banner/big-ring.png';
import smallRing from '@/assets/banner/small-ring.png';
import triangle from '@/assets/banner/triangle.png';

type HeroBannerProps = {
  title?: string;
  subtitle?: string;
};

export default function HeroBanner({
  title = 'SIMVEX : 손으로 직접 배우는 3D 학습',
  subtitle = '회전·확대·분해하는 3D 인터랙션으로 구조 학습의 새로운 기준을 제시합니다.',
}: HeroBannerProps) {
  return (
    <section className='mt-6 rounded-2xl overflow-hidden border border-white/10 bg-[#0B0E13] shadow-[0_12px_50px_rgba(0,0,0,0.35)]'>
      <div className='relative h-44'>
        {/* 배경 오버레이 */}
        <div className='absolute inset-0 bg-linear-to-r from-black/10 via-black/40 to-black/75' />

        {/* 좌측 큰 링 */}
        <img
          src={bigRing}
          alt=''
          className='absolute left-12 top-1/2 -translate-y-1/2 w-60 opacity-95 pointer-events-none select-none'
        />

        {/* 오른쪽 삼각형: 위쪽으로 올리고 더 왼쪽으로 */}
        <img
          src={triangle}
          alt=''
          className='absolute right-40 top-4 w-12 opacity-95 pointer-events-none select-none'
        />

        {/* 오른쪽 링: 더 오른쪽 + 살짝 아래로 */}
        <img
          src={smallRing}
          alt=''
          className='absolute right-60 top-1/2 translate-y-1 w-30 opacity-95 pointer-events-none select-none'
        />

        {/* 텍스트: 배너 중앙 정렬 */}
        <div className='relative z-10 h-full flex items-center justify-center text-center'>
          {/* 좌/우 도형 영역만큼 padding 확보해서 중앙이 안 밀리게 */}
          <div className='px-60'>
            <h2 className='text-[24px] font-bold text-white/95 tracking-wide'>{title}</h2>
            <p className='mt-1 text-[12px] text-white/60 leading-relaxed'>{subtitle}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
