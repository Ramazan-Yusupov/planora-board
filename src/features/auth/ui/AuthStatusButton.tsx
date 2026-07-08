"use client";

import { LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { useAuth } from "../model/AuthProvider";
import { AuthModal } from "./AuthModal";

type AuthStatusButtonProps = Readonly<{
  className?: string;
}>;

export function AuthStatusButton({ className }: AuthStatusButtonProps) {
  const auth = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (auth.profile) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          className="px-3"
          size="sm"
          variant={auth.profile.isAdmin ? "secondary" : "ghost"}
          onClick={() => setIsAuthOpen(true)}
        >
          {auth.profile.isAdmin ? (
            <ShieldCheck aria-hidden="true" size={16} />
          ) : (
            <UserCircle aria-hidden="true" size={16} />
          )}
          {auth.profile.handle}
        </Button>
        <Button
          aria-label="Выйти"
          className="px-3"
          size="sm"
          variant="ghost"
          onClick={() => void auth.signOut()}
        >
          <LogOut aria-hidden="true" size={16} />
        </Button>
        {isAuthOpen ? <AuthModal onClose={() => setIsAuthOpen(false)} /> : null}
      </div>
    );
  }

  return (
    <>
      <Button
        className={className}
        disabled={auth.isLoading}
        size="sm"
        variant="secondary"
        onClick={() => setIsAuthOpen(true)}
      >
        <UserCircle aria-hidden="true" size={16} />
        Войти
      </Button>
      {isAuthOpen ? <AuthModal onClose={() => setIsAuthOpen(false)} /> : null}
    </>
  );
}
