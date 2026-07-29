export type DocumentStatus =
  | 'UPLOADING' | 'STORED' | 'PROCESSING' | 'INDEXED'
  | 'UPLOAD_FAILED' | 'INGEST_FAILED' | 'DELETED';

export interface ChatDocument {
  document_id: string;
  original_file_name: string;
  storage_url?: string | null;
  status: DocumentStatus;
  building_code: string;
  category?: string | null;
  title?: string | null;
  chunk_count: number;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: ChatDocument[];
  page: number;
  page_size: number;
  total: number;
}

export interface DocumentUploadResponse {
  success: boolean;
  documents: ChatDocument[];
}

export interface SelectedDocumentFile {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
}
