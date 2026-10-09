import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/popup/App";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
	throw new Error("The popup is missing its #root element.");
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
