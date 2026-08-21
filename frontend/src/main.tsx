
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/globals.css";

  const storedTheme = localStorage.getItem("proptech-theme");
  const initialTheme =
    storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : "light";

  document.documentElement.classList.toggle("dark", initialTheme === "dark");
  document.documentElement.dataset.theme = initialTheme;
  document.documentElement.style.colorScheme = initialTheme;

  createRoot(document.getElementById("root")!).render(<App />);
  
