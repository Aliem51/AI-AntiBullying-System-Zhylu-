import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const AdminPanel = ({ t, lang, setLang }) => { // Добавили пропсы мультиязычности
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority'); 
  
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  // "Не назначено" теперь берется из перевода
  const staff = [t.not_assigned, "Ерланова.А.П (Психолог)", "Смирнов К.В. (Психолог)", "Ахметова Д.С. (Директор)"];

  const fetchComplaints = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/complaints');
      const data = await response.json();
      setComplaints(data);
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const filteredAndSorted = complaints
    .filter(c => {
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
      const matchesSearch = 
  c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  c.student_names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  String(c.id).toLowerCase().includes(searchTerm.toLowerCase()); // Приводим UUID к строке
      return matchesStatus && matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return (Number(b.ai_priority_score) || 0) - (Number(a.ai_priority_score) || 0);
      } else {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const categories = ['all', ...new Set(complaints.map(c => c.category).filter(Boolean))];

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchComplaints();
    } catch (error) { alert("Ошибка обновления статуса"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t.confirm_delete)) {
      try {
        const response = await fetch(`http://localhost:5000/api/complaints/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setComplaints(prev => prev.filter(item => item.id !== id));
          if (selectedItem?.id === id) setSelectedItem(null);
        }
      } catch (error) { alert("Ошибка при удалении"); }
    }
  };

  const updateAssignee = async (id, name) => {
    try {
      await fetch(`http://localhost:5000/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: name }) 
      });
      fetchComplaints();
    } catch (error) { console.error(error); }
  };

  const handleSaveReply = async (id) => {
    const textField = document.getElementById('adminReplyText');
    const text = textField ? textField.value : "";

    if (!text.trim()) {
      alert(t.alert_reply_empty);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: text }) 
      });

      if (response.ok) {
        setSelectedItem(null);
        await fetchComplaints(); 
      } else {
        alert("Ошибка сохранения");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Сервер не отвечает.");
    }
  };

  if (loading) return <div className="loading">{t.loading_admin}</div>;

  return (
    <div className="admin-page-bg">
      <div className="container admin-container">
        <header className="admin-header">
          <h1>{t.admin_title}</h1>
          
          <div className="admin-header-right">
             {/* Селектор языка как в хедере */}
            <div className="lang-switcher">
      <select 
        className="lang-select" 
        value={lang} 
        onChange={(e) => setLang(e.target.value)}
      >
        <option value="ru">RU</option>
        <option value="kk">KZ</option>
        <option value="en">EN</option>
      </select>
    </div>

            
            <button onClick={() => { localStorage.removeItem('user'); navigate('/login'); }} className="btn-logout">
                {t.admin_logout}
            </button>
          </div>
        </header>

        <div className="admin-dashboard-grid">
  {/* Карточка: Всего */}
  <div className="stat-card">
    <span className="stat-label">{t.dash_total}</span>
    <span className="stat-value">{complaints.length}</span>
  </div>

  {/* Карточка: Критические */}
  <div className="stat-card urgent">
    <span className="stat-label">{t.dash_urgent}</span>
    <span className="stat-value">
      {complaints.filter(c => Number(c.ai_priority_score) >= 90).length}
    </span>
  </div>

  {/* Карточка: Новые */}
  <div className="stat-card new">
    <span className="stat-label">{t.dash_new}</span>
    <span className="stat-value">
      {complaints.filter(c => c.status === 'new' || !c.status).length}
    </span>
  </div>
</div>

        <div className="filter-panel">
          <div className="filter-group">
            <input 
              type="text" 
              placeholder={t.admin_search_placeholder} 
              className="input-field search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>{t.label_status}</label>
            <select className="input-field" onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">{t.all_statuses}</option>
              <option value="new">{t.status_new}</option>
              <option value="in_progress">{t.status_in_progress}</option>
              <option value="resolved">{t.status_resolved}</option>
            </select>
          </div>
          <div className="filter-group">
            <label>{t.label_ai_cat}</label>
            <select className="input-field" onChange={(e) => setFilterCategory(e.target.value)}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? t.all_categories : cat}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>{t.label_sort}</label>
            <select className="input-field" onChange={(e) => setSortBy(e.target.value)}>
              <option value="priority">{t.sort_priority}</option>
              <option value="date">{t.sort_date}</option>
            </select>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.th_id}</th>
                <th>{t.th_date}</th>
                <th>{t.th_category}</th>
                <th>{t.th_desc}</th>
                <th>{t.th_priority}</th>
                <th>{t.th_responsible}</th>
                <th>{t.th_status}</th>
                <th>{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((item) => (
                <tr key={item.id} className={Number(item.ai_priority_score) >= 90 ? 'priority-urgent-row' : ''}>
                  <td className="id-cell">
                    <code className="full-id">{item.id}</code>
                  </td>
                  <td className="date-cell">
                    {new Date(item.created_at).toLocaleDateString()}<br/>
                    <small>{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                  </td>
                  <td>
                    <div className="item-type-tag">{item.type}</div>
                    <div className="ai-category-tag">{item.category}</div>
                  </td>
                  <td className="desc-cell">
                    <div className="item-desc-short">{item.description?.substring(0, 45)}...</div>
                  </td>
                  <td>
                    <div className={`priority-badge p-${Math.floor(Number(item.ai_priority_score)/20)}`}>
                      {item.ai_priority_score}%
                    </div>
                  </td>
                  <td>
                    <select 
                      className="status-select select-minimal" 
                      value={item.assigned_to || t.not_assigned}
                      onChange={(e) => updateAssignee(item.id, e.target.value)}
                    >
                      {staff.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select
                      className={`status-select ${item.status || 'new'}`}
                      value={item.status || 'new'}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                    >
                      <option value="new">{t.status_new}</option>
                      <option value="in_progress">{t.status_in_progress}</option>
                      <option value="resolved">{t.status_resolved}</option>
                    </select>
                  </td>
                  <td className="actions-cell">
                    <div className="btn-group-row">
                      <button className="btn-details-new" onClick={() => setSelectedItem(item)}>{t.btn_details}</button>
                      <button className="btn-delete-new" onClick={() => handleDelete(item.id)}>{t.btn_delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="modal-overlay">
    <div className="modal-content admin-modal">
      <div className="modal-header">
        <div className="header-left">
          <h2>{t.modal_report_title} <span className="id-highlight">{selectedItem.id}</span></h2>
          <span className={`priority-tag-large p-${Math.floor(Number(selectedItem.ai_priority_score)/20)}`}>
            {t.modal_ai_priority} {selectedItem.ai_priority_score}%
          </span>
        </div>
      </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="info-section card">
                  <h4>{t.modal_info_title}</h4>
                  <div className="info-row"><strong>{t.label_type}</strong> {selectedItem.type}</div>
                  <div className="info-row"><strong>{t.label_ai_cat}</strong> <span className="ai-highlight">{selectedItem.category}</span></div>
                  <div className="info-row"><strong>{t.label_location}</strong> {selectedItem.location_ru || t.not_specified}</div>
                  <div className="info-row"><strong>{t.label_time}</strong> {selectedItem.time || t.not_specified}</div>
                </div>

                <div className="info-section card">
                  <h4>{t.modal_participants_title}</h4>
                  <div className="info-row"><strong>{t.label_name}</strong> {selectedItem.person_reporting || t.anonymous}</div>
                  <div className="info-row"><strong>{t.label_students}</strong> {selectedItem.student_names || t.not_specified}</div>
                  <div className="info-row"><strong>{t.label_phone}</strong> {selectedItem.phone || '—'}</div>
                  <div className="info-row"><strong>Email:</strong> {selectedItem.email || '—'}</div>
                </div>
              </div>

              <div className="info-block full-width">
                <h4>{t.modal_desc_title}</h4>
                <div className="description-text-full">{selectedItem.description}</div>
              </div>

              {selectedItem.file_path && (
                <div className="info-block full-width">
                  <h4>{t.modal_files_title}</h4>
                  <div className="file-preview-container">
                    <a href={`http://localhost:5000${selectedItem.file_path}`} target="_blank" rel="noopener noreferrer">
                      {selectedItem.file_path.toLowerCase().endsWith('.pdf') ? (
                        <div className="pdf-viewer-link">📄 {t.pdf_view}</div>
                      ) : (
                        <img className="evidence-img" src={`http://localhost:5000${selectedItem.file_path}`} alt="Evidence" />
                      )}
                    </a>
                  </div>
                </div>
              )}

              <div className="reply-section">
                <h4>{t.modal_reply_title}</h4>
                <textarea
                  className="input-field admin-textarea"
                  id="adminReplyText"
                  rows="4"
                  placeholder={t.placeholder_reply}
                  defaultValue={selectedItem.admin_reply}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-save-close" onClick={() => handleSaveReply(selectedItem.id)}>
                {t.btn_save_close}
              </button>
              <button className="btn-cancel" onClick={() => setSelectedItem(null)}>{t.btn_cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;