import { mount } from "svelte";
import "./app.css";
import "./mobile.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app") });
