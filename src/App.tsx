import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Sparkles,
  Users,
  Send,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Copy,
  Check,
  Flame,
  Scale,
  Calendar,
  Layers,
  Utensils
} from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  age: number;
  weight: number;
  goal: string;
  intensity: string;
  schedule: number;
  original_plan: string;
  updated_plan: string | null;
  nutrition_tip: string;
  feedback: string | null;
  created_at?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"generator" | "result" | "users" | "docs">("generator");
  
  // Form input states
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("102");
  const [age, setAge] = useState("26");
  const [weight, setWeight] = useState("72.5");
  const [goal, setGoal] = useState("muscle gain & strength");
  const [intensity, setIntensity] = useState("Medium");
  
  // Generation & feedback states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [feedbackUserId, setFeedbackUserId] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [copiedPlan, setCopiedPlan] = useState(false);

  // All users state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Load all users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !userId.trim()) return;

    setIsGenerating(true);
    setConfirmationMessage(null);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          user_id: Number(userId),
          age: Number(age) || 25,
          weight: Number(weight) || 70,
          goal: goal.trim() || "general fitness",
          intensity: intensity,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setFeedbackUserId(String(data.user.id));
        setFeedbackInput("");
        setActiveTab("result");
        fetchUsers();
      } else {
        alert(data.error || "Failed to generate plan");
      }
    } catch (err) {
      console.error("Generation error:", err);
      alert("Error generating workout plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackUserId.trim() || !feedbackInput.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(feedbackUserId),
          feedback: feedbackInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfirmationMessage(data.message || "Your plan has been updated based on your feedback!");
        if (currentUser && currentUser.id === Number(feedbackUserId)) {
          setCurrentUser({
            ...currentUser,
            updated_plan: data.updated_plan,
            feedback: feedbackInput.trim(),
          });
        }
        setFeedbackInput("");
        fetchUsers();
        // Scroll to confirmation box
        window.scrollTo({ top: 120, behavior: "smooth" });
      } else {
        alert(data.error || "Failed to update plan");
      }
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Error updating plan with feedback.");
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2000);
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      String(u.id).includes(userSearchQuery) ||
      u.goal.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP BAR CONTRACT */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            💪
          </div>
          <span className="text-lg font-bold tracking-tight text-white">FitBuddy</span>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab("generator")}
            className={`transition-colors hover:text-white pb-0.5 ${
              activeTab === "generator" ? "text-blue-400 border-b-2 border-blue-500 font-semibold" : ""
            }`}
          >
            Plan Generator
          </button>
          {currentUser && (
            <button
              onClick={() => setActiveTab("result")}
              className={`transition-colors hover:text-white pb-0.5 ${
                activeTab === "result" ? "text-blue-400 border-b-2 border-blue-500 font-semibold" : ""
              }`}
            >
              My Workout Plan
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab("users");
              fetchUsers();
            }}
            className={`transition-colors hover:text-white pb-0.5 ${
              activeTab === "users" ? "text-blue-400 border-b-2 border-blue-500 font-semibold" : ""
            }`}
          >
            All Users Dashboard
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`transition-colors hover:text-white pb-0.5 ${
              activeTab === "docs" ? "text-blue-400 border-b-2 border-blue-500 font-semibold" : ""
            }`}
          >
            Architecture & Specs
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("generator")}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/30 whitespace-nowrap"
          >
            + Create Plan
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 relative flex flex-col">
        {/* Background Gym Image with contrast scrim */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.94)), url('/static/images/gym-bg.jpg')`,
          }}
        />

        <div className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col justify-center">
          {/* TAB 1: GENERATOR HOME FORM */}
          {activeTab === "generator" && (
            <div className="w-full max-w-xl mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200">
              <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
                  <span>💪</span> FitBuddy - AI Workout Generator
                </h1>
                <p className="text-slate-600 text-sm mt-1.5">
                  Generate a personalized 7-day workout & nutrition plan tailored to your profile
                </p>
              </div>

              {/* Quick Presets */}
              <div className="mb-6 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Quick Fill Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername("Marcus Vance");
                      setUserId("201");
                      setAge("29");
                      setWeight("81.0");
                      setGoal("Hypertrophy & chest/back strength");
                      setIntensity("High");
                    }}
                    className="text-xs bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium px-2.5 py-1.5 rounded-md border border-slate-300 transition-colors"
                  >
                    Strength & Muscle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername("Elena Rostova");
                      setUserId("202");
                      setAge("24");
                      setWeight("62.5");
                      setGoal("Fat loss and athletic conditioning");
                      setIntensity("Medium");
                    }}
                    className="text-xs bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium px-2.5 py-1.5 rounded-md border border-slate-300 transition-colors"
                  >
                    Fat Loss & HIIT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername("David Kim");
                      setUserId("203");
                      setAge("35");
                      setWeight("75.0");
                      setGoal("Flexibility, posture & joint mobility");
                      setIntensity("Low");
                    }}
                    className="text-xs bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium px-2.5 py-1.5 rounded-md border border-slate-300 transition-colors"
                  >
                    Mobility & Core
                  </button>
                </div>
              </div>

              <form onSubmit={handleGeneratePlan} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Name:
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Alex Hunter"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="user_id" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      User ID:
                    </label>
                    <input
                      type="number"
                      id="user_id"
                      name="user_id"
                      required
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="101"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Age:
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      required
                      min="14"
                      max="100"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="28"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="weight" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Weight (kg):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="weight"
                      name="weight"
                      required
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="72.5"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="intensity" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Workout Intensity:
                    </label>
                    <select
                      id="intensity"
                      name="intensity"
                      required
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="goal" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Fitness Goal:
                  </label>
                  <input
                    type="text"
                    id="goal"
                    name="goal"
                    required
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., weight loss, flexibility"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white font-semibold rounded-lg text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating with Gemini 1.5 Pro & Flash...</span>
                    </>
                  ) : (
                    <span>Generate Plan</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                <button
                  onClick={() => {
                    setActiveTab("users");
                    fetchUsers();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  📋 View All Registered Users & Plans →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONALIZED WORKOUT RESULT PAGE */}
          {activeTab === "result" && currentUser && (
            <div className="w-full max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200">
              <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
                  <span>🏋️</span> Your Personalized Workout Plan
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  Custom tailored 7-day routine and dietary guidance
                </p>
              </div>

              {/* Confirmation Banner */}
              {confirmationMessage && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-500 rounded-xl text-emerald-800 font-semibold text-sm flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>✅ {confirmationMessage}</span>
                </div>
              )}

              {/* User Information Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  User Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Name</span>
                    <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">User ID</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{currentUser.id}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Age</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{currentUser.age}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Weight</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{currentUser.weight} kg</span>
                  </div>
                  <div className="sm:col-span-1">
                    <span className="block text-xs text-slate-500 font-medium">Fitness Goal</span>
                    <span className="text-sm font-bold text-blue-700 capitalize">{currentUser.goal}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Intensity</span>
                    <span className="text-sm font-bold text-slate-900">{currentUser.intensity}</span>
                  </div>
                </div>
              </div>

              {/* Workout Plan Section in <pre> */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>7-Day Workout Plan</span>
                  </h2>
                  <button
                    onClick={() => copyToClipboard(currentUser.original_plan)}
                    className="text-xs flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPlan ? "Copied" : "Copy Plan"}</span>
                  </button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 overflow-x-auto">
                  <pre className="font-mono text-xs md:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {currentUser.original_plan}
                  </pre>
                </div>
              </div>

              {/* Nutrition Tip Section */}
              <div className="mb-6">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span>💡</span> Nutrition Tip
                </h2>
                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 border-l-4 border-l-blue-600 rounded-xl p-4.5 text-blue-950 text-sm leading-relaxed shadow-sm">
                  {currentUser.nutrition_tip}
                </div>
              </div>

              {/* Updated Workout Plan Section (if feedback updated) */}
              {currentUser.updated_plan && (
                <div className="mb-6 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-emerald-800 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                      <span>Updated Workout Plan (Based on Your Feedback)</span>
                    </h2>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-200 border-l-4 border-l-emerald-500 rounded-xl p-4.5 overflow-x-auto">
                    <pre className="font-mono text-xs md:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {currentUser.updated_plan}
                    </pre>
                  </div>
                </div>
              )}

              {/* Feedback Form Section */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>📝</span> Share Your Feedback & Update Plan
                  </h2>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Adaptive Plan Revision
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Submit feedback to adjust, update, or optimize your plan (e.g. &quot;Add yoga on rest days&quot;, &quot;Include more core
                  exercises&quot;, &quot;Focus more on bodyweight&quot;).
                </p>

                {/* Quick suggestions for feedback */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Quick Update Suggestions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Add 20 mins yoga & stretching on Day 4",
                      "Include more abdominal core exercises",
                      "Reduce intensity for beginner joints",
                      "Add dumbbell supersets on push days",
                      "Focus more on home bodyweight exercises"
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFeedbackInput(suggestion)}
                        className="text-[11px] bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium px-2 py-1 rounded-md border border-slate-200 transition-colors"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <label htmlFor="feedback_user_id" className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Unique User ID:
                    </label>
                    <input
                      type="number"
                      id="feedback_user_id"
                      required
                      value={feedbackUserId}
                      onChange={(e) => setFeedbackUserId(e.target.value)}
                      placeholder="Enter the same User ID used to generate your plan"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="feedback" className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Feedback / Plan Update Request:
                    </label>
                    <textarea
                      id="feedback"
                      required
                      rows={3}
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Let us know how we can update your plan..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-y"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white font-semibold rounded-lg text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Plan with Gemini 1.5 Pro...</span>
                      </>
                    ) : (
                      <span>Update Workout Plan Now</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Bottom Nav Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => setActiveTab("generator")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  ← Generate Another Plan
                </button>
                <button
                  onClick={() => {
                    setActiveTab("users");
                    fetchUsers();
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  📋 View All Users & Plans →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ALL USERS DASHBOARD (ADMIN VIEW) */}
          {activeTab === "users" && (
            <div className="w-full max-w-5xl mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span>📋</span> FitBuddy - All Users & Workout Plans
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1">
                    Overview of all registered users, personalized plans, and feedback-based revisions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchUsers}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => setActiveTab("generator")}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    + Generate New Plan
                  </button>
                </div>
              </div>

              {/* Search filter */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Filter users by name, ID, or goal..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Table Container */}
              <div className="w-full overflow-x-auto border border-slate-300 rounded-xl shadow-sm">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white font-semibold">
                      <th className="p-3 border border-blue-500 whitespace-nowrap">User ID</th>
                      <th className="p-3 border border-blue-500 whitespace-nowrap">Name</th>
                      <th className="p-3 border border-blue-500 whitespace-nowrap">Age</th>
                      <th className="p-3 border border-blue-500 whitespace-nowrap">Weight (kg)</th>
                      <th className="p-3 border border-blue-500 whitespace-nowrap">Goal</th>
                      <th className="p-3 border border-blue-500 whitespace-nowrap">Intensity</th>
                      <th className="p-3 border border-blue-500 min-w-[280px]">Original Plan</th>
                      <th className="p-3 border border-blue-500 min-w-[280px]">Updated Plan</th>
                      <th className="p-3 border border-blue-500 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 align-top font-bold text-slate-900 border border-slate-200 tabular-nums">
                            {user.id}
                          </td>
                          <td className="p-3 align-top font-medium text-slate-900 border border-slate-200 whitespace-nowrap">
                            {user.name}
                          </td>
                          <td className="p-3 align-top text-slate-700 border border-slate-200 tabular-nums">
                            {user.age}
                          </td>
                          <td className="p-3 align-top text-slate-700 border border-slate-200 tabular-nums whitespace-nowrap">
                            {user.weight} kg
                          </td>
                          <td className="p-3 align-top font-semibold text-blue-600 border border-slate-200">
                            {user.goal}
                          </td>
                          <td className="p-3 align-top text-slate-700 border border-slate-200">
                            {user.intensity}
                          </td>
                          <td className="p-3 align-top border border-slate-200">
                            <pre className="font-mono text-[11px] leading-relaxed text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {user.original_plan || "N/A"}
                            </pre>
                          </td>
                          <td className="p-3 align-top border border-slate-200">
                            {user.updated_plan ? (
                              <pre className="font-mono text-[11px] leading-relaxed text-slate-800 bg-emerald-50/70 p-2.5 rounded border border-emerald-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {user.updated_plan}
                              </pre>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Not updated</span>
                            )}
                          </td>
                          <td className="p-3 align-top border border-slate-200 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setCurrentUser(user);
                                setFeedbackUserId(String(user.id));
                                setFeedbackInput("");
                                setActiveTab("result");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                            >
                              Update Plan
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          {isLoadingUsers ? "Loading users..." : "No users found. Generate a plan first!"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE & SPECS */}
          {activeTab === "docs" && (
            <div className="w-full max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  FitBuddy Architecture & Project Milestones
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  Complete breakdown of core functionalities, file hierarchy, and Gemini API integration
                </p>
              </div>

              {/* Grid of Milestones */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <h3 className="text-sm font-bold text-blue-700 flex items-center gap-1.5 mb-2">
                    <Dumbbell className="w-4 h-4" />
                    Milestone 2: Core Functionalities
                  </h3>
                  <ul className="text-xs text-slate-700 space-y-2">
                    <li>
                      <strong>Workout Plan Generation:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">generate_workout_gemini()</code> in <code className="bg-slate-200 px-1 py-0.5 rounded">app/gemini_generator.py</code>. 7-day structured plan with Warm-up, Main Workout, and Cooldown.
                    </li>
                    <li>
                      <strong>Nutrition Tip Generation:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">generate_nutrition_tip_with_flash()</code> in <code className="bg-slate-200 px-1 py-0.5 rounded">app/gemini_flash_generator.py</code>. Emphasizes protein at every meal (chicken, fish, beans, Greek yogurt) for satiety, metabolism, and muscle building.
                    </li>
                    <li>
                      <strong>Feedback-Based Plan Updating:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">update_workout_plan()</code> in <code className="bg-slate-200 px-1 py-0.5 rounded">app/updated_plan.py</code>. Revises plan based on user feedback.
                    </li>
                    <li>
                      <strong>User & Plan Storage:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">app/database.py</code>. SQLite + SQLAlchemy preserving both original and updated plans.
                    </li>
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <h3 className="text-sm font-bold text-blue-700 flex items-center gap-1.5 mb-2">
                    <Layers className="w-4 h-4" />
                    Activity 2.2 & 4.2: Routing & Jinja2 Templates
                  </h3>
                  <ul className="text-xs text-slate-700 space-y-2">
                    <li>
                      <strong>FastAPI Routing:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">app/routes.py</code> linking HTML forms to Gemini generators and database.
                    </li>
                    <li>
                      <strong>Pydantic Schemas:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">app/schemas.py</code> (<code className="bg-slate-200 px-1 py-0.5 rounded">UserInput</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">FeedbackRequest</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">WorkoutRequest</code>).
                    </li>
                    <li>
                      <strong>Dynamic Templates:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">templates/index.html</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">templates/result.html</code> with &lt;pre&gt; blocks and confirmation banner, and <code className="bg-slate-200 px-1 py-0.5 rounded">templates/all_users.html</code> with Jinja2 <code className="bg-slate-200 px-1 py-0.5 rounded">&#123;% for user in users %&#125;</code> loop.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Endpoints Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Active Backend Endpoints</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Endpoint</th>
                        <th className="p-2.5">Function</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-bold text-blue-600">GET</td>
                        <td className="p-2.5 font-mono">/</td>
                        <td className="p-2.5">home_page()</td>
                        <td className="p-2.5 text-slate-600">Renders index.html form</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-emerald-600">POST</td>
                        <td className="p-2.5 font-mono">/generate-workout</td>
                        <td className="p-2.5">generate_workout_form()</td>
                        <td className="p-2.5 text-slate-600">Processes form, calls Gemini, renders result.html</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-emerald-600">POST</td>
                        <td className="p-2.5 font-mono">/submit-feedback</td>
                        <td className="p-2.5">submit_feedback_form()</td>
                        <td className="p-2.5 text-slate-600">Revises plan with feedback & saves updated plan</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-600">GET</td>
                        <td className="p-2.5 font-mono">/view-all-users</td>
                        <td className="p-2.5">view_all_users()</td>
                        <td className="p-2.5 text-slate-600">Admin table of all registered users & plans</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-emerald-600">POST</td>
                        <td className="p-2.5 font-mono">/api/generate-plan</td>
                        <td className="p-2.5">JSON API</td>
                        <td className="p-2.5 text-slate-600">Full-stack React generator endpoint</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/80 px-6 py-4 text-center text-xs text-slate-500">
        FitBuddy AI Workout Generator · Personalized 7-Day Fitness & Nutrition Intelligence
      </footer>
    </div>
  );
}
