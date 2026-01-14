import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { RegistrationForm } from '@/app/components/RegistrationForm'
import { AdminPanel } from '@/app/components/AdminPanel'
import { WinnerRoulette } from '@/app/components/WinnerRoulette'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { Users, Trophy, QrCode } from 'lucide-react'

import pokemonLogo from '@/assets/pokemon-go-logo.png'

type View = 'main' | 'roulette'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState('register')

  const isAdmin =
    new URLSearchParams(window.location.search).get('admin') === '1'

  const registrationUrl = window.location.origin

  if (currentView === 'roulette') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <WinnerRoulette onBack={() => setCurrentView('main')} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="text-center mb-8">
          <img
            src={pokemonLogo}
            alt="Pokémon GO"
            className="h-20 mx-auto mb-3"
          />
          <h1 className="text-4xl font-bold text-gray-800">
            Dinámicas Pokémon GO GDL
          </h1>
        </header>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={`grid w-full mx-auto mb-8 ${
              isAdmin ? 'max-w-3xl grid-cols-3' : 'max-w-md grid-cols-1'
            }`}
          >
            <TabsTrigger value="register" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registro
            </TabsTrigger>

            {isAdmin && (
              <>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Administración
                </TabsTrigger>

                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="register">
            <RegistrationForm />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="admin">
                <AdminPanel onStartRoulette={() => setCurrentView('roulette')} />
              </TabsContent>

              <TabsContent value="qr">
                <QRCodeDisplay url={registrationUrl} />
              </TabsContent>
            </>
          )}
        </Tabs>

        <footer className="mt-12 text-center text-sm text-gray-500">
          En nombre de Pawmi de Bidoff y del ditto santo, amen.
        </footer>

      </div>
    </div>
  )
}
