import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "Файл не получен" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Ошибка загрузки файла", details: uploadError },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server crashed", details: err.message },
      { status: 500 }
    );
  }
}
