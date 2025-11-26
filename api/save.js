import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false, // важно
  },
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (e) {
        reject(e);
      }
    });
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).send("Метод запрещён");

    const body = await readBody(req);
    const userInput = body.userInput;

    if (!userInput) {
      console.log("No user input")
      return res.status(400).send("Нет данных");
    }

    const fileName = "data.json";

    // Загружаем JSON
    const { data: file } = await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET)
      .download(fileName);

    let arr = [];

    if (file) {
      const text = await file.text();
      try {
        arr = JSON.parse(text);
      } catch {
        arr = [];
      }
    }

    arr.push(userInput);

    const buffer = Buffer.from(JSON.stringify(arr, null, 2));

    await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, buffer, {
        upsert: true,
        contentType: "application/json"
      });

    res.status(200).send("Сохранено");

  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка");
  }
  console.log("BODY:", body);

}
