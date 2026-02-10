import { useState, useRef } from 'react';
import { X, FileText, Loader2, CheckCircle, Download, FileJson } from 'lucide-react';
import callApi, { HttpMethod } from '@/api/callApi';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportGenerationModalProps {
    objectId: string;
    onClose: () => void;
}

interface PdfResponse {
    title: string;
    overview: string;
    analysis: string;
    conclusion: string;
    keywords: string[];
}

const ReportGenerationModal = ({ objectId, onClose }: ReportGenerationModalProps) => {
    // Input State
    const [intent, setIntent] = useState<'과제' | '요약' | '비즈니스' | '발표'>('과제');
    const [customIntent, setCustomIntent] = useState('');

    // Process State
    const [isLoading, setIsLoading] = useState(false);
    const [generatedData, setGeneratedData] = useState<PdfResponse | null>(null);

    // PDF 변환용 캡처 영역 참조
    const printRef = useRef<HTMLDivElement>(null);

    // 1단계: 리포트 생성 (API 호출)
    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const finalIntent = customIntent.trim() ? customIntent : intent;

            const res = await callApi<{ result: PdfResponse }>(
                `/pdf/${objectId}?intent=${encodeURIComponent(finalIntent)}`,
                HttpMethod.GET,
                null,
                null,
                { timeout: 60000 }
            );

            if (res?.result) {
                setGeneratedData(res.result);
            }
        } catch (e) {
            console.error("Failed to generate report:", e);
            alert("리포트 생성에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 2단계: 실제 PDF 파일 다운로드
    const handleDownloadPdf = async () => {
        if (!generatedData || !printRef.current) return;

        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                backgroundColor: '#ffffff', // 배경색 강제 지정
                useCORS: true,
                allowTaint: true,
                // [추가] 3D Canvas 등 불필요한 요소 캡처 제외 (에러 방지용)
                ignoreElements: (element) => element.tagName === 'CANVAS' || element.tagName === 'IFRAME'
            });

            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();

            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            doc.save(`${generatedData.title.replace(/\s+/g, '_')}_Report.pdf`);
            onClose();

        } catch (err) {
            console.error("PDF download failed:", err);
            alert("PDF 다운로드 중 오류가 발생했습니다.");
        }
    };

    return (
        <>
            {/* [수정됨] 실제 PDF로 인쇄될 영역
               - 이슈 원인: Tailwind v4 등의 text-gray-900 등이 'oklch' 색상을 사용함 -> html2canvas 미지원
               - 해결: style 속성에 HEX 코드(#000000 등)를 직접 입력하여 oklch 사용을 방지함
            */}
            {generatedData && (
                <div
                    ref={printRef}
                    className="absolute top-0 left-0 -z-50 p-12"
                    // [핵심 수정] Tailwind 클래스 대신 style로 HEX 색상 강제 지정
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        backgroundColor: '#ffffff', // 흰색 배경
                        color: '#111111',           // 기본 글자색 (검정)
                        fontFamily: 'sans-serif'
                    }}
                >
                    <h1
                        className="text-3xl font-bold mb-6 pb-4"
                        style={{ borderBottom: '2px solid #000000' }}
                    >
                        {generatedData.title}
                    </h1>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-bold mb-3" style={{ color: '#1e40af' }}> {/* 진한 파랑 */}
                                1. 개요 (Overview)
                            </h2>
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#374151' }}> {/* 짙은 회색 */}
                                {generatedData.overview}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3" style={{ color: '#1e40af' }}>
                                2. 상세 분석 (Analysis)
                            </h2>
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#374151' }}>
                                {generatedData.analysis}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3" style={{ color: '#1e40af' }}>
                                3. 결론 (Conclusion)
                            </h2>
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#374151' }}>
                                {generatedData.conclusion}
                            </p>
                        </section>

                        <section className="mt-8 pt-6" style={{ borderTop: '1px solid #e5e7eb' }}>
                            <h3 className="text-sm font-bold mb-2" style={{ color: '#6b7280' }}>
                                핵심 키워드
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {generatedData.keywords.map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 rounded-full text-xs font-medium"
                                        // [핵심 수정] 뱃지 스타일도 HEX로 지정
                                        style={{
                                            backgroundColor: '#f3f4f6',
                                            color: '#4b5563'
                                        }}
                                    >
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="mt-12 text-center text-xs" style={{ color: '#9ca3af' }}>
                        Generated by SIMVEX AI Assistant
                    </div>
                </div>
            )}

            {/* --- 기존 모달 UI (동일) --- */}
            <div className="absolute bottom-6 right-20 z-[100] w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 origin-bottom-right">
                {/* ... (이전 코드와 동일, 생략) ... */}

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {generatedData ? '리포트 준비 완료' : '리포트 생성'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {generatedData
                                ? '생성된 내용을 확인하고 파일로 저장하세요.'
                                : '탐구한 3D 모델을 바탕으로 리포트를 작성합니다.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {!generatedData ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700">리포트 용도</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['과제', '요약', '비즈니스', '발표'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setIntent(opt as any)}
                                            className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left h-24 relative cursor-pointer
                                                ${intent === opt
                                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full mb-1">
                                                <span className={`text-sm font-bold ${intent === opt ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {opt}
                                                </span>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                                    ${intent === opt ? 'border-blue-500 bg-white' : 'border-gray-300'}`}>
                                                    {intent === opt && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] leading-tight mt-1 ${intent === opt ? 'text-blue-600' : 'text-gray-500'}`}>
                                                {opt === '과제' && '이론·원리 중심'}
                                                {opt === '요약' && '핵심 포인트 요약'}
                                                {opt === '비즈니스' && '활용 및 가치 분석'}
                                                {opt === '발표' && '대본 형식 구성'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700">추가 요청 사항</label>
                                <div className="relative">
                                    <textarea
                                        value={customIntent}
                                        onChange={(e) => setCustomIntent(e.target.value)}
                                        placeholder="예: 4행정 사이클의 열역학 과정 위주로 설명해줘"
                                        className="w-full h-24 bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-shadow"
                                        maxLength={100}
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                                        {customIntent.length}/100
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm shrink-0">
                                        <FileJson className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                                            {generatedData.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {generatedData.overview}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            {generatedData.keywords.slice(0, 3).map((kw, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-md">
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                <CheckCircle className="text-blue-600 shrink-0" size={20} />
                                <p className="text-xs text-blue-800 font-medium">
                                    AI 분석이 완료되었습니다.<br/>
                                    아래 버튼을 눌러 PDF 파일로 저장하세요.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm cursor-pointer"
                    >
                        취소
                    </button>
                    {!generatedData ? (
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    분석 중...
                                </>
                            ) : (
                                <>
                                    <FileText size={16} />
                                    리포트 생성
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleDownloadPdf}
                            className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                        >
                            <Download size={16} />
                            PDF 파일 저장
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default ReportGenerationModal;