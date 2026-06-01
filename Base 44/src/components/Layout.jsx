import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, BarChart3, Bot, Home, Settings, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/",         icon: Home,         label: "Home"     },
  { path: "/workout",  icon: Dumbbell,     label: "Train"    },
  { path: "/calendar", icon: CalendarDays, label: "Calendar" },
  { path: "/progress", icon: BarChart3,    label: "Progress" },
  { path: "/coach",    icon: Bot,          label: "AI Coach" },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      <main className="flex-1 pb-24 overflow-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        {/* Blur bg */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-2xl border-t border-border" />
        <div className="relative flex items-center justify-around max-w-lg mx-auto h-16 px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = pathname === path;
            return (
              <Link key={path} to={path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                <div className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300",
                  active ? "bg-primary/15" : "bg-transparent"
                )}>
                  {active && (
                    <div className="absolute inset-0 rounded-xl bg-primary/10 blur-sm" />
                  )}
                  <Icon className={cn("w-5 h-5 relative z-10 transition-all duration-200", active && "drop-shadow-[0_0_6px_currentColor]")} />
                </div>
                <span className={cn("text-[10px] font-medium transition-all duration-200", active ? "opacity-100" : "opacity-60")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}