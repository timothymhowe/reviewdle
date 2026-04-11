import { redirect } from "next/navigation";
import { getLatestPuzzleNumber } from "@/lib/supabase";

const useSupabase = process.env.SUPABASE_URL !== "your_supabase_url";

export default async function Home() {
  if (useSupabase) {
    const latest = await getLatestPuzzleNumber();
    if (latest) redirect(`/puzzle/${latest}`);
  }

  // fallback for local dev without supabase
  redirect("/puzzle/1");
}
