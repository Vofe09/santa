import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Метод запрещён");

  const { name, gift } = req.body;
  if (!name || !gift) return res.status(400).send("Нет данных");

  const fileName = "data.txt";

  try {
    // Скачиваем существующий файл
    const { data: existing, error: downloadError } = await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET)
      .download(fileName);

    let currentText = "";
    if (existing) {
      currentText = await existing.text();
    }

    // Добавляем новую запись
    const newText = currentText + `Имя: ${name}, Подарок: ${gift}\n`;
    const buffer = Buffer.from(newText, "utf8");

    // Загружаем обратно с upsert
    const { error: uploadError } = await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, buffer, {
        contentType: "text/plain",
        upsert: true
      });

    if (uploadError) return res.status(500).send("Ошибка сохранения");

    return res.status(200).send("Сохранено");

  } catch (err) {
    return res.status(500).send("Ошибка сервера");
  }
}
