import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import FriendsLayout from "./pages/FriendsLayout";
import FriendsEmpty from "./pages/FriendsEmpty";
import FriendChat from "./pages/FriendChat";
import GroupChat from "./pages/GroupChat";
import FriendRequestsPage from "./pages/FriendRequests";
import { PoweredByBadge } from "./components/PoweredByBadge";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/friends/request" element={<FriendRequestsPage />} />
            <Route path="/friends" element={<FriendsLayout />}>
              <Route index element={<FriendsEmpty />} />
              <Route path="group/:groupSlug" element={<GroupChat />} />
              <Route path=":friendSlug" element={<FriendChat />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
