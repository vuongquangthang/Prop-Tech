import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';

const N8N_WEBHOOK = '/n8n-proxy/webhook/4091fa09-fb9a-4039-9411-7104d213f601/chat';
const STORAGE_KEY = 'resident_chat_history';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'error';
  text: string;
  time: string;
}

const SUGGESTED_QUESTIONS = [
  'Phí gửi xe là bao nhiêu?',
  'Quy định về thú cưng?',
  'Giờ yên lặng là mấy giờ?',
  'Cách đăng ký sửa chữa căn hộ?',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  type: 'ai',
  text: 'Xin chào! Tôi là trợ lý AI của Smart Building. Tôi có thể giúp bạn giải đáp thắc mắc về quy định, dịch vụ và các tiện ích trong chung cư. Bạn cần hỏi gì?',
  time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
};

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [WELCOME_MESSAGE];
}

function saveHistory(messages: Message[]) {
  try {
    // Keep max 100 messages in storage
    const toSave = messages.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

export function ChatAI() {
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist history
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Server trả về lỗi ${res.status}`);
      }

      const data = await res.json();
      const replyText =
        data.output ||
        data.text ||
        data.message ||
        data.response ||
        (typeof data === 'string' ? data : 'Xin lỗi, tôi không hiểu phản hồi từ server.');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        text: err.message?.includes('fetch')
          ? 'Không thể kết nối đến trợ lý AI. Vui lòng kiểm tra kết nối mạng và thử lại.'
          : `Lỗi: ${err.message || 'Đã có lỗi xảy ra'}`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleClearHistory = () => {
    const fresh = { ...WELCOME_MESSAGE, id: Date.now().toString() };
    setMessages([fresh]);
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1A4B84 0%, #2563A8 100%)' }}
          >
            <Sparkles size={20} color="#FFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Trợ lý AI
            </h2>
            <p style={{ fontSize: '11px', color: '#1E7E34' }}>
              ● Đang hoạt động
            </p>
          </div>
        </div>
        <button
          onClick={handleClearHistory}
          title="Xóa lịch sử chat"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Trash2 size={16} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex"
            style={{
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* AI Avatar */}
            {message.type !== 'user' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1"
                style={{
                  background: message.type === 'error'
                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                    : 'linear-gradient(135deg, #1A4B84 0%, #2563A8 100%)',
                }}
              >
                {message.type === 'error'
                  ? <AlertCircle size={14} color="#FFF" />
                  : <Sparkles size={14} color="#FFF" />
                }
              </div>
            )}

            <div
              className="max-w-[75%] px-3 py-2"
              style={{
                backgroundColor:
                  message.type === 'user' ? 'var(--brand-primary)'
                  : message.type === 'error' ? '#FEF2F2'
                  : '#FFFFFF',
                color:
                  message.type === 'user' ? '#FFF'
                  : message.type === 'error' ? '#B91C1C'
                  : 'var(--text-primary)',
                border: message.type === 'user' ? 'none'
                  : message.type === 'error' ? '1px solid #FECACA'
                  : '1px solid #E5E7EB',
                borderRadius:
                  message.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}
            >
              {message.type === 'ai' && (
                <div className="flex items-center space-x-1 mb-1">
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-primary)' }}>
                    AI Assistant
                  </span>
                </div>
              )}
              <p style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {message.text}
              </p>
              <p
                style={{
                  fontSize: '10px',
                  color: message.type === 'user' ? 'rgba(255,255,255,0.7)'
                    : message.type === 'error' ? '#F87171'
                    : 'var(--text-secondary)',
                  marginTop: '4px',
                  textAlign: 'right',
                }}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}

        {/* Bot typing indicator */}
        {isLoading && (
          <div className="flex items-end space-x-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1A4B84 0%, #2563A8 100%)' }}
            >
              <Sparkles size={14} color="#FFF" />
            </div>
            <div
              className="px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px 16px 16px 4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}
            >
              <div className="flex items-center space-x-1">
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginRight: '6px' }}>
                  AI đang nhập
                </span>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    style={{
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggested Questions */}
        {showSuggestions && (
          <div className="space-y-2 mt-2">
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
              💡 Câu hỏi gợi ý
            </p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full px-3 py-2 rounded-xl text-left transition-all"
                  style={{
                    border: '1.5px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-primary)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(26,75,132,0.12)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi... (Enter để gửi)"
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-xl focus:outline-none transition-colors"
            style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              border: '2px solid #E5E7EB',
              backgroundColor: isLoading ? '#F9FAFB' : '#FFFFFF',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              backgroundColor: (inputText.trim() && !isLoading) ? 'var(--brand-primary)' : '#D1D5DB',
              cursor: (inputText.trim() && !isLoading) ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading
              ? <RefreshCw size={16} color="#FFF" style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={16} color="#FFF" />
            }
          </button>
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px', textAlign: 'center' }}>
          AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
