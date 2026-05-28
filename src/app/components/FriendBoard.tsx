import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Instagram,
  Twitter,
  MessageSquare,
  Copy,
  Check,
  Plus,
  Trash2,
  Hash,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useFriends } from '@/hooks/useFriends'

import pokebola from '@/assets/Pokebola.png'
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
] as const

type GameId = (typeof GAMES)[number]['id']

type ContactMethod = 'ig' | 'x' | 'discord' | 'campfire' | 'other'

const CONTACT_METHODS: { id: ContactMethod; label: string; placeholder: string }[] = [
  { id: 'ig', label: 'Instagram', placeholder: 'Usuario de Instagram' },
  { id: 'x', label: 'X', placeholder: 'Usuario de X' },
  { id: 'discord', label: 'Discord', placeholder: 'Usuario o servidor' },
  { id: 'campfire', label: 'Campfire', placeholder: 'Tu usuario' },
  { id: 'other', label: 'Otro', placeholder: 'Cómo contactarte' },
]

const getAvatarUrl = (avatarDex?: string) =>
  avatarDex
    ? `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${avatarDex}/Normal.png`
    : pokebola

export function FriendBoard({ isAdmin }: { isAdmin: boolean }) {
  const { friends, addFriendProfile, deleteFriendProfile } = useFriends()
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarDex, setAvatarDex] = useState('')
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [contactMethod, setContactMethod] = useState<ContactMethod | null>(null)
  const [contactValue, setContactValue] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<{ userId: string; gameId: string; code: string } | null>(null)
  const [gameFilter, setGameFilter] = useState<'all' | GameId>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [contactFriendId, setContactFriendId] = useState<string | null>(null)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleSubmit = async () => {
    if (!username.trim() || Object.keys(codes).length === 0) return
    const cleanContact = contactValue.trim()
    await addFriendProfile({
      username: username.trim(),
      avatar_dex: avatarDex ? avatarDex.padStart(4, '0') : undefined,
      game_codes: codes,
      social_ig: contactMethod === 'ig' ? cleanContact.replace('@', '') : '',
      social_x: contactMethod === 'x' ? cleanContact.replace('@', '') : '',
      social_other_type:
        contactMethod === 'discord'
          ? 'Discord'
          : contactMethod === 'campfire'
            ? 'Campfire'
            : contactMethod === 'other'
              ? 'Personalizado'
              : undefined,
      social_other_value:
        contactMethod === 'discord' || contactMethod === 'campfire' || contactMethod === 'other'
          ? cleanContact
          : '',
    })
    setShowForm(false)
    setUsername('')
    setAvatarDex('')
    setCodes({})
    setContactMethod(null)
    setContactValue('')
  }

  const filteredFriends =
    gameFilter === 'all'
      ? friends
      : friends.filter((f) => Boolean(f.game_codes[gameFilter]))

  const filterLabel =
    gameFilter === 'all' ? 'Todos los juegos' : GAMES.find((g) => g.id === gameFilter)?.name ?? 'Todos los juegos'

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-3 rounded-[22px] bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-4 shadow-md transition-colors text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-black leading-tight">Publicar en el tablón</span>
            <span className="block text-[12px] font-medium text-white/90 mt-0.5 leading-snug">
              Códigos de juego y contacto
            </span>
          </span>
          <ChevronRight className="w-6 h-6 shrink-0 text-white/90" strokeWidth={2.5} />
        </button>
      ) : (
        <div className="bg-white rounded-[24px] shadow-xl p-5 relative border border-gray-100">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            aria-label="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black text-gray-900 pr-10">Nueva publicación</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4">Solo llena lo que uses.</p>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#eef4ff] border border-[#dbeafe] flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={getAvatarUrl(avatarDex ? avatarDex.padStart(4, '0') : undefined)}
                  alt="Preview"
                  className="w-10 h-10 object-contain"
                  style={avatarDex ? { imageRendering: 'pixelated' } : {}}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = pokebola
                  }}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Tu nombre de entrenador *"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-50 border-gray-200 font-bold"
                />
                <Input
                  type="number"
                  min="1"
                  max="1025"
                  placeholder="Nº Pokédex (opcional)"
                  value={avatarDex}
                  onChange={(e) => setAvatarDex(e.target.value)}
                  className="bg-gray-50 border-gray-200 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">Códigos de juego *</p>
              <div className="space-y-2">
                {GAMES.map((game) => (
                  <div key={game.id} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-2 py-1.5">
                    <img src={game.logo} alt={game.name} className="w-7 h-7 object-contain shrink-0" />
                    <Input
                      placeholder={game.name}
                      value={codes[game.id] || ''}
                      onChange={(e) => {
                        const newCodes = { ...codes }
                        if (e.target.value) newCodes[game.id] = e.target.value
                        else delete newCodes[game.id]
                        setCodes(newCodes)
                      }}
                      className="border-0 bg-transparent h-9 focus-visible:ring-0 px-1 text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">Contacto (opcional)</p>
              <div className="flex flex-wrap gap-2">
                {CONTACT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      if (contactMethod === method.id) {
                        setContactMethod(null)
                        setContactValue('')
                      } else {
                        setContactMethod(method.id)
                        setContactValue('')
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      contactMethod === method.id
                        ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
              {contactMethod && (
                <Input
                  placeholder={CONTACT_METHODS.find((m) => m.id === contactMethod)?.placeholder}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  className="mt-2 bg-gray-50 border-gray-200"
                />
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 rounded-xl font-bold h-11">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!username || Object.keys(codes).length === 0}
                className="flex-1 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold h-11"
              >
                Publicar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowFilterMenu((v) => !v)}
          className="flex items-center gap-2 text-[#1f2937] font-bold text-[15px] py-1"
        >
          <SlidersHorizontal className="w-5 h-5 text-gray-600" strokeWidth={2} />
          <span>{filterLabel}</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
        </button>

        {showFilterMenu && (
          <div className="absolute left-0 top-full mt-2 z-20 w-full max-w-xs rounded-2xl border border-gray-200 bg-white shadow-xl py-2 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setGameFilter('all')
                setShowFilterMenu(false)
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-gray-50 ${gameFilter === 'all' ? 'text-[#3B82F6]' : 'text-gray-700'}`}
            >
              Todos los juegos
            </button>
            {GAMES.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  setGameFilter(game.id)
                  setShowFilterMenu(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 ${
                  gameFilter === game.id ? 'text-[#3B82F6]' : 'text-gray-700'
                }`}
              >
                <img src={game.logo} alt="" className="w-6 h-6 object-contain" />
                {game.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredFriends.length === 0 ? (
          <p className="text-center text-gray-500 font-medium py-10 bg-white/80 rounded-2xl border border-gray-100">
            {friends.length === 0
              ? 'Aún no hay entrenadores. ¡Sé el primero en publicarte!'
              : 'No hay publicaciones para este juego.'}
          </p>
        ) : (
          filteredFriends.map((friend) => {
            const friendGames = Object.keys(friend.game_codes)
              .map((id) => GAMES.find((g) => g.id === id))
              .filter(Boolean) as (typeof GAMES)[number][]

            const hasContact = Boolean(
              friend.social_ig || friend.social_x || (friend.social_other_type && friend.social_other_value)
            )
            const showContact = contactFriendId === friend.id

            return (
              <div
                key={friend.id}
                className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4 relative overflow-visible"
              >
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFriendProfile(friend.id)}
                    className="absolute top-2 right-2 h-8 w-8 text-red-400 hover:text-white hover:bg-red-500 rounded-lg z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={getAvatarUrl(friend.avatar_dex)}
                      alt=""
                      className="w-full h-full object-contain scale-[1.15]"
                      style={friend.avatar_dex ? { imageRendering: 'pixelated' } : {}}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = pokebola
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-14">
                    <h3 className="text-[17px] font-black text-gray-900 leading-tight truncate">{friend.username}</h3>
                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">Juegos disponibles:</p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {friendGames.map((game) => {
                        const code = friend.game_codes[game.id]
                        const isActive =
                          activeView?.userId === friend.id && activeView?.gameId === game.id
                        return (
                          <button
                            key={game.id}
                            type="button"
                            onClick={() =>
                              setActiveView(
                                isActive ? null : { userId: friend.id, gameId: game.id, code }
                              )
                            }
                            className={`w-10 h-10 rounded-xl flex items-center justify-center p-1.5 transition-all border shadow-sm ${
                              isActive
                                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200 ring-offset-1 scale-105'
                                : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md hover:scale-105'
                            }`}
                            title={game.name}
                          >
                            <img
                              src={game.logo}
                              alt={game.name}
                              className="w-full h-full object-contain"
                            />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="relative shrink-0 self-center w-11 h-11">
                    {showContact && (
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        {!hasContact ? (
                          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 text-white text-[10px] font-bold px-2 py-1 shadow-md">
                            Sin contacto
                          </span>
                        ) : (
                          <>
                            {friend.social_ig && (
                              <a
                                href={`https://instagram.com/${friend.social_ig}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pointer-events-auto absolute -top-10 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                title="Instagram"
                              >
                                <Instagram className="w-4 h-4" />
                              </a>
                            )}
                            {friend.social_x && (
                              <a
                                href={`https://x.com/${friend.social_x}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pointer-events-auto absolute top-1/2 -translate-y-1/2 -left-10 w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                title="X"
                              >
                                <Twitter className="w-4 h-4" />
                              </a>
                            )}
                            {friend.social_other_type && friend.social_other_value && (
                              <span
                                className="pointer-events-auto absolute top-1/2 -translate-y-1/2 -right-10 w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg"
                                title={`${friend.social_other_type}: ${friend.social_other_value}`}
                              >
                                {friend.social_other_type === 'Campfire' || friend.social_other_type === 'Discord' ? (
                                  <MessageSquare className="w-4 h-4" />
                                ) : (
                                  <Hash className="w-4 h-4" />
                                )}
                              </span>
                            )}
                            {(friend.social_other_type && friend.social_other_value) && (
                              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 max-w-[120px] truncate rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-indigo-700 px-2 py-1 shadow-md pointer-events-none">
                                {friend.social_other_type !== 'Personalizado'
                                  ? `${friend.social_other_type}: `
                                  : ''}
                                {friend.social_other_value}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setContactFriendId(showContact ? null : friend.id)}
                      className={`relative z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        showContact
                          ? 'bg-[#3B82F6] text-white shadow-md scale-105'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                      aria-label="Ver contacto"
                      aria-expanded={showContact}
                    >
                      <MessageSquare className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {activeView?.userId === friend.id && (
                  <div className="mt-3 bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-blue-300 font-black uppercase tracking-wider">
                        {GAMES.find((g) => g.id === activeView.gameId)?.name}
                      </p>
                      <p className="font-mono text-base font-bold tracking-wide">{activeView.code}</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleCopy(activeView.code)}
                      variant="ghost"
                      className={`h-10 w-10 p-0 rounded-lg ${
                        copiedCode === activeView.code
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {copiedCode === activeView.code ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                )}

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
