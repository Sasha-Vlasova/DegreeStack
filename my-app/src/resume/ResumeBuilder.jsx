import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { loadTemplate } from "./engine/loadTemplate";
import { loadDefaultData } from "./engine/loadDefaultData";
import { renderTemplate } from "./engine/renderTemplate";
import html2pdf from "html2pdf.js";

export default function ResumeBuilder() {
  const { templateId } = useParams();

  const [template, setTemplate] = useState(null);
  const [values, setValues] = useState(null);

  // -----------------------------
  // LOAD TEMPLATE + DEFAULT DATA
  // -----------------------------
  useEffect(() => {
    async function fetchEverything() {
      const templateData = await loadTemplate(templateId);
      setTemplate(templateData);


      console.log("TEMPLATE DATA:", templateData);


      const defaults = await loadDefaultData(templateId);
      setValues(defaults);


      console.log("TEMPLATE DATA:", templateData);

    }

    fetchEverything();
  }, [templateId]);

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



  return (
    <div style={{ display: "flex", gap: "24px", padding: "24px", color: "orange" }}>
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
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          />
        </div>
              <button
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
      </button>
      </div>
    </div>
  );
}