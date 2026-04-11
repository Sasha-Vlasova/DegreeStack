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
      career_clusters,
      program_campuses!inner (
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

  if (filters.school) {
    query = query.eq("program_campuses.campus_code", filters.school);
  }

  if (filters.location) {
    query = query.eq("program_campuses.campuses.state", filters.location);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
};