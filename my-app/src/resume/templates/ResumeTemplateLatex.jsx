export default function ResumeTemplate({ form = {} }) {
  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        maxWidth: "700px",
        margin: "0 auto",
        padding: "24px",
        lineHeight: "1.4",
        color: "#111"
      }}
    >
      {/* NAME + CONTACT */}
      <h1 style={{ fontSize: "28px", marginBottom: "4px" }}>
        {form.fullName || "Your Name"}
      </h1>

      <p style={{ fontSize: "12px", marginTop: 0, color: "#444" }}>
        {form.email || "email@domain.com"} &nbsp;|&nbsp;
        {form.phone || "(555) 555-5555"} &nbsp;|&nbsp;
        {form.location || "City, State"}
      </p>

      {/* EDUCATION */}
      <section style={{ marginTop: "20px" }}>
        <h2 style={sectionHeader}>Education</h2>

        <div style={rowHeader}>
          <span>
            {form.degreeTitle || "Bachelor of Arts"}
            {form.majorMinor ? `, ${form.majorMinor}` : ""}
          </span>
          <span>{form.gradYear || "2026"}</span>
        </div>

        <div style={subText}>
          {form.institutionName || "Carroll University"},{" "}
          {form.location || "Waukesha, WI"}
        </div>
      </section>

      {/* EXPERIENCE */}
      <section style={{ marginTop: "20px" }}>
        <h2 style={sectionHeader}>Experience</h2>

        {(form.experienceEntries || [
          {
            title: "Student Research Assistant",
            company: "Carroll University",
            location: "Waukesha, WI",
            start: "2024",
            end: "2025",
            bullets: [
              "Conducted data analysis using Python and R to support faculty research.",
              "Presented findings at the Honors Research Symposium."
            ]
          }
        ]).map((exp, i) => (
          <div key={i} style={{ marginBottom: "12px" }}>
            <div style={rowHeader}>
              <span>
                {exp.title} — {exp.company}
              </span>
              <span>
                {exp.start} – {exp.end}
              </span>
            </div>

            <div style={subText}>{exp.location}</div>

            <ul style={listStyle}>
              {(exp.bullets || []).map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* SKILLS */}
      <section style={{ marginTop: "20px" }}>
        <h2 style={sectionHeader}>Skills</h2>

        <div style={{ fontSize: "12px" }}>
          {form.skillsList ||
            "Research Methods, Academic Writing, Data Analysis, Communication, Team Collaboration"}
        </div>
      </section>
    </div>
  );
}

const sectionHeader = {
  fontSize: "13px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  borderBottom: "1px solid #000",
  paddingBottom: "2px",
  marginBottom: "6px"
};

const rowHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontWeight: "600",
  fontSize: "13px"
};

const subText = {
  fontSize: "12px",
  color: "#444"
};

const listStyle = {
  marginTop: 0,
  paddingLeft: "18px",
  fontSize: "12px"
};
