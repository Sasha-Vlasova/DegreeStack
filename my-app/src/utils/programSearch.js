import { supabase } from "../supabase";

export const searchPrograms = async (queryText = "", filters = {}) => {
  let query = supabase
    .from("programs")
    .select(`
      id,
      title,
      program_level,
      program_type,
      program_url,
      state_source,
      career_clusters,
      program_campuses (
        campus_code,
        campuses (
          code,
          name,
          state
        )
      )
    `);

  if (queryText.trim() !== "") {
    const words = queryText.trim().split(/\s+/).join(" | ");
    query = query.textSearch("title", words, {
      type: "plain"
    });
  }

  if (filters.type) {
    query = query.eq("program_level", filters.type);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
};