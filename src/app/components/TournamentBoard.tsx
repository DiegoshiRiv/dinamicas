import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Swords, Eye, Trophy, Plus, Shield, User, Trash2, AlertCircle, Check } from 'lucide-react'
import { useTournaments, Pokemon, TournamentMatch, TournamentPlayer } from '@/hooks/useTournaments'

const REGIONAL_FORMS: Record<string, string[]> = {
  "Rattata": ["Alola"], "Raticate": ["Alola"], "Raichu": ["Alola"], "Sandshrew": ["Alola"], "Sandslash": ["Alola"], "Vulpix": ["Alola"], "Ninetales": ["Alola"], "Diglett": ["Alola"], "Dugtrio": ["Alola"], "Meowth": ["Alola", "Galar"], "Persian": ["Alola"], "Geodude": ["Alola"], "Graveler": ["Alola"], "Golem": ["Alola"], "Grimer": ["Alola"], "Muk": ["Alola"], "Exeggutor": ["Alola"], "Marowak": ["Alola"],
  "Ponyta": ["Galar"], "Rapidash": ["Galar"], "Slowpoke": ["Galar"], "Slowbro": ["Galar"], "Farfetch'd": ["Galar"], "Weezing": ["Galar"], "Mr. Mime": ["Galar"], "Articuno": ["Galar"], "Zapdos": ["Galar"], "Moltres": ["Galar"], "Slowking": ["Galar"], "Corsola": ["Galar"], "Zigzagoon": ["Galar"], "Linoone": ["Galar"], "Darumaka": ["Galar"], "Darmanitan": ["Galar"], "Yamask": ["Galar"], "Stunfisk": ["Galar"],
  "Growlithe": ["Hisui"], "Arcanine": ["Hisui"], "Voltorb": ["Hisui"], "Electrode": ["Hisui"], "Typhlosion": ["Hisui"], "Qwilfish": ["Hisui"], "Sneasel": ["Hisui"], "Samurott": ["Hisui"], "Lilligant": ["Hisui"], "Basculin": ["Hisui"], "Zorua": ["Hisui"], "Zoroark": ["Hisui"], "Braviary": ["Hisui"], "Sliggoo": ["Hisui"], "Goodra": ["Hisui"], "Avalugg": ["Hisui"], "Decidueye": ["Hisui"]
};

