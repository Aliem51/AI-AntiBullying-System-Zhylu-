import React, { useState } from 'react';
import './App.css';

const Faq = ({ t }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Формируем массивы вопросов, беря данные из переводов 't'
  const studentFaqs = [
    { q: t.faq_s_q1, a: t.faq_s_a1 },
    { q: t.faq_s_q2, a: t.faq_s_a2 },
    { q: t.faq_s_q3, a: t.faq_s_a3 },
    { q: t.faq_s_q4, a: t.faq_s_a4 },
    { q: t.faq_s_q5, a: t.faq_s_a5 },
  ];

  const psychFaqs = [
    { q: t.faq_p_q1, a: t.faq_p_a1 },
    { q: t.faq_p_q2, a: t.faq_p_a2 },
    { q: t.faq_p_q3, a: t.faq_p_a3 },
    { q: t.faq_p_q4, a: t.faq_p_a4 },
  ];

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem', color: '#1E293B' }}>
        {t.faq_title}
      </h2>

      {/* БЛОК 1: Студенты */}
      <h3 style={{ color: '#2563EB', marginBottom: '20px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>
        {t.faq_section_students}
      </h3>
      <div className="faq-list">
        {studentFaqs.map((faq, index) => (
          <div key={`s-${index}`} className={`faq-item ${openIndex === `s-${index}` ? 'open' : ''}`} onClick={() => toggleFaq(`s-${index}`)}>
            <div className="faq-question">
              <strong>{faq.q}</strong>
              <span className="faq-icon">{openIndex === `s-${index}` ? '−' : '+'}</span>
            </div>
            {openIndex === `s-${index}` && <div className="faq-answer"><p>{faq.a}</p></div>}
          </div>
        ))}
      </div>

      {/* БЛОК 2: Психологи */}
      <h3 style={{ color: '#2563EB', marginBottom: '20px', marginTop: '50px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>
        {t.faq_section_psychologists}
      </h3>
      <div className="faq-list">
        {psychFaqs.map((faq, index) => (
          <div key={`p-${index}`} className={`faq-item ${openIndex === `p-${index}` ? 'open' : ''}`} onClick={() => toggleFaq(`p-${index}`)}>
            <div className="faq-question">
              <strong>{faq.q}</strong>
              <span className="faq-icon">{openIndex === `p-${index}` ? '−' : '+'}</span>
            </div>
            {openIndex === `p-${index}` && <div className="faq-answer"><p>{faq.a}</p></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faq;