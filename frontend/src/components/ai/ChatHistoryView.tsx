import { ThumbsUp, ThumbsDown, Filter, Plus, MessageSquare } from 'lucide-react';
import { useState } from 'react';

// TODO: Fetch chat sessions from API when chatbot backend is implemented
// GET /api/Chatbot/sessions - List all chat sessions
// GET /api/Chatbot/sessions/{sessionId}/messages - Get messages for a session
const chatSessions: Array<{
  id: string;
  resident: string;
  phone: string;
  time: string;
  satisfied: boolean;
  lastMessage: string;
}> = [];

const chatMessages: Record<string, Array<{
  sender: string;
  text: string;
  time: string;
}>> = {};

export function ChatHistoryView() {
  const [selectedChat, setSelectedChat] = useState<string>('');
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
