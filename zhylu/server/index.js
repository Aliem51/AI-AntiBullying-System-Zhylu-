import express from 'express';
import pg from 'pg';
const { Pool } = pg;
import cors from 'cors';
import bcrypt from 'bcrypt'; 
import 'dotenv/config';      
import path from 'path';
import multer from 'multer';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// Настройка подключения через .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
// 3. Проверка подключения при запуске
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Ошибка подключения к базе:', err.stack);
  } else {
    console.log('✅ База данных подключена и готова к работе');
  }
});

// --- ЭНДПОИНТЫ ---

const sendTelegramNotification = async (type, priority) => {
  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_ID = process.env.TG_CHAT_ID;
  
  console.log(`📢 [TG Log]: Новая жалоба (${type}). Приоритет: ${priority}%`);

  if (BOT_TOKEN && CHAT_ID && BOT_TOKEN !== 'YOUR_TELEGRAM_TOKEN_HERE') {
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: CHAT_ID, 
          text: `🚨 Новая жалоба!\nТип: ${type}\nПриоритет ИИ: ${priority}%` 
        })
      });
    } catch (e) {
      console.error("Ошибка отправки в TG:", e);
    }
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Создаем папку, если её нет
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Сохраняем оригинальное расширение файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Статическая раздача файлов из папки uploads
app.use('/uploads', express.static('uploads'));

//ЭНДПОИНТ СОЗДАНИЯ 
app.post('/api/complaints', upload.single('attachment'), async (req, res) => {
  
  const { 
    description, type, locationRu, personReporting, 
    time, phone, email, studentNames, category, priority 
  } = req.body;

  const filePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!description || description.trim().length < 10) {
    return res.status(400).json({ error: "Описание слишком короткое" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO complaints (
        description, type, location_ru, person_reporting, 
        incident_time, phone, email, student_names, 
        category, ai_priority_score, is_urgent, status, file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'new', $12) RETURNING id`,
      [
        description, type, locationRu, personReporting, 
        time, phone, email, studentNames, 
        category, priority, priority >= 80, filePath
      ]
    );

    sendTelegramNotification(type, priority);
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('❌ Ошибка сохранения:', err.message);
    res.status(500).json({ error: "Ошибка базы" });
  }
});

// ЛОГИН
app.post('/api/login', async (req, res) => {
  // .trim(), чтобы убрать случайные пробелы
  const email = req.body.email.trim();
  const password = req.body.password; // Пароль не тримим

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      // ЛОГ ДЛЯ ПРОВЕРКИ 
      console.log(`Проверка пароля для: [${email}]`);
      console.log(`Хеш из базы: [${user.password}]`);

      const isMatch = await bcrypt.compare(password, user.password);
      
      if (isMatch) {
        delete user.password;
        res.json({ success: true, user });
      } else {
        res.status(401).json({ success: false, message: "Неверный пароль" });
      }
    } else {
      res.status(401).json({ success: false, message: "Пользователь не найден" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
// СОЗДАНИЕ ЖАЛОБЫ (с валидацией)
app.post('/api/complaints', async (req, res) => {
  const { 
    description, type, locationRu, personReporting, 
    time, phone, email, studentNames, category, priority 
  } = req.body;

  // --- ВАЛИДАЦИЯ БЭКЕНДА ---
  if (!description || description.trim().length < 10) {
    console.log("⚠️ Попытка отправить пустую или короткую жалобу");
    return res.status(400).json({ error: "Описание слишком короткое (мин. 10 символов)" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO complaints (
        description, type, location_ru, person_reporting, 
        incident_time, phone, email, student_names, 
        category, ai_priority_score, is_urgent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'new') RETURNING id`,
      [
        description, 
        type, 
        locationRu, 
        personReporting, 
        time, 
        phone, 
        email, 
        studentNames, 
        category, 
        priority, 
        priority >= 80
      ]
    );

    // Вызываем уведомление в Telegram (фундамент готов)
    sendTelegramNotification(type, priority);

    console.log('📬 Новая жалоба сохранена в PostgreSQL. ID:', result.rows[0].id);
    res.json({ id: result.rows[0].id });
    
  } catch (err) {
    console.error('❌ Ошибка сохранения жалобы:', err.message);
    res.status(500).json({ error: "Ошибка базы данных при сохранении" });
  }
}); */

// Эндпоинт для удаления жалобы
app.delete('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;
  try {
    
    await pool.query('DELETE FROM complaints WHERE id = $1', [id]);

    res.status(200).json({ message: "Удалено успешно" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера при удалении" });
  }
});

// 1. Получение ВСЕХ жалоб
app.get('/api/complaints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении списка" });
  }
});

// 2. УДАЛЕНИЕ 
app.delete('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Попытка удаления жалобы с ID: ${id}`);
  try {
    const result = await pool.query('DELETE FROM complaints WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Жалоба не найдена" });
    }

    res.status(200).json({ success: true, message: "Удалено успешно" });
  } catch (err) {
    console.error('❌ Ошибка при удалении:', err.message);
    res.status(500).json({ error: "Ошибка сервера при удалении" });
  }
});

// 3. ПОИСК ПО ID 
app.get('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT status, admin_reply, assigned_to FROM complaints WHERE id::text = $1', 
      [id.trim()]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Заявка не найдена" });
    }
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get('/api/test-db', async (req, res) => {
  const result = await pool.query('SELECT id FROM complaints LIMIT 1');
  res.json({ 
    message: "Первый ID в базе", 
    dbId: result.rows[0]?.id 
  });
});

// ОБНОВЛЕНИЕ СТАТУСА, ОТВЕТА И ОТВЕТСТВЕННОГО 
app.patch('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;
  const { status, adminReply, assignedTo } = req.body; 
  
  console.log(`[PATCH] ID: ${id}, Body:`, req.body);

  try {
    // Обновляем статус, если пришел
    if (status) {
      await pool.query('UPDATE complaints SET status = $1 WHERE id = $2', [status, id]);
    }
    
    // Обновляем ответ админа 
    if (adminReply !== undefined) {
      await pool.query('UPDATE complaints SET admin_reply = $1 WHERE id = $2', [adminReply, id]);
    }

    // Обновляем ответственного
    if (assignedTo !== undefined) {
      await pool.query('UPDATE complaints SET assigned_to = $1 WHERE id = $2', [assignedTo, id]);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Ошибка при PATCH:', err.message);
    res.status(500).json({ error: "Ошибка сервера при обновлении" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));