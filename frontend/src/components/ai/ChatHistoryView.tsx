import { Eye, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import {
  chatService,
  ChatConversationSummary,
  ChatConversationDetail,
} from '../../services/feature.service';
import { PageHeader, EmptyState } from '../ui/product-system';
import { Button } from '../ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../ui/alert-dialog';

const PAGE_SIZE = 10;

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ChatHistoryView() {
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<ChatConversationDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<ChatConversationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const result = await chatService.getConversationsPage(targetPage, PAGE_SIZE);
      setConversations(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch (_) {
      setConversations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const handleViewDetail = async (conv: ChatConversationSummary) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const result = await chatService.getConversationDetail(conv.userId);
      setDetail(result);
    } catch (_) {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await chatService.deleteConversation(pendingDelete.userId);
      setPendingDelete(null);
      const isLastRowOnPage = conversations.length === 1 && page > 1;
      await loadPage(isLastRowOnPage ? page - 1 : page);
    } catch (_) {
      // Bo qua loi, giu nguyen danh sach de nguoi dung thu lai.
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Trợ lý ảo AI"
        title="Lịch sử hội thoại"
        description="Danh sách các cuộc hội thoại giữa cư dân và chatbot AI."
      />

      <div className="product-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Đang tải...
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={44} />}
            title="Chưa có lịch sử hội thoại"
            description="Các cuộc hội thoại với chatbot AI sẽ được hiển thị ở đây."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cư dân</TableHead>
                  <TableHead>Tin nhắn gần nhất</TableHead>
                  <TableHead>Cập nhật lần cuối</TableHead>
                  <TableHead className="text-center">Số tin nhắn</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conv) => (
                  <TableRow key={conv.userId}>
                    <TableCell className="font-medium">{conv.userPhone || conv.userId}</TableCell>
                    <TableCell className="max-w-md truncate italic" style={{ color: 'var(--text-secondary)' }}>
                      "{conv.lastMessage}"
                    </TableCell>
                    <TableCell style={{ color: 'var(--text-secondary)' }}>
                      {formatDateTime(conv.lastUpdated)}
                    </TableCell>
                    <TableCell className="text-center">{conv.messageCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 h-8 px-2 text-xs"
                          onClick={() => handleViewDetail(conv)}
                        >
                          <Eye size={14} />
                          Xem chi tiết
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setPendingDelete(conv)}
                        >
                          <Trash2 size={14} />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {total} cuộc hội thoại
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => loadPage(page - 1)}
                  className="gap-1 h-8 px-2 text-xs"
                >
                  <ChevronLeft size={14} />
                  Trước
                </Button>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Trang {page}/{totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => loadPage(page + 1)}
                  className="gap-1 h-8 px-2 text-xs"
                >
                  Sau
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết hội thoại</DialogTitle>
            <DialogDescription>
              {detail?.userPhone ? `Cư dân ${detail.userPhone}` : 'Đang tải...'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-1">
            {detailLoading ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                Đang tải...
              </p>
            ) : !detail || detail.messages.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                Không có tin nhắn.
              </p>
            ) : (
              detail.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.messageRole === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[80%]">
                    <div
                      className="px-4 py-2.5 rounded-lg text-sm"
                      style={
                        message.messageRole === 'user'
                          ? { background: 'var(--primary)', color: '#fff' }
                          : { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                      }
                    >
                      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.messageText}</p>
                    </div>
                    <p className="text-xs mt-1 px-1" style={{ color: 'var(--text-secondary)' }}>
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hội thoại?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ tin nhắn của cư dân {pendingDelete?.userPhone || pendingDelete?.userId} sẽ bị xóa vĩnh viễn và
              không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? 'Đang xóa...' : 'Xóa hội thoại'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
