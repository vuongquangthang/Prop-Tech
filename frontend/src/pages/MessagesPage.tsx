import { Info, MessageCircle, Paperclip, Search, Send, Smile } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { loadRoomConversations, type RoomConversation } from '../services/roomConversationService';

export function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<RoomConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [localDraftMessages, setLocalDraftMessages] = useState<Record<number, RoomConversation['messages']>>({});

  const refresh = async () => {
    setLoading(true);
    setError('');

    try {
      const nextConversations = await loadRoomConversations();
      setConversations(nextConversations);

      const roomParam = searchParams.get('room');
      if (roomParam) {
        const matchedConversation = nextConversations.find((conversation) => conversation.roomInquiry === roomParam || conversation.messages.some((message) => message.messageText.includes(roomParam)));
        if (matchedConversation) {
          setSelectedConversation(matchedConversation.id);
        } else if (nextConversations.length > 0 && selectedConversation === null) {
          setSelectedConversation(nextConversations[0].id);
        }
      } else if (nextConversations.length > 0 && selectedConversation === null) {
        setSelectedConversation(nextConversations[0].id);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải hội thoại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversation.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.roomInquiry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  const activeConversation = filteredConversations.find((conversation) => conversation.id === selectedConversation) ?? filteredConversations[0] ?? null;
  const activeMessages = [...(activeConversation?.messages ?? []), ...(activeConversation ? localDraftMessages[activeConversation.id] ?? [] : [])].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    if (!activeConversation) return;

    setLocalDraftMessages((currentDrafts) => {
      const currentMessages = currentDrafts[activeConversation.id] ?? [];
      const nextMessage = {
        id: Date.now(),
        sender: 'me' as const,
        text: messageInput.trim(),
        time: 'Vừa xong',
        createdAt: new Date().toISOString(),
      };

      return {
        ...currentDrafts,
        [activeConversation.id]: [...currentMessages, nextMessage],
      };
    });

    setMessageInput('');
    toast.success('Đã gửi tin nhắn');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Tin nhắn</h1>
          <p className="text-sm text-gray-600">Quản lý các cuộc hội thoại với người thuê phòng</p>
        </div>

        <div>
          <div className="flex items-end gap-8 border-b border-gray-300">
            <button
              onClick={() => navigate('/post-management')}
              className="-mb-px border-b-2 border-transparent px-2 pb-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800"
            >
              Quản lý bài đăng
            </button>
            <button className="-mb-px border-b-2 border-blue-600 px-2 pb-3 text-sm font-semibold text-blue-600">
              Tin nhắn
            </button>
          </div>
        </div>

        <div className="flex rounded border-2 border-gray-300 bg-white overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex w-96 flex-col border-r border-gray-300">
            <div className="flex h-20 items-center border-b border-gray-300 px-4">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm cuộc hội thoại..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-sm text-gray-500">Đang tải hội thoại...</div>
              ) : error ? (
                <div className="p-6 text-center text-sm text-red-600">{error}</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">Chưa có hội thoại nào</div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`w-full border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 ${selectedConversation === conversation.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-white">
                          {conversation.userName.charAt(0)}
                        </div>
                        {conversation.online && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h4 className={`truncate text-sm ${conversation.unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                            {conversation.userName}
                          </h4>
                          <span className={`text-xs ${conversation.unread > 0 ? 'font-bold text-gray-700' : 'text-gray-500'}`}>
                            {conversation.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className={`flex-1 truncate text-xs ${conversation.unread > 0 ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                            <span className="font-medium text-blue-600">#{conversation.roomInquiry}</span> • {conversation.lastMessage}
                          </p>
                          {conversation.unread > 0 && (
                            <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                              <span className="text-xs font-semibold text-white">{conversation.unread}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            {activeConversation ? (
              <>
                <div className="flex h-20 items-center justify-between border-b border-gray-300 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-white">
                        {activeConversation.userName.charAt(0)}
                      </div>
                      {activeConversation.online && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">{activeConversation.userName}</h3>
                      <p className="text-xs text-gray-500">#{activeConversation.roomInquiry}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="rounded-full p-2 hover:bg-gray-100" title="Thông tin">
                      <Info size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-6">
                  {activeMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">Chưa có tin nhắn</div>
                  ) : (
                    activeMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-md flex-col ${message.sender === 'me' ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              message.sender === 'me'
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-200 bg-white text-gray-800'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <span className="mt-1 px-2 text-xs text-gray-500">{message.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-300 bg-white p-4">
                  <div className="flex items-end space-x-2">
                    <button className="rounded-full p-2 hover:bg-gray-100" title="Đính kèm">
                      <Paperclip size={20} className="text-gray-600" />
                    </button>
                    <button className="rounded-full p-2 hover:bg-gray-100" title="Emoji">
                      <Smile size={20} className="text-gray-600" />
                    </button>
                    <div className="flex-1 rounded-full bg-gray-100 px-4 py-2">
                      <input
                        type="text"
                        placeholder="Aa"
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        onKeyDown={handleKeyPress}
                        className="w-full bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className={`rounded-full p-2 ${messageInput.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-300'}`}
                      title="Gửi"
                    >
                      <Send size={20} className="text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600">Chọn một cuộc hội thoại để bắt đầu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
