export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const BIN_ID = process.env.JSONBIN_ID;
  const KEY = process.env.JSONBIN_KEY;

  const { name, gift } = req.body;

  try {
    // 1. Получаем текущие данные
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        "X-Master-Key": KEY
      }
    });

    let json = {};

    if (getRes.ok) {
      const data = await getRes.json();
      json = data.record || {};
    }

    // 2. Номер новой записи
    const count = Object.keys(json).length;
    const newKey = `request${count + 1}`;

    // 3. Добавляем новую запись
    json[newKey] = { name, gift };

    // 4. Сохраняем файл обратно
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": KEY
      },
      body: JSON.stringify(json)
    });

    res.status(200).send("Добавлено!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка JSONBin");
  }
}
