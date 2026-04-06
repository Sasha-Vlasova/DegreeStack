export function loadTemplate(filePath) {
  return fetch(filePath).then(res => res.text());
}
