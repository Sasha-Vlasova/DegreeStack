import { supabase } from "../../supabase";

export async function loadSavedResume(userId, templateId) {
  if (!userId || !templateId) return null;

  const { data, error } = await supabase
    .from("user_resumes")
    .select("resume_data")
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .single();

  if (error) {
    // Not an actual error — just means no saved resume exists yet
    return null;
  }

  return data?.resume_data || null;
}
