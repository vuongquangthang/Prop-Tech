import { ThumbsUp, ThumbsDown, MessageSquare, Plus, X, Check } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { chatService, ChatMessage, UnansweredChatItem } from '../../services/feature.service';
import { StatusBadge, EmptyState } from '../ui/product-system';

interface ChatSession {
  id: string;
  userId: number;
  resident: string;
  phone: string;
  time: string;
  satisfied: boolean;
  unresolvedCount: number;
  lastMessage: string;
  messages: Array<{ sender: 'user' | 'ai'; text: string; time: string; isKnowledgeGap?: boolean }>;
}

const buildSessions = (messages: ChatMessage[], unansweredItems: UnansweredChatItem[]): ChatSession[] => {
  const byUser = new Map<number, ChatMessage[]>();
  const unresolvedCountByUser = new Map<number, number>();

  unansweredItems.forEach(item => {
    unresolvedCountByUser.set(item.userId, (unresolvedCountByUser.get(item.userId) || 0) + 1);
  });

  for (const m of messages) {
    const key = m.userId;
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key)!.push(m);
  }

  return Array.from(byUser.entries()).map(([userId, msgs]) => {
    const sorted = [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const last = sorted[sorted.length - 1];
    const lastDate = new Date(last.createdAt);
    const time = `${String(lastDate.getDate()).padStart(2, '0')}/${String(lastDate.getMonth() + 1).padStart(2, '0')}/${lastDate.getFullYear()} ${String(lastDate.getHours()).padStart(2, '0')}:${String(lastDate.getMinutes()).padStart(2, '0')}`;
    const phone = last.userPhone || String(userId);

    const chatMessages = sorted.map(m => {
      const d = new Date(m.createdAt);
      return {
        sender: (m.messageRole === 'user' ? 'user' : 'ai') as 'user' | 'ai',
        text: m.messageText,
        isKnowledgeGap: m.isKnowledgeGap,
        time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      };
    });
    const unresolvedCount = unresolvedCountByUser.get(userId) || 0;

    return {
      id: String(userId),
      userId,
      resident: `Cư dân ${phone}`,
      phone,
      time,
      satisfied: unresolvedCount === 0,
      unresolvedCount,
      lastMessage: last.messageText,
      messages: chatMessages,
    };
  });
};

