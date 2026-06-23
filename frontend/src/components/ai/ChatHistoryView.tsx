import { ThumbsUp, ThumbsDown, MessageSquare, Plus, X, Check } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { chatService, ChatMessage, UnansweredChatItem } from '../../services/feature.service';
import { PageHeader } from '../ui/product-system';

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        eyebrow="Trợ lý ảo AI"
        title="Lịch sử hội thoại"
        description="Rà soát hội thoại AI, các câu chưa đủ dữ liệu và bổ sung nhanh vào kho tri thức."
      />

      <div className="flex min-h-0 flex-1">
      {/* Chat List - Left Panel */}
      <div className="w-96 bg-white border-r-2 border-gray-300 flex flex-col">
        <div className="border-b border-gray-300 p-4">
          <h3 className="text-base text-gray-800 mb-3">Danh sách hội thoại</h3>
          
          {/* Filter Buttons */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`flex-1 px-3 py-2 text-xs rounded border ${filter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Tất cả ({chatSessions.length})
            </button>
            <button 
              onClick={() => setFilter('satisfied')}
              className={`flex-1 px-3 py-2 text-xs rounded border ${filter === 'satisfied' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Hài lòng ({chatSessions.filter(s => s.satisfied).length})
            </button>
            <button 
              onClick={() => setFilter('unsatisfied')}
              className={`flex-1 px-3 py-2 text-xs rounded border ${filter === 'unsatisfied' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Không hài lòng ({chatSessions.filter(s => !s.satisfied).length})
            </button>
          </div>
        </div>
        
        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => setSelectedChat(session.id)}
                className={`relative p-4 pl-8 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${selectedChat === session.id ? 'bg-blue-50' : ''}`}
              >
                {/* left accent bar (absolute so it won't shift layout) */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${selectedChat === session.id ? 'bg-blue-500' : 'bg-transparent'}`} />
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{session.resident}</p>
                    <p className="text-xs text-gray-600">{session.phone}</p>
                  </div>
                  {session.satisfied ? (
                    <ThumbsUp size={16} className="text-green-600" />
                  ) : (
                    <ThumbsDown size={16} className="text-red-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-1">{session.time}</p>
                {session.unresolvedCount > 0 && (
                  <p className="text-xs text-red-700 mb-1">Cần bổ sung {session.unresolvedCount} câu tri thức</p>
                )}
                <p className="text-xs text-gray-700 truncate italic">"{session.lastMessage}"</p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
              <MessageSquare size={48} className="text-gray-300" />
              <p className="text-sm text-gray-500 text-center">
                {chatSessions.length === 0 
                  ? 'Chưa có lịch sử hội thoại nào' 
                  : 'Không tìm thấy hội thoại phù hợp với bộ lọc'}
              </p>
              <p className="text-xs text-gray-400 text-center">
                Các cuộc hội thoại với chatbot AI sẽ được hiển thị ở đây
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Content - Right Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-base text-gray-900">
                  {selectedSession?.resident}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedSession?.time}
                </p>
              </div>
              <button
                onClick={() => {
                  if (selectedUnansweredList.length > 0) {
                    setSelectedUnanswered(selectedUnansweredList[0]);
                  }
                }}
                disabled={selectedUnansweredList.length === 0}
                className="px-3 py-2 bg-white border border-gray-800 text-gray-800 text-xs rounded hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-40"
              >
                <Plus size={14} />
                <span>Thêm vào KB ({selectedUnansweredList.length})</span>
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {sessionMessages.map((message, index) => (
                <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.sender === 'ai' && (
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs">AI</div>
                        <span className="text-xs text-gray-500">Trả lời bởi AI</span>
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}>
                      <p className="text-sm">{message.text}</p>
                      {message.sender === 'ai' && message.isKnowledgeGap && (
                        <p className="text-xs text-red-700 mt-2">AI chưa đủ dữ liệu cho câu này</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">{message.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedUnansweredList.length > 0 && (
              <div className="px-6 pb-4">
                <div className="bg-red-50 border border-red-300 rounded p-3 space-y-2">
                  <p className="text-sm text-red-800 font-bold">Các câu cần bổ sung tri thức</p>
                  {selectedUnansweredList.map((item) => (
                    <div key={item.assistantMessageId} className="bg-white border border-red-200 rounded p-3">
                      <p className="text-sm text-gray-900 mb-2">{item.question}</p>
                      <button
                        onClick={() => setSelectedUnanswered(item)}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Trả lời và thêm vào KB
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Satisfaction Footer */}
            <div className="bg-white border-t border-gray-300 px-6 py-4">
              {selectedSession?.satisfied ? (
                <div className="flex items-center space-x-2 text-green-700">
                  <ThumbsUp size={16} />
                  <span className="text-sm">Cư dân hài lòng với câu trả lời</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-700">
                  <ThumbsDown size={16} />
                  <span className="text-sm">Cư dân không hài lòng - Cần bổ sung tri thức</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">Chọn một cuộc hội thoại để xem chi tiết</p>
          </div>
        )}
      </div>

      {selectedUnanswered && (
        <ResolveKnowledgeModal
          item={selectedUnanswered}
          onClose={() => setSelectedUnanswered(null)}
          onSaved={loadData}
        />
      )}
      </div>
    </div>
  );
}
