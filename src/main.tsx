import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles/globals.css";
import AppShell from "@/components/layout/AppShell";

const Standings = React.lazy(()=>import("@/pages/Standings"));
const Simulate  = React.lazy(()=>import("@/pages/Simulate"));
const Timing    = React.lazy(()=>import("@/pages/Timing"));
const TestCfg   = React.lazy(()=>import("@/pages/TestConfig"));
const Parts     = React.lazy(()=>import("@/pages/Parts"));
const Notes     = React.lazy(()=>import("@/pages/Notes"));
const Profile   = React.lazy(()=>import("@/pages/Profile"));

const withShell = (el: React.ReactNode) => <AppShell>{el}</AppShell>;

const router = createBrowserRouter([
  { path: "/", element: withShell(<Standings/>) },
  { path: "/standings", element: withShell(<Standings/>) },
  { path: "/simulate", element: withShell(<Simulate/>) },
  { path: "/timing", element: withShell(<Timing/>) },
  { path: "/test-config", element: withShell(<TestCfg/>) },
  { path: "/parts", element: withShell(<Parts/>) },
  { path: "/notes", element: withShell(<Notes/>) },
  { path: "/profile", element: withShell(<Profile/>) },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);
