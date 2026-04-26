import { supabase } from "../../supabase";

export async function loadUserProfile(userId) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error loading user profile:", error);
    return null;
  }

  return data;
}
