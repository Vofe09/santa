export default async function handler(req, res) {
  const BIN_ID = process.env.JSONBIN_ID;
  const KEY = process.env.JSONBIN_KEY;

  try {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": KEY }
    });

    const data = await r.json();
    res.status(200).json(data.record || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка JSONBin" });
  }
}
