import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserRole, upsertAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ user: null });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ user: null });
  }

  // get cookie id from request for anonymous user upgrade
  const cookieId = request.cookies.get("reviewdle_uid")?.value || null;

  // upsert user in our db
  await upsertAuthUser(
    user.email || "",
    user.user_metadata?.full_name || null,
    user.user_metadata?.avatar_url || null,
    cookieId
  );

  const role = await getUserRole(user.email || null);

  return NextResponse.json({
    user: {
      email: user.email,
      name: user.user_metadata?.full_name,
      avatar: user.user_metadata?.avatar_url,
      role,
    },
  });
}
