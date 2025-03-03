import { createClient } from "@supabase/supabase-js";
import axios from "axios";

// 🔹 Load Environment Variables Safely (No Hardcoded Keys)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Supabase credentials are missing. Check your .env file!");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔹 Backend API URL (For fetching assets & metrics)
const API_URL = `${window.location.protocol}//${window.location.hostname}:9000`;

/** ======================
 *  🔹 AUTHENTICATION METHODS (Fixed Sign Up)
 *  ====================== */

// ✅ Sign Up User & Insert into public.users
export const signUp = async (email, password, fullName, industry, companySize) => {
  // Step 1: Create user in auth.users (handled by Supabase)
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const user = data?.user; // Get the created user

  // Step 2: Insert into public.users table (if user was created)
  if (user) {
    const { error: insertError } = await supabase
      .from("users") // Make sure this matches your Supabase table name
      .insert([
        {
          id: user.id, // Matches auth.users UUID
          email,
          full_name: fullName,
          industry,
          company_size: companySize,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error("❌ Error inserting user into public.users:", insertError.message);
      throw insertError;
    }
  }

  return user;
};

// ✅ Get User Profile from `public.users`
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("❌ Error fetching user profile:", error.message);
    return null;
  }

  return data;
};

// ✅ Sign In User
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
  return data.user;
};

// ✅ Sign Out User
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ✅ Get Current User
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user || null;
};

/** ======================
 *  🔹 DATA FETCHING METHODS
 *  ====================== */

// ✅ Fetch Asset Data
export const fetchAssets = async () => {
  try {
    console.log("📡 Fetching assets from:", `${API_URL}/assets`);
    const response = await axios.get(`${API_URL}/assets`);
    return response.data || [];
  } catch (error) {
    console.error("❌ Error fetching assets:", error);
    return [];
  }
};

// ✅ Fetch Company Metrics
export const fetchMetrics = async () => {
  try {
    console.log("📡 Fetching company metrics from:", `${API_URL}/metrics`);
    const response = await axios.get(`${API_URL}/metrics`);
    return response.data || {
      totalAssets: 0,
      activePMPlans: 0,
      nextPMTask: "N/A",
      locations: [],
    };
  } catch (error) {
    console.error("❌ Error fetching metrics:", error);
    return {
      totalAssets: 0,
      activePMPlans: 0,
      nextPMTask: "N/A",
      locations: [],
    };
  }
};

export default supabase;
