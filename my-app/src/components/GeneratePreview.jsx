import { useState } from "react";
import html2canvas from "html2canvas";
import supabase from "../supabase";

export default function GeneratePreview({ template }) {
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    setLoading(true);
    console.log("Generating preview for:", template.id);

    // 1. Get the HTML from the template
    let html = template.template_content;
    if (!html) {
      console.error("TEMPLATE CONTENT IS EMPTY for:", template);
      setLoading(false);
      return;
    }

    // 2. Replace placeholders with sample data
    html = html.replace(/{{full_name}}/g, "John Doe");
    html = html.replace(/{{email}}/g, "john@example.com");
    html = html.replace(/{{phone}}/g, "555-555-5555");
    html = html.replace(/{{location}}/g, "Waukesha, WI");
    html = html.replace(/{{institution_name}}/g, "Carroll University");
    html = html.replace(/{{degree_title}}/g, "Bachelor of Science");
    html = html.replace(/{{major_minor}}/g, "Computer Science");
    html = html.replace(/{{grad_year}}/g, "2026");
    html = html.replace(/{{skills_list}}/g, "Leadership, Communication, Teamwork");
    html = html.replace(/{{experience_entries}}/g, "<p>- Example experience entry</p>");

    // 3. Wrap HTML for consistent screenshot size
    const wrappedHTML = `
      <html>
        <body style="margin:0; padding:0; background:white;">
          <div style="
            width: 850px;
            padding: 40px;
            margin: 0 auto;
            background: white;
            font-family: Arial, sans-serif;
          ">
            ${html}
          </div>
        </body>
      </html>
    `;

    // 4. Create hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    document.body.appendChild(iframe);

    try {
      iframe.contentDocument.open();
      iframe.contentDocument.write(wrappedHTML);
      iframe.contentDocument.close();
    } catch (err) {
      console.error("IFRAME WRITE ERROR:", err);
      setLoading(false);
      return;
    }

    // Wait for layout
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 5. Screenshot
    let canvas;
    try {
      canvas = await html2canvas(iframe.contentDocument.body, {
        scale: 1,
        useCORS: true,
      });
    } catch (err) {
      console.error("HTML2CANVAS ERROR:", err);
      setLoading(false);
      return;
    }

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    if (!blob) {
      console.error("BLOB ERROR: canvas.toBlob returned null");
      setLoading(false);
      return;
    }

    // 6. Upload to Supabase Storage
    const filePath = `${template.id}.png`;

    const { error: uploadError } = await supabase.storage
      .from("template_previews")
      .upload(filePath, blob, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError);
      setLoading(false);
      return;
    }

    // 7. Get public URL
    const { data: urlData } = supabase.storage
      .from("template_previews")
      .getPublicUrl(filePath);

    const previewUrl = urlData.publicUrl;
    console.log("Preview URL:", previewUrl);

    // 8. Update DB
    const { error: updateError } = await supabase
      .from("resume_templates")
      .update({ preview_url: previewUrl })
      .eq("id", template.id);

    if (updateError) {
      console.error("UPDATE ERROR:", updateError);
    } else {
      console.log("Preview URL saved to DB");
    }

    // 9. Cleanup
    document.body.removeChild(iframe);
    setLoading(false);
  };

  return (
    <button
      onClick={generatePreview}
      disabled={loading}
      style={{
        padding: "10px 20px",
        background: "#ff9c00",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        color: "black",
        fontWeight: "bold",
      }}
    >
      {loading ? "Generating..." : "Generate Preview"}
    </button>
  );
}
