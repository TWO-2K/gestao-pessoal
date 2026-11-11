import React from "react";
import Layout from "@/components/Layout";
import OrbitaShell from "@/components/orbita/OrbitaShell";
import Dashboard from "@/pages/Dashboard";
import OrbitaHome from "@/pages/OrbitaHome";
import { useLayoutPreferencia } from "@/hooks/useLayoutPreferencia";

// Escolhe o shell conforme a preferência do usuário. Padrão (e fallback em erro): layout clássico.
export function LayoutSwitch() {
  const { layout, isLoading } = useLayoutPreferencia();
  if (isLoading) return <div className="min-h-screen bg-ink-50" />;
  return layout === "orbita" ? <OrbitaShell /> : <Layout />;
}

// "/" mostra o painel de módulos no Órbita e o painel financeiro de sempre no clássico.
export function HomeRoute() {
  const { layout } = useLayoutPreferencia();
  return layout === "orbita" ? <OrbitaHome /> : <Dashboard />;
}
