import { ThumbsUp, ThumbsDown, Filter, Plus } from 'lucide-react';
import { useState } from 'react';

const chatSessions = [
  { 
    id: 'CHAT-001',
    resident: 'Nguyễn Văn A', 
    phone: '0934567890',
    time: '05/02/2026 14:30',
    satisfied: true,
    lastMessage: 'Cảm ơn bạn!'
  },
  { 
    id: 'CHAT-002',
    resident: 'Trần Thị B', 
    phone: '0945678901',
    time: '05/02/2026 10:15',
    satisfied: false,
    lastMessage: 'Không giải quyết được vấn đề'
  },
  { 
    id: 'CHAT-003',
    resident: 'Lê Văn C', 
    phone: '0956789012',
    time: '04/02/2026 16:20',
    satisfied: true,
    lastMessage: 'OK rồi'
  },
  { 
    id: 'CHAT-004',
    resident: 'Phạm Thị D', 
    phone: '0967890123',
    time: '04/02/2026 11:45',
    satisfied: true,
    lastMessage: 'Đã hiểu'
  },
  { 
    id: 'CHAT-005',
    resident: 'Hoàng Văn E', 
    phone: '0978901234',
    time: '03/02/2026 09:30',
    satisfied: false,
    lastMessage: 'Câu trả lời không rõ ràng'
  },
];

const chatMessages = {
  'CHAT-001': [
    { sender: 'user', text: 'Hồ bơi mở cửa mấy giờ vậy?', time: '14:30' },
    { sender: 'ai', text: 'Hồ bơi mở cửa từ 6:00 - 22:00 hàng ngày. Vui lòng mang theo thẻ cư dân khi sử dụng.', time: '14:30' },
    { sender: 'user', text: 'Cảm ơn bạn!', time: '14:31' },
  ],
  'CHAT-002': [
    { sender: 'user', text: 'Làm sao để thanh toán hóa đơn online?', time: '10:15' },
    { sender: 'ai', text: 'Bạn có thể thanh toán qua VietQR hoặc chuyển khoản ngân hàng. Vui lòng xem mã QR trong App.', time: '10:15' },
    { sender: 'user', text: 'Tôi không tìm thấy mã QR ở đâu cả', time: '10:16' },
    { sender: 'ai', text: 'Xin lỗi, để tôi kết nối với nhân viên hỗ trợ.', time: '10:16' },
    { sender: 'user', text: 'Không giải quyết được vấn đề', time: '10:17' },
  ],
  'CHAT-003': [
    { sender: 'user', text: 'Phí quản lý là bao nhiêu?', time: '16:20' },
    { sender: 'ai', text: 'Phí quản lý: 15.000 VNĐ/m²/tháng. Phí gửi xe máy: 100.000 VNĐ/tháng. Phí gửi ô tô: 1.500.000 VNĐ/tháng.', time: '16:20' },
    { sender: 'user', text: 'OK rồi', time: '16:21' },
  ],
  'CHAT-004': [
    { sender: 'user', text: 'Tôi có thể nuôi chó không?', time: '11:45' },
    { sender: 'ai', text: 'Được phép nuôi chó/mèo dưới 5kg. Cần đăng ký với Ban quản lý và có đầy đủ giấy tờ tiêm phòng.', time: '11:45' },
    { sender: 'user', text: 'Đã hiểu', time: '11:46' },
  ],
  'CHAT-005': [
    { sender: 'user', text: 'Tôi muốn khiếu nại về tiếng ồn', time: '09:30' },
    { sender: 'ai', text: 'Vui lòng liên hệ Ban quản lý qua hotline 1900xxxx.', time: '09:30' },
    { sender: 'user', text: 'Có cách nào khác không?', time: '09:31' },
    { sender: 'ai', text: 'Bạn có thể gửi phản ánh qua tính năng "Góp ý" trong App.', time: '09:31' },
    { sender: 'user', text: 'Câu trả lời không rõ ràng', time: '09:32' },
  ],
};

export function ChatHistoryView() {
  const [selectedChat, setSelectedChat] = useState<string>('CHAT-001');
  const [filter, setFilter] = useState<'all' | 'satisfied' | 'unsatisfied'>('all');
  
  const filteredSessions = chatSessions.filter(session => {
    if (filter === 'satisfied') return session.satisfied;
    if (filter === 'unsatisfied') return !session.satisfied;
    return true;
  });
  
  const messages = chatMessages[selectedChat as keyof typeof chatMessages] || [];

  return (
    <div className="flex h-full">
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
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${selectedChat === session.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
              >
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
                <p className="text-xs text-gray-700 truncate italic">"{session.lastMessage}"</p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Chưa có cư dân nào đặt câu hỏi hôm nay</p>
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
                  {chatSessions.find(s => s.id === selectedChat)?.resident}
                </p>
                <p className="text-xs text-gray-600">
                  {chatSessions.find(s => s.id === selectedChat)?.time}
                </p>
              </div>
              <button className="px-3 py-2 bg-white border border-gray-800 text-gray-800 text-xs rounded hover:bg-gray-50 flex items-center space-x-2">
                <Plus size={14} />
                <span>Thêm vào KB</span>
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
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
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">{message.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Satisfaction Footer */}
            <div className="bg-white border-t border-gray-300 px-6 py-4">
              {chatSessions.find(s => s.id === selectedChat)?.satisfied ? (
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
    </div>
  );
}
