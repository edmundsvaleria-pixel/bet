import { lazy, Suspense } from 'react'
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

// ✅ Lazy load all pages (they will be split into separate chunks)
const Home = lazy(() => import('./pages/Home'))
const Live = lazy(() => import('./pages/Live'))
const Wallet = lazy(() => import('./pages/Wallet'))
const Menu = lazy(() => import('./pages/Menu'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const MatchDetails = lazy(() => import('./pages/MatchDetails'))
const MyBets = lazy(() => import('./pages/MyBets'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Support = lazy(() => import('./pages/Support'))
const Terms = lazy(() => import('./pages/Terms'))
const Referral = lazy(() => import('./pages/Referral'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-400">Loading...</p>
    </div>
  </div>
)

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
                    <Suspense fallback={<PageLoader />}>
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
                        <Route path="/referral" element={<Referral />} />
                      </Routes>
                    </Suspense>
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