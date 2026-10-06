import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { translations } from './translations'; // Импортируем твой файл с переводами
import './App.css';

import LandingPage from './LandingPage';
import ComplaintForm from './ComplaintForm';
import AdminPanel from './AdminPanel';
import StatusChecker from './StatusChecker';
import Login from './Login';
import Faq from './Faq';

function App() {
  // 1. Состояние пользователя
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. Состояние языка (берем из памяти или ставим 'ru' по умолчанию)
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ru');
  
  // Переменная t — это "словарь" текущего языка
  const t = translations[lang];

  const location = useLocation();
  const navigate = useNavigate();

  // Функция смены языка
  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  // Плавный скролл к "О нас" (id="about-section")
  const scrollToAbout = () => {
    const executeScroll = () => {
      const element = document.getElementById('about-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(executeScroll, 500);
    } else {
      executeScroll();
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const showHeader = location.pathname !== '/admin';

  return (
    <div className="App">
      {showHeader && (
        <header className="main-header">
          {/* ЛОГОТИП */}
          <div className="logo-container" onClick={() => navigate('/')}>
            <span className="logo-dot">●</span> ZHYLU
          </div>

          {/* ЦЕНТРАЛЬНАЯ НАВИГАЦИЯ */}
          <nav className="nav-links">
            <span className="nav-item" onClick={() => navigate('/')}>
              {t.nav_home}
            </span>
            <span className="nav-item" onClick={scrollToAbout}>
              {t.nav_about}
            </span>
            <span className="nav-item" onClick={() => navigate('/status')}>
              {t.nav_status}
            </span>
            <span className="nav-item" onClick={() => navigate('/faq')}>
  {t.nav_faq}
</span>

            {/* ВЫБОР ЯЗЫКА (Dropdown) */}
            <div className="lang-switcher">
              <select className="lang-select" value={lang} onChange={handleLangChange}>
                <option value="ru">RU</option>
                <option value="kk">KZ</option>
                <option value="en">EN</option>
              </select>
            </div>
          </nav>

          {/* КНОПКА СПРАВА */}
          <button className="btn-primary-top" onClick={() => navigate('/submit')}>
            {t.btn_report}
          </button>
        </header>
      )}

      <main className="content">
        <Routes>
  {/* Передаем объект перевода 't' в каждый компонент */}
  <Route path="/" element={<LandingPage t={t} />} />
  <Route path="/submit" element={<ComplaintForm t={t} />} />
  <Route path="/status" element={<StatusChecker t={t} />} />
  <Route path="/login" element={<Login setUser={setUser} t={t} />} />
  <Route path="/faq" element={<Faq t={t} />} />

  <Route 
    path="/admin" 
    element={
      user && (user.role === 'admin' || user.role === 'psychologist')
      ? <AdminPanel t={t} lang={lang} setLang={setLang} /> // Передаем все нужные пропсы здесь
      : <Navigate to="/login" replace />
    } 
  />
  
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
      </main>
    </div>
  );
}

export default App;