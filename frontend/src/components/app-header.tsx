"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

interface AppHeaderProps {
  showMembers?: boolean;
  memberCount?: number;
  onToggleMembers?: () => void;
}

export function AppHeader({ 
  showMembers = false, 
  memberCount = 0, 
  onToggleMembers 
}: AppHeaderProps) {
  
  
  return (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
      <h1 className="text-lg font-semibold tracking-tight">
          Gestión de actividades in GLOBAL COMPONET
        </h1>
      
      <div className="flex items-center gap-2">
        {showMembers && onToggleMembers && (
          <button
            onClick={onToggleMembers}
            className="p-2 rounded-md hover:bg-muted transition-colors relative"
          >
            <Users className="size-4" />
            {memberCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                {memberCount}
              </span>
            )}
          </button>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