const POKEMON_LIST = "Abomasnow,Aegislash,Aerodactyl,Aggron,Alakazam,Alomomola,Altaria,Ampharos,Annihilape,Arbok,Arboliva,Arcanine,Arceus,Archeops,Ariados,Armarouge,Armaldo,Aromatisse,Articuno,Audino,Aurorus,Avalugg,Azelf,Azumarill,Baxcalibur,Bastiodon,Beedrill,Bellibolt,Bellossom,Bewear,Bidoof,Bisharp,Blastoise,Blaziken,Blissey,Bramblin,Breloom,Bronzong,Bruxish,Butterfree,Buzzwole,Camerupt,Carbink,Carkol,Carnivine,Carracosta,Castform,Ceruledge,Cetitan,Chandelure,Charizard,Chatot,Cherrim,Chesnaught,Chien-Pao,Chi-Yu,Chimecho,Cinccino,Cinderace,Clamperl,Claydol,Clefable,Cloyster,Cobalion,Cofagrigus,Comfey,Conkeldurr,Copperajah,Corviknight,Crabominable,Cradily,Cramorant,Cranidos,Crawdaunt,Cresselia,Crobat,Crustle,Cryogonal,Dachsbun,Darkrai,Darmanitan,Decidueye,Dedenne,Delcatty,Delibird,Delphox,Deoxys,Dewgong,Dialga,Diancie,Diggersby,Ditto,Dodrio,Donphan,Dondozo,Dragalge,Dragapult,Dragonite,Drapion,Drednaw,Drifblim,Dugtrio,Dunsparce,Duraludon,Durant,Dusknoir,Dustox,Eelektross,Electivire,Electrode,Emboar,Empoleon,Entei,Escavalier,Espeon,Excadrill,Exeggutor,Exploud,Falinks,Farfetch'd,Feraligatr,Ferrothorn,Flamigo,Flareon,Fletchinder,Florges,Flygon,Forretress,Froslass,Frosmoth,Furret,Gallade,Galvantula,Garbodor,Garchomp,Gardevoir,Garganacl,Gastrodon,Gengar,Gholdengo,Gigalith,Girafarig,Giratina,Glaceon,Glalie,Gligar,Gliscor,Gogoat,Golbat,Golduck,Golem,Golisopod,Golurk,Goodra,Gorebyss,Gothitelle,Gourgeist,Granbull,Grafaiai,Greedent,Greninja,Grimer,Grimmsnarl,Groudon,Grovyle,Grumpig,Guzzlord,Gyarados,Hariyama,Haxorus,Heatmor,Heatran,Heracross,Hippowdon,Hitmonchan,Hitmonlee,Hitmontop,Ho-Oh,Honchkrow,Hoopa,Houndoom,Huntail,Hydreigon,Hypno,Incineroar,Infernape,Inteleon,Ivysaur,Jellicent,Jigglypuff,Jirachi,Jolteon,Jumpluff,Jynx,Kabutops,Kadabra,Kangaskhan,Kecleon,Keldeo,Kingambit,Kingdra,Kingler,Klang,Kleavor,Klefki,Klinklang,Kommo-o,Krabby,Kricketune,Krookodile,Kyogre,Kyurem,Lairon,Lanturn,Lapras,Latias,Latios,Leafeon,Leavanny,Ledian,Lickilicky,Lickitung,Liepard,Lilligant,Linoone,Lokix,Lopunny,Lucario,Ludicolo,Lugia,Lumineon,Lunala,Lunatone,Lurantis,Luvdisc,Luxray,Lycanroc,Machamp,Machoke,Magcargo,Magearna,Magmortar,Magneton,Magnezone,Malamar,Mamoswine,Manaphy,Mandibuzz,Manectric,Mantine,Maractus,Marill,Marowak,Marshtomp,Masquerain,Mawile,Medicham,Meganium,Melmetal,Meloetta,Meowscarada,Mesprit,Metagross,Metang,Mew,Mewtwo,Mienshao,Mightyena,Milotic,Miltank,Mimikyu,Minun,Mismagius,Moltres,Mothim,Mr. Mime,Mudsdale,Muk,Musharna,Naganadel,Natu,Nidoking,Nidoqueen,Nihilego,Ninetales,Ninjask,Noctowl,Noivern,Nosepass,Obstagoon,Octillery,Oddish,Omastar,Orthworm,Oranguru,Oricorio,Pachirisu,Palafin,Palkia,Palossand,Pangoro,Parasect,Passimian,Pawmot,Pelipper,Perrserker,Persian,Pidgeot,Pikachu,Piloswine,Pinsir,Plusle,Politoed,Poliwrath,Porygon-Z,Porygon2,Primarina,Primeape,Probopass,Purugly,Pyroar,Quagsire,Quaquaval,Qwilfish,Raichu,Raikou,Rapidash,Raticate,Rayquaza,Regice,Regidrago,Regieleki,Regigigas,Regirock,Registeel,Relicanth,Reshiram,Reuniclus,Revavroom,Rhydon,Rhyperior,Rillaboom,Roaring Moon,Roselia,Roserade,Rotom,Sableye,Salamence,Samurott,Sandslash,Sawk,Sawsbuck,Sceptile,Scizor,Scolipede,Scrafty,Scyther,Seaking,Sealeo,Secret Sword,Seismitoad,Serperior,Seviper,Sharpedo,Shedinja,Shiftry,Shiinotic,Shuckle,Sigilyph,Silvally,Simipour,Simisage,Simisear,Sirfetch'd,Skarmory,Skeledirge,Slaking,Slowbro,Slowking,Slugma,Smeargle,Sneasel,Sneasler,Snorlax,Snubbull,Solgaleo,Solrock,Spinda,Spiritomb,Stantler,Staraptor,Starmie,Steelix,Stoutland,Stunfisk,Sudowoodo,Suicune,Sunflora,Swalot,Swampert,Swanna,Swellow,Swoobat,Sylveon,Talonflame,Tangela,Tangrowth,Tapu Bulu,Tapu Fini,Tapu Koko,Tapu Lele,Tauros,Tentacruel,Terapagos,Togekiss,Togetic,Torkoal,Tornadus,Torterra,Toxapex,Toxicroak,Toxtricity,Trevenant,Tropius,Tsareena,Typhlosion,Tyranitar,Tyrantrum,Umbreon,Unfezant,Unown,Ursaluna,Ursaring,Uxie,Vaporeon,Veluza,Venomoth,Venusaur,Vespiquen,Victini,Victreebel,Vigoroth,Vileplume,Virizion,Vivillon,Volbeat,Volcanion,Volcarona,Wailord,Walrein,Watchog,Weavile,Weezing,Whimsicott,Whiscash,Wigglytuff,Wobbuffet,Wormadam,Wyrdeer,Xatu,Xerneas,Yveltal,Zangoose,Zapdos,Zarude,Zebstrika,Zekrom,Zeraora,Zoroark,Zygarde".split(",")

