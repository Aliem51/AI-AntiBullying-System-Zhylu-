import React, { useState } from 'react';
import './App.css';
// 1. Импортируем библиотеку Google AI
import { GoogleGenerativeAI } from "@google/generative-ai";

const ComplaintForm = ({ t }) => {
  // ... (стейты и функция compressImage без изменений) ...
  const [formData, setFormData] = useState({
    type: 'Буллинг',
    locationRu: '',
    locationEn: '',
    personReporting: '',
    time: '',
    phone: '',
    email: '',
    studentNames: '',
    description: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  const compressImage = async (file) => {
  // Если это PDF, сжимать не нужно, возвращаем как есть
  if (file.type === 'application/pdf') return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Устанавливаем размер (например, макс 800px)
        const maxWidth = 800;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          // Важно: создаем новый файл из блоба, чтобы у него было имя
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.7); // 0.7 - качество
      };
    };
  });
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file && file.size > 5 * 1024 * 1024) {
      alert(t.alert_file_size);
      return;
    }

    setLoading(true);

    try {
      // 2. Инициализация Gemini
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("API ключ Gemini не найден в переменных окружения (.env)");
}

const genAI = new GoogleGenerativeAI(apiKey.trim());
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const currentLangName = t.cat_critical.includes("КРИТИЧЕСКИЙ") ? "Russian" : 
                             t.cat_critical.includes("CRITICAL") ? "English" : "Kazakh";

      // 3. Формирование промпта
      const prompt = `
        Ты — судебный эксперт и психолог. Проанализируй жалобу на предмет риска жизни и здоровья.
        ВАЖНО: Напиши название категории только на языке: ${currentLangName}.
        
        КРИТЕРИИ ПРИОРИТЕТА (0-100):
        - 100: Угроза жизни, суицидальные мысли, "прощайте", "не хочу жить".
        - 90: Физическое насилие, драка, нанесение телесных повреждений.
        - 70: Системный буллинг, вымогательство денег, угрозы.
        - 30: Мелкие ссоры, недопонимания, бытовые конфликты.

        Верни ответ строго в формате JSON:
        {"category": "название категории на ${currentLangName}", "priority": число}
        
        Текст жалобы: "${formData.description}"
      `;

      // 4. Запрос к ИИ
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let aiResponse = { category: t.cat_general, priority: 30 };

      try {
        // --- ОЧИСТКА ТЕКСТА ОТ ГЕМИНИ ---
        let cleanedText = text; 
        if (cleanedText.includes("```json")) {
            cleanedText = cleanedText.split("```json")[1].split("```")[0];
        } else if (cleanedText.includes("```")) {
            cleanedText = cleanedText.split("```")[1].split("```")[0];
        }
        // --------------------------------

        const parsed = JSON.parse(cleanedText.trim());
        aiResponse.category = parsed.category;
        aiResponse.priority = Number(parsed.priority) || 30;
      } catch (e) {
        console.error("Ошибка парсинга JSON от Gemini. Текст был:", text, e);
        // Если ИИ ошибся, используем значения по умолчанию, чтобы форма не упала
      }

      // --- ТВОЙ ЖЕСТКИЙ АЛГОРИТМИЧЕСКИЙ ФИЛЬТР (оставляем без изменений) ---
      const lowerText = formData.description.toLowerCase();
      const criticalWords = ["смерт", "умереть", "прощайте", "не хочу жить", "суицид", "өлгім келеді", "қош бол", "suicide", "die"];
      const violenceWords = ["бьют", "ударил", "пинали", "избили", "убью", "нож", "ұрып", "сабап", "beat", "kill", "hit"];
      const bullyingWords = ["деньги", "вымога", "акша", "бер", "money", "extort"];

      if (criticalWords.some(w => lowerText.includes(w))) {
        aiResponse.priority = 100;
        aiResponse.category = t.cat_critical; 
      } else if (violenceWords.some(w => lowerText.includes(w))) {
        aiResponse.priority = Math.max(aiResponse.priority, 90);
        aiResponse.category = t.cat_violence; 
      } else if (bullyingWords.some(w => lowerText.includes(w))) {
        aiResponse.priority = Math.max(aiResponse.priority, 70);
        aiResponse.category = t.cat_bullying;
      }

      // 5. Отправка в БД (PostgreSQL)
      const dataToSend = new FormData();

