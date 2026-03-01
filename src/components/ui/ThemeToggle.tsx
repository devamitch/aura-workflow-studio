import { Moon, Sun } from "lucide-react";
import React from "react";
import { useStore } from "../../store";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useStore();

  return (
    <div className="theme-toggle">
      <button
        className={`theme-btn ${theme === "light" ? "active" : ""}`}
        onClick={() => theme !== "light" && toggleTheme()}
      >
        <Sun size={14} />
        <span>Light</span>
      </button>
      <button
        className={`theme-btn ${theme === "dark" ? "active" : ""}`}
        onClick={() => theme !== "dark" && toggleTheme()}
      >
        <Moon size={14} />
        <span>Dark</span>
      </button>
    </div>
  );
};
