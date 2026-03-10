import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, RefreshCw, Trash2 } from 'lucide-react';

const N8N_WEBHOOK = '/n8n-proxy/webhook/4091fa09-fb9a-4039-9411-7104d213f601/chat';
const STORAGE_KEY = 'resident_chat_history';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'error';
  text: string;
  time: string;
}

const SUGGESTED_QUESTIONS = [
  'Quy định tòa nhà là gì?',
  'Lấy pass wifi phòng chờ?',
  'Phí gửi xe là bao nhiêu?',
  'Cách đăng ký sửa chữa căn hộ?',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  type: 'ai',
  text: 'Chào bạn! Tôi là trợ lý AI của SmartHome. Tôi có thể giúp bạn giải thích hóa đơn, tra cứu nội quy hoặc hướng dẫn thanh toán.',
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
  } catch {}
}

export function ChatAI() {
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

      if (!res.ok) throw new Error(`Server trả về lỗi ${res.status}`);

      const data = await res.json();
      const replyText =
        data.output || data.text || data.message || data.response ||
        (typeof data === 'string' ? data : 'Xép lỗi, tôi đang gặp vấn đề. Vui lòng thử lại sau.');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'error',
        text: err.message?.includes('fetch')
          ? 'Không thể kết nối đến trợ lý AI. Vui lòng kiểm tra kết nối mạng.'
          : `Lỗi: ${err.message || 'Đã có lỗi xảy ra'}`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }]);
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
    setMessages([{ ...WELCOME_MESSAGE, id: Date.now().toString() }]);
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #F3F4F6',
        backgroundColor: '#FFF', flexShrink: 0,
      }}>
        <div style={{ width: 24 }} />
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Trợ lý ảo tòa nhà</p>
        <button
          onClick={handleClearHistory}
          title="Xóa lịch sử"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <Trash2 size={18} color="#9CA3AF" />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.type !== 'user' ? (
              /* Bot / Error message row */
              <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: '85%' }}>
                {/* Bot avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: msg.type === 'error' ? '#FEE2E2' : '#DBEAFE',
                  border: `1px solid ${msg.type === 'error' ? '#FECACA' : '#BFDBFE'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginRight: 12,
                }}>
                  <MessageCircle size={18} color={msg.type === 'error' ? '#DC2626' : '#2563EB'} />
                </div>
                {/* Bubble */}
                <div style={{
                  backgroundColor: msg.type === 'error' ? '#FEF2F2' : '#FFFFFF',
                  border: `1px solid ${msg.type === 'error' ? '#FECACA' : '#E5E7EB'}`,
                  borderRadius: '16px 16px 16px 4px',
                  padding: 12,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}>
                  {msg.type === 'ai' && (
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', margin: '0 0 4px' }}>
                      AI Assistant
                    </p>
                  )}
                  <p style={{
                    fontSize: 14, color: msg.type === 'error' ? '#B91C1C' : '#374151',
                    lineHeight: '20px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </p>
                  <p style={{ fontSize: 10, color: '#9CA3AF', margin: '4px 0 0', textAlign: 'right' }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ) : (
              /* User message row */
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', maxWidth: '85%', alignSelf: 'flex-end', marginLeft: 'auto' }}>
                <div style={{
                  backgroundColor: '#1E3A8A',
                  borderRadius: '16px 16px 4px 16px',
                  padding: 12,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}>
                  <p style={{ fontSize: 14, color: '#FFFFFF', lineHeight: '20px', margin: 0, wordBreak: 'break-word' }}>
                    {msg.text}
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', textAlign: 'right' }}>
                    {msg.time}
                  </p>
                </div>
                {/* User avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginLeft: 12,
                }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: '85%' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginRight: 12,
            }}>
              <MessageCircle size={18} color="#2563EB" />
            </div>
            <div style={{
              backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
              borderRadius: '16px 16px 16px 4px', padding: '12px 16px',
              display: 'flex', gap: 4, alignItems: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF',
                  animation: 'bounce 1.2s infinite',
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestion chips */}
        {showSuggestions && (
          <div style={{ marginLeft: 44, display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 8 }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                style={{
                  padding: '6px 12px', borderRadius: 16,
                  backgroundColor: '#FFFFFF', border: '1px solid #BFDBFE',
                  fontSize: 12, color: '#2563EB', cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: 16, backgroundColor: '#FFFFFF',
        borderTop: '1px solid #F3F4F6',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi..."
            disabled={isLoading}
            style={{
              flex: 1, backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB', borderRadius: 24,
              padding: '12px 52px 12px 16px',
              fontSize: 14, color: '#111827', outline: 'none',
            }}
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            style={{
              position: 'absolute', right: 8,
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: (inputText.trim() && !isLoading) ? '#1E3A8A' : '#D1D5DB',
              border: 'none', cursor: (inputText.trim() && !isLoading) ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {isLoading
              ? <RefreshCw size={16} color="#FFF" style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={16} color="#FFF" />
            }
          </button>
        </div>
        <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
          AI có thể không chính xác 100%. Vui lòng không chia sẻ mã số cá nhân.
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
