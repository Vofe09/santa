import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // или SUPABASE_KEY, если так у тебя
);

export default async function handler(req, res) {
  if (req.method !== "POST") 
    return res.status(405).send("Метод запрещён");

  const { userInput } = req.body;
  if (!userInput) 
    return res.status(400).send("Нет данных");

  const fileName = "data.json";

  // 1. Загружаем существующий JSON
  const { data: file, error: downloadError } = await supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .download(fileName);

  let arr = [];

  if (file) {
    const text = await file.text();
    try {
      arr = JSON.parse(text);
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = [];
    }
  }

  // 2. Добавляем новое значение
  arr.push(userInput);

  // 3. Загружаем обратно
  const buffer = Buffer.from(JSON.stringify(arr, null, 2), "utf8");

  const { error: uploadError } = await supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, buffer, {
      contentType: "application/json",
      upsert: true
    });

  if (uploadError) return res.status(500).send("Ошибка сохранения");

  return res.status(200).send("Сохранено");
}
