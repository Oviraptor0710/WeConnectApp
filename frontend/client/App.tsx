import "./global.css";
import "./lib/i18n";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import GlobalCallProvider from "@/components/GlobalCallProvider";

// Auth
import Register from "@/pages/register/index";
import Login from "@/pages/login/index";
import ForgotPassword from "@/pages/forgot-password/index";
import ResetPassword from "@/pages/reset-password/index";

// Main app
import Home from "@/pages/home/index";
import Search from "@/pages/search/index";
import UserProfile from "@/pages/user-profile/index";
import MyProfile from "@/pages/my-profile/index";
import Friends from "@/pages/friends/index";
import Chat from "@/pages/chat/index";
import Call from "@/pages/call/index";
import Events from "@/pages/events/index";
import Games from "@/pages/games/index";
import GameRoom from "@/pages/game-room/index";
import EventDetail from "@/pages/event-detail/index";

// Admin
import AdminStats from "@/pages/admin-stats/index";
import AdminEventsManagement from "@/pages/admin-stats/EventsManagement";
import EventManagement from "@/pages/event-management/index";
import EventStats from "@/pages/event-stats/index";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GlobalCallProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Main App Routes */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/call" element={<ProtectedRoute><Call /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
              <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
              <Route path="/game" element={<ProtectedRoute><GameRoom /></ProtectedRoute>} />

              {/* Organizer Routes */}
              <Route path="/organizer/stats" element={<ProtectedRoute requireOrganizer><AdminStats /></ProtectedRoute>} />
              <Route path="/organizer/events" element={<ProtectedRoute requireOrganizer><EventManagement /></ProtectedRoute>} />
              <Route path="/organizer/events/:id/stats" element={<ProtectedRoute requireOrganizer><EventStats /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/stats" element={<ProtectedRoute requireAdmin><AdminStats /></ProtectedRoute>} />
              <Route path="/admin/events-management" element={<ProtectedRoute requireAdmin><AdminEventsManagement /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalCallProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
