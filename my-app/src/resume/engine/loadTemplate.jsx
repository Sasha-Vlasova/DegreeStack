import { supabase } from "../../supabase.jsx";

export async function loadTemplate(templateId) {
  const { data, error } = await supabase
    .from("resume_templates")
    .select("id, name, template_content")
    .eq("id", templateId)
    .single();

  if (error) {
    console.error("Error loading template:", error);
    return null;
  }

  return data;
}
