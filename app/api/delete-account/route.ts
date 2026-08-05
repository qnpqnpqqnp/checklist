import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: "서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았어요" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return Response.json({ error: "로그인 정보가 없어요" }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);
  if (userError || !user) {
    return Response.json({ error: "유효하지 않은 로그인이에요" }, { status: 401 });
  }

  const { error: deleteRowsError } = await admin
    .from("checklists")
    .delete()
    .eq("owner_id", user.id);
  if (deleteRowsError) {
    return Response.json(
      { error: "체크리스트 삭제에 실패했어요" },
      { status: 500 }
    );
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    return Response.json({ error: "계정 삭제에 실패했어요" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
