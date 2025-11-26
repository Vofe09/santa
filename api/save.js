export const config = {
  api: {
    bodyParser: false
  }
};

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log("METHOD:", req.method);

  // Читаем тело вручную
  let raw = "";
  await new Promise(resolve => {
    req.on("data", chunk => raw += chunk);
    req.on("end", resolve);
  });

  console.log("RAW BODY:", raw);

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

  // Инициализация Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Запись в БД
  const { error } = await supabase.from("wishes").insert({ name, gift });

  if (error) {
    console.log("SUPABASE ERROR:", error);
    return res.status(500).json({ error: "Supabase error" });
  }

  res.status(200).json({ ok: true });
}
