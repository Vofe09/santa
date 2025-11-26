export const config = {
  api: {
    bodyParser: false
  }
};

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ЧИТАЕМ RAW BODY ВРУЧНУЮ
  let raw = "";
  await new Promise(resolve => {
    req.on("data", chunk => (raw += chunk));
    req.on("end", resolve);
  });

  if (!raw) {
    return res.status(400).json({ error: "Empty body" });
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { name, gift } = data;

  if (!name || !gift) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Supabase init
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // --- Работа с файлом data.json ---
  const fileName = "data.json";

  // ЧИТАЕМ существующий JSON
  const { data: existingFile } = await supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .download(fileName);

  let list = [];

  if (existingFile) {
    const text = await existingFile.text();
    try {
      list = JSON.parse(text);
    } catch {}
  }

  // ДОБАВЛЯЕМ новую запись
  list.push({ name, gift });

  // Пишем обратно
  const buffer = Buffer.from(JSON.stringify(list, null, 2), "utf8");

  const { error: uploadError } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, buffer, {
      contentType: "application/json",
      upsert: true
    });

  if (uploadError) {
    console.log(uploadError);
    return res.status(500).json({ error: "Save failed" });
  }

  return res.status(200).json({ ok: true });
}
