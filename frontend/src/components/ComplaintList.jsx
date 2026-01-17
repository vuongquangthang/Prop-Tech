import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ComplaintList({ userRole }) {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getMyComplaints();
      setComplaints(data || []);
    } catch (err) {
      setError('Không thể tải danh sách khiếu nại');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (complaintId) => {
    try {
      const detail = await api.getComplaintById(complaintId);
      setSelectedComplaint(detail);
    } catch (err) {
      setError('Không thể tải chi tiết khiếu nại');
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="complaint-container">
      <div className="complaint-header">
        <h2>Danh Sách Khiếu Nại</h2>
        {userRole === 'RESIDENT' && (
          <button 
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            + Tạo Khiếu Nại
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <ComplaintForm 
          onSubmit={() => {
            loadComplaints();
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {selectedComplaint ? (
        <ComplaintDetail 
          complaint={selectedComplaint} 
          onClose={() => setSelectedComplaint(null)}
          onUpdate={() => {
            loadComplaints();
            setSelectedComplaint(null);
          }}
        />
      ) : (
        <div className="complaint-list">
          {complaints.length === 0 ? (
            <p>Không có khiếu nại nào</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Phòng</th>
                  <th>Tiêu Đề</th>
                  <th>Ngày Tạo</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>#{complaint.id}</td>
                    <td>{complaint.roomId}</td>
                    <td>{complaint.title}</td>
                    <td>{new Date(complaint.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className={`status ${complaint.status.toLowerCase()}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewDetail(complaint.id)}
                        className="btn-small"
                      >
                        Xem Chi Tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function ComplaintForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomId: '',
    category: 'OTHER'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createComplaint(formData);
      onSubmit();
    } catch (err) {
      setError('Không thể tạo khiếu nại');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Tạo Khiếu Nại Mới</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="roomId">Phòng:</label>
          <input
            id="roomId"
            type="number"
            name="roomId"
            value={formData.roomId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="category">Danh Mục:</label>
          <select 
            id="category"
            name="category" 
            value={formData.category}
            onChange={handleChange}
          >
            <option value="MAINTENANCE">Bảo Trì</option>
            <option value="CLEANLINESS">Vệ Sinh</option>
            <option value="NOISE">Tiếng Ồn</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="title">Tiêu Đề:</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Mô Tả:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Đang Tạo...' : 'Tạo Khiếu Nại'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

function ComplaintDetail({ complaint, onClose, onUpdate }) {
  const [attachments, setAttachments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File không được lớn hơn 10MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Chỉ hỗ trợ JPG, PNG, GIF, WebP');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      await api.uploadComplaintAttachment(complaint.id, file);
      setFile(null);
      // Reload attachments
      const detail = await api.getComplaintById(complaint.id);
      setAttachments(detail.attachments || []);
    } catch (err) {
      setError('Không thể tải lên tệp');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="complaint-detail">
      <button onClick={onClose} className="btn-back">← Quay Lại</button>
      
      <div className="detail-header">
        <h3>{complaint.title}</h3>
        <span className={`status ${complaint.status.toLowerCase()}`}>
          {complaint.status}
        </span>
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <label>Mã Khiếu Nại:</label>
          <span>#{complaint.id}</span>
        </div>
        <div className="detail-item">
          <label>Phòng:</label>
          <span>{complaint.roomId}</span>
        </div>
        <div className="detail-item">
          <label>Danh Mục:</label>
          <span>{complaint.category}</span>
        </div>
        <div className="detail-item">
          <label>Ngày Tạo:</label>
          <span>{new Date(complaint.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className="detail-description">
        <h4>Mô Tả:</h4>
        <p>{complaint.description}</p>
      </div>

      <div className="attachments-section">
        <h4>Tệp Đính Kèm</h4>
        {error && <div className="error-message">{error}</div>}
        
        <div className="file-upload">
          <input 
            type="file" 
            id="attachment-file"
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
          />
          {file && (
            <div className="file-preview">
              <span>{file.name}</span>
              <button 
                onClick={handleUpload}
                className="btn-primary"
                disabled={uploading}
              >
                {uploading ? 'Đang Tải...' : 'Tải Lên'}
              </button>
            </div>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="attachment-list">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="attachment-item">
                <a href={attachment.filePath} target="_blank" rel="noopener noreferrer">
                  {attachment.fileName}
                </a>
                <span className="file-size">
                  ({(attachment.fileSize / 1024).toFixed(2)} KB)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {complaint.status === 'OPEN' && (
        <div className="detail-actions">
          <button className="btn-primary">Phản Hồi</button>
        </div>
      )}
    </div>
  );
}
