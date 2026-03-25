import React, { useState, useEffect } from "react";
import "./Education.css";
import { supabase } from "../supabase";

function Education() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [filters, setFilters] = useState({
    field_of_study: "",
    type: "",
    school: "",
    location: ""
  });

  const [results, setResults] = useState([]);

  // Handle typing in search box
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle dropdown changes
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  // Main search function
  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    let query = supabase
      .from("programs")
      .select(`
        id,
        title,
        program_level,
        program_type,
        career_clusters,
        campuses!inner (
          code,
          name
        )
      `)


    if (searchQuery && searchQuery.trim() !== "") {
      query = query.or(`
        title.ilike.%${searchQuery}%,
        keywords.ilike.%${searchQuery}%
      `);
    }

    if (filters.type) {
      query = query.eq("program_level", filters.type);
    }

    if (filters.school) {
      query = query.eq("campuses.name", filters.school);
    }

    // 🔍 Filter by field of study (career_clusters array)
    //if (filters.field_of_study && filters.field_of_study !== "") {
    //  query = query.contains("career_clusters", [filters.field_of_study]);
    //}

    const { data, error } = await query;
    console.log("RAW DATA:", data);

    if (error) {
      console.error("Error fetching programs:", error);
    } else {
      console.log("RESULTS:", data); // helpful for debugging
      setResults(data);
    }

    setLoading(false);
  };

  // Auto-run search when filters or query change
  useEffect(() => {
    handleSearch();
  }, [searchQuery, filters]);

  return (
    <div className="education-page">
      <h1>Find Further Education Opportunities</h1>

      <div className="search-filters">
        <input
          type="text"
          placeholder="Search for a program, school, or keyword..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <select
          name="field_of_study"
          value={filters.field_of_study}
          onChange={handleFilterChange}
        >
          <option value="">All Field of Studies</option>
          <option value="science">Science</option>
          <option value="technology">Technology</option>
          <option value="engineering">Engineering</option>
          <option value="mathematics">Mathematics</option>
        </select>

        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">All Program Types</option>
          <option value="Masters">Masters</option>
          <option value="Doctorate">Doctorate</option>
          <option value="Certificate">Certificate</option>
          <option value="Post Bachelors">Post Bachelors</option>
          <option value="Education Specialist">Education Specialist</option>
        </select>

        <select
          name="school"
          value={filters.school}
          onChange={handleFilterChange}
        >
          <option value="">All Schools</option>
          <option value="University of Wisconsin Madison">UW Madison</option>
          <option value="University of Wisconsin Milwaukee">UW Milwaukee</option>
          <option value="University of Wisconsin Green Bay">UW Green Bay</option>
        </select>

        <select
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
        >
          <option value="">All Locations</option>
          <option value="wisconsin">Wisconsin</option>
        </select>

        {/* Optional now, since auto-search exists */}
        <button onClick={handleSearch}>Refresh</button>
      </div>

      <div className="results">
        {loading ? (
          <p>Loading...</p>
        ) : !hasSearched ? (
          <p>Start searching to see results</p>
        ) : results.length === 0 ? (
          <p className="no-results">No results found :(</p>
        ) : (
          results.map((item) => (
            <div key={item.id} className="result-item">
              <h3>{item.title}</h3>

              <p>
                <strong>Level:</strong> {item.program_level}
              </p>

              <p>
                <strong>Campuses:</strong>{" "}
                {item.campuses?.map((c) => c.name).join(", ")}
              </p>

              {item.program_type && (
                <p>
                  <strong>Type:</strong> {item.program_type}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Education;