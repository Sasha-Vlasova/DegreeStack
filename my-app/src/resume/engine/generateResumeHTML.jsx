import { renderTemplate } from "./renderTemplate";

export function generateResumeHTML(templateContent, values) {
  return renderTemplate(templateContent, values);
}