function ResolveKnowledgeModal({
  item,
  onClose,
  onSaved,
}: {
  item: UnansweredChatItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [answerText, setAnswerText] = useState('');
  const [category, setCategory] = useState('Khác');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!answerText.trim()) return;
    setSaving(true);
    try {
      await chatService.resolveUnanswered(item.assistantMessageId, {
        answerText: answerText.trim(),
        category,
        activateImmediately: true,
      });
      onSaved();
      onClose();
    } catch (_) {
      setSaving(false);
    }
  };

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[760px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg text-gray-800">Bổ sung tri thức từ hội thoại</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
            <p className="text-sm text-yellow-800 font-bold mb-1">Câu AI chưa đủ dữ liệu:</p>
            <p className="text-sm text-gray-800">{item.question}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Danh mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            >
              <option value="Nội quy">Nội quy</option>
              <option value="Thủ tục hành chính">Thủ tục hành chính</option>
              <option value="Giá dịch vụ">Giá dịch vụ</option>
              <option value="Tài chính">Tài chính</option>
              <option value="Kỹ thuật">Kỹ thuật</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-bold">Câu trả lời chuẩn</label>
            <textarea
              rows={7}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Nhập câu trả lời để hệ thống tự thêm vào kho tri thức..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>

        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !answerText.trim()}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <Check size={16} />
            <span>{saving ? 'Đang lưu...' : 'Lưu vào tri thức'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatHistoryView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unansweredItems, setUnansweredItems] = useState<UnansweredChatItem[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'satisfied' | 'unsatisfied'>('all');
  const [selectedUnanswered, setSelectedUnanswered] = useState<UnansweredChatItem | null>(null);

  const loadData = async () => {
    try {
      const [allMessages, unanswered] = await Promise.all([
        chatService.getAllHistory(1000),
        chatService.getUnanswered(200),
      ]);

      setMessages(allMessages);
      setUnansweredItems(unanswered);
      const sessions = buildSessions(allMessages, unanswered);
      setChatSessions(sessions);
      if (!selectedChat && sessions.length > 0) {
        setSelectedChat(sessions[0].id);
      }
    } catch (_) {
      setMessages([]);
      setUnansweredItems([]);
      setChatSessions([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedSession = useMemo(
    () => chatSessions.find(s => s.id === selectedChat),
    [chatSessions, selectedChat]
  );

  const selectedUnansweredList = useMemo(
    () => unansweredItems.filter(item => String(item.userId) === selectedChat),
    [unansweredItems, selectedChat]
  );
  
  const filteredSessions = chatSessions.filter(session => {
    if (filter === 'satisfied') return session.satisfied;
    if (filter === 'unsatisfied') return !session.satisfied;
    return true;
  });
  
  const sessionMessages = selectedSession?.messages || [];
  const filterTabs = [
    { key: 'all', label: 'Tất cả', count: chatSessions.length },
    { key: 'satisfied', label: 'Hài lòng', count: chatSessions.filter(s => s.satisfied).length },
    { key: 'unsatisfied', label: 'Cần xử lý', count: chatSessions.filter(s => !s.satisfied).length },
  ] as const;

  return (
    <div className="space-y-4">

      {/* Vùng 2 cột: chiều cao cố định theo màn hình, mỗi cột cuộn độc lập.
          Dùng inline style cho layout/màu vì Tailwind của dự án được build tĩnh
          (không hỗ trợ arbitrary values / min-h-0 / grid-cols-[..]). */}
      <div
        className="product-card overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          height: 'calc(100dvh - var(--admin-topbar-height) - 210px)',
          minHeight: '460px',
        }}
      >
        {/* Chat List - Left Panel */}
        <div
          className="flex flex-col"
          style={{ minHeight: 0, borderRight: '1px solid var(--surface-border)', background: 'var(--surface-card)' }}
        >
          <div className="p-4" style={{ borderBottom: '1px solid var(--surface-border)' }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="table-section-title leading-tight">Lịch sử hội thoại</h3>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{chatSessions.length} cuộc hội thoại</p>
              </div>
              <MessageSquare size={18} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div className="ai-chat-filter-tabs">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={filter === tab.key ? 'is-active' : ''}
                  onClick={() => setFilter(tab.key)}
                >
                  <span>{tab.label}</span>
                  <b>{tab.count}</b>
                </button>
              ))}
            </div>
          </div>

          {/* Session List — cuộn độc lập */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => {
                const isActive = selectedChat === session.id;
                return (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() => setSelectedChat(session.id)}
                    className="relative w-full text-left"
                    style={{
                      padding: '14px 14px 14px 22px',
                      borderBottom: '1px solid var(--surface-border)',
                      background: isActive ? 'var(--brand-surface)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <span
                      className="absolute"
                      style={{ left: 0, top: 0, bottom: 0, width: 4, background: isActive ? 'var(--brand-primary)' : 'transparent' }}
                    />
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <p className="text-sm truncate" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{session.resident}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{session.phone}</p>
                      </div>
                      {session.satisfied ? (
                        <ThumbsUp size={16} style={{ flexShrink: 0, color: 'var(--success)' }} />
                      ) : (
                        <ThumbsDown size={16} style={{ flexShrink: 0, color: 'var(--error)' }} />
                      )}
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{session.time}</p>
                    {session.unresolvedCount > 0 && (
                      <div className="mb-1">
                        <StatusBadge tone="danger">Cần bổ sung {session.unresolvedCount} câu</StatusBadge>
                      </div>
                    )}
                    <p className="text-xs truncate italic" style={{ color: 'var(--text-secondary)' }}>"{session.lastMessage}"</p>
                  </button>
                );
              })
            ) : (
              <EmptyState
                icon={<MessageSquare size={44} />}
                title={chatSessions.length === 0 ? 'Chưa có lịch sử hội thoại' : 'Không có hội thoại phù hợp'}
                description="Các cuộc hội thoại với chatbot AI sẽ được hiển thị ở đây."
              />
            )}
          </div>
        </div>

        {/* Chat Content - Right Panel */}
          <div className="flex flex-col" style={{ minHeight: 0, background: 'var(--surface-subtle)' }}>
          {selectedChat ? (
            <>
              {/* Chat Header — cố định */}
              <div
                className="px-6 py-4 flex items-center justify-between gap-3"
                style={{ flexShrink: 0, background: 'var(--surface-card)', borderBottom: '1px solid var(--surface-border)' }}
              >
                <div style={{ minWidth: 0 }}>
                  <p className="text-sm truncate" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSession?.resident}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selectedSession?.time}</p>
                </div>
                <button
                  onClick={() => {
                    if (selectedUnansweredList.length > 0) {
                      setSelectedUnanswered(selectedUnansweredList[0]);
                    }
                  }}
                  disabled={selectedUnansweredList.length === 0}
                  className="px-3 py-2 text-xs rounded flex items-center gap-2"
                  style={{
                    flexShrink: 0,
                    background: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--text-primary)',
                    opacity: selectedUnansweredList.length === 0 ? 0.4 : 1,
                  }}
                >
                  <Plus size={14} />
                  <span>Thêm vào KB ({selectedUnansweredList.length})</span>
                </button>
              </div>

              {/* Chat Messages — cuộn độc lập */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ minHeight: 0 }}>
                {sessionMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${message.sender === 'user' ? 'order-2' : 'order-1'}`} style={{ maxWidth: 'min(620px, 76%)' }}>
                      {message.sender === 'ai' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                            style={{ background: 'var(--primary)', fontSize: 10, fontWeight: 600 }}
                          >AI</div>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Trả lời bởi AI</span>
                        </div>
                      )}
                      <div
                        className="px-4 py-3 rounded-lg"
                        style={
                          message.sender === 'user'
                            ? { background: 'var(--brand-primary)', color: '#fff' }
                            : { background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }
                        }
                      >
                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</p>
                        {message.sender === 'ai' && message.isKnowledgeGap && (
                          <p className="text-xs mt-2" style={{ color: 'var(--error)' }}>AI chưa đủ dữ liệu cho câu này</p>
                        )}
                      </div>
                      <p className="text-xs mt-1 px-1" style={{ color: 'var(--text-secondary)' }}>{message.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedUnansweredList.length > 0 && (
                <div className="px-6 pb-4" style={{ flexShrink: 0 }}>
                  <div
                    className="rounded-lg p-3 space-y-2 overflow-y-auto"
                    style={{ background: 'var(--error-soft)', border: '1px solid var(--error)', maxHeight: 176 }}
                  >
                    <p className="text-sm" style={{ fontWeight: 600, color: 'var(--error-foreground)' }}>Các câu cần bổ sung tri thức</p>
                    {selectedUnansweredList.map((item) => (
                      <div key={item.assistantMessageId} className="p-3" style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)' }}>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{item.question}</p>
                        <button
                          onClick={() => setSelectedUnanswered(item)}
                          className="px-3 py-1.5 text-xs rounded text-white"
                          style={{ background: 'var(--error)' }}
                        >
                          Trả lời và thêm vào KB
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Satisfaction Footer — cố định */}
              <div className="px-6 py-3" style={{ flexShrink: 0, background: 'var(--surface-card)', borderTop: '1px solid var(--surface-border)' }}>
                {selectedSession?.satisfied ? (
                  <div className="flex items-center space-x-2" style={{ color: 'var(--success-foreground)' }}>
                    <ThumbsUp size={16} />
                    <span className="text-sm">Cư dân hài lòng với câu trả lời</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2" style={{ color: 'var(--error-foreground)' }}>
                    <ThumbsDown size={16} />
                    <span className="text-sm">Cư dân không hài lòng - Cần bổ sung tri thức</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Chọn một cuộc hội thoại để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {selectedUnanswered && (
        <ResolveKnowledgeModal
          item={selectedUnanswered}
          onClose={() => setSelectedUnanswered(null)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
