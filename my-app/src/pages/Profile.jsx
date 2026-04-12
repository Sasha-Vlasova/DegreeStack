import React, { useState, useEffect, useMemo } from "react";
import "./Profile.css";
import { supabase } from "../supabase";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { searchPrograms } from "../utils/programSearch";

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    school: "",
    year: "",
    skills: ""
  });

  const [citizenships, setCitizenships] = useState([]);
  const [countryQuery, setCountryQuery] = useState("");
  const [countryResults, setCountryResults] = useState([]);

  const [majors, setMajors] = useState([]);
  const [minors, setMinors] = useState([]);
  const [majorQuery, setMajorQuery] = useState("");
  const [minorQuery, setMinorQuery] = useState("");
  const [programOptions, setProgramOptions] = useState([]);

  const [recommended, setRecommended] = useState([]);
  const [recommendationQuery, setRecommendationQuery] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchProgramOptions();
  }, []);

  async function fetchProgramOptions() {
    let allPrograms = [];
    let from = 0;
    const batchSize = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase
        .from("programs")
        .select("title")
        .order("title", { ascending: true })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("Program fetch error:", error);
        return;
      }

      if (!data || data.length === 0) {
        keepFetching = false;
        break;
      }

      allPrograms = [...allPrograms, ...data];

      if (data.length < batchSize) {
        keepFetching = false;
      } else {
        from += batchSize;
      }
    }

    const uniqueTitles = [
      ...new Map(
        allPrograms
          .filter((item) => item.title)
          .map((item) => [item.title.trim().toLowerCase(), item.title.trim()])
      ).values()
    ];

    setProgramOptions(uniqueTitles);
  }

  async function fetchProfile() {
    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserEmail(user.email);

    let { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      const { data: insertData } = await supabase
        .from("user_profiles")
        .insert({ user_id: user.id })
        .select()
        .single();

      data = insertData;
    }

    if (data) {
      setFormData({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        school: data.school || "",
        year: data.year || "",
        skills: data.skills || ""
      });

      setCitizenships(
        data.citizenship
          ? data.citizenship.split(",").map((c) => c.trim()).filter(Boolean)
          : []
      );

      setMajors(
        data.major
          ? data.major.split(",").map((m) => m.trim()).filter(Boolean)
          : []
      );

      setMinors(
        data.minors
          ? data.minors.split(",").map((m) => m.trim()).filter(Boolean)
          : []
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    if (countryQuery.length < 2) {
      setCountryResults([]);
      return;
    }

    const fetchCountries = async () => {
      try {
        const res = await fetch(
          `https://restcountries.com/v3.1/name/${countryQuery}`
        );
        const data = await res.json();

        const names = [
          ...new Map(
            data.map((c) => [c.name.common.toLowerCase(), c.name.common])
          ).values()
        ].sort((a, b) => a.localeCompare(b));

        setCountryResults(names);
      } catch {
        setCountryResults([]);
      }
    };

    fetchCountries();
  }, [countryQuery]);

  const rankPrograms = (query, selectedList) => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();

    return programOptions
      .filter(
        (option) =>
          option.toLowerCase().includes(q) &&
          !selectedList.includes(option)
      )
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        const aExact = aLower === q;
        const bExact = bLower === q;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aLower.startsWith(q);
        const bStarts = bLower.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aWords = aLower.split(/[\s:,-]+/);
        const bWords = bLower.split(/[\s:,-]+/);

        const aWord = aWords.includes(q);
        const bWord = bWords.includes(q);
        if (aWord && !bWord) return -1;
        if (!aWord && bWord) return 1;

        return a.length - b.length;
      })
      .slice(0, 20);
  };

  const filteredMajorOptions = useMemo(() => {
    return rankPrograms(majorQuery, majors);
  }, [majorQuery, majors, programOptions]);

  const filteredMinorOptions = useMemo(() => {
    return rankPrograms(minorQuery, minors);
  }, [minorQuery, minors, programOptions]);

  useEffect(() => {
    const fetchRecommended = async () => {
      let data = [];
      let usedQuery = "";

      for (const major of majors) {
        data = await searchPrograms(major);
        if (data?.length > 0) {
          usedQuery = major;
          break;
        }
      }

      if ((!data || data.length === 0) && minors.length > 0) {
        for (const minor of minors) {
          data = await searchPrograms(minor);
          if (data?.length > 0) {
            usedQuery = minor;
            break;
          }
        }
      }

      if ((!data || data.length === 0) && formData.skills) {
        const firstSkill = formData.skills.split(",")[0].trim();
        if (firstSkill) {
          data = await searchPrograms(firstSkill);
          if (data?.length > 0) {
            usedQuery = firstSkill;
          }
        }
      }

      setRecommendationQuery(usedQuery);
      setRecommended((data || []).slice(0, 3));
    };

    fetchRecommended();
  }, [majors, minors, formData.skills]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addChip = (value, list, setter, clearSetter) => {
    const trimmed = value.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setter([...list, trimmed]);
    clearSetter("");
  };

  const removeChip = (value, list, setter) => {
    setter(list.filter((item) => item !== value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      first_name: formData.firstName,
      last_name: formData.lastName,
      school: formData.school,
      year: formData.year,
      major: majors.join(", "),
      minors: minors.join(", "),
      skills: formData.skills,
      citizenship: citizenships.join(", ")
    });

    if (!error) {
      setIsEditing(false);
    }
  };

  const handleViewMore = () => {
    navigate("/education", {
      state: { searchQuery: recommendationQuery }
    });
  };

  const getWelcomeMessage = () => {
    if (formData.firstName && formData.lastName) {
      return `Welcome back, ${formData.firstName} ${formData.lastName}!`;
    }
    if (formData.firstName) {
      return `Welcome back, ${formData.firstName}!`;
    }
    return `Welcome to your profile, ${userEmail}!`;
  };

  if (!user && !loading) {
    return <Navigate to="/authorization" replace />;
  }

  if (loading) {
    return (
      <div className="profile">
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-layout">
      <div className="profile-main profile">
        <h1>{getWelcomeMessage()}</h1>

        {!isEditing ? (
          <div className="profile-view">
            <p>
              <strong>Name:</strong>{" "}
              {formData.firstName || formData.lastName
                ? `${formData.firstName} ${formData.lastName}`
                : "Not provided yet"}
            </p>
            <p><strong>School:</strong> {formData.school || "Not provided yet"}</p>
            <p><strong>Year:</strong> {formData.year || "Not provided yet"}</p>
            <p><strong>Majors:</strong> {majors.join(", ") || "Not provided yet"}</p>
            <p><strong>Minors:</strong> {minors.join(", ") || "Not provided yet"}</p>
            <p><strong>Skills:</strong> {formData.skills || "Not provided yet"}</p>
            <p><strong>Citizenship:</strong> {citizenships.join(", ") || "Not provided yet"}</p>
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-edit">
            <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
            <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
            <input name="school" placeholder="School" value={formData.school} onChange={handleChange} />
            <input name="year" placeholder="Year" value={formData.year} onChange={handleChange} />
            <input name="skills" placeholder="Skills" value={formData.skills} onChange={handleChange} />

            <label>Majors</label>
            <div className="selected-countries">
              {majors.map((major) => (
                <span key={major} className="country-chip">
                  {major}
                  <button type="button" onClick={() => removeChip(major, majors, setMajors)}>x</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a major..."
              value={majorQuery}
              onChange={(e) => setMajorQuery(e.target.value)}
            />
            {filteredMajorOptions.length > 0 && (
              <ul className="country-dropdown">
                {filteredMajorOptions.map((option) => (
                  <li
                    key={option}
                    className="country-option"
                    onClick={() => addChip(option, majors, setMajors, setMajorQuery)}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}

            <label>Minors</label>
            <div className="selected-countries">
              {minors.map((minor) => (
                <span key={minor} className="country-chip">
                  {minor}
                  <button type="button" onClick={() => removeChip(minor, minors, setMinors)}>x</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a minor..."
              value={minorQuery}
              onChange={(e) => setMinorQuery(e.target.value)}
            />
            {filteredMinorOptions.length > 0 && (
              <ul className="country-dropdown">
                {filteredMinorOptions.map((option) => (
                  <li
                    key={option}
                    className="country-option"
                    onClick={() => addChip(option, minors, setMinors, setMinorQuery)}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}

            <label>Citizenship</label>
            <div className="selected-countries">
              {citizenships.map((c) => (
                <span key={c} className="country-chip">
                  {c}
                  <button type="button" onClick={() => removeChip(c, citizenships, setCitizenships)}>x</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a country..."
              value={countryQuery}
              onChange={(e) => setCountryQuery(e.target.value)}
            />
            {countryResults.length > 0 && (
              <ul className="country-dropdown">
                {countryResults.map((country) => (
                  <li
                    key={country}
                    className="country-option"
                    onClick={() =>
                      addChip(country, citizenships, setCitizenships, setCountryQuery)
                    }
                  >
                    {country}
                  </li>
                ))}
              </ul>
            )}

            <button type="submit">Save</button>
          </form>
        )}
      </div>

      <div className="profile-recommendations">
        <h2>Recommended Education</h2>

        {recommended.length === 0 ? (
          <p>No recommendations yet.</p>
        ) : (
          <>
            {recommended.map((item) => (
              <div key={item.id} className="result-item">
                <h4>{item.title}</h4>
                <p><strong>Level:</strong> {item.program_level}</p>
                <p>
                  <strong>Campuses:</strong>{" "}
                  {item.program_campuses
                    ?.map((pc) => pc.campuses?.name)
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </p>
              </div>
            ))}
            <button onClick={handleViewMore}>View More</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;