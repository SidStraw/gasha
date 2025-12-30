import { motion } from 'framer-motion';
import { X, Sparkles, Trophy } from 'lucide-react';
import type { GachaItem } from '@gasha/shared';

interface PrizeDisplayProps {
  winner: GachaItem | null;
  isLoading: boolean;
  onClose: () => void;
}

const PrizeDisplay: React.FC<PrizeDisplayProps> = ({ winner, isLoading, onClose }) => {
  if (!winner && !isLoading) return null;

  const showWinner = winner !== null;

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-gasha-bg/90 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Content */}
      <motion.div 
        className="relative bg-gasha-bg border-4 border-gasha-brown rounded-3xl p-8 max-w-sm w-[90%] shadow-2xl"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gasha-red text-white p-2 rounded-full border-4 border-gasha-brown hover:scale-110 transition-transform shadow-md"
        >
          <X size={24} strokeWidth={3} />
        </button>

        {!showWinner && isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="gasha-spinner w-16 h-16"></div>
            <p className="text-gasha-brown font-bold text-xl animate-pulse font-display">抽選中...</p>
            <p className="text-gasha-brown-light text-sm">正在選出幸運兒...</p>
          </div>
        ) : showWinner ? (
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Winner Badge */}
            <div className="px-4 py-1 rounded-full border-2 border-gasha-brown text-sm font-black uppercase tracking-wider bg-gasha-yellow text-gasha-brown-dark font-display">
              🎉 恭喜中獎！
            </div>

            {/* 扭蛋球樣式 - GACHAGO 風格 */}
            <motion.div 
              className="gacha-ball w-36 h-36 flex items-center justify-center shadow-lg"
              style={{ '--ball-color': winner.color } as React.CSSProperties}
              initial={{ y: -300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            >
              <motion.div 
                className="bg-white/80 p-4 rounded-2xl"
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <Trophy size={48} className="text-gasha-brown" />
              </motion.div>
            </motion.div>

            {/* 獲勝者名稱 */}
            <motion.h2 
              className="text-2xl font-black text-gasha-brown-dark leading-tight font-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {winner.label}
            </motion.h2>
            
            {/* 獎品說明 */}
            {winner.prize && (
              <motion.div 
                className="bg-gasha-brown/10 p-4 rounded-xl w-full border-2 border-gasha-brown/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-gasha-brown-dark font-bold text-lg italic leading-snug">
                  "{winner.prize}"
                </p>
              </motion.div>
            )}

            {/* 確認按鈕 */}
            <motion.button
              onClick={onClose}
              className="mt-2 px-8 py-3 bg-gasha-red border-4 border-gasha-brown rounded-full text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              好耶！
            </motion.button>

            {/* 底部裝飾 */}
            <div className="pt-2 flex items-center gap-2 text-gasha-brown-light text-sm font-bold">
               <Sparkles size={16} />
               <span>Gasha 轉蛋機</span>
               <Sparkles size={16} />
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
};

export default PrizeDisplay;
