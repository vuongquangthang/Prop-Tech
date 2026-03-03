import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

export function ChatAI() {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: 'Xin chào! Tôi là trợ lý AI của Smart Building. Tôi có thể giúp bạn giải đáp thắc mắc về quy định, dịch vụ trong chung cư. Bạn cần hỏi gì?',
      time: '10:30',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const suggestedQuestions = [
    'Phí gửi xe là bao nhiêu?',
    'Quy định về thú cưng?',
    'Giờ yên lặng là mấy giờ?',
    'Cách đăng ký sửa chữa căn hộ?',
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Add user message
    const newUserMessage = {
      type: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newUserMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        type: 'ai',
        text: 'Cảm ơn bạn đã đặt câu hỏi. Theo quy định của chung cư, phí gửi xe máy là 150.000đ/tháng/xe và xe ô tô là 600.000đ/tháng/xe. Phí này đã bao gồm bảo vệ 24/7 và bảo hiểm xe.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleSuggestionClick = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-2">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className="flex"
            style={{
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              className="max-w-[85%] px-3 py-2 rounded-2xl"
              style={{
                backgroundColor: message.type === 'user' ? 'var(--brand-primary)' : '#FFF',
                color: message.type === 'user' ? '#FFF' : 'var(--text-primary)',
                border: message.type === 'ai' ? '1px solid #D1D5DB' : 'none',
                borderRadius: message.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              }}
            >
              {message.type === 'ai' && (
                <div className="flex items-center space-x-1 mb-1">
                  <Sparkles size={14} color="var(--brand-primary)" />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-primary)' }}>
                    AI Assistant
                  </span>
                </div>
              )}
              <p style={{ fontSize: '13px', lineHeight: 1.5 }}>
                {message.text}
              </p>
              <p
                style={{
                  fontSize: '10px',
                  color: message.type === 'user' ? '#E8F0F8' : 'var(--text-secondary)',
                  marginTop: '4px',
                }}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
              💡 Câu hỏi gợi ý
            </p>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {question}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-end space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              backgroundColor: inputText.trim() ? 'var(--brand-primary)' : '#D1D5DB',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={18} color="#FFF" />
          </button>
        </div>

        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px', textAlign: 'center' }}>
          AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.
        </p>
      </div>
    </div>
  );
}
