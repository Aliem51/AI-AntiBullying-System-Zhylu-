import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Login = ({ t }) => { // Принимаем переводы t
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Сохраняем пользователя в браузере
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/admin');
        window.location.reload(); // Чтобы App.jsx увидел изменения
      } else {
        alert(t.alert_denied); // Переведенное сообщение
      }
    } catch (error) {
      alert(t.alert_server_error); // Переведенное сообщение
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-page-wrapper">
      <div className="status-checker-card">
        <h2 className="form-header">{t.login_title}</h2>
        <form onSubmit={handleLogin} className="complaint-form-layout">
          <input 
            type="email" 
            className="input-field" 
            placeholder={t.login_email}
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            className="input-field" 
            placeholder={t.login_pass}
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t.login_loading : t.btn_login}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;