import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider } from '@/lib/AuthContext'
import { ViewAsProvider } from '@/lib/ViewAsContext'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from '@/components/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import Relatorios from '@/pages/Relatorios';
import ContasPagar from '@/pages/ContasPagar';
import Gastos from '@/pages/Gastos';
import DividasReceber from '@/pages/DividasReceber';
import Categorias from '@/pages/Categorias';
import ContasPagamento from '@/pages/ContasPagamento';
import Planner from '@/pages/Planner';
import Midias from '@/pages/Midias';
import Treinos from '@/pages/Treinos';
import TreinoHoje from '@/pages/TreinoHoje';
import PesoCorporal from '@/pages/PesoCorporal';
import MetasAcademia from '@/pages/MetasAcademia';
import PlanosAcademia from '@/pages/PlanosAcademia';
import EvolucaoAcademia from '@/pages/EvolucaoAcademia';
import MedidasCorporais from '@/pages/MedidasCorporais';
import Usuarios from '@/pages/Usuarios';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ViewAsProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/contas" element={<ContasPagar />} />
                <Route path="/gastos" element={<Gastos />} />
                <Route path="/receber" element={<DividasReceber />} />
                <Route path="/categorias" element={<Categorias />} />
                <Route path="/contas-pagamento" element={<ContasPagamento />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/midias" element={<Midias />} />
                <Route path="/midias/:tipoSlug" element={<Midias />} />
                <Route path="/midias/:tipoSlug/:id" element={<Midias />} />
                <Route path="/academia" element={<Treinos />} />
                <Route path="/academia/hoje" element={<TreinoHoje />} />
                <Route path="/academia/planos" element={<PlanosAcademia />} />
                <Route path="/academia/evolucao" element={<EvolucaoAcademia />} />
                <Route path="/academia/peso" element={<PesoCorporal />} />
                <Route path="/academia/medidas" element={<MedidasCorporais />} />
                <Route path="/academia/metas" element={<MetasAcademia />} />
                <Route element={<AdminRoute />}>
                  <Route path="/usuarios" element={<Usuarios />} />
                </Route>
              </Route>
            </Route>

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            {/* Reset password must stay reachable even with a session active (recovery link flow) */}
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
        </ViewAsProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
