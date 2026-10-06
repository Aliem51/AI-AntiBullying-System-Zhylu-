import React, { useState } from 'react';
import './App.css';

const StatusChecker = ({ t }) => { // Принимаем переводы t
  const [ticketId, setTicketId] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    const cleanId = ticketId.trim();
    if (!cleanId) return alert(t.alert_empty);

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/complaints/${cleanId}`);
      if (response.ok) {
        const data = await response.json();
        setInfo(data);
      } else {
        alert(t.alert_not_found);
      }
    } catch (error) {
      alert(t.alert_error);
    } finally {
      setLoading(false);
    }
  };

  // Функция перевода статусов
  const getStatusText = (status) => {
    switch (status) {
      case 'new': return t.status_new;
      case 'in_progress': return t.status_progress;
      case 'resolved': return t.status_resolved;
      default: return t.status_default;
    }
  };

  return (
    <div className="status-page-wrapper">
      <div className="status-checker-card">
        <h3>{t.status_title}</h3>
        <div className="status-checker-input-group">
          <input 
            className="input-field"
            placeholder={t.status_placeholder} 
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
          />
          <button onClick={checkStatus} disabled={loading} className="btn-primary">
            {loading ? '...' : t.btn_find}
          </button>
        </div>

        {info && (
          <div className="status-info-box">
            <div className="info-row">
              <strong>{t.status_label}</strong> 
              <span className={`status-badge ${info.status}`}>
                {getStatusText(info.status)}
              </span>
            </div>
            
            <div className="info-row" style={{ marginTop: '15px' }}>
              <strong>{t.assigned_label}</strong>
              <div className="assigned-person-text" style={{ color: '#007bff', fontWeight: 'bold', marginTop: '5px' }}>
                👤 {(!info.assigned_to || info.assigned_to === "Не назначено") 
                    ? t.not_assigned 
                    : info.assigned_to}
              </div>
            </div>

            <div className="info-row" style={{ marginTop: '15px' }}>
              <strong>{t.reply_label}</strong>
              <div className="admin-reply-text" style={{ background: '#f9f9f9', padding: '10px', borderRadius: '5px', marginTop: '5px' }}>
                {info.admin_reply || t.no_reply}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusChecker;