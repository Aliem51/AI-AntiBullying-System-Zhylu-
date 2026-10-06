import React from 'react';
import { useNavigate } from 'react-router-dom';
import mainImage from './assets/mainmage.png'; 
import zhyluLogo from './assets/zhylu.png';
import iconImage from './assets/image.png'; 
import schoolboyImg from './assets/schoolboy.jpg'; 
import pexelsImg from './assets/pexels.jpg'; 
import professiyaImg from './assets/professiya.jpg';
import './App.css';

const LandingPage = ({ t }) => {
  const navigate = useNavigate();

  // Массив карточек (теперь данные берутся из объекта перевода t)
  const features = [
    { title: t.feature_1_title, desc: t.feature_1_desc, path: "/submit" },
    { title: t.feature_2_title, desc: t.feature_2_desc, path: "#" },
    { title: t.feature_3_title, desc: t.feature_3_desc, path: "#" },
    { title: t.feature_4_title, desc: t.feature_4_desc, path: "/status" } // Ссылка на проверку статуса
  ];

  // Массив преимуществ (исправлены названия переменных картинок)
  const benefits = [
    { title: t.benefit_1_title, text: t.benefit_1_text, img: schoolboyImg },
    { title: t.benefit_2_title, text: t.benefit_2_text, img: pexelsImg },
    { title: t.benefit_3_title, text: t.benefit_3_text, img: professiyaImg }
  ];

  return (
    <div className="landing-wrapper">
      <div className="container">
        
        {/* ГЕРОЙ-СЕКЦИЯ */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="text-accent">{t.hero_title_accent}</span> {t.hero_title_text}
            </h1>
            <p className="hero-subtitle">{t.hero_subtitle}</p>
            <button className="btn-primary btn-hero" onClick={() => navigate('/submit')}>
              {t.btn_start}
            </button>
          </div>
          <div className="hero-image-wrapper">
            <img src={mainImage} alt="Main" className="hero-img-main" />
          </div>
        </section>

        {/* СЕТКА КАРТОЧЕК */}
        <section className="features-grid">
          {features.map((item, index) => (
            <div key={index} className="feature-card">
              <div className="icon-box">
                <img src={iconImage} alt="icon" className="card-icon-img" />
              </div>
              <h3 className="feature-card-title">{item.title}</h3>
              <p className="feature-card-desc">{item.desc}</p>
            </div>
          ))}
        </section>
      </div>

      {/* О НАС (Добавлен id для скролла) */}
      <section id="about-section" className="about-section-alt">
        <div className="container about-flex">
            <div className="about-image-container">
                <img src={mainImage} alt="About" className="about-img" />
            </div>
            <div className="about-text-container">
                <h2 className="about-title">
                    {t.about_title} <img src={zhyluLogo} alt="Zhylu" className="zhylu-inline-logo" />
                </h2>
                <div className="about-description-block">
                  <p>{t.about_p1}</p>
                  <p>
                    <span className="mission-label">{t.mission_label}</span> 
                    {t.about_p2}
                  </p>
                </div>
            </div>
        </div>
      </section>

      {/* КОМУ БУДЕТ ПОЛЕЗНО */}
      <section className="benefits-section">
        <div className="container">
            <h2 className="benefits-main-title">
              {t.benefits_title} <span className="blue-text">{t.benefits_accent}</span>
            </h2>
            <div className="benefits-grid">
                {benefits.map((b, i) => (
                    <div key={i} className="benefit-info-card">
                        <img src={b.img} alt={b.title} className="benefit-photo" />
                        <div className="benefit-content">
                            <h4>{b.title}</h4>
                            <p>{b.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;