import { useEffect, useState } from "react";
import supabase from "../supabase";
import GeneratePreview from "../components/GeneratePreview";

export default function GeneratePreviewsAdmin() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const loadTemplates = async () => {
      const { data, error } = await supabase
        .from("resume_templates")
        .select("*");

      if (error) {
        console.error("LOAD ERROR:", error);
        return;
      }

      console.log("Loaded templates:", data);
      setTemplates(data);
    };

    loadTemplates();
  }, []);

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1>Generate Previews</h1>
      <p>This page will generate thumbnails for all templates.</p>

      {templates.map((t) => (
        <div key={t.id} style={{ marginBottom: 20 }}>
          <h3>{t.name}</h3>
          <GeneratePreview template={t} />
        </div>
      ))}
    </div>
  );
}
