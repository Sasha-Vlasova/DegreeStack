import React, { useState, useEffect } from "react";
import "./Profile.css";
import { supabase } from "../supabase";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);

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

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code === "PGRST116") { 
      const { data: insertData, error: insertError } = await supabase
        .from("user_profiles")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile row:", insertError);
        return;
      }

      data = insertData;
    } else if (error) {
      console.error("Error fetching profile:", error);
      return;
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
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
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
        citizenship: formData.citizenship
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving profile:", error);
    } else if (data) {
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
      setIsEditing(false);
    }
  };

  return (
    <div className="profile">
      {!isEditing ? (
        <div>
          <h1>{formData.firstName} {formData.lastName}</h1>
          <p><strong>School:</strong> {formData.school}</p>
          <p><strong>Year:</strong> {formData.year}</p>
          <p><strong>Major:</strong> {formData.major}</p>
          <p><strong>Minors:</strong> {formData.minors}</p>
          <p><strong>Skills:</strong> {formData.skills}</p>
          <p><strong>Citizenship:</strong> {formData.citizenship}</p>
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
          <input name="school" placeholder="School" value={formData.school} onChange={handleChange} />
          <input name="year" placeholder="Year (Freshman, Senior...)" value={formData.year} onChange={handleChange} />
          <input name="major" placeholder="Major" value={formData.major} onChange={handleChange} />
          <input name="minors" placeholder="Minors" value={formData.minors} onChange={handleChange} />
          <input name="skills" placeholder="Skills (comma separated)" value={formData.skills} onChange={handleChange} />
          <input name="citizenship" placeholder="Citizenship" value={formData.citizenship} onChange={handleChange} />
          <button type="submit">Save</button>
        </form>
      )}
    </div>
  );
}

export default Profile;