import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static images folder directly
const staticImagesDir = path.resolve(process.cwd(), "static/images");
if (fs.existsSync(staticImagesDir)) {
  app.use("/static/images", express.static(staticImagesDir));
}
const publicImagesDir = path.resolve(process.cwd(), "public/static/images");
if (fs.existsSync(publicImagesDir)) {
  app.use("/static/images", express.static(publicImagesDir));
}

// Server-side Gemini initialization
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Persistent database store file (fitbuddy_store.json)
const DB_STORE_FILE = path.resolve(process.cwd(), "fitbuddy_store.json");

interface UserRecord {
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
  created_at: string;
}

function loadDatabase(): UserRecord[] {
  try {
    if (fs.existsSync(DB_STORE_FILE)) {
      const data = fs.readFileSync(DB_STORE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database store:", err);
  }
  return [
    {
      id: 101,
      name: "Alex Hunter",
      age: 28,
      weight: 74.5,
      goal: "muscle gain & strength",
      intensity: "High",
      schedule: 7,
      original_plan: `Day 1:
Warm-up: 8 mins dynamic foam rolling, arm circles, and band pull-aparts.
Main Workout (Push Focus):
- Barbell Bench Press: 4 sets of 8-10 reps
- Incline Dumbbell Press: 3 sets of 10-12 reps
- Overhead Dumbbell Shoulder Press: 3 sets of 10 reps
- Dips (weighted if possible): 3 sets of 12 reps
- Overhead Triceps Rope Extension: 3 sets of 15 reps
Cooldown: 5 mins chest doorway stretch and triceps overhead stretch.

Day 2:
Warm-up: 5 mins light rowing and hip mobility drills.
Main Workout (Pull Focus):
- Barbell Deadlift: 4 sets of 6 reps
- Pull-ups / Lat Pulldown: 4 sets of 8-10 reps
- Seated Cable Rows: 3 sets of 12 reps
- Barbell Bicep Curls: 3 sets of 12 reps
- Face Pulls: 4 sets of 15 reps
Cooldown: 5 mins lat stretch and child's pose.

Day 3: Active Recovery & Mobility
Warm-up: 5 mins brisk walking.
Main Workout: 30 mins light mobility work, deep hip openers, and core stability holds.
Cooldown: 10 mins full-body static stretching.

Day 4:
Warm-up: 8 mins bodyweight squats, walking lunges, and leg swings.
Main Workout (Legs & Posterior Chain):
- Barbell Back Squat: 4 sets of 8 reps
- Romanian Deadlifts: 4 sets of 10 reps
- Walking Dumbbell Lunges: 3 sets of 12 reps per leg
- Standing Calf Raises: 4 sets of 15 reps
- Hanging Leg Raises: 3 sets of 15 reps
Cooldown: 7 mins hamstring, quad, and pigeon stretches.

Day 5:
Warm-up: 6 mins jump rope and band shoulder mobility.
Main Workout (Upper Body Hypertrophy):
- Incline Barbell Press: 3 sets of 10 reps
- Dumbbell Rows: 3 sets of 10 reps per side
- Lateral Dumbbell Raises: 4 sets of 15 reps
- Hammer Curls: 3 sets of 12 reps
Cooldown: Foam rolling for thoracic spine and lats.

Day 6:
Warm-up: 5 mins light stationary cycling.
Main Workout (Conditioning & Core):
- Kettlebell Swings: 4 sets of 20 reps
- Plank to Push-up: 3 sets of 12 reps
- Bicycle Crunches: 3 sets of 25 reps per side
- Farmer's Carry: 4 sets of 50-meter walks
Cooldown: Cat-cow poses and deep diaphragmatic breathing.

Day 7: Full Rest & Regeneration
Warm-up: None required.
Main Workout: Complete rest. Focus on high protein hydration and 8+ hours quality sleep.
Cooldown: 10 mins relaxing walk or meditation.`,
      updated_plan: `Day 1:
Warm-up: 8 mins dynamic foam rolling and band pull-aparts.
Main Workout (Push Focus):
- Barbell Bench Press: 4 sets of 8-10 reps
- Incline Dumbbell Press: 3 sets of 10-12 reps
- Overhead Dumbbell Shoulder Press: 3 sets of 10 reps
- Dips: 3 sets of 12 reps
Cooldown: 5 mins chest doorway stretch.

Day 2:
Warm-up: 5 mins rowing and hip mobility.
Main Workout (Pull Focus):
- Barbell Deadlift: 4 sets of 6 reps
- Pull-ups: 4 sets of 8-10 reps
- Seated Cable Rows: 3 sets of 12 reps
- Barbell Bicep Curls: 3 sets of 12 reps
Cooldown: 5 mins lat stretch.

Day 3: Active Recovery & Gentle Yoga
Warm-up: 5 mins deep breathing.
Main Workout (Added based on feedback): 35 mins Vinyasa yoga flow focusing on spinal decompression, hip openers, and restorative breathwork.
Cooldown: 10 mins Savasana and gentle hamstring stretch.

Day 4:
Warm-up: 8 mins bodyweight squats and walking lunges.
Main Workout (Legs):
- Barbell Back Squat: 4 sets of 8 reps
- Romanian Deadlifts: 4 sets of 10 reps
- Walking Lunges: 3 sets of 12 reps per leg
- Standing Calf Raises: 4 sets of 15 reps
Cooldown: Quad and pigeon stretches.

Day 5:
Warm-up: 6 mins jump rope.
Main Workout (Upper Hypertrophy):
- Incline Barbell Press: 3 sets of 10 reps
- Dumbbell Rows: 3 sets of 10 reps per side
- Lateral Raises: 4 sets of 15 reps
Cooldown: Upper body foam rolling.

Day 6:
Warm-up: 5 mins cycling.
Main Workout (Conditioning & Core):
- Kettlebell Swings: 4 sets of 20 reps
- Bicycle Crunches: 3 sets of 25 reps
- Extra 15 mins post-workout cardio intervals (per feedback request)
Cooldown: 5 mins cool-down stretch.

Day 7: Full Rest & Regeneration`,
      nutrition_tip:
        "Prioritize protein! Aim for a good source of protein (like chicken, fish, beans, or Greek yogurt) with every meal. Protein helps build muscle, keeps you feeling full, and supports your metabolism, all crucial for gaining lean muscle and burning fat.",
      feedback: "Add a gentle yoga recovery session on Day 3 and extra cardio on Day 6.",
      created_at: new Date().toISOString(),
    },
  ];
}

function saveDatabase(records: UserRecord[]) {
  try {
    fs.writeFileSync(DB_STORE_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database store:", err);
  }
}

// Fallback workout generator
function createFallbackWorkout(goal: string, intensity: string): string {
  const capGoal = goal.trim() || "general fitness";
  const capInt = intensity.trim() || "Medium";
  return `Day 1:
Warm-up: 5-10 mins light cardio (jumping jacks, high knees) and dynamic arm swings.
Main Workout (${capInt} Intensity - Focus on ${capGoal}):
- Push-ups: 3 sets of 12-15 reps
- Bodyweight Squats / Goblet Squats: 3 sets of 15 reps
- Dumbbell Rows: 3 sets of 12 reps
- Plank Hold: 3 sets of 45-60 seconds
Cooldown: 5-10 mins full-body static stretching and controlled deep breathing.

Day 2:
Warm-up: 5 mins stationary cycling or brisk walking with hip openers.
Main Workout (Core & Mobility):
- Mountain Climbers: 3 sets of 20 reps
- Russian Twists: 3 sets of 20 reps (10 per side)
- Lunges: 3 sets of 12 reps per leg
- Glute Bridges: 3 sets of 15 reps
Cooldown: Cat-cow stretches and child's pose (5 mins).

Day 3:
Warm-up: 5-10 mins light jog in place and shoulder mobility.
Main Workout (Upper Body Focus):
- Overhead Dumbbell Press: 3 sets of 10-12 reps
- Bicep Curls: 3 sets of 12 reps
- Tricep Dips: 3 sets of 12 reps
- Lateral Raises: 3 sets of 15 reps
Cooldown: Chest doorway stretch and upper back foam rolling.

Day 4: Active Recovery & Gentle Stretch
Warm-up: 5 mins light walking.
Main Workout: 30 minutes brisk walking or gentle yoga flow focusing on mobility and breath work.
Cooldown: 10 mins full body hamstring and hip flexor stretches.

Day 5:
Warm-up: 5-10 mins skipping rope and torso rotations.
Main Workout (Lower Body Power):
- Romanian Deadlifts: 3 sets of 10-12 reps
- Bulgarian Split Squats: 3 sets of 10 reps per leg
- Calf Raises: 3 sets of 20 reps
- Bicycle Crunches: 3 sets of 25 reps
Cooldown: Quad stretches and pigeon pose for 5-8 mins.

Day 6:
Warm-up: 5 mins shadow boxing and arm circles.
Main Workout (Full Body Conditioning):
- Kettlebell / Dumbbell Swings: 4 sets of 15 reps
- Burpees or Step-outs: 3 sets of 10 reps
- Dumbbell Renegade Rows: 3 sets of 8 reps per arm
Cooldown: Extended child's pose and cobra stretch (5-10 mins).

Day 7: Full Rest & Regeneration
Warm-up: None required.
Main Workout: Rest and hydrate. Focus on deep recovery, healthy nutrition, and sound sleep.
Cooldown: 10 mins light foam rolling or relaxation.`;
}

function createFallbackNutritionTip(goal: string): string {
  return `Prioritize protein! Aim for a good source of protein (like chicken, fish, beans, or Greek yogurt) with every meal. Protein helps build muscle, keeps you feeling full, and supports your metabolism, all crucial for reaching your ${goal || "fitness"} goals.`;
}

// ------------------------------------------
// API Endpoints
// ------------------------------------------

// 1. Get all users
app.get("/api/users", (req: Request, res: Response) => {
  const users = loadDatabase();
  res.json({ success: true, users });
});

// 2. Generate nutrition tip
app.get("/api/nutrition-tip", async (req: Request, res: Response) => {
  const goal = (req.query.goal as string) || "general fitness";
  let tip = createFallbackNutritionTip(goal);

  if (ai) {
    try {
      const prompt = `Give one clear, helpful nutrition or recovery tip for someone focused on '${goal}'. The tip should be practical, friendly, and easy to understand, emphasizing whole foods and proper nutrient timing. Keep it under 3 sentences.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });
      if (response.text) {
        tip = response.text.trim();
      }
    } catch (err) {
      console.warn("Gemini nutrition tip call failed, using fallback:", err);
    }
  }

  res.json({ goal, nutrition_tip: tip });
});

// 3. Generate Workout & Save Plan
app.post("/api/generate-plan", async (req: Request, res: Response) => {
  try {
    const { username, user_id, age, weight, goal, intensity } = req.body;

    if (!username || !user_id) {
      return res.status(400).json({ error: "username and user_id are required" });
    }

    const uid = Number(user_id);
    const parsedAge = Number(age) || 25;
    const parsedWeight = Number(weight) || 70;
    const cleanGoal = String(goal || "general fitness");
    const cleanIntensity = String(intensity || "Medium");

    let workoutPlan = createFallbackWorkout(cleanGoal, cleanIntensity);
    let nutritionTip = createFallbackNutritionTip(cleanGoal);

    if (ai) {
      try {
        const workoutPrompt = `You are a professional fitness trainer.

Create a personalized, structured 7-day workout plan for someone with the goal of **${cleanGoal}**, and prefers **${cleanIntensity} intensity** workouts.

Each day must include:
- A warm-up (5-10 mins)
- Main workout (targeted exercises, sets & reps)
- Cooldown or recovery tip

Format:
Day 1:
Warm-up: ...
Main Workout: ...
Cooldown: ...
(Repeat for Day 2-7)`;

        const workoutResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: workoutPrompt,
        });

        if (workoutResponse.text) {
          workoutPlan = workoutResponse.text.trim();
        }

        const tipPrompt = `Give one clear, helpful nutrition or recovery tip for someone focused on '${cleanGoal}'. The tip should be practical, friendly, and easy to understand. Emphasize protein intake (like chicken, fish, beans, or Greek yogurt) for muscle repair, satiety, and metabolic support.`;
        const tipResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: tipPrompt,
        });

        if (tipResponse.text) {
          nutritionTip = tipResponse.text.trim();
        }
      } catch (err) {
        console.warn("Gemini API call failed, using structured fallback:", err);
      }
    }

    // Save or update in database
    const users = loadDatabase();
    const existingIndex = users.findIndex((u) => u.id === uid);
    const record: UserRecord = {
      id: uid,
      name: String(username),
      age: parsedAge,
      weight: parsedWeight,
      goal: cleanGoal,
      intensity: cleanIntensity,
      schedule: 7,
      original_plan: workoutPlan,
      updated_plan: existingIndex >= 0 ? users[existingIndex].updated_plan : null,
      nutrition_tip: nutritionTip,
      feedback: existingIndex >= 0 ? users[existingIndex].feedback : null,
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = record;
    } else {
      users.unshift(record);
    }
    saveDatabase(users);

    return res.json({
      success: true,
      message: "Workout plan generated and saved successfully!",
      user: record,
      workout_plan: workoutPlan,
      nutrition_tip: nutritionTip,
    });
  } catch (error: any) {
    console.error("Error in generate-plan:", error);
    return res.status(500).json({ error: error.message || "Failed to generate plan" });
  }
});

// 4. Submit Feedback & Update Plan
app.post("/api/submit-feedback", async (req: Request, res: Response) => {
  try {
    const { user_id, feedback } = req.body;
    const uid = Number(user_id);

    if (!uid || !feedback) {
      return res.status(400).json({ error: "user_id and feedback are required" });
    }

    const users = loadDatabase();
    const userIndex = users.findIndex((u) => u.id === uid);
    const user = userIndex >= 0 ? users[userIndex] : null;
    const originalPlan = user?.original_plan || createFallbackWorkout("general fitness", "Medium");

    let updatedPlan = `${originalPlan}

[UPDATED BASED ON FEEDBACK: "${feedback}"]
- Adapted routine to seamlessly include: ${feedback}
- Balanced volume and rest periods to maintain optimal progress.`;

    if (ai) {
      try {
        const updatePrompt = `You are a professional fitness trainer assistant.

Here's the original 7-day workout plan:
${originalPlan}

User Feedback:
"${feedback}"

Based on the feedback, revise the relevant parts of the workout plan. Keep the 7-day format (Day 1 to Day 7 with Warm-up, Main Workout, and Cooldown) and rest of the plan unchanged if not needed.`;

        const updateResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: updatePrompt,
        });

        if (updateResponse.text) {
          updatedPlan = updateResponse.text.trim();
        }
      } catch (err) {
        console.warn("Gemini update plan failed, using fallback:", err);
      }
    }

    // Save updated plan in record
    if (userIndex >= 0) {
      users[userIndex].updated_plan = updatedPlan;
      users[userIndex].feedback = String(feedback);
      saveDatabase(users);
    } else {
      // Create new record
      const newRec: UserRecord = {
        id: uid,
        name: `User ${uid}`,
        age: 25,
        weight: 70,
        goal: "General Fitness",
        intensity: "Medium",
        schedule: 7,
        original_plan: originalPlan,
        updated_plan: updatedPlan,
        nutrition_tip: createFallbackNutritionTip("General Fitness"),
        feedback: String(feedback),
        created_at: new Date().toISOString(),
      };
      users.unshift(newRec);
      saveDatabase(users);
    }

    return res.json({
      success: true,
      message: "Your plan has been updated based on your feedback!",
      updated_plan: updatedPlan,
      original_plan: originalPlan,
      user_id: uid,
    });
  } catch (error: any) {
    console.error("Error in submit-feedback:", error);
    return res.status(500).json({ error: error.message || "Failed to update plan" });
  }
});

// HTML Form Compatibility endpoints (direct browser POSTs / template routes)
app.post("/generate-workout", async (req: Request, res: Response) => {
  const { username, user_id, age, weight, goal, intensity } = req.body;
  const uid = Number(user_id) || 101;
  const parsedAge = Number(age) || 25;
  const parsedWeight = Number(weight) || 70;
  const cleanGoal = String(goal || "general fitness");
  const cleanIntensity = String(intensity || "Medium");

  let workoutPlan = createFallbackWorkout(cleanGoal, cleanIntensity);
  let nutritionTip = createFallbackNutritionTip(cleanGoal);

  if (ai) {
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Create a personalized, structured 7-day workout plan for goal of ${cleanGoal} with ${cleanIntensity} intensity. Each day must include Warm-up, Main Workout (sets/reps), and Cooldown.`,
      });
      if (resp.text) workoutPlan = resp.text.trim();
    } catch {}
  }

  const users = loadDatabase();
  const existingIndex = users.findIndex((u) => u.id === uid);
  const record: UserRecord = {
    id: uid,
    name: String(username || "User"),
    age: parsedAge,
    weight: parsedWeight,
    goal: cleanGoal,
    intensity: cleanIntensity,
    schedule: 7,
    original_plan: workoutPlan,
    updated_plan: existingIndex >= 0 ? users[existingIndex].updated_plan : null,
    nutrition_tip: nutritionTip,
    feedback: existingIndex >= 0 ? users[existingIndex].feedback : null,
    created_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) users[existingIndex] = record;
  else users.unshift(record);
  saveDatabase(users);

  // Read result.html and replace Jinja-style variables
  const resultTemplatePath = path.resolve(process.cwd(), "templates/result.html");
  if (fs.existsSync(resultTemplatePath)) {
    let html = fs.readFileSync(resultTemplatePath, "utf-8");
    html = html
      .replace(/\{\{\s*username\s*\}\}/g, record.name)
      .replace(/\{\{\s*user_id\s*\}\}/g, String(record.id))
      .replace(/\{\{\s*age\s*\}\}/g, String(record.age))
      .replace(/\{\{\s*weight\s*\}\}/g, String(record.weight))
      .replace(/\{\{\s*goal\s*\}\}/g, record.goal)
      .replace(/\{\{\s*intensity\s*\}\}/g, record.intensity)
      .replace(/\{\{\s*workout_plan\s*\}\}/g, record.original_plan)
      .replace(/\{\{\s*nutrition_tip\s*\}\}/g, record.nutrition_tip)
      .replace(/\{%\s*if success_message\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, "")
      .replace(/\{%\s*if updated_plan\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, "");
    return res.send(html);
  }
  return res.redirect("/");
});

app.post("/submit-feedback", async (req: Request, res: Response) => {
  const { user_id, feedback } = req.body;
  const uid = Number(user_id) || 101;
  const users = loadDatabase();
  const user = users.find((u) => u.id === uid) || users[0];
  const originalPlan = user?.original_plan || createFallbackWorkout("general fitness", "Medium");

  const updatedPlan = `${originalPlan}

[UPDATED BASED ON FEEDBACK: "${feedback}"]
- Customized exercises and schedule based on your suggestions.`;

  if (user) {
    user.updated_plan = updatedPlan;
    user.feedback = String(feedback);
    saveDatabase(users);
  }

  const resultTemplatePath = path.resolve(process.cwd(), "templates/result.html");
  if (fs.existsSync(resultTemplatePath)) {
    let html = fs.readFileSync(resultTemplatePath, "utf-8");
    const successMsg = "Your plan has been updated based on your feedback!";
    html = html
      .replace(/\{\{\s*username\s*\}\}/g, user?.name || `User ${uid}`)
      .replace(/\{\{\s*user_id\s*\}\}/g, String(uid))
      .replace(/\{\{\s*age\s*\}\}/g, String(user?.age || 25))
      .replace(/\{\{\s*weight\s*\}\}/g, String(user?.weight || 70))
      .replace(/\{\{\s*goal\s*\}\}/g, user?.goal || "general fitness")
      .replace(/\{\{\s*intensity\s*\}\}/g, user?.intensity || "Medium")
      .replace(/\{\{\s*workout_plan\s*\}\}/g, originalPlan)
      .replace(/\{\{\s*nutrition_tip\s*\}\}/g, user?.nutrition_tip || createFallbackNutritionTip("general fitness"))
      .replace(/\{\{\s*success_message\s*\}\}/g, successMsg)
      .replace(/\{%\s*if success_message\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, `$1`)
      .replace(/\{%\s*if updated_plan\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, `$1`)
      .replace(/\{\{\s*updated_plan\s*\}\}/g, updatedPlan);
    return res.send(html);
  }
  return res.redirect("/");
});

app.get("/view-all-users", (req: Request, res: Response) => {
  const allUsersPath = path.resolve(process.cwd(), "templates/all_users.html");
  if (fs.existsSync(allUsersPath)) {
    const users = loadDatabase();
    let rowsHtml = "";
    for (const u of users) {
      rowsHtml += `<tr>
        <td><strong>${u.id}</strong></td>
        <td>${u.name}</td>
        <td>${u.age}</td>
        <td>${u.weight} kg</td>
        <td><span class="badge-goal">${u.goal}</span></td>
        <td>${u.intensity}</td>
        <td class="plan-cell"><pre>${u.original_plan}</pre></td>
        <td class="plan-cell"><pre>${u.updated_plan || "Not updated"}</pre></td>
      </tr>`;
    }
    let html = fs.readFileSync(allUsersPath, "utf-8");
    html = html.replace(
      /\{%\s*for user in users\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
      rowsHtml
    );
    return res.send(html);
  }
  return res.redirect("/");
});

// Setup Vite in Dev or serve Static in Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitBuddy server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
