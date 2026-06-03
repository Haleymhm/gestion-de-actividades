"use client";

import { useState, useEffect, useRef } from "react";
import { LogOut, Loader2, User, Check } from "lucide-react";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<{id: string; email: string; username: string | null} | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
      setUsername(res.data.username || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      await authApi.updateUsername(username);
      setUser({ ...user!, username });
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kanban_access_token");
    router.push("/");
  };

  if (loading) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
      >
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
          {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
        </div>
        <span className="text-sm hidden md:inline">
          {user?.username || user?.email?.split("@")[0]}
        </span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 rounded-md border border-border bg-background shadow-lg p-3 z-50">
          <div className="text-sm font-medium mb-2 truncate">{user?.email}</div>
          
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="flex-1 px-2 py-1 text-sm rounded border border-input bg-background"
              />
              <button
                onClick={handleSaveUsername}
                disabled={saving || !username.trim()}
                className="p-1 rounded bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 w-full p-2 text-sm text-left rounded hover:bg-muted"
            >
              <User className="size-4" />
              <span>{user?.username || "Agregar username"}</span>
            </button>
          )}
          
          <hr className="my-2" />
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full p-2 text-sm text-left rounded hover:bg-destructive/10 text-destructive"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}