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

// GET /api/tasks/[id] - Get specific task
export async function GET(request, { params }) {
  try {
    const tasks = readTasks();
    const task = tasks.find(t => t.id == params.id); // Use == to handle string/number comparison
    
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    console.log(`📋 Fetched task: ${task.name}`);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read task" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update specific task
export async function PUT(request, { params }) {
  try {
    const updatedTask = await request.json();
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t.id == params.id); // Use == to handle string/number comparison
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    // Validate task
    if (!updatedTask.name) {
      return NextResponse.json(
        { error: "Task name is required" },
        { status: 400 }
      );
    }
    
    // Update task while preserving id and created date
    tasks[taskIndex] = {
      ...updatedTask,
      id: tasks[taskIndex].id, // Keep original ID type
      created: tasks[taskIndex].created || new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    writeTasks(tasks);
    
    console.log(`✅ Updated task: ${updatedTask.name}`);
    return NextResponse.json(tasks[taskIndex]);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete specific task
export async function DELETE(request, { params }) {
  try {
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t.id == params.id); // Use == to handle string/number comparison
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    writeTasks(tasks);
    
    console.log(`🗑️ Deleted task: ${deletedTask.name}`);
    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}