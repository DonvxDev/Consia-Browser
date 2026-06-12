import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./types/electron.d";

createRoot(document.getElementById("root")!).render(<App />);
