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
      const { data: templates, error } = await supabase
        .from("resume_templates")
        .select(`
          id,
          name,
          preview_url,
          category_id,
          resume_categories ( name )
        `);

      if (error) return console.error(error);

      if (!user) {
        setRecommended([]);
        setOthers(templates || []);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("major, minors")
        .eq("user_id", user.id)
        .single();

      const majors = profile?.major?.split(",").map(m => m.trim()) || [];
      const minors = profile?.minors?.split(",").map(m => m.trim()) || [];
      const allPrograms = [...majors, ...minors];

      if (allPrograms.length === 0) {
        setRecommended([]);
        setOthers(templates || []);
        return;
      }

      const quoted = allPrograms.map(p => `"${p}"`).join(",");

      const { data: matched } = await supabase
        .from("resume_fields")
        .select("category_id")
        .or(`major_name.in.(${quoted}),minor_name.in.(${quoted})`);

      const categoryIds = [...new Set(matched?.map(c => String(c.category_id)) || [])];

      const recommendedTemplates = templates.filter(t =>
        categoryIds.includes(String(t.category_id))
      );

      const otherTemplates = templates.filter(
        t => !categoryIds.includes(String(t.category_id))
      );

      setRecommended(recommendedTemplates);
      setOthers(otherTemplates);
    }

    loadTemplates();
  }, [user]);

  // -----------------------------
  // Hover Card Component
  // -----------------------------
  function HoverCard({ children, onClick }) {
    const [hover, setHover] = useState(false);

    const style = {
      background: "#ffffff15",
      borderRadius: "14px",
      overflow: "hidden",
      cursor: "pointer",
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      border: "1px solid #ffffff20",
      boxShadow: hover
        ? "0 8px 20px rgba(0,0,0,0.25)"
        : "0 4px 12px rgba(0,0,0,0.15)",
      transform: hover ? "translateY(-6px)" : "translateY(0)",
    };

    return (
      <div
        style={style}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </div>
    );
  }

  // -----------------------------
  // Styles
  // -----------------------------
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "28px",
  };

  const ratioBox = {
    position: "relative",
    width: "100%",
    paddingTop: "80%", 
    //background: "#111",
    overflow: "hidden",
  };

  const imgStyle = {
    position: "absolute",
    top: "0%",
    left: 0,
    width: "100%",
    height: "120%",
    objectFit: "cover",
    objectPosition: "center top",
  };

  const overlayStyle = {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: "15px 12px",
    background: "linear-gradient(to top,#ff9c00, rgba(0,0,0,0.75))",
    color: "white",
    fontSize: "17px",
    fontWeight: "600",
    textAlign: "center",
  };

  return (
    <div style={{ padding: "32px", color: "white" }}>

      {/* Highly Recommended */}
      {user && recommended.length > 0 && (
        <>
          <h2 style={{ marginBottom: "20px", fontSize: "26px", fontWeight: "700" }}>
            Highly Recommended
          </h2>

          <div style={gridStyle}>
            {recommended.map(t => (
              <HoverCard key={t.id} onClick={() => navigate(`/resume/builder/${t.id}`)}>
                 <div className="resume-preview-wrapper" style={ratioBox}>
                  <img
                    src={`${t.preview_url}?t=${Date.now()}`}
                    alt=""
                    style={imgStyle}
                  />
                  <div className="resume-preview-overlay" style={overlayStyle}>
                    {t.resume_categories?.name}
                  </div>
                </div>
              </HoverCard>
            ))}
          </div>
        </>
      )}

      {/* All Templates */}
      <h2 style={{ marginTop: "50px", marginBottom: "20px", fontSize: "26px", fontWeight: "700" }}>
        All Templates
      </h2>

      <div style={gridStyle}>
        {others.map(t => (
          <HoverCard key={t.id} onClick={() => navigate(`/resume/builder/${t.id}`)}>
            <div className="resume-preview-wrapper" style={ratioBox}>
              <img
                src={`${t.preview_url}?t=${Date.now()}`}
                alt=""
                style={imgStyle}
              />
              <div className="resume-preview-overlay" style={overlayStyle}>
                {t.resume_categories?.name}
              </div>
            </div>
          </HoverCard>
        ))}
      </div>
    </div>
  );
}
