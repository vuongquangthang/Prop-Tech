import React, { useState } from 'react';
import {
  Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { documentService } from '../services/document.service';
import { SelectedDocumentFile } from '../types/document';
import { normalizeApiError } from '../types/api';

const MAX_SIZE = 10 * 1024 * 1024;
const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];

export default function DocumentUploadScreen() {
  const navigation = useNavigation<any>();
  const [files, setFiles] = useState<SelectedDocumentFile[]>([]);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true, copyToCacheDirectory: true,
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'],
    });
    if (result.canceled) return;
    const selected = result.assets.map(asset => ({
      uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size,
    }));
    if (files.length + selected.length > 5) return Alert.alert('Tối đa 5 file');
    const invalid = selected.find(file => (file.size || 0) > MAX_SIZE || (file.mimeType && !allowed.includes(file.mimeType)));
    if (invalid) return Alert.alert('File không hợp lệ', `${invalid.name} sai định dạng hoặc vượt quá 10 MB.`);
    setFiles(current => [...current, ...selected]);
  };

  const upload = async () => {
    if (!files.length || uploading) return;
    setUploading(true); setProgress(0);
    try {
      const response = await documentService.upload(files, category, title, setProgress);
      if (!response.success) Alert.alert('Một số file xử lý thất bại', 'Xem trạng thái trong danh sách tài liệu.');
      navigation.replace('DocumentList');
    } catch (e) {
      Alert.alert('Upload thất bại', normalizeApiError(e).message);
    } finally { setUploading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity><Text style={styles.heading}>Thêm tài liệu</Text><View style={{ width: 24 }} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput style={styles.input} placeholder="Tiêu đề (tùy chọn)" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Danh mục (tùy chọn)" value={category} onChangeText={setCategory} />
        <TouchableOpacity style={styles.pick} onPress={pick}><Text style={styles.pickText}>Chọn PDF, DOCX, TXT hoặc MD</Text></TouchableOpacity>
        {files.map((file, index) => (
          <View key={`${file.uri}-${index}`} style={styles.file}>
            <View style={{ flex: 1 }}><Text style={styles.fileName}>{file.name}</Text><Text style={styles.fileMeta}>{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Không rõ dung lượng'}</Text></View>
            <TouchableOpacity onPress={() => setFiles(current => current.filter((_, i) => i !== index))}><Text style={styles.remove}>Xóa</Text></TouchableOpacity>
          </View>
        ))}
        {uploading && <Text style={styles.progress}>Đang upload: {progress}%</Text>}
        <TouchableOpacity style={[styles.upload, (!files.length || uploading) && styles.disabled]} disabled={!files.length || uploading} onPress={upload}>
          <Text style={styles.uploadText}>{uploading ? 'Đang xử lý...' : `Upload ${files.length} file`}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  back: { fontSize: 32, color: '#1A4B84' }, heading: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 13, marginBottom: 12 },
  pick: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#1A4B84', padding: 22, borderRadius: 12, alignItems: 'center' },
  pickText: { color: '#1A4B84', fontWeight: '600' }, file: { flexDirection: 'row', backgroundColor: '#fff', padding: 13, borderRadius: 10, marginTop: 10 },
  fileName: { fontWeight: '600' }, fileMeta: { color: '#64748B', fontSize: 12, marginTop: 3 }, remove: { color: '#DC2626' },
  progress: { marginTop: 16, textAlign: 'center' }, upload: { backgroundColor: '#1A4B84', padding: 15, borderRadius: 12, marginTop: 20 },
  uploadText: { color: '#fff', textAlign: 'center', fontWeight: '700' }, disabled: { opacity: 0.45 },
});
