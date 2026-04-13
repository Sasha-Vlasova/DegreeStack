import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Resume() {
  const { user } = useAuth();
  const [recommended, setRecommended] = useState([]);
  const [others, setOthers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTemplates() {
      // 1) Load ALL templates
      const { data: templates, error: tmplError } = await supabase
        .from("resume_templates")
        .select(`
          id,
          name,
          category_id,
          resume_categories ( name )
        `);

      if (tmplError) {
        console.error("Error loading templates:", tmplError);
        return;
      }

      // If no user → show all as others
      if (!user) {
        setRecommended([]);
        setOthers(templates || []);
        return;
      }

      // 2) Load user profile
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("major, minors")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        setRecommended([]);
        setOthers(templates || []);
        return;
      }

      // 3) Parse majors + minors safely
      const majors = profile?.major
        ? profile.major.split(",").map(m => m.trim()).filter(Boolean)
        : [];

      const minors = profile?.minors
        ? profile.minors.split(",").map(m => m.trim()).filter(Boolean)
        : [];

      const allPrograms = [...majors, ...minors];

      console.log("Programs:", allPrograms);

      if (allPrograms.length === 0) {
        setRecommended([]);
        setOthers(templates || []);
        return;
      }

      // 4) Quote values safely
      const quoted = allPrograms.map(p => `"${p}"`).join(",");

      // 5) FIXED .or() QUERY (single line, no spaces/newlines)
      const { data: matchedCategories, error: catError } = await supabase
        .from("resume_fields")
        .select("category_id")
        .or(`major_name.in.(${quoted}),minor_name.in.(${quoted})`);

      if (catError) {
        console.error("Error loading categories:", catError);
        setRecommended([]);
        setOthers(templates || []);
        return;
      }

      console.log("Matched categories:", matchedCategories);

      if (!matchedCategories || matchedCategories.length === 0) {
        setRecommended([]);
        setOthers(templates || []);
        return;
      }

      // 6) Unique category IDs (safe string conversion)
      const categoryIds = [
        ...new Set(matchedCategories.map(c => String(c.category_id)))
      ];

      console.log("Category IDs:", categoryIds);

      // 7) Split templates safely
      const recommendedTemplates = (templates || []).filter(t =>
        categoryIds.includes(String(t.category_id))
      );

      const otherTemplates = (templates || []).filter(
        t => !categoryIds.includes(String(t.category_id))
      );

      console.log("Recommended:", recommendedTemplates);

      setRecommended(recommendedTemplates);
      setOthers(otherTemplates);
    }

    loadTemplates();
  }, [user]);

  return (
    <div style={{ padding: "24px", color: "#ffffff" }}>
      
      {user && recommended.length > 0 && (
        <>
          <h2>Highly Recommended</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "16px"
            }}
          >
            {recommended.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/resume/builder/${t.id}`)}
                style={{
                  padding: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  background: "white",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                <p
                  style={{
                    fontSize: "18px",
                    color: "#222",
                    fontWeight: "700",
                    margin: 0
                  }}
                >
                  {t.resume_categories?.name || "Uncategorized"}
                </p>

                <h3
                  style={{
                    marginTop: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#444"
                  }}
                >
                  {t.name}
                </h3>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ marginTop: "32px", color: "#ffffff" }}>All Templates</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "16px"
        }}
      >
        {others.map(t => (
          <div
            key={t.id}
            onClick={() => navigate(`/resume/builder/${t.id}`)}
            style={{
              padding: "16px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              background: "white",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            <p
              style={{
                fontSize: "18px",
                color: "#ff9c00",
                fontWeight: "700",
                margin: 0
              }}
            >
              {t.resume_categories?.name || "Uncategorized"}
            </p>

            <h3
              style={{
                marginTop: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#444"
              }}
            >
              {t.name}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}