export function renderTemplate(template, values) {
  function renderExperience(experienceArray) {
    if (!experienceArray || experienceArray.length === 0) return "";

    return experienceArray
      .map(
        (exp) => `
      <div style="margin-bottom: 16px;">
        <div style="font-size: 14px; font-weight: bold; font-style: italic;">
          ${exp.job_title || ""}
        </div>
        <div style="font-size: 13px; color: #555;">
          ${exp.company || ""} — ${exp.company_location || ""}<br>
          ${exp.start_date || ""} – ${exp.end_date || ""}
        </div>
        <ul style="font-size: 13px; margin-top: 6px; padding-left: 20px;">
          ${(exp.bullets || [])
            .map((b) => `<li>${b}</li>`)
            .join("")}
        </ul>
      </div>
    `
      )
      .join("");
  }

  let html = template;

  // Simple replacements
  Object.keys(values).forEach((key) => {
    if (typeof values[key] !== "object") {
      html = html.replaceAll(`{{${key}}}`, values[key] || "");
    }
  });

  // Experience replacement
  html = html.replace(
    "{{experience_entries}}",
    renderExperience(values.experience)
  );

  return html;
}