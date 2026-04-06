export function renderTemplate(template, data) {
  let output = template;

  for (const key in data) {
    const placeholder = `{{${key}}}`;
    output = output.replaceAll(placeholder, data[key] || "");
  }

  return output;
}
