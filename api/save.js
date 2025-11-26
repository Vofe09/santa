import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Метод запрещён");

  const { userInput } = req.body;
  if (!userInput) return res.status(400).send("Нет данных");

  const fileName = "data.txt";

  const { data: existing, error: downloadError } = await supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .download(fileName);

  let currentText = "";
  if (existing) {
    currentText = await existing.text();
  }

  const newText = currentText + userInput + "\n";
  const buffer = Buffer.from(newText, "utf8");

  const { error: uploadError } = await supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, buffer, {
      contentType: "text/plain",
      upsert: true
    });

  if (uploadError) return res.status(500).send("Ошибка сохранения");

  return res.status(200).send("Сохранено");
}
