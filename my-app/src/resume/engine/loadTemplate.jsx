import { supabase } from "../../supabase";

export async function loadTemplate(templateId) {
  const { data, error } = await supabase
    .from("resume_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) throw error;
  return data;
}
