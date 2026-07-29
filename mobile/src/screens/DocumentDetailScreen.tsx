import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { documentService } from '../services/document.service';
import { ChatDocument } from '../types/document';
import { normalizeApiError } from '../types/api';
import { useAuthStore } from '../store/authStore';

export default function DocumentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const id = (route.params as { documentId: string }).documentId;
  const role = useAuthStore(state => state.user?.role);
  const canManage = ['Admin', 'QuanLy', 'Manager'].includes(role || '');
  const [document, setDocument] = useState<ChatDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setDocument(await documentService.get(id)); setError(null); }
    catch (e) { setError(normalizeApiError(e).message); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const reindex = () => Alert.alert('Reindex tài liệu', 'Tạo lại toàn bộ vector?', [
    { text: 'Hủy', style: 'cancel' }, { text: 'Reindex', onPress: async () => {
      setBusy(true);
      try { setDocument((await documentService.reindex(id)).document); }
      catch (e) { Alert.alert('Reindex thất bại', normalizeApiError(e).message); }
      finally { setBusy(false); }
    } },
  ]);
  const openFile = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const file = await documentService.downloadFile(id);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          dialogTitle: document?.title || document?.original_file_name,
        });
      } else {
        Alert.alert('Đã tải file', `File đã lưu tại: ${file.uri}`);
      }
    } catch (e) {
      Alert.alert('Không thể mở file', normalizeApiError(e).message);
    } finally {
      setOpening(false);
    }
  };

  const remove = () => Alert.alert('Xóa tài liệu', 'File cloud và vector sẽ bị xóa.', [
    { text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: async () => {
      setBusy(true);
      try { await documentService.delete(id); navigation.replace('Documents'); }
      catch (e) { Alert.alert('Xóa thất bại', normalizeApiError(e).message); setBusy(false); }
    } },
  ]);

  if (!document && !error) return <SafeAreaView style={styles.center}><ActivityIndicator /></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.center}><Text>{error}</Text><TouchableOpacity onPress={load}><Text style={styles.link}>Thử lại</Text></TouchableOpacity></SafeAreaView>;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity><Text style={styles.heading}>Chi tiết tài liệu</Text><View style={{ width: 24 }} /></View>
      <View style={styles.card}>
        <Text style={styles.title}>{document!.title || document!.original_file_name}</Text>
        <Text style={styles.row}>File: {document!.original_file_name}</Text>
        <Text style={styles.row}>Danh mục: {document!.category || 'Chưa phân loại'}</Text>
        <Text style={styles.row}>Tòa nhà: {document!.building_code}</Text>
        <Text style={styles.row}>Trạng thái: {document!.status}</Text>
        <Text style={styles.row}>Chunks: {document!.chunk_count}</Text>
        <Text style={styles.row}>Ngày tạo: {new Date(document!.created_at).toLocaleString()}</Text>
        {document!.error && <Text style={styles.error}>{document!.error}</Text>}
        {document!.status === 'INDEXED' || document!.status === 'STORED' || document!.status === 'PROCESSING' ? (
          <TouchableOpacity disabled={opening} onPress={openFile}>
            <Text style={styles.link}>{opening ? 'Đang tải file...' : 'Xem / Tải file'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {canManage && <View style={styles.actions}>
        <TouchableOpacity style={styles.primary} disabled={busy} onPress={reindex}><Text style={styles.buttonText}>Reindex</Text></TouchableOpacity>
        <TouchableOpacity style={styles.danger} disabled={busy} onPress={remove}><Text style={styles.buttonText}>Xóa</Text></TouchableOpacity>
      </View>}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' }, back: { fontSize: 32, color: '#1A4B84' },
  heading: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 18 }, card: { backgroundColor: '#fff', margin: 16, padding: 18, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 }, row: { color: '#475569', marginTop: 7 },
  error: { color: '#B91C1C', marginTop: 12 }, link: { color: '#1D4ED8', fontWeight: '600', marginTop: 14 },
  actions: { flexDirection: 'row', gap: 12, padding: 16 }, primary: { flex: 1, backgroundColor: '#1A4B84', padding: 14, borderRadius: 10 },
  danger: { flex: 1, backgroundColor: '#DC2626', padding: 14, borderRadius: 10 }, buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
