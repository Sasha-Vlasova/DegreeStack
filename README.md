# DegreeStack

DegreeStack is a web application built with React and Supabase that combines:

* Academic program discovery
* Career/job dataset exploration
* Resume builder with dynamic templates
* User authentication and profile management

The system is designed to help students connect education paths with real-world career opportunities while generating tailored resumes.

---

## Overview

DegreeStack is a web platform designed to help students, early-career professionals, and individuals seeking a career change to explore education, internship, and job opportunities in one place. It offers a searchable database of universities, programs, and job postings, with filters such as location, field of study, program type, and keywords to make browsing easier. Visitors can freely explore opportunities and access resume templates, while users who create an account gain access to personalized features. For example, signed-in users receive tailored recommendations, including the top three education or career opportunities that best match their background and interests. The name ‘DegreeStack’ is inspired by the computer science concept of a stack (LIFO – last in, first out), reflecting how users build and layer their education and experiences over time to reach their goals. People tend to apply the most recent education they’ve acquired to their jobs first. 

The platform also includes tools to support the application process. Visitors can view and download resume templates after adding their information, while registered users can save, revisit, and edit their resumes directly from their profile without downloading them on their personal devices. Additional user-friendly features, such as a high-contrast viewing mode, password visibility toggle during login, and easy navigation controls, improve accessibility and overall usability. DegreeStack exists to simplify the process of exploring academic and career paths by combining discovery, personalization, and practical tools into a single, easy-to-use platform. It solves the problem of scattered and overwhelming career and education information by bringing relevant opportunities and tools into one easy-to-use platform. 

---

## Key Features

### Authentication & User Profiles

* User authentication via Supabase Auth
* Persistent user profiles (`user_profiles`)
* Stores academic information (major, minor, school, skills)

---

### Academic Program Explorer

* Browse and search academic programs
* Filter by:

  * Degree level
  * Program type
  * Keywords
  * Career clusters
* Programs linked to campuses via relational mapping

---

### Career / Job Dataset

* Large-scale job/career dataset storage
* Supports:

  * Job title and company
  * Salary range
  * Required skills
  * Job type (Full-time, Internship, etc.)
  * Category and career cluster
* Designed for filtering and recommendation-style queries

---

### Resume Builder System

* Dynamic resume template system
* Users can:

  * Personalized resumes from templates
  * Save multiple versions,edit and regenerate resumes
  * Download on thier local device

* Template system includes:

  * Categories
  * Default data per template
  * Custom resume fields

---

## Tech Stack

### Frontend

* React (Vite)
* React Router
* Context API (Auth + UI state)

### Backend / Database

* Supabase (PostgreSQL)
* Supabase Auth
* Row-level relational database design

### Data Formats

* JSONB for flexible resume and program metadata
* Relational tables for core entities

---

## Database Architecture (High-Level)

### Core Tables

* `user_profiles` → user academic profile data
* `user_resumes` → stored resumes per user
* `resume_templates` → resume design templates
* `resume_categories` → grouping for templates
* `resume_default_data` → default resume content

### Academic System

* `programs` → academic program listings
* `campuses` → campus/location data
* `program_campuses` → links programs to campuses

### Career System

* `careers` → job postings and scraped career data

---

## Project Structure (Simplified)

```
src/
 ├── pages/           # App pages (Dashboard, Resume, Programs, Careers)
 ├── components/      # Reusable UI components
 ├── resume/          # Resume builder engine
 │    ├── engine/     # Template loading + rendering logic
 │    └── ResumeBuilder.jsx
 ├── supabase.jsx     # Supabase client
 └── App.jsx          # Routing
```

---

## Setup Instructions

### 1. Clone repository

```bash
git clone <repo-url>
cd DegreeStack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### 4. Run development server

```bash
npm run dev
```

---

### 5. Build for production

```bash
npm run build
```

---

## Key Design Principles

* Modular resume engine design (template-based rendering)
* Relational database structure for academic + career data
* JSONB flexibility for dynamic resume and program fields
* Separation of concerns between:

  * UI pages
  * Business logic (resume engine)
  * Data access (Supabase layer)

---

## Known Areas for Improvement

* Reduce frontend bundle size via code splitting
* Remove unused or legacy files
* Improve schema consistency (some legacy fields exist)
* Add stronger indexing for large dataset queries (careers/programs)
* Improve error handling and loading states in UI

---

## Future Enhancements

* AI-based career recommendations
* Resume scoring and optimization suggestions
* Advanced program-to-career matching engine
* Full search indexing system
* Admin dashboard for dataset management

---

## License

This project is for educational and portfolio use.
