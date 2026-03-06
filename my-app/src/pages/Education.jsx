import React, { useState } from "react";
import "./Education.css";

function Education() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    field_of_study: "",
    type: "",
    school: "",
    location: ""
  });

  const [results, setResults] = useState([]);

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
      <h1>Find Further Education Opportunities</h1>

      <div className="search-filters">
        <input
          type="text"
          placeholder="Search for a program, school, or keyword..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <select name="field_of_study" value={filters.field_of_study} onChange={handleFilterChange}>
          <option value="">All Field of Studies</option>
          <option value="science">Science</option>
          <option value="technology">Technology</option>
          <option value="engineering">Engineering</option>
          <option value="mathematics">Mathematics</option>
        </select>

        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Program Types</option>
          <option value="master">Masters</option>
          <option value="doctorate">Doctorate</option>
          <option value="certificate">Certificate</option>
        </select>

        <select name="school" value={filters.school} onChange={handleFilterChange}>
          <option value="">All Schools</option>
          <option value="University of Wisconsin Madison">UW Madison</option>
          <option value="University of Wisconsin Milwaukee">UW Milwaukee</option>
          <option value="University of Wisconsin Green Bay">UW Green Bay</option>
        </select>

        <select name="location" value={filters.location} onChange={handleFilterChange}>
          <option value="">All Locations</option>
          <option value="wisconsin">Wisconsin</option>
        </select>

        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="results">
        {results.length === 0 ? (
          <p className="no-results">No results found :(</p> 
        ) : (
          results.map((item, index) => (
            <div key={index} className="result-item">
              {item.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Education;