import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Instagram, Twitter, MessageSquare, Copy, Check, Plus, Trash2 } from 'lucide-react'
import { useFriends } from '@/hooks/useFriends'

// IMPORTA TUS ASSETS AQUÍ (Actualizado a pokeball.png)
import pokebola from '@/assets/pokeball.png'
import goLogo from '@/assets/go.png'
import uniteLogo from '@/assets/unite.png'
import tcgLogo from '@/assets/tcg.png'
import championsLogo from '@/assets/champions.png'
import mastersLogo from '@/assets/masters.png'
import friendsLogo from '@/assets/friends.png'

const GAMES = [
  { id: 'go', name: 'Pokémon GO', logo: goLogo },
  { id: 'unite', name: 'Pokémon UNITE', logo: uniteLogo },
  { id: 'tcg', name: 'TCG Pocket', logo: tcgLogo },
  { id: 'champions', name: 'Champions', logo: championsLogo },
  { id: 'masters', name: 'Masters EX', logo: mastersLogo },
  { id: 'friends', name: 'Friends', logo: friendsLogo },
]

export function FriendBoard({ isAdmin }: { isAdmin: boolean }) {
  const { friends, addFriendProfile, deleteFriendProfile } = useFriends()
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [socialIg, setSocialIg] = useState('')
  const [socialX, setSocialX] = useState('')
  const [socialDiscord, setSocialDiscord] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  // Estado para saber qué código de qué usuario se está viendo
  const [activeView, setActiveView] = useState<{ userId: string, gameId: string, code: string } | null>(null)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleSubmit = async () => {
    if (!username.trim() || Object.keys(codes).length === 0) return
    await addFriendProfile({
      username: username.trim(),
      game_codes: codes,
      social_ig: socialIg.replace('@', '').trim(),
      social_x: socialX.replace('@', '').trim(),
      social_discord: socialDiscord.trim()
    })
    setShowForm(false); setUsername(''); setCodes({}); setSocialIg(''); setSocialX(''); setSocialDiscord('');
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl py-6 font-black shadow-lg text-lg">
          <Plus className="w-6 h-6 mr-2" /> Publicar mi código de amigo
        </Button>
      ) : (
        <div className="bg-white rounded-[24px] shadow-2xl p-6 relative overflow-hidden">
          <h2 className="text-2xl font-black mb-4 text-gray-900">Añadirme al Tablón</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700">Nombre de Usuario o Entrenador *</label>
              <Input placeholder="Ej: AshKetchum99" value={username} onChange={e => setUsername(e.target.value)} className="bg-gray-50 border-gray-200 mt-1" />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Mis Códigos (Llena los que juegues)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GAMES.map(game => (
                  <div key={game.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <img src={game.logo} alt={game.name} className="w-8 h-8 object-contain" />
                    <Input 
                      placeholder="Tu código" 
                      value={codes[game.id] || ''} 
                      onChange={e => {
                        const newCodes = { ...codes };
                        if (e.target.value) newCodes[game.id] = e.target.value; else delete newCodes[game.id];
                        setCodes(newCodes);
                      }} 
                      className="border-0 bg-transparent h-8 focus-visible:ring-0 px-1 text-sm" 
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Redes Sociales (Opcional)</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2"><Instagram className="w-5 h-5 text-pink-500" /><Input placeholder="Usuario Instagram" value={socialIg} onChange={e => setSocialIg(e.target.value)} className="bg-gray-50" /></div>
                <div className="flex items-center gap-2"><Twitter className="w-5 h-5 text-blue-400" /><Input placeholder="Usuario X (Twitter)" value={socialX} onChange={e => setSocialX(e.target.value)} className="bg-gray-50" /></div>
                <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-500" /><Input placeholder="Usuario Discord" value={socialDiscord} onChange={e => setSocialDiscord(e.target.value)} className="bg-gray-50" /></div>
              </div>
            </div>

            {/* AQUÍ ESTÁ EL ARREGLO DE LOS BOTONES: Ahora son flex-1 */}
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 rounded-xl bg-gray-100 border-0 hover:bg-gray-200 py-6 font-bold text-gray-600 text-base sm:text-lg">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!username || Object.keys(codes).length === 0} className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-base sm:text-lg">
                Publicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE AMIGOS */}
      <div className="space-y-4">
        {friends.length === 0 ? (
          <p className="text-center text-white/80 font-medium py-8 bg-black/10 rounded-2xl">Aún no hay entrenadores. ¡Sé el primero en publicarte!</p>
        ) : (
          friends.map(friend => (
            <div key={friend.id} className="bg-white rounded-[24px] shadow-xl p-4 sm:p-5 flex gap-4 relative overflow-hidden transition-all">
              
              {/* POKEBOLA IZQUIERDA */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                <img src={pokebola} alt="Pokebola" className="w-full h-full object-contain opacity-90 drop-shadow-sm" />
              </div>

              {/* INFO CENTRAL */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 truncate pr-2">{friend.username}</h3>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => deleteFriendProfile(friend.id)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-2 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* JUEGOS (ICONOS) */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(friend.game_codes).map(([gameId, code]) => {
                    const gameInfo = GAMES.find(g => g.id === gameId);
                    if (!gameInfo) return null;
                    return (
                      <button 
                        key={gameId} 
                        onClick={() => setActiveView(activeView?.userId === friend.id && activeView?.gameId === gameId ? null : { userId: friend.id, gameId, code })}
                        className={`h-10 px-2 rounded-lg transition-transform active:scale-95 ${activeView?.userId === friend.id && activeView?.gameId === gameId ? 'bg-blue-50 border border-blue-200 shadow-inner' : 'hover:bg-gray-50'}`}
                      >
                        <img src={gameInfo.logo} alt={gameInfo.name} className="h-full object-contain" />
                      </button>
                    )
                  })}
                </div>

                {/* VISUALIZADOR DE CÓDIGO CON BOTÓN DE COPIAR */}
                {activeView?.userId === friend.id && (
                  <div className="mt-3 bg-gray-900 text-white rounded-xl p-3 flex items-center justify-between shadow-inner animate-in slide-in-from-top-2">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{GAMES.find(g => g.id === activeView.gameId)?.name}</p>
                      <p className="font-mono text-lg font-bold tracking-widest">{activeView.code}</p>
                    </div>
                    <Button 
                      onClick={() => handleCopy(activeView.code)} 
                      variant="ghost" 
                      className={`h-10 w-10 p-0 rounded-lg ${copiedCode === activeView.code ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {copiedCode === activeView.code ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                )}

                {/* REDES SOCIALES */}
                {(friend.social_ig || friend.social_x || friend.social_discord) && (
                  <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-400 self-center hidden sm:block">Contacto:</span>
                    {friend.social_ig && <a href={`https://instagram.com/${friend.social_ig}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors"><Instagram className="w-5 h-5" /></a>}
                    {friend.social_x && <a href={`https://x.com/${friend.social_x}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors"><Twitter className="w-5 h-5" /></a>}
                    {friend.social_discord && (
                      <div className="flex items-center gap-1 text-gray-400 hover:text-indigo-500 transition-colors cursor-help" title={`Discord: ${friend.social_discord}`}>
                        <MessageSquare className="w-5 h-5" /><span className="text-xs font-bold">{friend.social_discord}</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}