import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { loadTemplate } from "./engine/loadTemplate";
import { loadDefaultData } from "./engine/loadDefaultData";
import { renderTemplate } from "./engine/renderTemplate";
import html2pdf from "html2pdf.js";
import { loadUserProfile } from "./engine/loadUserProfile";
import { useAuth } from "../AuthContext";
import { loadSavedResume } from "./engine/loadSavedResume";
import { supabase } from "../supabase"; 


export default function ResumeBuilder() {
  const { templateId } = useParams();
  const { user } = useAuth();


  const [template, setTemplate] = useState(null);
  const [values, setValues] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const saveToMyResume = async () => {
    if (!user || !values) return;

    // find latest resume
    const { data: latest } = await supabase
      .from("user_resumes")
      .select("id, group_id")
      .eq("user_id", user.id)
      .eq("template_id", templateId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    await supabase
      .from("user_resumes")
      .update({
        resume_data: values,
        updated_at: new Date().toISOString(),
      })
      .eq("id", latest.id);

      showToast("Resume updated in My Resumes");
  };



  const saveAsNewVersion = async () => {
    if (!user || !values) return;

    const { data: latest } = await supabase
      .from("user_resumes")
      .select("group_id, version")
      .eq("user_id", user.id)
      .eq("template_id", templateId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    const groupId = latest?.group_id || crypto.randomUUID();
    //const nextVersion = (latest?.version || 0) + 1;
    const { data: latestVersionRow, error } = await supabase
      .from("user_resumes")
      .select("version")
      .eq("user_id", user.id)
      .eq("template_id", templateId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestVersionRow?.version || 0) + 1;
    
    await supabase.from("user_resumes").insert({
      user_id: user.id,
      template_id: templateId,
      group_id: groupId,
      version: nextVersion,
      //resume_name: `${template?.name || "Resume"} v${nextVersion}`,
      resume_name: `${template?.name || "Resume"} Version ${nextVersion}`,
      resume_data: values,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    showToast("New resume version saved in My Resumes");
  };







  // -----------------------------
  // LOAD TEMPLATE + DEFAULT DATA
  // -----------------------------
  useEffect(() => {
    async function fetchEverything() {
      // 1. Load template metadata
      const templateData = await loadTemplate(templateId);
      setTemplate(templateData);

      // 2. Load default template data
      const defaults = await loadDefaultData(templateId);

      let merged = { ...defaults };

      // 3. If user is signed in → check for saved resume
      let saved = null;
      if (user) {
        saved = await loadSavedResume(user.id, templateId);
      }

      if (saved) {
        // 4. Saved resume exists → use it
        merged = saved;
      } else {
        // 5. No saved resume → merge user profile into defaults
        if (user) {
          const profile = await loadUserProfile(user.id);

          if (profile) {
            merged.full_name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
            merged.email = profile.email || merged.email;
            merged.phone = profile.phone || merged.phone;
            merged.location = profile.location || merged.location;
            merged.major_minor = profile.major || merged.major_minor;
            merged.skills_list = profile.skills || merged.skills_list;
            merged.grad_year = profile.grad_year || merged.grad_year;
            merged.institution_name = profile.school || merged.institution_name;
          }
        }
      }

      // 6. Set final merged values
      setValues(merged);
    }

    fetchEverything();
  }, [templateId, user]);

/*  useEffect(() => {
    if (!user || !values) return;

    const save = async () => {
      await supabase
        .from("user_resumes")
        .upsert({
          user_id: user.id,
          template_id: templateId,
          resume_data: values,
          updated_at: new Date(),
        });
    };

    save();
  }, [values]);*/



  // -----------------------------
  // EXPERIENCE HANDLERS
  // -----------------------------
  const addExperience = () => {
    setValues((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          job_title: "",
          company: "",
          company_location: "",
          start_date: "",
          end_date: "",
          bullets: [""],
        },
      ],
    }));
  };

  const deleteExperience = (index) => {
    setValues((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const deleteBullet = (expIndex, bulletIndex) => {
    setValues((prev) => {
      const updated = [...prev.experience];

      updated[expIndex] = {
        ...updated[expIndex],
        bullets: updated[expIndex].bullets.filter(
          (_, i) => i !== bulletIndex
        ),
      };

      return { ...prev, experience: updated };
    });
  };

  // -----------------------------
  // PDF DOWNLOAD
  // -----------------------------
  const downloadPDF = () => {
    const element = document.querySelector("iframe");
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `${values.full_name || "resume"}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    const doc = element.contentDocument.body;
    doc.style.background = "white";

    html2pdf().set(opt).from(doc).save();
  };

  // -----------------------------
  // LIVE TEMPLATE RENDER
  // -----------------------------
  const html = useMemo(() => {
    if (!template || !values) return "<p>Loading...</p>";
    return renderTemplate(template.template_content, values);
  }, [template, values]);


  console.log("TEMPLATE:", template);
  console.log("VALUES:", values);
  console.log("TEMPLATE CONTENT:", template?.template_content);


  if (!template || !values || !template.template_content) {
    return <p style={{ color: "white" }}>Loading...</p>;
  }


  function ModernButton({ children, onClick, variant = "primary", style }) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const base = {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
    transition: "all 0.15s ease",
    transform: active
      ? "scale(0.97)"
      : hover
      ? "translateY(-2px)"
      : "translateY(0px)",
    boxShadow: hover
      ? "0 10px 25px rgba(0,0,0,0.15)"
      : "0 4px 12px rgba(0,0,0,0.08)",
  };

  const variants = {
    primary: { background: "#3498db", color: "white" },
    success: { background: "#2ecc71", color: "black" },
    warning: { background: "#FF8C00", color: "black" },
    danger: { background: "#e74c3c", color: "white" },
    dark: { background: "#111", color: "white" },
  };

  return (
    <button
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
    >
      {children}
    </button>
  );
}



return (
  <div
    className="resume-builder"
    style={{ display: "flex", gap: "24px", padding: "24px", color: "orange" }}
  >


    {/* LEFT SIDE */}
    <div style={{ flex: 1 }}>
      <h2>Resume Fields</h2>

      {/* SIMPLE FIELDS */}
      {Object.keys(values)
        .filter((key) => typeof values[key] !== "object")
        .map((key) => (
          <div key={key} style={{ marginBottom: "12px" }}>
            <label style={{ fontWeight: "bold", color: "white" }}>
              {key.replace(/_/g, " ")}
            </label>

            <input
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
              }}
              value={values[key]}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
            />
          </div>
        ))}

      {/* EXPERIENCE */}
      <h3 style={{ marginTop: "24px" }}>Relevant Experience</h3>

      {values.experience.map((exp, index) => (
        <div
          key={index}
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            position: "relative",
          }}
        >
          {/* DELETE EXPERIENCE */}
          <button
            onClick={() => deleteExperience(index)}
            style={{
              position: "absolute",
              right: "10px",
              top: "10px",
              background: "red",
              color: "white",
              border: "none",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>

          <input
            placeholder="Job Title"
            value={exp.job_title}
            onChange={(e) => {
              const updated = [...values.experience];
              updated[index] = {
                ...updated[index],
                job_title: e.target.value,
              };
              setValues({ ...values, experience: updated });
            }}
          />

          <input
            placeholder="Company"
            value={exp.company}
            onChange={(e) => {
              const updated = [...values.experience];
              updated[index] = {
                ...updated[index],
                company: e.target.value,
              };
              setValues({ ...values, experience: updated });
            }}
          />

          <input
            placeholder="Location"
            value={exp.company_location}
            onChange={(e) => {
              const updated = [...values.experience];
              updated[index] = {
                ...updated[index],
                company_location: e.target.value,
              };
              setValues({ ...values, experience: updated });
            }}
          />

          <input
            placeholder="Start Date"
            value={exp.start_date}
            onChange={(e) => {
              const updated = [...values.experience];
              updated[index] = {
                ...updated[index],
                start_date: e.target.value,
              };
              setValues({ ...values, experience: updated });
            }}
          />

          <input
            placeholder="End Date"
            value={exp.end_date}
            onChange={(e) => {
              const updated = [...values.experience];
              updated[index] = {
                ...updated[index],
                end_date: e.target.value,
              };
              setValues({ ...values, experience: updated });
            }}
          />

          {/* BULLETS */}
          <h4>Bullets</h4>

          {exp.bullets.map((b, bIndex) => (
            <div
              key={bIndex}
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "6px",
                alignItems: "center",
              }}
            >
              <input
                placeholder={`Bullet ${bIndex + 1}`}
                value={b}
                style={{ flex: 1 }}
                onChange={(e) => {
                  const updated = [...values.experience];
                  updated[index] = {
                    ...updated[index],
                    bullets: updated[index].bullets.map((bullet, i) =>
                      i === bIndex ? e.target.value : bullet
                    ),
                  };
                  setValues({ ...values, experience: updated });
                }}
              />

              {/* DELETE BULLET BUTTON */}
              <button
                onClick={() => deleteBullet(index, bIndex)}
                style={{
                  background: "black",
                  color: "white",
                  border: "none",
                  padding: "2px 4px",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() => {
              const updated = [...values.experience];
              updated[index] = {
                ...updated[index],
                bullets: [...updated[index].bullets, ""],
              };
              setValues({ ...values, experience: updated });
            }}
          >
            + Add Bullet
          </button>
        </div>
      ))}

      {/* ADD EXPERIENCE */}
      <button
        onClick={addExperience}
        style={{
          marginTop: "10px",
          padding: "8px 12px",
          background: "green",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        + Add Experience
      </button>
    </div>

        
    {/* RIGHT SIDE */}
    <div style={{ flex: 1 }}>
      <h2>Live Preview</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "20px",
          background: "#e5e5e5",
          height: "85vh",
          overflow: "auto",
        }}
      >
        <iframe
          title="resume-preview"
          srcDoc={html}
          style={{
            width: "210mm",
            minHeight: "297mm",
            border: "none",
            background: "white",
            colorScheme: "light",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        />
      </div>

      <ModernButton variant="warning"
        onClick={downloadPDF}
        style={{
          marginBottom: "10px",
          padding: "10px 14px",
          background: "#FF8C00",
          color: "black",
          border: "none",
          cursor: "pointer",
          borderRadius: "6px",
        }}
      >
        Download PDF
      </ModernButton>

  {user && (
    <>

      <ModernButton variant="warning"
      onClick={saveToMyResume}
      style={{
        padding: "8px 12px",
        background: "#2ecc71",
        color: "black",
        border: "none",
        cursor: "pointer",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "12px",
        width: "fit-content",
      }}
    >
      Update old version
    </ModernButton>
    </>
  )}
    {toast && (
      <div
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          background: "#111",
          color: "white",
          padding: "12px 16px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          zIndex: 9999,
          animation: "fadeIn 0.2s ease",
        }}
      >
        {toast}
      </div>
    )}

  {user && (
    <>
    <ModernButton variant="warning"
      onClick={saveAsNewVersion}
      style={{
         padding: "8px 12px",
        background: "#3498db",
        color: "white",
        border: "none",
        cursor: "pointer",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "12px",
        width: "fit-content",
      }}
    >
      Save new copy
   </ModernButton>
   </>
    )}
    </div>
  </div>
);


}