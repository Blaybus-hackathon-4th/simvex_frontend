import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import callApi, { HttpMethod } from '@/api/callApi';
import { useLearningStore } from '@/store/learningStore';

interface QuizModePanelProps {
  objectId: string;
  selectedPartId: string | null;
  onClose: () => void;
}

interface QuizData {
  type: string;
  question: string;
  targetPartId: string;
  hint: string;
  successMessage: string;
}

const QuizModePanel = ({ objectId, selectedPartId, onClose }: QuizModePanelProps) => {
  const [status, setStatus] = useState<'loading' | 'playing' | 'success'>('loading');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // selector로 안전하게 가져오기
  const interactedParts = useLearningStore((state) => state.getLearningContext(objectId).interactedParts);

  const fetchQuiz = useCallback(async () => {
    setStatus('loading');
    setShowHint(false);
    setQuizData(null);

    try {
      // chatHistory 파싱 안전 처리
      const storedChat = localStorage.getItem(`chat-storage-${objectId}`);
      let chatHistory: any[] = [];
      if (storedChat) {
        try {
          const parsed = JSON.parse(storedChat);
          chatHistory = parsed?.state?.messages ?? [];
        } catch {
          chatHistory = [];
        }
      }

      const payload = {
        currentModel: objectId,
        interactedParts,
        chatHistory,
      };

      const res = await callApi<{ result: QuizData }>('/quizzes', HttpMethod.POST, payload);

      if (res?.result) {
        setQuizData(res.result);
        setStatus('playing');
      } else {
        throw new Error('Quiz result is empty');
      }
    } catch (e) {
      console.error('❌ Failed to load quiz:', e);
      alert('퀴즈 생성에 실패했습니다. (학습 데이터가 부족할 수 있습니다)');
      onClose();
    }
  }, [objectId, interactedParts, onClose]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleCheckAnswer = () => {
    if (!quizData || !selectedPartId) return;

    if (selectedPartId === quizData.targetPartId) {
      setStatus('success');
      setShowHint(false);
    } else {
      setShowHint(true);
    }
  };

  if (status === 'loading') {
    return (
      <div className='flex flex-col items-center justify-center h-full space-y-4 animate-in fade-in'>
        <div className='relative'>
          <div className='w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin' />
          <HelpCircle className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500' size={24} />
        </div>
        <p className='text-gray-400 text-sm font-medium animate-pulse'>AI가 맞춤형 퀴즈를 생성하고 있습니다...</p>
        <p className='text-xs text-gray-600'>사용자의 학습 이력과 대화를 분석 중입니다.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className='flex flex-col items-center justify-center h-full text-center p-6 animate-in zoom-in-95 duration-300'>
        <div className='w-24 h-24 bg-linear-to-tr from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 mb-6'>
          <div className='w-20 h-20 bg-[#161616] rounded-full flex items-center justify-center'>
            <div className='w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center animate-bounce'>
              <CheckCircle size={32} className='text-white' />
            </div>
          </div>
        </div>

        <h2 className='text-2xl font-bold text-white mb-2'>정답이에요!</h2>
        <p className='text-sm text-gray-400 mb-8 leading-relaxed whitespace-pre-line'>{quizData?.successMessage}</p>

        <div className='flex gap-3 w-full'>
          <button
            onClick={() => {
              useLearningStore.getState().resetProgress(objectId);
              onClose();
            }}
            className='flex-1 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer'
          >
            학습 종료
          </button>
          <button
            onClick={onClose}
            className='flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors cursor-pointer'
          >
            계속 공부하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full relative'>
      <div className='h-14 flex items-center justify-between px-6 border-b border-white/5 shrink-0'>
        <span className='text-blue-400 font-bold text-sm'>학습 체크</span>
        <button
          onClick={() => setShowExitConfirm(true)}
          className='text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer'
        >
          <X size={20} />
        </button>
      </div>

      <div className='flex-1 p-6 overflow-y-auto'>
        <div className='mb-2 text-blue-500 text-xs font-bold tracking-wider'>BLIND QUIZ</div>
        <h3 className='text-2xl font-bold text-white leading-tight mb-4'>{quizData?.question}</h3>

        <div className='p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200 mb-6'>
          💡 3D 뷰어에서 <strong>알맞은 부품을 찾아 클릭</strong>한 뒤,
          <br />
          아래 버튼을 눌러주세요.
        </div>

        <div className='p-4 bg-[#222] rounded-xl border border-white/5'>
          <div className='text-xs text-gray-500 mb-1'>현재 선택된 부품 ID</div>
          <div
            className={`text-sm font-bold flex items-center gap-2 ${selectedPartId ? 'text-white' : 'text-gray-600'}`}
          >
            {selectedPartId ? (
              <>
                <CheckCircle size={14} className='text-green-500' />
                {selectedPartId}
              </>
            ) : (
              '선택된 부품 없음'
            )}
          </div>
        </div>
      </div>

      <div className='p-6 border-t border-white/5 bg-[#1a1a1a] relative'>
        {showHint && (
          <div className='absolute bottom-full left-0 w-full bg-[#2a1a1a] border-t-2 border-red-500 p-5 animate-in slide-in-from-bottom-2 duration-300 shadow-2xl z-20'>
            <div className='flex justify-between items-start mb-2'>
              <div className='flex items-center gap-2 text-red-400 font-bold text-sm'>
                <AlertCircle size={16} />
                오답입니다!
              </div>
              <button onClick={() => setShowHint(false)} className='text-gray-500 hover:text-white cursor-pointer'>
                <X size={14} />
              </button>
            </div>
            <div className='text-xs font-bold text-gray-400 mb-1'>힌트</div>
            <p className='text-sm text-gray-200 leading-relaxed'>{quizData?.hint}</p>
          </div>
        )}

        <button
          onClick={handleCheckAnswer}
          disabled={!selectedPartId}
          className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer
            ${selectedPartId ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20' : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'}`}
        >
          {selectedPartId ? '정답 확인' : '부품을 선택해주세요'}
          {selectedPartId && <ArrowRight size={16} />}
        </button>
      </div>

      {showExitConfirm && (
        <div className='absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-sm text-center'>
            <h4 className='text-lg font-bold text-gray-900 mb-2'>퀴즈를 종료하시겠습니까?</h4>
            <p className='text-sm text-gray-500 mb-6'>진행 중인 퀴즈 내용은 저장되지 않습니다.</p>
            <div className='flex gap-3'>
              <button
                onClick={() => setShowExitConfirm(false)}
                className='flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer'
              >
                취소
              </button>
              <button
                onClick={onClose}
                className='flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors cursor-pointer'
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizModePanel;
