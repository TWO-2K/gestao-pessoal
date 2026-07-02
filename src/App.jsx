import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider } from '@/lib/AuthContext'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import ContasPagar from '@/pages/ContasPagar';
import DividasReceber from '@/pages/DividasReceber';
import Categorias from '@/pages/Categorias';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/contas" element={<ContasPagar />} />
                <Route path="/receber" element={<DividasReceber />} />
                <Route path="/categorias" element={<Categorias />} />
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
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
