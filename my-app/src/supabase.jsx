// src/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dddcbdblonuypmetwdey.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZGNiZGJsb251eXBtZXR3ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzE4MzQsImV4cCI6MjA4NzYwNzgzNH0.yjMRAzitkus8Mh-Pk7xi_SY1JJ-9rcS0IOWCzTExK-I";

export const supabase = createClient(supabaseUrl, supabaseKey);