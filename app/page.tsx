"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Moon,
  Sun,
  Edit,
  Trash2,
  PlusCircle,
  CalendarDays,
  List,
  AlertCircle,
} from "lucide-react";

interface Task {
  id: number;
  name: string;
  deadline: Date;
  note?: string;
  notified?: boolean;
}

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [calendarView, setCalendarView] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------- Load Saved Tasks + Theme ----------------
  useEffect(() => {
    try {
      setLoading(true);
      const savedTasks = localStorage.getItem("tasks");
      const savedTheme = localStorage.getItem("theme");

      if (savedTasks) {
        const parsed = JSON.parse(savedTasks).map((t: any) => ({
          ...t,
          deadline: new Date(t.deadline),
        }));
        setTasks(parsed);
      }
      if (savedTheme === "dark") setDarkMode(true);

      if ("Notification" in window) Notification.requestPermission();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => console.log("✅ SW registered"))
          .catch(() => console.log("❌ SW failed"));
      }
    } catch {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, []);

  // ---------------- Save Tasks + Theme ----------------
  useEffect(() => localStorage.setItem("tasks", JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem("theme", darkMode ? "dark" : "light"), [darkMode]);

  // ---------------- Notifications ----------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTasks((prev) =>
        prev.map((task) => {
          const diff = (task.deadline.getTime() - now.getTime()) / 60000;
          if (diff > 4 && diff <= 5 && !task.notified && Notification.permission === "granted") {
            new Notification("⏰ Task Reminder", {
              body: `Your task "${task.name}" is due in 5 minutes.`,
              icon: "/favicon.ico",
            });
            return { ...task, notified: true };
          }
          return task;
        })
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ---------------- CRUD ----------------
  const handleAddTask = () => {
    if (!taskName || !deadline) return alert("Please enter a task name and deadline.");
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? { ...t, name: taskName, deadline, note, notified: false }
            : t
        )
      );
      setEditingTask(null);
    } else {
      setTasks((prev) => [
        ...prev,
        { id: Date.now(), name: taskName, deadline, note, notified: false },
      ]);
    }
    setTaskName("");
    setDeadline(null);
    setNote("");
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTaskName(task.name);
    setDeadline(new Date(task.deadline));
    setNote(task.note || "");
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this task?")) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  // ---------------- Styles ----------------
  const bgGradient = darkMode
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-slate-700"
    : "bg-gradient-to-br from-slate-50 via-gray-100 to-gray-200";

  const headerTextColor = darkMode ? "text-white" : "text-gray-900";

  // ---------------- Calendar ----------------
  const tileContent = ({ date }: { date: Date }) => {
    const dayTasks = tasks.filter(
      (t) => t.deadline.toDateString() === date.toDateString()
    );
    if (dayTasks.length === 0) return null;
    return (
      <div className="flex justify-center mt-1">
        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
      </div>
    );
  };

  const tasksForSelectedDate = tasks.filter(
    (t) => t.deadline.toDateString() === selectedDate.toDateString()
  );

  const calendarStyle = `
    .react-calendar {
      border: none !important;
      width: 100%;
      border-radius: 1rem;
      background: ${darkMode ? "#1f2937" : "#f8fafc"};
      color: ${darkMode ? "#f9fafb" : "#111827"};
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .react-calendar__tile {
      border-radius: 10px;
      transition: 0.3s ease;
      padding: 0.6rem 0 !important;
    }
    .react-calendar__tile:hover {
      background: ${darkMode ? "rgba(147,197,253,0.2)" : "rgba(147,197,253,0.4)"} !important;
      transform: scale(1.05);
    }
    .react-calendar__tile--now {
      background: ${darkMode ? "rgba(99,102,241,0.4)" : "rgba(129,140,248,0.3)"} !important;
      border: 1px solid rgba(129,140,248,0.6) !important;
    }
    .react-calendar__tile--active {
      background: ${darkMode ? "rgba(56,189,248,0.5)" : "rgba(59,130,246,0.4)"} !important;
    }
  `;

  // ---------------- UI ----------------
  return (
    <div className={`min-h-screen transition-colors duration-700 ${bgGradient} flex flex-col items-center py-12`}>
      <style>{calendarStyle}</style>

      {/* Floating Orbs */}
      <motion.div className="absolute w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 10 }}
        style={{ top: "10%", left: "5%" }} />
      <motion.div className="absolute w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"
        animate={{ y: [0, -25, 0], x: [0, 25, 0] }} transition={{ repeat: Infinity, duration: 14 }}
        style={{ bottom: "15%", right: "10%" }} />

      {/* Loading Animation */}
      {loading ? (
        <div className="flex flex-col justify-center items-center mt-48 space-y-4">
          <motion.div
            className="relative w-20 h-20"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-400 via-sky-400 to-purple-400 blur-xl opacity-70"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            />
          </motion.div>
          <motion.p
            className="text-lg font-medium text-indigo-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Loading your tasks...
          </motion.p>
        </div>
      ) : error ? (
        // Error State
        <div className="text-center mt-32 text-red-600">
          <AlertCircle size={40} className="mx-auto mb-3" />
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        // Main Content
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative z-10 w-full max-w-xl ${darkMode ? "bg-gray-800/70" : "bg-white/70"} backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20`}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className={`text-3xl font-semibold tracking-wide ${headerTextColor}`}>
              TO-DO App
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCalendarView(!calendarView)}
                className="p-2 bg-white/30 hover:bg-white/40 rounded-full transition"
              >
                {calendarView ? <List size={20} /> : <CalendarDays size={20} />}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-white/30 hover:bg-white/40 rounded-full transition"
              >
                {darkMode ? <Sun size={20} color="yellow" /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!calendarView ? (
              // TASK VIEW
              <motion.div
                key="taskview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Input Section */}
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Enter task name..."
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="p-3 rounded-lg bg-white/80 w-full text-gray-900 placeholder-gray-500 outline-none"
                  />
                  <DatePicker
                    selected={deadline}
                    onChange={(date) => setDeadline(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={5}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    placeholderText="Select deadline..."
                    className="p-3 rounded-lg bg-white/80 w-full text-gray-900 placeholder-gray-500 outline-none"
                  />
                  <textarea
                    placeholder="Add a note (optional)..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="p-3 rounded-lg bg-white/80 w-full text-gray-900 placeholder-gray-500 outline-none"
                    rows={3}
                  ></textarea>
                  <button
                    onClick={handleAddTask}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 transition font-medium shadow-md"
                  >
                    <PlusCircle size={18} />
                    {editingTask ? "Update Task" : "Add Task"}
                  </button>
                </div>

                {/* Task List */}
                {tasks.length === 0 ? (
                  <p className={`text-center italic ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No tasks yet. Add one to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => {
                      const now = new Date();
                      const timeLeft = (task.deadline.getTime() - now.getTime()) / 60000;
                      const dueSoon = timeLeft > 0 && timeLeft < 5;
                      const overdue = timeLeft < 0;

                      return (
                        <motion.div
                          key={task.id}
                          className={`flex justify-between items-start p-5 rounded-xl transition-all shadow-lg ${
                            dueSoon
                              ? "bg-sky-100 border border-sky-400"
                              : overdue
                              ? "bg-rose-100 border border-rose-400"
                              : "bg-white/90 border border-gray-200"
                          }`}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div>
                            <h3 className="font-semibold text-gray-900">{task.name}</h3>
                            <p className="text-sm text-gray-700">
                              Deadline:{" "}
                              {task.deadline.toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                            {task.note && (
                              <p className="text-sm mt-2 text-gray-800 italic">
                                Note: {task.note}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-3 mt-1">
                            <button onClick={() => handleEdit(task)} className="text-blue-600 hover:text-blue-800">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              // CALENDAR VIEW
              <motion.div key="calendarview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Calendar
                  onChange={(date) => setSelectedDate(date as Date)}
                  value={selectedDate}
                  tileContent={tileContent}
                />
                <div className="mt-6">
                  <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Tasks on {selectedDate.toDateString()}
                  </h3>
                  {tasksForSelectedDate.length === 0 ? (
                    <p className={`italic ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      No tasks for this day.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {tasksForSelectedDate.map((t) => (
                        <li
                          key={t.id}
                          className={`p-4 rounded-lg shadow ${
                            darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <strong>{t.name}</strong>
                          <br />
                          <span className="text-sm opacity-80">
                            {t.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {t.note && <p className="text-sm mt-1 italic opacity-70">{t.note}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
