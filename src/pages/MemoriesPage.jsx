import React, { useState, useEffect, useRef } from 'react';
import { useTracker } from '../context/TrackerContext';
import { uploadMemoryFile, getUserMemories, deleteUserMemory } from '../api/memoriesApi';
import { optimizeImageForFastUpload } from '../utils/imageOptimizer';
import FloatingChatButton from '../components/FloatingChatButton';
import EmergencyContactModal from '../components/EmergencyContactModal';
import './MemoriesPage.css';

const MemoriesPage = () => {
  const { user, openAuthModal } = useTracker();

  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload modal & form state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [memoryTopic, setMemoryTopic] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // In-page File Viewer Modal
  const [viewingMemory, setViewingMemory] = useState(null);

  const fileInputRef = useRef(null);
  const optimizedFileRef = useRef(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setViewingMemory(null);
        setIsUploadModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch memories when user changes or page loads
  useEffect(() => {
    if (!user || !user.id) {
      setMemories([]);
      return;
    }

    const fetchMemories = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getUserMemories(user.id);
        setMemories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load memories:', err);
        setError('Could not load your saved memories. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [user?.id]);

  // Clean up object URL previews
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.url) {
        URL.revokeObjectURL(filePreview.url);
      }
    };
  }, [filePreview]);

  const handleFileSelect = (file) => {
    if (!file) return;

    if (file.size === undefined || file.size === null || file.size === 0) {
      setError('The selected file appears to be empty (0 bytes). If this is a screen recording, please make sure the recording is saved completely before selecting.');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File exceeds the 100MB limit. Please select a video, image, or PDF up to 100MB.');
      return;
    }

    setSelectedFile(file);
    setError('');

    const isVideo = (file.type && file.type.startsWith('video/')) || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
    const isImage = (file.type && file.type.startsWith('image/')) || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

    if (isImage) {
      const url = URL.createObjectURL(file);
      setFilePreview({ url, type: 'image' });
      // Pre-optimize image in background while user fills in title
      optimizedFileRef.current = null;
      optimizeImageForFastUpload(file).then((compressed) => {
        optimizedFileRef.current = compressed;
      }).catch(() => {
        optimizedFileRef.current = file;
      });
    } else if (isVideo) {
      const url = URL.createObjectURL(file);
      setFilePreview({ url, type: 'video' });
      optimizedFileRef.current = file;
    } else {
      setFilePreview(null);
      optimizedFileRef.current = file;
    }

    // Pre-populate topic if empty
    if (!memoryTopic) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setMemoryTopic(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      openAuthModal('/memories');
      return;
    }

    if (!selectedFile) {
      setError('Please select a photo, scan, video, or document to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Use pre-optimized image if ready, or optimize now on demand
      let fileToSend = optimizedFileRef.current;
      if (!fileToSend) {
        fileToSend = await optimizeImageForFastUpload(selectedFile);
      }

      const savedMemory = await uploadMemoryFile(fileToSend, user.id, memoryTopic);
      setMemories((prev) => [savedMemory, ...prev]);
      setSuccess('🎉 Memory successfully saved!');

      // Snappy close transition (350ms instead of 1400ms delay)
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setFilePreview(null);
        setMemoryTopic('');
        setSuccess('');
        optimizedFileRef.current = null;
      }, 350);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload memory. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    if (!user || !user.id) return;
    setDeletingId(memoryId);
    setError('');

    try {
      await deleteUserMemory(memoryId, user.id);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete memory: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter memories
  const filteredMemories = memories.filter((item) => {
    if (activeFilter === 'all') return true;
    const type = (item.fileType || '').toLowerCase();
    const name = (item.fileName || '').toLowerCase();
    const isVideo = type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(name);
    const isImg = type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
    const isDoc = type.includes('pdf') || type.includes('document') || type.includes('text') || name.endsWith('.pdf');

    if (activeFilter === 'photos') return isImg;
    if (activeFilter === 'videos') return isVideo;
    if (activeFilter === 'documents') return isDoc;
    return true;
  });

  const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return 'Unknown size';
    if (Number(bytes) === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Group memories separated by upload date (Today, Yesterday, Date)
  const getDateGroups = (items) => {
    const groupsMap = new Map();
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayMidnight = todayMidnight - (24 * 60 * 60 * 1000);

    items.forEach((item) => {
      let key = 'earlier';
      let label = 'Earlier';
      let sortTimestamp = 0;

      if (item.uploadedAt) {
        const d = new Date(item.uploadedAt);
        if (!isNaN(d.getTime())) {
          const itemMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          sortTimestamp = itemMidnight;

          const formattedDate = d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          if (itemMidnight === todayMidnight) {
            key = 'today_' + itemMidnight;
            label = `Today, ${formattedDate}`;
          } else if (itemMidnight === yesterdayMidnight) {
            key = 'yesterday_' + itemMidnight;
            label = `Yesterday, ${formattedDate}`;
          } else {
            key = 'date_' + itemMidnight;
            label = formattedDate;
          }
        }
      }

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label,
          sortTimestamp,
          items: []
        });
      }
      groupsMap.get(key).items.push(item);
    });

    return Array.from(groupsMap.values()).sort((a, b) => b.sortTimestamp - a.sortTimestamp);
  };

  const dateGroups = getDateGroups(filteredMemories);

  return (
    <main className="memories-page-container">
      <div className="memories-content-wrap">
        {/* Header Hero Banner */}
        <section className="memories-hero-card">
          <div className="hero-left-details">
            <h1 className="hero-main-title">Pregnancy Memories Gallery</h1>
          </div>

          <div className="hero-right-action">
            <button
              id="open-upload-memory-btn"
              className="upload-memory-hero-btn"
              onClick={() => {
                if (!user) {
                  openAuthModal('/memories');
                } else {
                  setIsUploadModalOpen(true);
                  setError('');
                  setSuccess('');
                }
              }}
            >
              <span className="btn-sparkle">✨</span> + Add New Memory
            </button>
          </div>
        </section>

        {/* Guest Warning if not logged in */}
        {!user && (
          <div className="memories-guest-card">
            <span className="guest-icon">🔐</span>
            <div className="guest-text">
              <strong>Login Required to Access Memories</strong>
              <p>Sign in or create an account to view and upload your pregnancy memories safely to the cloud.</p>
            </div>
            <button className="guest-login-btn" onClick={() => openAuthModal('/memories')}>
              Login / Sign Up
            </button>
          </div>
        )}

        {/* Global Notifications */}
        {error && <div className="memories-alert error">{error}</div>}
        {success && <div className="memories-alert success">{success}</div>}

        {/* Filter Navigation Tabs */}
        {user && (
          <div className="memories-toolbar">
            <div className="memories-filter-tabs">
              <button
                className={`filter-pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All Keepsakes ({memories.length})
              </button>
              <button
                className={`filter-pill-btn ${activeFilter === 'photos' ? 'active' : ''}`}
                onClick={() => setActiveFilter('photos')}
              >
                📸 Photos & Ultrasounds
              </button>
              <button
                className={`filter-pill-btn ${activeFilter === 'videos' ? 'active' : ''}`}
                onClick={() => setActiveFilter('videos')}
              >
                🎬 Videos & Audio
              </button>
              <button
                className={`filter-pill-btn ${activeFilter === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveFilter('documents')}
              >
                📄 Reports & PDFs
              </button>
            </div>

            <span className="memories-count-indicator">
              Showing {filteredMemories.length} of {memories.length} files
            </span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="memories-loading-box">
            <div className="memories-spinner" />
            <p>Loading your saved pregnancy memories from cloud storage...</p>
          </div>
        )}

        {/* Memories Gallery Grid Separated by Date */}
        {user && !loading && (
          dateGroups.length > 0 ? (
            <div className="memories-date-sections">
              {dateGroups.map((group) => (
                <section key={group.key} className="memory-date-group">
                  {/* Date Group Header */}
                  <div className="memory-date-header">
                    <div className="date-badge-wrap">
                      <span className="date-cal-icon">📅</span>
                      <h2 className="date-group-heading">{group.label}</h2>
                      <span className="date-files-count">
                        {group.items.length} {group.items.length === 1 ? 'file' : 'files'}
                      </span>
                    </div>
                    <div className="date-group-line" />
                  </div>

                  {/* Files uploaded under this date */}
                  <div className="memories-cards-grid">
                    {group.items.map((item) => {
                      const fileNameLower = (item.fileName || '').toLowerCase();
                      const typeLower = (item.fileType || '').toLowerCase();
                      const isImg = typeLower.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileNameLower);
                      const isVideo = typeLower.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(fileNameLower);
                      const isPdf = typeLower.includes('pdf') || fileNameLower.endsWith('.pdf');

                      return (
                        <div key={item.id} className="memory-card">
                          {/* Media Preview Box */}
                          <div
                            className="memory-media-wrap clickable-media"
                            onClick={() => setViewingMemory(item)}
                            title="Click to view file"
                          >
                            {isImg ? (
                              <img
                                src={item.fileUrl}
                                alt={item.topic || item.fileName}
                                className="memory-thumbnail-img"
                                loading="lazy"
                              />
                            ) : isVideo ? (
                              <video
                                src={item.fileUrl}
                                className="memory-thumbnail-video"
                                controls
                                preload="metadata"
                              />
                            ) : isPdf ? (
                              <div className="memory-doc-preview">
                                <img
                                  src={item.fileUrl.replace(/\.pdf$/i, '.jpg')}
                                  alt={item.topic || item.fileName}
                                  className="memory-thumbnail-img memory-pdf-thumbnail"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <span className="doc-icon">📄</span>
                                <span className="doc-type-tag">PDF Document</span>
                              </div>
                            ) : (
                              <div className="memory-doc-preview">
                                <span className="doc-icon">📁</span>
                                <span className="doc-type-tag">Attached File</span>
                              </div>
                            )}
                          </div>

                          {/* Card Content Details */}
                          <div className="memory-card-body">
                            <h3 className="memory-topic-title" title={item.topic || item.fileName}>
                              {item.topic || item.fileName}
                            </h3>

                            <div className="memory-metadata-row">
                              <span className="memory-filename" title={item.fileName}>
                                📎 {item.fileName}
                              </span>
                            </div>

                            <div className="memory-footer-info">
                              <span className="memory-date">📅 {formatDate(item.uploadedAt)}</span>
                              <span className="memory-size">{formatFileSize(item.fileSize)}</span>
                            </div>

                            {/* Card Action Buttons */}
                            <div className="memory-card-actions">
                              <button
                                type="button"
                                className="memory-action-btn view-btn"
                                onClick={() => setViewingMemory(item)}
                                title="View on this page"
                              >
                                👁️ View
                              </button>

                              {deleteConfirmId === item.id ? (
                                <div className="delete-confirm-group">
                                  <span className="confirm-prompt">Confirm?</span>
                                  <button
                                    type="button"
                                    className="memory-action-btn confirm-del-btn"
                                    onClick={() => handleDeleteMemory(item.id)}
                                    disabled={deletingId === item.id}
                                  >
                                    {deletingId === item.id ? 'Deleting...' : 'Yes, Delete'}
                                  </button>
                                  <button
                                    type="button"
                                    className="memory-action-btn cancel-del-btn"
                                    onClick={() => setDeleteConfirmId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="memory-action-btn delete-btn"
                                  onClick={() => setDeleteConfirmId(item.id)}
                                  title="Delete this memory"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="memories-empty-card">
              <div className="empty-bubble-icon">📸</div>
              <h3 className="empty-title">No Pregnancy Memories Yet</h3>
              <p className="empty-desc">
                Capture the journey! Upload your ultrasound scans, baby bump photos, doctor notes, or baby kick recordings.
                They are securely stored and tracked in your memories gallery.
              </p>
              <button
                className="empty-upload-cta"
                onClick={() => setIsUploadModalOpen(true)}
              >
                + Upload Your First Memory ✨
              </button>
            </div>
          )
        )}
      </div>

      {/* Upload Memory Modal Dialog */}
      {isUploadModalOpen && (
        <div className="memory-modal-overlay" role="dialog" aria-modal="true">
          <div className="memory-modal-card">
            <div className="modal-header-box">
              <div className="modal-title-wrap">
                <span className="modal-header-icon">📸</span>
                <div>
                  <h2 className="modal-heading">Upload Pregnancy Memory</h2>
                  <p className="modal-sub">Stored safely in your pregnancy memories gallery</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                  setFilePreview(null);
                  setError('');
                }}
              >
                ✕
              </button>
            </div>

            {error && <div className="memories-alert error">{error}</div>}
            {success && <div className="memories-alert success">{success}</div>}

            <form onSubmit={handleUploadSubmit} className="memory-upload-form">
              {/* File Dropzone */}
              <div
                className={`file-dropzone ${selectedFile ? 'has-file' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden-file-input"
                  accept="image/*,video/*,application/pdf,.mp4,.mov,.webm,.avi,.mkv,.pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {filePreview && filePreview.type === 'image' ? (
                  <div className="dropzone-preview-box">
                    <img src={filePreview.url} alt="Preview" className="preview-img" />
                    <span className="change-photo-text">Click or drag to change image</span>
                  </div>
                ) : filePreview && filePreview.type === 'video' ? (
                  <div className="dropzone-preview-box video-preview-box">
                    <video src={filePreview.url} controls className="preview-video-player" />
                    <span className="change-photo-text">Click to choose a different video</span>
                  </div>
                ) : selectedFile ? (
                  <div className="dropzone-file-selected">
                    <span className="file-ready-icon">
                      {selectedFile.type?.includes('pdf') || selectedFile.name?.toLowerCase().endsWith('.pdf') ? '📄' :
                       selectedFile.type?.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(selectedFile.name) ? '🎬' : '📁'}
                    </span>
                    <strong>{selectedFile.name}</strong>
                    <span className="file-size-tag">{formatFileSize(selectedFile.size)}</span>
                    <span className="change-photo-text">Click to choose a different file</span>
                  </div>
                ) : (
                  <div className="dropzone-prompt">
                    <span className="dropzone-cloud-icon">☁️</span>
                    <strong className="dropzone-text-title">Drag & Drop or Click to Browse</strong>
                    <p className="dropzone-text-sub">Supports Ultrasound Scans, Photos, Videos & PDFs (up to 100MB)</p>
                    <span className="dropzone-browse-pill">Browse Files</span>
                  </div>
                )}
              </div>

              {/* Memory Title / Topic input */}
              <div className="form-field-group">
                <label htmlFor="memory-topic-input">
                  Memory Title / Milestone Name <span className="req-star">*</span>
                </label>
                <input
                  id="memory-topic-input"
                  type="text"
                  value={memoryTopic}
                  onChange={(e) => setMemoryTopic(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel-modal"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-submit-upload"
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <span className="btn-spinner" /> Uploading...
                    </>
                  ) : (
                    'Save to Memories 💖'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* In-Page File Viewer Modal with "X" Close Button */}
      {viewingMemory && (
        <div
          className="memory-viewer-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewingMemory(null)}
        >
          <div
            className="memory-viewer-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="viewer-header">
              <div className="viewer-title-group">
                <h3 className="viewer-title">
                  {viewingMemory.topic || viewingMemory.fileName}
                </h3>
                <span className="viewer-subtitle">
                  📎 {viewingMemory.fileName} • {formatFileSize(viewingMemory.fileSize)} • {formatDate(viewingMemory.uploadedAt)}
                </span>
              </div>
              <button
                type="button"
                className="viewer-close-btn"
                onClick={() => setViewingMemory(null)}
                title="Close (Esc)"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="viewer-body">
              {((viewingMemory.fileType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(viewingMemory.fileName || '')) ? (
                <img
                  src={viewingMemory.fileUrl}
                  alt={viewingMemory.topic || viewingMemory.fileName}
                  className="viewer-full-image"
                />
              ) : ((viewingMemory.fileType || '').startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(viewingMemory.fileName || '')) ? (
                <video
                  src={viewingMemory.fileUrl}
                  controls
                  autoPlay
                  className="viewer-full-video"
                />
              ) : ((viewingMemory.fileType || '').includes('pdf') || (viewingMemory.fileName || '').toLowerCase().endsWith('.pdf')) ? (
                <div className="viewer-pdf-container">
                  <iframe
                    src={viewingMemory.fileUrl}
                    title={viewingMemory.topic || viewingMemory.fileName}
                    className="viewer-pdf-frame"
                  />
                  <div className="pdf-viewer-bar">
                    <span>Opening PDF Preview</span>
                    <a
                      href={viewingMemory.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="viewer-external-link"
                    >
                      Open in New Window ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="viewer-generic-preview">
                  <span className="generic-icon">📁</span>
                  <h4>{viewingMemory.fileName}</h4>
                  <a
                    href={viewingMemory.fileUrl}
                    download={viewingMemory.fileName}
                    className="viewer-external-link"
                  >
                    Download File 📥
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FloatingChatButton />
      <EmergencyContactModal />
    </main>
  );
};

export default MemoriesPage;