export function TournamentBoard({ isAdmin }: { isAdmin: boolean }) {
  const { tournaments, players, matches, createTournament, updateTournamentStatus, deleteTournament, registerPlayer, generateRound, setWinner } = useTournaments()
  const [newTName, setNewTName] = useState('')
  const [leagueChoice, setLeagueChoice] = useState<'super' | 'ultra' | 'master'>('super')
  const [selectedT, setSelectedT] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [team, setTeam] = useState<Pokemon[]>(Array(6).fill({ species: '', state: 'Normal', regional: 'Normal', cp: '', fast: '', charge1: '', charge2: '' }))
  
  const [viewPlayer, setViewPlayer] = useState<TournamentPlayer | null>(null)
  const [confirmWinnerData, setConfirmWinnerData] = useState<{matchId: string, playerId: string, playerName: string} | null>(null)
  
  // NUEVO ESTADO PARA NUESTRO MODAL ESTÉTICO
  const [alertInfo, setAlertInfo] = useState<{ title: string, message: string, type: 'error' | 'success' | 'champion' } | null>(null);

  const activeT = tournaments.find(t => t.id === selectedT)
  const tPlayers = players.filter(p => p.tournament_id === selectedT)
  const tMatches = matches.filter(m => m.tournament_id === selectedT && m.round === activeT?.current_round)

  const handleUpdatePokemon = (index: number, field: keyof Pokemon, value: string) => {
    const newTeam = [...team]
    newTeam[index] = { ...newTeam[index], [field]: value }
    if (field === 'species') newTeam[index].regional = 'Normal';
    setTeam(newTeam)
  }

  const handleRegister = async () => {
    if (!playerName.trim() || !selectedT) return

    const maxCP = activeT?.league === 'super' ? 1500 : activeT?.league === 'ultra' ? 2500 : 99999;
    const overCP = team.some(p => parseInt(p.cp || '0') > maxCP);

    if (overCP) {
      setAlertInfo({ title: "Límite de PC Excedido", message: `El torneo es formato ${activeT?.league.toUpperCase()} (PC máximo: ${maxCP}). Uno de tus Pokémon excede el límite permitido.`, type: 'error' });
      return;
    }

    await registerPlayer(selectedT, playerName, team)
    setPlayerName(''); setTeam(Array(6).fill({ species: '', state: 'Normal', regional: 'Normal', cp: '', fast: '', charge1: '', charge2: '' }))
    setAlertInfo({ title: "¡Inscripción Exitosa!", message: "Tu equipo ha sido registrado exitosamente y tu Hoja Abierta ha sido enviada al torneo.", type: 'success' });
  }

  const handleNextRound = async (tId: string, round: number) => {
    const res = await generateRound(tId, round);
    if (res?.error) {
      setAlertInfo({ title: "Acción Denegada", message: res.error, type: 'error' });
    } else if (res?.champion) {
      setAlertInfo({ title: "¡Tenemos un Campeón!", message: res.message || "", type: 'champion' });
    }
  }

  const handleWinnerClick = (matchId: string, playerId: string, playerName: string) => {
    setConfirmWinnerData({ matchId, playerId, playerName })
  }

  if (!selectedT) return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {isAdmin && (
        <div className="bg-white p-6 rounded-[24px] shadow-xl space-y-4 border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg">Crear Nuevo Torneo</h3>
          <Input placeholder="Ej: Copa Evento..." value={newTName} onChange={e => setNewTName(e.target.value)} className="bg-gray-50 border-0 py-6 text-lg" />
          
          <div>
            <span className="text-sm font-bold text-gray-500 mb-2 block">Formato / Liga:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={() => setLeagueChoice('super')} className={`py-6 font-bold ${leagueChoice === 'super' ? 'bg-blue-600 text-white border-b-4 border-red-500 shadow-md transform scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Superball (1500 PC)</Button>
              <Button onClick={() => setLeagueChoice('ultra')} className={`py-6 font-bold ${leagueChoice === 'ultra' ? 'bg-gray-900 text-yellow-400 border-b-4 border-yellow-500 shadow-md transform scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>UltraBall (2500 PC)</Button>
              <Button onClick={() => setLeagueChoice('master')} className={`py-6 font-bold ${leagueChoice === 'master' ? 'bg-purple-700 text-white border-b-4 border-pink-400 shadow-md transform scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Masterball (Sin Límite)</Button>
            </div>
          </div>

          <Button onClick={() => { createTournament(newTName, leagueChoice); setNewTName('') }} disabled={!newTName} className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-black py-6 text-lg">
            <Plus className="w-6 h-6 mr-2"/> Publicar Torneo
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tournaments.length === 0 ? <p className="text-white/80 col-span-2 text-center py-10 bg-black/10 rounded-2xl">No hay torneos activos.</p> : tournaments.map(t => (
          <div key={t.id} onClick={() => setSelectedT(t.id)} className="bg-white p-6 rounded-[24px] shadow-xl cursor-pointer hover:scale-[1.02] transition-transform flex justify-between items-center border-l-8" style={{ borderLeftColor: t.league === 'super' ? '#3B82F6' : t.league === 'ultra' ? '#111827' : '#7E22CE' }}>
            <div>
              <h3 className="text-xl font-black text-gray-900">{t.name}</h3>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Formato {t.league}ball</p>
              <p className={`text-sm font-bold ${t.status === 'open' ? 'text-green-500' : t.status === 'finished' ? 'text-gray-400' : 'text-blue-500'}`}>
                {t.status === 'open' ? 'Inscripciones Abiertas' : t.status === 'active' ? `Ronda ${t.current_round}` : 'Finalizado'}
              </p>
            </div>
            <Swords className="w-8 h-8 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <datalist id="pokemon-list">
        {POKEMON_LIST.map(poke => <option key={poke} value={poke} />)}
      </datalist>

      <div className="bg-white rounded-[24px] shadow-xl p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">{activeT?.name}</h2>
          <div className="flex gap-3 items-center mt-1">
            <span className={`px-3 py-1 rounded-full text-xs font-black text-white ${activeT?.league === 'super' ? 'bg-blue-600' : activeT?.league === 'ultra' ? 'bg-gray-900 text-yellow-400' : 'bg-purple-700'}`}>Formato {activeT?.league.toUpperCase()}</span>
            <p className="text-gray-500 font-medium text-sm">{tPlayers.length} Participantes</p>
          </div>
        </div>
        <Button onClick={() => setSelectedT(null)} variant="outline" className="border-0 bg-gray-100 font-bold text-gray-600 hover:bg-gray-200">Volver</Button>
      </div>

      {isAdmin && (
        <div className="bg-purple-50 rounded-[24px] p-6 shadow-inner border border-purple-100 flex flex-wrap gap-3 items-center">
          <span className="font-bold text-purple-900 w-full mb-2">Panel de Admin</span>
          {activeT?.status === 'open' && <Button onClick={() => handleNextRound(selectedT, 1)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1">Cerrar Inscripciones e Iniciar Ronda 1</Button>}
          {activeT?.status === 'active' && <Button onClick={() => handleNextRound(selectedT, (activeT.current_round || 1) + 1)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1">Generar Siguiente Ronda</Button>}
          {activeT?.status !== 'finished' && <Button onClick={() => updateTournamentStatus(selectedT, 'finished')} className="bg-gray-800 text-white font-bold flex-1">Finalizar Torneo</Button>}
          <Button onClick={() => { deleteTournament(selectedT); setSelectedT(null) }} variant="destructive" size="icon" className="shrink-0"><Trash2 className="w-5 h-5"/></Button>
        </div>
      )}

      {activeT?.status === 'open' && (
        <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8">
          <h3 className="text-xl font-black mb-1">Registro de Hoja Abierta</h3>
          <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Límite: {activeT?.league === 'super' ? '1500 PC' : activeT?.league === 'ultra' ? '2500 PC' : 'Sin límite'}</p>
          
          <Input placeholder="Tu Nombre o Gamertag *" value={playerName} onChange={e => setPlayerName(e.target.value)} className="mb-6 bg-gray-50 text-lg py-6 border-2 border-gray-200" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[0, 1, 2, 3, 4, 5].map(i => {
              const availableForms = REGIONAL_FORMS[team[i].species] || [];
              
              return (
                <div key={i} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3 relative shadow-sm">
                  <span className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-md">{i + 1}</span>
                  
                  <div className="flex gap-2">
                    <Input list="pokemon-list" placeholder="Pokémon" value={team[i].species} onChange={e => handleUpdatePokemon(i, 'species', e.target.value)} className="flex-1 bg-white border-gray-300" />
                  </div>

                  <div className="flex gap-2">
                    <select value={team[i].state} onChange={e => handleUpdatePokemon(i, 'state', e.target.value)} className="flex-1 bg-white text-xs border border-gray-300 rounded-md px-2 focus:ring-2 focus:ring-blue-500 outline-none h-10 font-medium">
                      <option value="Normal">Normal</option>
                      <option value="Oscuro">Oscuro</option>
                      <option value="Purificado">Purificado</option>
                    </select>

                    {availableForms.length > 0 && (
                      <select value={team[i].regional} onChange={e => handleUpdatePokemon(i, 'regional', e.target.value)} className="flex-1 bg-white text-xs border border-gray-300 rounded-md px-2 focus:ring-2 focus:ring-blue-500 outline-none h-10 font-bold text-blue-700 bg-blue-50 border-blue-200">
                        <option value="Normal">Forma Estándar</option>
                        {availableForms.map(form => <option key={form} value={form}>{form}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input type="number" placeholder="PC Exacto" value={team[i].cp} onChange={e => handleUpdatePokemon(i, 'cp', e.target.value)} className="w-1/3 bg-white border-gray-300" />
                    <Input placeholder="Ataque Rápido" value={team[i].fast} onChange={e => handleUpdatePokemon(i, 'fast', e.target.value)} className="flex-1 bg-white border-gray-300" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input placeholder="Cargado 1" value={team[i].charge1} onChange={e => handleUpdatePokemon(i, 'charge1', e.target.value)} className="flex-1 bg-white border-gray-300" />
                    <Input placeholder="Cargado 2 (Opcional)" value={team[i].charge2} onChange={e => handleUpdatePokemon(i, 'charge2', e.target.value)} className="flex-1 bg-white border-gray-300" />
                  </div>
                </div>
              )
            })}
          </div>
          <Button onClick={handleRegister} disabled={!playerName.trim() || team.some(p => !p.species)} className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-6 text-xl rounded-xl shadow-lg">Inscribir mi Equipo</Button>
        </div>
      )}

      {/* DISEÑO TIPO BRACKET CON TROFEO CENTRAL */}
      {activeT?.status === 'active' && (
        <div className="flex flex-col items-center gap-8 mt-8">
          
          <div className="flex flex-col justify-center items-center relative z-10 shrink-0 mb-4">
             <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-5 rounded-full border-4 border-yellow-400 shadow-xl mb-3">
                 <Trophy className="w-12 h-12 text-yellow-600 drop-shadow-md" />
             </div>
             <span className="font-black text-gray-800 text-xl uppercase tracking-widest bg-white border-2 border-gray-200 px-6 py-2 rounded-full shadow-sm">
                Ronda {activeT.current_round}
             </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 w-full">
            {tMatches.map(m => {
              const p1 = players.find(p => p.id === m.player1_id);
              const p2 = players.find(p => p.id === m.player2_id);
              
              return (
                <div key={m.id} className="relative flex flex-col items-center w-full sm:w-[320px]">
                  
                  <div className="w-0.5 h-6 bg-gray-300 -mt-6"></div>
                  
                  <div className="bg-white border-2 border-gray-200 rounded-2xl w-full shadow-lg overflow-hidden flex flex-col relative z-10">
                    
                    {/* JUGADOR 1 */}
                    <div 
                      className={`p-4 flex items-center justify-between transition-colors ${m.winner_id === p1?.id ? 'bg-green-100 border-b-2 border-green-200' : 'bg-white border-b-2 border-gray-100'} hover:bg-gray-50 cursor-pointer`}
                      onClick={() => isAdmin && !m.winner_id && p1 && p2 && handleWinnerClick(m.id, p1.id, p1.player_name)}
                    >
                      <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); if (p1) setViewPlayer(p1); }} className="bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-500 p-2 rounded-lg shadow-sm"><Eye className="w-4 h-4"/></button>
                        <span className={`font-black text-lg ${m.winner_id === p1?.id ? 'text-green-800' : 'text-gray-800'}`}>{p1?.player_name}</span>
                      </div>
                      {m.winner_id === p1?.id && <Check className="w-6 h-6 text-green-600 drop-shadow-sm"/>}
                    </div>

                    {/* CENTRO: VS o AVANZA AUTOMÁTICO */}
                    <div className="relative h-0 flex justify-center items-center z-20">
                       {p2 ? (
                         <div className="bg-gray-800 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-white shadow-md">VS</div>
                       ) : (
                         <div className="bg-yellow-400 text-yellow-900 text-xs font-black px-4 py-1 rounded-full border-2 border-white shadow-md flex items-center gap-1">
                           <Trophy className="w-3 h-3"/> AVANZA
                         </div>
                       )}
                    </div>

                    {/* JUGADOR 2 (O ESPACIO VACÍO SI ES IMPAR) */}
                    {p2 ? (
                      <div 
                        className={`p-4 flex items-center justify-between transition-colors ${m.winner_id === p2?.id ? 'bg-green-100' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`}
                        onClick={() => isAdmin && !m.winner_id && p2 && handleWinnerClick(m.id, p2.id, p2.player_name)}
                      >
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setViewPlayer(p2); }} className="bg-white border border-gray-200 hover:bg-blue-100 text-gray-500 hover:text-blue-500 p-2 rounded-lg shadow-sm"><Eye className="w-4 h-4"/></button>
                          <span className={`font-black text-lg ${m.winner_id === p2?.id ? 'text-green-800' : 'text-gray-800'}`}>{p2.player_name}</span>
                        </div>
                        {m.winner_id === p2?.id && <Check className="w-6 h-6 text-green-600 drop-shadow-sm"/>}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 flex justify-center items-center h-[76px]">
                        <div className="w-1/2 h-1.5 bg-gray-200 rounded-full opacity-60"></div>
                      </div>
                    )}
                    
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR GANADOR */}
      {confirmWinnerData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 border-yellow-400 transform transition-all">
              <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Trophy className="w-12 h-12 text-yellow-500 drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-wide">¡Ganador de esta ronda!</h3>
              <p className="text-gray-600 mb-8 text-lg">¿Confirmar victoria para <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{confirmWinnerData.playerName}</span>?</p>
              
              <div className="flex gap-3">
                 <Button onClick={() => setConfirmWinnerData(null)} variant="outline" className="flex-1 py-6 text-gray-500 font-bold border-2 border-gray-200 hover:bg-gray-50 text-lg">Cancelar</Button>
                 <Button onClick={() => { setWinner(confirmWinnerData.matchId, confirmWinnerData.playerId); setConfirmWinnerData(null); }} className="flex-1 py-6 bg-green-500 hover:bg-green-600 text-white font-black shadow-lg text-lg">Confirmar</Button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL HOJA ABIERTA INDIVIDUAL */}
      {viewPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewPlayer(null)}>
          <div className="bg-white rounded-[32px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-6 text-center text-gray-900 border-b pb-4 flex items-center justify-center gap-2">
              <User className="w-6 h-6 text-blue-500"/> Hoja de {viewPlayer.player_name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {viewPlayer.team.map((poke, i) => (
                <div key={i} className={`bg-white p-4 rounded-2xl shadow-sm border-l-4 ${poke.state === 'Oscuro' ? 'border-purple-600' : poke.state === 'Purificado' ? 'border-yellow-400' : 'border-blue-400'} border-t border-r border-b border-gray-100`}>
                  <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <span className="font-black text-gray-800 text-lg">{poke.species} 
                      {poke.regional !== 'Normal' && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{poke.regional}</span>}
                      {poke.state !== 'Normal' && <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${poke.state === 'Oscuro' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>{poke.state}</span>}
                    </span>
                    <span className="font-mono font-black text-sm bg-gray-900 text-white px-2 py-1 rounded-md">PC {poke.cp}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2"><Swords className="w-4 h-4 text-red-500"/> <span className="text-gray-700 font-bold">{poke.fast || '-'}</span></div>
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500"/> <span className="text-gray-700 font-bold">{poke.charge1 || '-'}</span></div>
                    {poke.charge2 && <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500"/> <span className="text-gray-700 font-bold">{poke.charge2}</span></div>}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setViewPlayer(null)} className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 rounded-xl text-lg">Cerrar</Button>
          </div>
        </div>
      )}

      {/* NUEVO MODAL DE ALERTAS ESTÉTICO */}
      {alertInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200" onClick={() => setAlertInfo(null)}>
           <div className={`bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 ${alertInfo.type === 'error' ? 'border-red-400' : alertInfo.type === 'success' ? 'border-green-400' : 'border-yellow-400'} transform transition-all`} onClick={e => e.stopPropagation()}>
              <div className={`${alertInfo.type === 'error' ? 'bg-red-100 text-red-500' : alertInfo.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-yellow-100 text-yellow-500'} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}>
                {alertInfo.type === 'error' && <AlertCircle className="w-10 h-10" />}
                {alertInfo.type === 'success' && <Check className="w-10 h-10" />}
                {alertInfo.type === 'champion' && <Trophy className="w-10 h-10" />}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{alertInfo.title}</h3>
              <p className="text-gray-600 mb-8 text-base">{alertInfo.message}</p>
              
              <Button onClick={() => setAlertInfo(null)} className={`w-full py-6 font-black shadow-lg text-lg text-white ${alertInfo.type === 'error' ? 'bg-red-500 hover:bg-red-600' : alertInfo.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                Entendido
              </Button>
           </div>
        </div>
      )}
    </div>
  )
}