"use client";

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    console.log("MainLayout rendering for path:", location.pathname);
    // Scroll to top on route change
    window.scrollTo(0, 0);

    // Add page transition class
    document.body.classList.add("fade-in");

    // Remove the class after animation completes
    const timeout = setTimeout(() => {
      document.body.classList.remove("fade-in");
    }, 300);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1 pt-5 mt-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
