import { loadTemplate } from "./loadTemplate";
import { renderTemplate } from "./renderTemplate";

export async function generateResumeHTML(filePath, data) {
  const template = await loadTemplate(filePath);
  return renderTemplate(template, data);
}
