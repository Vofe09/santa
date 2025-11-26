import { createClient } from "@supabase/supabase-js";

async function getRawBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const raw = await getRawBody(req);
    console.log("RAW BODY:", raw);

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return res.status(400).send("Bad JSON");
    }

    if (!body.userInput) {
      return res.status(400).send("Нет данных");
    }

    const fileName = "data.json";

    const { data: file } = await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET)
      .download(fileName);

    let arr = [];

    if (file) {
      const text = await file.text();
      try {
        arr = JSON.parse(text);
      } catch {}
    }

    arr.push(body.userInput);

    await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, JSON.stringify(arr, null, 2), {
        upsert: true,
        contentType: "application/json"
      });

    res.status(200).send("Сохранено");
  } catch (e) {
    console.error("SERVER ERROR:", e);
    res.status(500).send("Ошибка сервера");
  }
}
