import { supabase } from "./supabase";

export async function getUserRole(email: string | null): Promise<string | null> {
  if (!email) return null;

  const { data } = await supabase
    .from("users")
    .select("role_id, roles(name)")
    .eq("email", email)
    .single();

  if (!data) return null;
  const role = data.roles as unknown as { name: string } | null;
  return role?.name || "user";
}

export async function upsertAuthUser(
  email: string,
  displayName: string | null,
  avatarUrl: string | null,
  cookieId: string | null
) {
  // check if user exists by email
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) return existing.id;

  // check if there's an anonymous user with this cookie to upgrade
  if (cookieId) {
    const { data: anon } = await supabase
      .from("users")
      .select("id")
      .eq("cookie_id", cookieId)
      .single();

    if (anon) {
      await supabase
        .from("users")
        .update({
          email,
          display_name: displayName,
          avatar_url: avatarUrl,
          is_anonymous: false,
        })
        .eq("id", anon.id);
      return anon.id;
    }
  }

  // create new user
  const { data: newUser } = await supabase
    .from("users")
    .insert({
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
      is_anonymous: false,
      cookie_id: cookieId,
    })
    .select("id")
    .single();

  return newUser?.id || null;
}
