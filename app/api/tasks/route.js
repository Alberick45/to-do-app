import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Path to JSON file
const TASKS_FILE = path.join(process.cwd(), "data", "tasks.json");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function readTasks() {
  try {
    // Create file if it doesn't exist
    if (!fs.existsSync(TASKS_FILE)) {
      const dir = path.dirname(TASKS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    
    const data = fs.readFileSync(TASKS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading tasks:", error);
    return [];
  }
}

function writeTasks(tasks) {
  try {
    const dir = path.dirname(TASKS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error("Error writing tasks:", error);
    throw error;
  }
}

// ==========================================
// API ENDPOINTS
// ==========================================

// GET /api/tasks - List all tasks
export async function GET() {
  try {
    const tasks = readTasks();
    console.log(`📋 Fetched ${tasks.length} tasks`);
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Add new task
export async function POST(request) {
  try {
    const newTask = await request.json();
    
    // Validate task
    if (!newTask.name) {
      return NextResponse.json(
        { error: "Task name is required" },
        { status: 400 }
      );
    }
    if (!newTask.date) {
      return NextResponse.json(
        { error: "Task date is required" },
        { status: 400 }
      );
    }
    if (!newTask.time) {
      return NextResponse.json(
        { error: "Task time is required" },
        { status: 400 }
      );
    }
    
    // Read existing tasks
    const tasks = readTasks();
    
    // Create task with proper structure for existing API format
    const task = {
      id: newTask.id || Date.now().toString(),
      name: newTask.name,
      date: newTask.date,
      time: newTask.time,
      note: newTask.note || "",
      type: newTask.type || "reminder",
      notified: newTask.notified || false,
      created: new Date().toISOString()
    };
    
    // Add task
    tasks.push(task);
    writeTasks(tasks);
    
    console.log(`✅ Added task: ${task.name}`);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error adding task:", error);
    return NextResponse.json(
      { error: "Failed to add task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks - Clear all tasks
export async function DELETE() {
  try {
    writeTasks([]);
    console.log("🧹 Cleared all tasks");
    return NextResponse.json(
      { message: "All tasks cleared" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to clear tasks" },
      { status: 500 }
    );
  }
}