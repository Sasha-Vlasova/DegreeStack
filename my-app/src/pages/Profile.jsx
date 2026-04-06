import React, { useState, useEffect } from "react";
/*useState lets your component store and update values;
useEffect lets  component run code when something happens (like when the page loads). */
import "./Profile.css";
import { supabase } from "../supabase";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Profile() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false); //  whether the user is editing their profile
  const [loading, setLoading] = useState(true); //whether the profile is still being fetched
  const [userEmail, setUserEmail] = useState("");

  // Multi-citizenship states
  const [countryQuery, setCountryQuery] = useState(""); //the user types into the citizenship search box
  const [countryResults, setCountryResults] = useState([]); //List of matching countries from the API
  const [citizenships, setCitizenships] = useState([]); //Array of selected citizenships

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    school: "",
    year: "",
    major: "",
    minors: "",
    skills: "",
    citizenship: "" // stored as comma-separated string
  });

  useEffect(() => {
    fetchProfile();
  }, []); //runs once when the component loads

  // Fetch matching countries as user types
  useEffect(() => {
    if (countryQuery.length < 2) {
      setCountryResults([]);
      return;
    }

    const fetchByName = async () => {
      try {
        const res = await fetch(`https://restcountries.com/v3.1/name/${countryQuery}`); // i took the struckture from their website https://restcountries.com/
        const data = await res.json(); 
        //Calls the REST Countries API. Gets a list of matching countries

        const names = data //Extracts each country’s common name&Sorts alphabetically.
          .map((c) => c.name.common)
          .sort((a, b) => a.localeCompare(b));

        setCountryResults(names);
      } catch (err) {
        setCountryResults([]); //Saves the results so they appear in the dropdown.
      }
    };

    fetchByName();
  }, [countryQuery]);

  async function fetchProfile() {
    setLoading(true); //Marks the page as loading.

    const { data: { user } } = await supabase.auth.getUser(); //Asks Supabase for the current user.
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

    if (error && error.code === "PGRST116") { //"no rows found"
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

      // Load saved citizenships into array
      if (data.citizenship) {
        setCitizenships(data.citizenship.split(",").map((c) => c.trim()));
      }
    }

    setLoading(false);
  }

  const handleChange = (e) => { //Updates the correct field when the user types (like u typing name and it updates it at the same time)
    setFormData({
      ...formData, //copy everything that is already inside formData
      [e.target.name]: e.target.value //If the input name is "firstName", update formData.firstName.
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

  const handleSubmit = async (e) => { //Prevents page reload
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
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
        citizenship: citizenships.join(", ") // save as string
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
    <div className="profile">
      <h1>{getWelcomeMessage()}</h1>

      {!isEditing ? (
        <div className="profile-view">
          <p><strong>Name:</strong> {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : "Not provided yet"}</p>
          <p><strong>School:</strong> {formData.school || "Not provided yet"}</p>
          <p><strong>Year:</strong> {formData.year || "Not provided yet"}</p>
          <p><strong>Major:</strong> {formData.major || "Not provided yet"}</p>
          <p><strong>Minors:</strong> {formData.minors || "Not provided yet"}</p>
          <p><strong>Skills:</strong> {formData.skills || "Not provided yet"}</p>
          <p><strong>Citizenship:</strong> 
            {citizenships.length > 0 ? citizenships.join(", ") : "Not provided yet"}
          </p>

          {Object.values(formData).some(v => v === "") && (
            <p className="profile-hint">
              Your profile is incomplete — fill in missing fields to personalize your experience.
            </p>
          )}

          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-edit">
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
          <input name="school" placeholder="School" value={formData.school} onChange={handleChange} />
          <input name="year" placeholder="Year (Freshman, Senior...)" value={formData.year} onChange={handleChange} />
          <input name="major" placeholder="Major" value={formData.major} onChange={handleChange} />
          <input name="minors" placeholder="Minors" value={formData.minors} onChange={handleChange} />
          <input name="skills" placeholder="Skills (comma separated)" value={formData.skills} onChange={handleChange} />

          <label>Citizenship</label>

          <div className="selected-countries">
            {citizenships.map((c) => (
              <span key={c} className="country-chip">
                {c}
                <button type="button" onClick={() => removeCitizenship(c)}>x</button>
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
                  onClick={() => addCitizenship(country)}
                >
                  <span className="checkbox-box"></span>
                  <span>{country}</span>
                </li>
              ))}
            </ul>
          )}

          <button type="submit">Save</button>
        </form>
      )}
    </div>
  );
}

export default Profile;
