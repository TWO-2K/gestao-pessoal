import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";

const STORAGE_KEY = "admin-viewed-user-id";

const ViewAsContext = createContext({
  viewedUserId: null,
  isViewingOther: false,
  setViewedUserId: () => {},
});

export function ViewAsProvider({ children }) {
  const { user } = useAuth();
  const { usuario } = useUsuarioAtual();
  const isAdmin = usuario?.role === "admin";
  const [viewedUserId, setViewedUserIdState] = useState(null);

  useEffect(() => {
    if (!user) {
      setViewedUserIdState(null);
      return;
    }
    const stored = isAdmin ? sessionStorage.getItem(STORAGE_KEY) : null;
    setViewedUserIdState(stored || user.id);
  }, [user, isAdmin]);

  const setViewedUserId = (id) => {
    if (!isAdmin) return;
    setViewedUserIdState(id);
    if (id && id !== user?.id) {
      sessionStorage.setItem(STORAGE_KEY, id);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(
    () => ({
      viewedUserId: viewedUserId || user?.id || null,
      isViewingOther: !!user && !!viewedUserId && viewedUserId !== user.id,
      setViewedUserId,
    }),
    [viewedUserId, user, isAdmin]
  );

  return <ViewAsContext.Provider value={value}>{children}</ViewAsContext.Provider>;
}

export function useViewAs() {
  return useContext(ViewAsContext);
}
