import React, { useState, useEffect } from "react";
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

  const [countryQuery, setCountryQuery] = useState("");
  const [countryResults, setCountryResults] = useState([]);
  const [citizenships, setCitizenships] = useState([]);

  const [recommended, setRecommended] = useState([]);
  const [recommendationQuery, setRecommendationQuery] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    school: "",
    year: "",
    major: "",
    minors: "",
    skills: "",
    citizenship: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (countryQuery.length < 2) {
      setCountryResults([]);
      return;
    }

    const fetchByName = async () => {
      try {
        const res = await fetch(
          `https://restcountries.com/v3.1/name/${countryQuery}`
        );
        const data = await res.json();

        const names = data
          .map((c) => c.name.common)
          .sort((a, b) => a.localeCompare(b));

        setCountryResults(names);
      } catch (err) {
        setCountryResults([]);
      }
    };

    fetchByName();
  }, [countryQuery]);

  useEffect(() => {
    const fetchRecommended = async () => {
      let data = [];
      let usedQuery = "";

      if (formData.major) {
        data = await searchPrograms(formData.major);
        if (data?.length > 0) usedQuery = formData.major;
      }

      if ((!data || data.length === 0) && formData.minors) {
        data = await searchPrograms(formData.minors);
        if (data?.length > 0) usedQuery = formData.minors;
      }

      if ((!data || data.length === 0) && formData.skills) {
        const firstSkill = formData.skills.split(",")[0].trim();
        if (firstSkill) {
          data = await searchPrograms(firstSkill);
          if (data?.length > 0) usedQuery = firstSkill;
        }
      }

      setRecommendationQuery(usedQuery);
      setRecommended((data || []).slice(0, 3));
    };

    fetchRecommended();
  }, [formData.major, formData.skills, formData.minors]);

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
        major: data.major || "",
        minors: data.minors || "",
        skills: data.skills || "",
        citizenship: data.citizenship || ""
      });

      if (data.citizenship) {
        setCitizenships(data.citizenship.split(",").map((c) => c.trim()));
      }
    }

    setLoading(false);
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  function addCitizenship(country) {
    if (!citizenships.includes(country)) {
      setCitizenships([...citizenships, country]);
    }
    setCountryQuery("");
    setCountryResults([]);
  }

  function removeCitizenship(country) {
    setCitizenships(citizenships.filter((c) => c !== country));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        school: formData.school,
        year: formData.year,
        major: formData.major,
        minors: formData.minors,
        skills: formData.skills,
        citizenship: citizenships.join(", ")
      })
      .select()
      .single();

    if (!error && data) {
      setIsEditing(false);
    }
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

  const handleViewMore = () => {
    navigate("/education", {
      state: { searchQuery: recommendationQuery }
    });
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
            <p><strong>Major:</strong> {formData.major || "Not provided yet"}</p>
            <p><strong>Minors:</strong> {formData.minors || "Not provided yet"}</p>
            <p><strong>Skills:</strong> {formData.skills || "Not provided yet"}</p>
            <p>
              <strong>Citizenship:</strong>{" "}
              {citizenships.length > 0
                ? citizenships.join(", ")
                : "Not provided yet"}
            </p>

            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-edit">
            <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
            <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
            <input name="school" placeholder="School" value={formData.school} onChange={handleChange} />
            <input name="year" placeholder="Year" value={formData.year} onChange={handleChange} />
            <input name="major" placeholder="Major" value={formData.major} onChange={handleChange} />
            <input name="minors" placeholder="Minors" value={formData.minors} onChange={handleChange} />
            <input name="skills" placeholder="Skills" value={formData.skills} onChange={handleChange} />
            <button type="submit">Save</button>
          </form>
        )}
      </div>

      <div className="profile-recommendations">
        <h2>Recommended</h2>

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

            <button className="view-more-btn" onClick={handleViewMore}>
              View More
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;