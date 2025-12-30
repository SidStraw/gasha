import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, List, History, Edit3, Trash2 } from 'lucide-react';
import type { GachaItem, WinnerRecord } from '@gasha/shared';

type TabId = 'list' | 'history' | 'edit';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GachaItem[];
  history: WinnerRecord[];
  onUpdateItem: (id: string, updates: Partial<GachaItem>) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
}

const tabs: { id: TabId; label: string; icon: typeof List }[] = [
  { id: 'list', label: '列表', icon: List },
  { id: 'history', label: '紀錄', icon: History },
  { id: 'edit', label: '編輯', icon: Edit3 },
];

export default function SettingsModal({
  isOpen,
  onClose,
  items,
  history,
  onUpdateItem,
  onDeleteItem,
  onClearHistory,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 統計各獎項抽中次數
  const itemStats = useMemo(() => {
    const stats: Record<string, number> = {};
    history.forEach(record => {
      stats[record.item.id] = (stats[record.item.id] || 0) + 1;
    });
    return stats;
  }, [history]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="absolute inset-4 sm:inset-8 md:inset-16 bg-gasha-bg border-4 border-gasha-brown rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-4 border-gasha-brown">
              <h2 className="text-xl font-bold text-gasha-brown-dark font-display">
                設定
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-gasha-red rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b-2 border-gasha-brown/30">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 py-3 px-4 flex items-center justify-center gap-2 font-bold transition-colors
                    ${activeTab === tab.id 
                      ? 'bg-gasha-brown text-white' 
                      : 'text-gasha-brown hover:bg-gasha-brown/10'}
                  `}
                >
                  <tab.icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              {activeTab === 'list' && (
                <ListTab items={items} stats={itemStats} />
              )}
              {activeTab === 'history' && (
                <HistoryTab history={history} onClearHistory={onClearHistory} />
              )}
              {activeTab === 'edit' && (
                <EditTab 
                  items={items} 
                  editingId={editingId}
                  setEditingId={setEditingId}
                  onUpdateItem={onUpdateItem}
                  onDeleteItem={onDeleteItem}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// === 列表頁籤 ===
function ListTab({ items, stats }: { items: GachaItem[]; stats: Record<string, number> }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gasha-brown-light">
        <p>尚無獎項</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-gasha-brown/20"
        >
          {/* 球體顏色 */}
          <div
            className="w-10 h-10 rounded-full border-2 border-gasha-brown shrink-0"
            style={{ 
              background: `linear-gradient(0deg, ${item.color} 50%, #fff 50%)` 
            }}
          />
          {/* 名稱 */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gasha-brown-dark truncate">{item.label}</p>
            {item.prize && (
              <p className="text-sm text-gasha-brown-light truncate">{item.prize}</p>
            )}
          </div>
          {/* 抽中次數 */}
          <div className="text-sm text-gasha-brown-light">
            {stats[item.id] || 0} 次
          </div>
        </div>
      ))}
    </div>
  );
}

// === 紀錄頁籤 ===
function HistoryTab({ 
  history, 
  onClearHistory 
}: { 
  history: WinnerRecord[]; 
  onClearHistory: () => void;
}) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gasha-brown-light">
        <p>尚無抽獎紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onClearHistory}
          className="text-sm text-gasha-red hover:underline"
        >
          清除全部紀錄
        </button>
      </div>
      
      <div className="space-y-2">
        {history.slice().reverse().map((record, index) => (
          <div
            key={record.id}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-gasha-brown/20"
          >
            {/* 序號 */}
            <div className="w-8 h-8 bg-gasha-brown rounded-full flex items-center justify-center text-white text-sm font-bold">
              {history.length - index}
            </div>
            {/* 球體顏色 */}
            <div
              className="w-8 h-8 rounded-full border-2 border-gasha-brown shrink-0"
              style={{ 
                background: `linear-gradient(0deg, ${record.item.color} 50%, #fff 50%)` 
              }}
            />
            {/* 名稱 */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gasha-brown-dark truncate">{record.item.label}</p>
            </div>
            {/* 時間 */}
            <div className="text-xs text-gasha-brown-light">
              {new Date(record.timestamp).toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === 編輯頁籤 ===
function EditTab({ 
  items, 
  editingId,
  setEditingId,
  onUpdateItem,
  onDeleteItem,
}: { 
  items: GachaItem[]; 
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdateItem: (id: string, updates: Partial<GachaItem>) => void;
  onDeleteItem: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gasha-brown-light">
        <p>尚無獎項可編輯</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          className="p-3 bg-white rounded-xl border-2 border-gasha-brown/20"
        >
          {editingId === item.id ? (
            <EditForm 
              item={item} 
              onSave={(updates) => {
                onUpdateItem(item.id, updates);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center gap-3">
              {/* 球體顏色 */}
              <div
                className="w-10 h-10 rounded-full border-2 border-gasha-brown shrink-0"
                style={{ 
                  background: `linear-gradient(0deg, ${item.color} 50%, #fff 50%)` 
                }}
              />
              {/* 名稱 */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gasha-brown-dark truncate">{item.label}</p>
                {item.prize && (
                  <p className="text-sm text-gasha-brown-light truncate">{item.prize}</p>
                )}
              </div>
              {/* 操作按鈕 */}
              <button
                onClick={() => setEditingId(item.id)}
                className="p-2 text-gasha-blue hover:bg-gasha-blue/10 rounded-full transition-colors"
              >
                <Edit3 size={18} />
              </button>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-2 text-gasha-red hover:bg-gasha-red/10 rounded-full transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// === 編輯表單 ===
function EditForm({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: GachaItem; 
  onSave: (updates: Partial<GachaItem>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(item.label);
  const [prize, setPrize] = useState(item.prize || '');
  const [color, setColor] = useState(item.color);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gasha-brown-light mb-1">名稱</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2 border-2 border-gasha-brown/30 rounded-lg focus:border-gasha-brown focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gasha-brown-light mb-1">獎品說明</label>
        <input
          type="text"
          value={prize}
          onChange={(e) => setPrize(e.target.value)}
          placeholder="選填"
          className="w-full px-3 py-2 border-2 border-gasha-brown/30 rounded-lg focus:border-gasha-brown focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gasha-brown-light mb-1">顏色</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-10 border-2 border-gasha-brown/30 rounded-lg cursor-pointer"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border-2 border-gasha-brown rounded-lg text-gasha-brown font-bold hover:bg-gasha-brown/10 transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => onSave({ label, prize: prize || undefined, color })}
          className="flex-1 py-2 bg-gasha-green border-2 border-gasha-brown rounded-lg text-white font-bold hover:bg-gasha-green/90 transition-colors"
        >
          儲存
        </button>
      </div>
    </div>
  );
}
