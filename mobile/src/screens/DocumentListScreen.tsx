import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, AppState, FlatList, RefreshControl, SafeAreaView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { documentService } from '../services/document.service';
import { ChatDocument, DocumentStatus } from '../types/document';
import { normalizeApiError } from '../types/api';

const labels: Record<DocumentStatus, string> = {
  UPLOADING: 'Đang tải lên', STORED: 'Đã lưu file', PROCESSING: 'Đang xử lý',
  INDEXED: 'Sẵn sàng', UPLOAD_FAILED: 'Tải lên thất bại',
  INGEST_FAILED: 'Xử lý thất bại', DELETED: 'Đã xóa',
};
const processing = new Set<DocumentStatus>(['UPLOADING', 'STORED', 'PROCESSING']);

export default function DocumentListScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<ChatDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const result = await documentService.list();
      setItems(result.items.filter(item => item.status !== 'DELETED')); setError(null);
    } catch (e) { setError(normalizeApiError(e).message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    if (!items.some(item => processing.has(item.status))) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') load();
    }, 5000);
    return () => clearInterval(timer);
  }, [items, load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Tài liệu chatbot</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DocumentUpload')}><Text style={styles.add}>Thêm</Text></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 60 }} /> : (
        <FlatList data={items} keyExtractor={item => item.document_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>{error || 'Chưa có tài liệu.'}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DocumentDetail', { documentId: item.document_id })}>
              <Text style={styles.name}>{item.title || item.original_file_name}</Text>
              <Text style={styles.meta}>{item.category || 'Chưa phân loại'} · {item.chunk_count} chunks</Text>
              <Text style={[styles.status, item.status.includes('FAILED') && styles.failed]}>{labels[item.status]}</Text>
              {item.error && <Text style={styles.error}>{item.error}</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  back: { fontSize: 32, color: '#1A4B84' }, title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  add: { color: '#1A4B84', fontWeight: '700' }, empty: { textAlign: 'center', marginTop: 80, color: '#64748B' },
  card: { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 12, padding: 16, borderRadius: 12 },
  name: { fontWeight: '700', color: '#0F172A' }, meta: { color: '#64748B', marginTop: 5 },
  status: { marginTop: 8, color: '#047857', fontWeight: '600' }, failed: { color: '#B91C1C' }, error: { color: '#B91C1C', marginTop: 5 },
});
