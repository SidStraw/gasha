import React from 'react';
import { X, Sparkles, Trophy } from 'lucide-react';
import type { GachaItem } from '@gasha/shared';

interface PrizeDisplayProps {
  winner: GachaItem | null;
  isLoading: boolean;
  onClose: () => void;
}

const PrizeDisplay: React.FC<PrizeDisplayProps> = ({ winner, isLoading, onClose }) => {
  if (!winner && !isLoading) return null;

  // 如果有 winner 就直接顯示結果，不管 isLoading 狀態
  const showWinner = winner !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-[#FDFBF7] border-4 border-[#8B4513] rounded-3xl p-8 max-w-sm w-[90%] shadow-2xl transform scale-100 transition-all">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-[#E74C3C] text-white p-2 rounded-full border-4 border-[#8B4513] hover:scale-110 transition-transform shadow-md"
        >
          <X size={24} strokeWidth={3} />
        </button>

        {!showWinner && isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-16 h-16 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#8B4513] font-bold text-xl animate-pulse">抽選中...</p>
            <p className="text-[#8B4513]/60 text-sm">正在選出幸運兒...</p>
          </div>
        ) : showWinner ? (
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Winner Badge */}
            <div className="px-4 py-1 rounded-full border-2 border-[#8B4513] text-sm font-black uppercase tracking-wider bg-yellow-400 text-yellow-900">
              🎉 恭喜中獎！
            </div>

            {/* Visual Icon */}
            <div 
                className="w-32 h-32 rounded-full border-4 border-[#8B4513] flex items-center justify-center shadow-inner mb-2"
                style={{ backgroundColor: winner.color }}
            >
                <div className="bg-white/80 p-4 rounded-2xl">
                    <Trophy size={48} className="text-[#8B4513]"/>
                </div>
            </div>

            <h2 className="text-2xl font-black text-[#8B4513] leading-tight">{winner.label}</h2>
            
            {winner.prize && (
              <div className="bg-[#8B4513]/10 p-4 rounded-xl w-full border-2 border-[#8B4513]/20">
                <p className="text-[#6D4C41] font-bold text-lg italic leading-snug">
                  "{winner.prize}"
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2 text-[#8B4513]/60 text-sm font-bold">
               <Sparkles size={16} />
               <span>Gasha 轉蛋機</span>
               <Sparkles size={16} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PrizeDisplay;
