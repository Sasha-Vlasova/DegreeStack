import React, { useState } from "react";
import "./Education.css";

function Education() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    school: "",
    type: "",
    location: ""
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = () => {
    console.log("Searching:", searchQuery, filters);
  };

  return (
    <div className="education-page">
      <h1>Find Education Opportunities</h1>

      <div className="search-filters">
        <input
          type="text"
          placeholder="Search for a program, school, or keyword..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <select name="school" value={filters.school} onChange={handleFilterChange}>
          <option value="">All Schools</option>
          <option value="University of Wisconsin Madison">UW Madison</option>
          <option value="University of Wisconsin Milwaukee">UW Milwaukee</option>
          <option value="University of Wisconsin Green Bay">UW Green Bay</option>
        </select>

        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="grad">Graduate</option>
          <option value="certificate">Certificate</option>
        </select>

        <select name="location" value={filters.location} onChange={handleFilterChange}>
          <option value="">All Locations</option>
          <option value="us">USA</option>
        </select>

        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="results">
        {/* Render search results here */}
      </div>
    </div>
  );
}

export default Education;