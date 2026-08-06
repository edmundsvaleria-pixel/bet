import { Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'

// Context Providers
import { SupabaseProvider } from './context/SupabaseContext'
import { SystemSettingsProvider } from './context/SystemSettingsContext'
import { NotificationProvider } from './context/NotificationContext'
import { WalletProvider } from './context/WalletContext'
import { BetProvider } from './context/BetContext'
import { MatchEngineProvider } from './context/MatchEngineContext'
import { SupportProvider } from './context/SupportContext'

// Pages
import Home from './pages/Home'
import Live from './pages/Live'
import Wallet from './pages/Wallet'
import Menu from './pages/Menu'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import MatchDetails from './pages/MatchDetails'
import MyBets from './pages/MyBets'
import AdminDashboard from './pages/AdminDashboard'
import Support from './pages/Support'
import Terms from './pages/Terms'
import Referral from './pages/Referral'  // ✅ Import Referral page

function App() {
  return (
    <SupabaseProvider>
      <SystemSettingsProvider>
        <NotificationProvider>
          <WalletProvider>
            <BetProvider>
              <MatchEngineProvider>
                <SupportProvider>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/live" element={<Live />} />
                      <Route path="/wallet" element={<Wallet />} />
                      <Route path="/menu" element={<Menu />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/match/:id" element={<MatchDetails />} />
                      <Route path="/my-bets" element={<MyBets />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/referral" element={<Referral />} />  {/* ✅ Add referral route */}
                    </Routes>
                  </Layout>
                </SupportProvider>
              </MatchEngineProvider>
            </BetProvider>
          </WalletProvider>
        </NotificationProvider>
      </SystemSettingsProvider>
    </SupabaseProvider>
  )
}

export default App