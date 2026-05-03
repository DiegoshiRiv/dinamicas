import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Instagram, Twitter, MessageSquare, Copy, Check, Plus, Trash2, Hash } from 'lucide-react'
import { useFriends } from '@/hooks/useFriends'

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
  const [avatarDex, setAvatarDex] = useState('') // ESTADO PARA EL RETRATO
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [socialIg, setSocialIg] = useState('')
  const [socialX, setSocialX] = useState('')
  
  const [otherType, setOtherType] = useState('Ninguno')
  const [otherValue, setOtherValue] = useState('')
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
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
      avatar_dex: avatarDex ? avatarDex.padStart(4, '0') : undefined,
      game_codes: codes,
      social_ig: socialIg.replace('@', '').trim(),
      social_x: socialX.replace('@', '').trim(),
      social_other_type: otherType !== 'Ninguno' ? otherType : undefined,
      social_other_value: otherValue.trim()
    })
    setShowForm(false); setUsername(''); setAvatarDex(''); setCodes({}); setSocialIg(''); setSocialX(''); setOtherType('Ninguno'); setOtherValue('');
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl py-6 font-black shadow-lg text-lg">
          <Plus className="w-6 h-6 mr-2" /> Publicar mi código de amigo
        </Button>
      ) : (
        <div className="bg-white rounded-[32px] shadow-2xl p-6 relative overflow-hidden">
          <h2 className="text-2xl font-black mb-4 text-gray-900">Añadirme al Tablón</h2>
          
          <div className="space-y-4">
            
            <div>
              <label className="text-sm font-bold text-gray-700">Nombre de Usuario o Entrenador *</label>
              <Input placeholder="Ej: AshKetchum99" value={username} onChange={e => setUsername(e.target.value)} className="bg-gray-50 border-gray-200 mt-1 font-bold text-lg py-6" />
            </div>

            {/* SECCIÓN DEL AVATAR CON VISTA PREVIA */}
            <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-inner">
               <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0">
                  <img 
                    src={avatarDex ? `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${avatarDex.padStart(4, '0')}/Normal.png` : pokebola} 
                    alt="Preview" 
                    className="w-14 h-14 object-contain" 
                    style={avatarDex ? { imageRendering: 'pixelated' } : {}}
                    onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} // Si falla (Pokémon no existe), regresa a la Pokebola
                  />
               </div>
               <div className="flex-1">
                  <label className="text-xs font-black text-blue-800 uppercase tracking-widest block mb-1">Avatar de Pokémon</label>
                  <Input 
                    type="number" 
                    min="1" max="1025" 
                    placeholder="Nº de Pokédex (Ej: 94 = Gengar)" 
                    value={avatarDex} 
                    onChange={e => setAvatarDex(e.target.value)} 
                    className="bg-white border-blue-200 text-sm font-bold placeholder:font-normal" 
                  />
               </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2 mt-2">Mis Códigos (Llena los que juegues)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GAMES.map(game => (
                  <div key={game.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <img src={game.logo} alt={game.name} className="w-8 h-8 object-contain" />
                    <Input placeholder="Tu código" value={codes[game.id] || ''} onChange={e => { const newCodes = { ...codes }; if (e.target.value) newCodes[game.id] = e.target.value; else delete newCodes[game.id]; setCodes(newCodes); }} className="border-0 bg-transparent h-8 focus-visible:ring-0 px-1 text-sm font-mono" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2 mt-2">Redes Sociales y Contacto (Opcional)</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2"><Instagram className="w-5 h-5 text-pink-500" /><Input placeholder="Usuario Instagram" value={socialIg} onChange={e => setSocialIg(e.target.value)} className="bg-gray-50" /></div>
                <div className="flex items-center gap-2"><Twitter className="w-5 h-5 text-blue-400" /><Input placeholder="Usuario X (Twitter)" value={socialX} onChange={e => setSocialX(e.target.value)} className="bg-gray-50" /></div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-2">
                  <span className="text-xs font-bold text-gray-500 mb-2 block">Otro método de contacto:</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select value={otherType} onChange={e => setOtherType(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-1/3">
                      <option value="Ninguno">Ninguno</option>
                      <option value="Campfire">Campfire</option>
                      <option value="Discord">Discord</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Twitch">Twitch</option>
                      <option value="Personalizado">Mensaje Libre</option>
                    </select>
                    {otherType !== 'Ninguno' && (
                      <Input 
                        placeholder={otherType === 'Personalizado' ? "Ej: Mándame DM por Campfire a..." : `Usuario en ${otherType}`} 
                        value={otherValue} 
                        onChange={e => setOtherValue(e.target.value)} 
                        className="bg-white flex-1" 
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 rounded-xl bg-gray-100 border-0 hover:bg-gray-200 py-6 font-bold text-gray-600 text-base sm:text-lg">Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!username || Object.keys(codes).length === 0} className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-base sm:text-lg shadow-md shadow-green-500/30">Publicar</Button>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE AMIGOS CON RETRATOS PMD */}
      <div className="space-y-5">
        {friends.length === 0 ? (
          <p className="text-center text-white/80 font-medium py-8 bg-black/10 rounded-2xl">Aún no hay entrenadores. ¡Sé el primero en publicarte!</p>
        ) : (
          friends.map(friend => (
            <div key={friend.id} className="bg-white rounded-[32px] shadow-lg hover:shadow-xl p-6 relative overflow-hidden transition-all border border-gray-100 group flex flex-col">
              
              <div className="flex items-center gap-4 mb-5">
                {/* AVATAR DINÁMICO */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full flex items-center justify-center relative ${friend.avatar_dex ? 'bg-gradient-to-t from-gray-100 to-white shadow-sm border border-gray-200' : 'bg-gradient-to-br from-gray-50 to-gray-200 p-2 shadow-inner border border-gray-200'}`}>
                  <img 
                    src={friend.avatar_dex ? `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${friend.avatar_dex}/Normal.png` : pokebola} 
                    alt="Avatar" 
                    className={`w-full h-full object-contain drop-shadow-md transition-transform duration-300 ${friend.avatar_dex ? 'scale-[1.3] group-hover:scale-[1.4]' : 'group-hover:rotate-12'}`} 
                    style={friend.avatar_dex ? { imageRendering: 'pixelated' } : {}}
                    onError={(e) => { (e.target as HTMLImageElement).src = pokebola; (e.target as HTMLImageElement).style.transform = 'scale(1)'; (e.target as HTMLImageElement).style.imageRendering = 'auto'; }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">{friend.username}</h3>
                </div>

                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => deleteFriendProfile(friend.id)} className="h-10 w-10 text-red-400 hover:text-white hover:bg-red-500 rounded-2xl transition-all shrink-0 ml-2">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {Object.entries(friend.game_codes).map(([gameId, code]) => {
                  const gameInfo = GAMES.find(g => g.id === gameId);
                  if (!gameInfo) return null;
                  const isActive = activeView?.userId === friend.id && activeView?.gameId === gameId;
                  
                  return (
                    <button 
                      key={gameId} 
                      onClick={() => setActiveView(isActive ? null : { userId: friend.id, gameId, code })}
                      className={`relative h-16 px-2 rounded-2xl border-2 transition-all duration-200 flex items-center justify-center overflow-hidden ${
                        isActive 
                          ? 'bg-blue-50 border-blue-400 shadow-inner' 
                          : 'bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <img src={gameInfo.logo} alt={gameInfo.name} className={`h-10 w-auto object-contain transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-md' : 'hover:scale-110'}`} />
                    </button>
                  )
                })}
              </div>

              {activeView?.userId === friend.id && (
                <div className="mb-4 bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-inner animate-in slide-in-from-top-2 border-2 border-gray-800">
                  <div className="flex flex-col">
                    <p className="text-[10px] sm:text-xs text-blue-400 font-black uppercase tracking-widest mb-0.5">
                      {GAMES.find(g => g.id === activeView.gameId)?.name}
                    </p>
                    <p className="font-mono text-lg sm:text-xl font-bold tracking-widest text-white drop-shadow-md">{activeView.code}</p>
                  </div>
                  <Button 
                    onClick={() => handleCopy(activeView.code)} 
                    variant="ghost" 
                    className={`h-12 w-12 p-0 rounded-xl transition-all ${
                      copiedCode === activeView.code 
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {copiedCode === activeView.code ? <Check className="w-6 h-6" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              )}

              {(friend.social_ig || friend.social_x || friend.social_other_type) && (
                <div className="flex flex-wrap items-center gap-3 mt-auto pt-5 border-t-2 border-gray-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Contacto:</span>
                  
                  {friend.social_ig && (
                    <a href={`https://instagram.com/${friend.social_ig}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-50 text-pink-500 hover:bg-pink-500 hover:text-white transition-all shadow-sm" title="Instagram">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  
                  {friend.social_x && (
                    <a href={`https://x.com/${friend.social_x}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-900 hover:text-white transition-all shadow-sm" title="Twitter / X">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  
                  {friend.social_other_type && friend.social_other_value && (
                    <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm ml-auto sm:ml-0">
                       {friend.social_other_type === 'Campfire' || friend.social_other_type === 'Discord' ? <MessageSquare className="w-4 h-4 text-indigo-500"/> : <Hash className="w-4 h-4 text-indigo-500"/>}
                       <span className="text-sm font-bold text-indigo-700">
                         {friend.social_other_type !== 'Personalizado' ? `${friend.social_other_type}: ` : ''}{friend.social_other_value}
                       </span>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  )
}