// ВАЖНО: Добавляем описание вручную, чтобы точно ушло актуальное значение
dataToSend.append('description', formData.description);
dataToSend.append('type', formData.type);
dataToSend.append('locationRu', formData.locationRu); // Проверь: в БД поле называется locationRu
dataToSend.append('personReporting', formData.personReporting);
dataToSend.append('time', formData.time);
dataToSend.append('phone', formData.phone);
dataToSend.append('email', formData.email);
dataToSend.append('studentNames', formData.studentNames);

// Добавляем то, что пришло от ИИ
dataToSend.append('category', aiResponse.category);
dataToSend.append('priority', aiResponse.priority);

if (file) {
    // Используем 'attachment', так как в Контроллере @RequestParam("attachment")
    const compressedFile = await compressImage(file);
    dataToSend.append('attachment', compressedFile);
    console.log("Файл прикреплен к отправке:", compressedFile.name);
}

      const dbResponse = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        body: dataToSend
      });

      if (!dbResponse.ok) throw new Error("Ошибка сервера");
      const dbResult = await dbResponse.json();
      setSubmittedId(dbResult.id);

    } catch (error) {
      console.error("Ошибка:", error);
      alert(t.alert_submit_error + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Рендер экрана успеха (с переводами)
  if (submittedId) {
    return (
      <div className="status-page-wrapper">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h2 className="success-title">{t.success_title}</h2>
          <p className="success-text">{t.success_desc}</p>
          <div 
    className="id-badge clickable" 
    title={t.title_copy}
    onClick={() => {
      navigator.clipboard.writeText(submittedId);
      alert(t.alert_copied);
    }}
  >
    {submittedId} <span style={{fontSize: '14px'}}>📋</span>
  </div>
  <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
    {t.click_to_copy}
  </p>
  {/* ----------------- */}
          <button 
            className="btn-primary" 
            onClick={() => { setSubmittedId(null); setFile(null); }}
          >
            {t.btn_back}
          </button>
        </div>
      </div>
    );
  }

  // 5. Основная форма (с переводами и сохранением верстки)
  return (
    <div className="form-page-bg">
      <div className="form-container">
        <div className="form-header-box">
          <h2 className="form-header">{t.form_title}</h2>
          <p className="form-subheader">{t.form_subtitle}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="complaint-form-layout">
          <div className="form-group">
            <label className="label-style">{t.label_type}</label>
            <select 
              className="input-field" 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="Буллинг">{t.type_bullying}</option>
              <option value="Угрозы">{t.type_threats}</option>
              <option value="Конфликт">{t.type_conflict}</option>
              <option value="Другое">{t.type_other}</option>
            </select>
          </div>

          <div className="grid-2-col">
            <div className="form-group">
              <label className="label-style">{t.label_location}</label>
              <input 
                className="input-field" 
                placeholder={t.placeholder_location} 
                onChange={e => setFormData({...formData, locationRu: e.target.value})} 
              />
            </div>
            <div className="form-group">
               <label className="label-style">{t.label_time}</label>
               <input type="time" className="input-field" onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
          </div>

          <div className="grid-2-col">
            <div className="form-group">
              <label className="label-style">{t.label_name}</label>
              <input className="input-field" placeholder={t.placeholder_name} onChange={e => setFormData({...formData, personReporting: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="label-style">{t.label_phone}</label>
              <input className="input-field" placeholder="+7 (___) ___ __ __" onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="label-style">{t.label_students}</label>
            <textarea 
              className="input-field textarea-small" 
              placeholder={t.placeholder_students} 
              onChange={e => setFormData({...formData, studentNames: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="label-style">{t.label_description} <span className="required-star">*</span></label>
            <textarea 
              className="input-field textarea-large" 
              required 
              placeholder={t.placeholder_description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          <div className="file-upload-group">
            <label className="label-style">{t.label_file}</label>
            
            <div className="custom-file-wrapper">
              <label className="custom-file-btn">
                {t.btn_choose_file}
                <input 
                  type="file" 
                  className="hidden-file-input" 
                  accept="image/*,.pdf" 
                  onChange={(e) => setFile(e.target.files[0])} 
                />
              </label>
              <span className="custom-file-name">
                {file ? `📎 ${file.name}` : t.no_file_chosen}
              </span>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-submit-full" disabled={loading}>
            {loading ? t.btn_loading : t.btn_submit}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;