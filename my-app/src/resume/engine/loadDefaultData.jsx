import { supabase } from "../../supabase.jsx";

export async function loadDefaultData(templateId) {
  const { data, error } = await supabase
    .from("resume_default_data")
    .select("default_data")
    .eq("template_id", templateId)
    .single();

  if (error) {
    console.error("Error loading default data:", error);
    return null;
  }

  return data.default_data;
}
