import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Swords, Eye, Trophy, Plus, Shield, User, Trash2, AlertCircle, Check, AlertTriangle } from 'lucide-react'
import { useTournaments, Pokemon, TournamentMatch, TournamentPlayer } from '@/hooks/useTournaments'
import pokebola from '@/assets/pokeball.png'

import typeNormal from '@/assets/normal.png'
import typeLucha from '@/assets/lucha.png'
import typeVolador from '@/assets/volador.png'
import typeVeneno from '@/assets/veneno.png'
import typeTierra from '@/assets/tierra.png'
import typeRoca from '@/assets/roca.png'
import typeBicho from '@/assets/bicho.png'
import typeFantasma from '@/assets/fantasma.png'
import typeAcero from '@/assets/acero.png'
import typeFuego from '@/assets/fuego.png'
import typeAgua from '@/assets/agua.png'
import typePlanta from '@/assets/planta.png'
import typeElectrico from '@/assets/electrico.png'
import typePsiquico from '@/assets/psiquico.png'
import typeHielo from '@/assets/hielo.png'
import typeDragon from '@/assets/dragon.png'
import typeSiniestro from '@/assets/siniestro.png'
import typeHada from '@/assets/hada.png'

import imgOscuro from '@/assets/oscuro.png'
import imgPurificado from '@/assets/purificado.png'

const POKEMON_TYPES = [
  { name: 'Normal', icon: typeNormal }, { name: 'Fuego', icon: typeFuego },
  { name: 'Agua', icon: typeAgua }, { name: 'Planta', icon: typePlanta },
  { name: 'Eléctrico', icon: typeElectrico }, { name: 'Hielo', icon: typeHielo },
  { name: 'Lucha', icon: typeLucha }, { name: 'Veneno', icon: typeVeneno },
  { name: 'Tierra', icon: typeTierra }, { name: 'Volador', icon: typeVolador },
  { name: 'Psíquico', icon: typePsiquico }, { name: 'Bicho', icon: typeBicho },
  { name: 'Roca', icon: typeRoca }, { name: 'Fantasma', icon: typeFantasma },
  { name: 'Dragón', icon: typeDragon }, { name: 'Siniestro', icon: typeSiniestro },
  { name: 'Acero', icon: typeAcero }, { name: 'Hada', icon: typeHada },
];

const REGIONAL_FORMS: Record<string, string[]> = {
  "Rattata": ["Alola"], "Raticate": ["Alola"], "Raichu": ["Alola"], "Sandshrew": ["Alola"], "Sandslash": ["Alola"], "Vulpix": ["Alola"], "Ninetales": ["Alola"], "Diglett": ["Alola"], "Dugtrio": ["Alola"], "Meowth": ["Alola", "Galar"], "Persian": ["Alola"], "Geodude": ["Alola"], "Graveler": ["Alola"], "Golem": ["Alola"], "Grimer": ["Alola"], "Muk": ["Alola"], "Exeggutor": ["Alola"], "Marowak": ["Alola"],
  "Ponyta": ["Galar"], "Rapidash": ["Galar"], "Slowpoke": ["Galar"], "Slowbro": ["Galar"], "Farfetch'd": ["Galar"], "Weezing": ["Galar"], "Mr. Mime": ["Galar"], "Articuno": ["Galar"], "Zapdos": ["Galar"], "Moltres": ["Galar"], "Slowking": ["Galar"], "Corsola": ["Galar"], "Zigzagoon": ["Galar"], "Linoone": ["Galar"], "Darumaka": ["Galar"], "Darmanitan": ["Galar"], "Yamask": ["Galar"], "Stunfisk": ["Galar"],
  "Growlithe": ["Hisui"], "Arcanine": ["Hisui"], "Voltorb": ["Hisui"], "Electrode": ["Hisui"], "Typhlosion": ["Hisui"], "Qwilfish": ["Hisui"], "Sneasel": ["Hisui"], "Samurott": ["Hisui"], "Lilligant": ["Hisui"], "Basculin": ["Hisui"], "Zorua": ["Hisui"], "Zoroark": ["Hisui"], "Braviary": ["Hisui"], "Sliggoo": ["Hisui"], "Goodra": ["Hisui"], "Avalugg": ["Hisui"], "Decidueye": ["Hisui"]
};

const POKEMON_LIST = "Abomasnow,Aegislash,Aerodactyl,Aggron,Alakazam,Altaria,Ampharos,Annihilape,Arbok,Arboliva,Arcanine,Arceus,Articuno,Azumarill,Baxcalibur,Bastiodon,Beedrill,Bellibolt,Bisharp,Blastoise,Blaziken,Blissey,Breloom,Bronzong,Buzzwole,Camerupt,Carbink,Carnivine,Carracosta,Castform,Ceruledge,Chandelure,Charizard,Chesnaught,Chien-Pao,Chi-Yu,Cinderace,Clefable,Cobalion,Cofagrigus,Conkeldurr,Corviknight,Cradily,Cresselia,Crobat,Crustle,Darkrai,Darmanitan,Decidueye,Dedenne,Delphox,Deoxys,Dewgong,Dialga,Diancie,Diggersby,Ditto,Dondozo,Dragalge,Dragapult,Dragonite,Drapion,Drifblim,Duraludon,Dusknoir,Eelektross,Electivire,Electrode,Emboar,Empoleon,Entei,Escavalier,Espeon,Excadrill,Exeggutor,Feraligatr,Ferrothorn,Florges,Flygon,Forretress,Froslass,Gallade,Galvantula,Garchomp,Gardevoir,Garganacl,Gastrodon,Gengar,Gholdengo,Gigalith,Giratina,Glaceon,Glalie,Gligar,Gliscor,Golisopod,Golurk,Goodra,Gothitelle,Gourgeist,Granbull,Grafaiai,Greedent,Greninja,Grimer,Grimmsnarl,Groudon,Guzzlord,Gyarados,Hariyama,Haxorus,Heatran,Heracross,Hippowdon,Hitmontop,Ho-Oh,Honchkrow,Houndoom,Hydreigon,Hypno,Incineroar,Infernape,Inteleon,Jellicent,Jirachi,Jolteon,Jumpluff,Kangaskhan,Kecleon,Keldeo,Kingambit,Kingdra,Klefki,Kommo-o,Krookodile,Kyogre,Kyurem,Lanturn,Lapras,Latias,Latios,Leafeon,Lickilicky,Lickitung,Lilligant,Linoone,Lokix,Lucario,Ludicolo,Lugia,Lunala,Lycanroc,Machamp,Magnezone,Malamar,Mamoswine,Mandibuzz,Mantine,Marowak,Mawile,Medicham,Meganium,Melmetal,Meloetta,Meowscarada,Metagross,Mew,Mewtwo,Milotic,Miltank,Mimikyu,Mismagius,Moltres,Mr. Mime,Mudsdale,Muk,Naganadel,Nidoking,Nidoqueen,Nihilego,Ninetales,Noctowl,Noivern,Obstagoon,Omastar,Oranguru,Pachirisu,Palafin,Palkia,Palossand,Pangoro,Passimian,Pawmot,Pelipper,Perrserker,Persian,Pidgeot,Pikachu,Pinsir,Politoed,Poliwrath,Porygon-Z,Porygon2,Primarina,Primeape,Probopass,Pyroar,Quagsire,Quaquaval,Qwilfish,Raichu,Raikou,Rapidash,Raticate,Rayquaza,Regice,Regidrago,Regieleki,Regigigas,Regirock,Registeel,Relicanth,Reshiram,Reuniclus,Rhyperior,Rillaboom,Roaring Moon,Roserade,Rotom,Sableye,Salamence,Samurott,Sandslash,Sceptile,Scizor,Scolipede,Scrafty,Seismitoad,Serperior,Seviper,Shiftry,Shuckle,Sigilyph,Silvally,Sirfetch'd,Skarmory,Skeledirge,Slaking,Slowbro,Slowking,Sneasler,Snorlax,Solgaleo,Spiritomb,Staraptor,Starmie,Steelix,Stoutland,Stunfisk,Suicune,Swalot,Swampert,Swanna,Sylveon,Talonflame,Tangrowth,Tapu Bulu,Tapu Fini,Tapu Koko,Tapu Lele,Tauros,Tentacruel,Terapagos,Togekiss,Torkoal,Tornadus,Torterra,Toxapex,Toxicroak,Toxtricity,Trevenant,Tropius,Tsareena,Typhlosion,Tyranitar,Tyrantrum,Umbreon,Ursaluna,Ursaring,Uxie,Vaporeon,Venusaur,Vespiquen,Victini,Victreebel,Vigoroth,Vileplume,Virizion,Volcanion,Volcarona,Walrein,Weavile,Weezing,Whimsicott,Whiscash,Wigglytuff,Wobbuffet,Wyrdeer,Xerneas,Yveltal,Zangoose,Zapdos,Zarude,Zekrom,Zeraora,Zoroark,Zygarde".split(",");

const POKEMON_LEGAL_MOVES: Record<string, { fast: string[], charge: string[] }> = {
  "Swampert": { fast: ["Disparo Lodo", "Pistola Agua"], charge: ["Hidrocañón", "Terremoto", "Onda Tóxica", "Agua Lodosa"] },
  "Charizard": { fast: ["Giro Fuego", "Ataque Ala", "Ascuas", "Dragoaliento"], charge: ["Anillo Ígneo", "Garra Dragón", "Sofoco", "Llamarada"] },
  "Trevenant": { fast: ["Garra Umbría", "Finta"], charge: ["Bomba Germen", "Bola Sombra", "Juego Sucio"] },
  "Medicham": { fast: ["Contraataque", "Psicocorte"], charge: ["Puño Dinámico", "Puño Hielo", "Psíquico", "Puño Incremento"] },
  "Lanturn": { fast: ["Chispa", "Pistola Agua", "Rayo Carga"], charge: ["Surf", "Rayo", "Trueno"] },
  "Noctowl": { fast: ["Ataque Ala", "Paranormal"], charge: ["Bola Sombra", "Ataque Aéreo", "Psíquico"] },
  "Sableye": { fast: ["Garra Umbría", "Finta"], charge: ["Juego Sucio", "Retribución", "Sombra Vil", "Joya de Luz"] },
  "Azumarill": { fast: ["Burbuja", "Golpe Roca"], charge: ["Carantoña", "Rayo Hielo", "Hidrobomba"] },
  "Venusaur": { fast: ["Látigo Cepa", "Hoja Afilada"], charge: ["Planta Feroz", "Bomba Lodo", "Tormenta Floral"] },
  "Stunfisk": { fast: ["Disparo Lodo", "Impactrueno"], charge: ["Terremoto", "Avalancha", "Agua Lodosa", "Chispazo"] },
  "Pelipper": { fast: ["Ataque Ala", "Pistola Agua"], charge: ["Meteorobola", "Vendaval", "Ventisca"] },
  "Scrafty": { fast: ["Contraataque", "Alarido"], charge: ["Juego Sucio", "Puño Incremento", "Bomba Ácida"] },
  "Umbreon": { fast: ["Alarido", "Finta"], charge: ["Juego Sucio", "Última Baza", "Pulso Umbrío"] },
  "Giratina": { fast: ["Garra Umbría", "Dragoaliento"], charge: ["Garra Dragón", "Sombra Vil", "Poder Pasado"] },
  "Talonflame": { fast: ["Calcinación", "Picotazo", "Giro Fuego"], charge: ["Pájaro Osado", "Nitrocarga", "Huracán"] }
};

const FAST_MOVES_DICT: Record<string, string> = {
  "Placaje": "Normal", "Ataque Rápido": "Normal", "Arañazo": "Normal", "Fijar Blanco": "Normal", "Poder Oculto": "Normal",
  "Ascuas": "Fuego", "Giro Fuego": "Fuego", "Colmillo Ígneo": "Fuego", "Calcinación": "Fuego", 
  "Pistola Agua": "Agua", "Cascada": "Agua", "Burbuja": "Agua", 
  "Látigo Cepa": "Planta", "Hoja Afilada": "Planta", "Semilladora": "Planta", "Hoja Mágica": "Planta", 
  "Impactrueno": "Eléctrico", "Chispa": "Eléctrico", "Voltiocambio": "Eléctrico", 
  "Nieve Polvo": "Hielo", "Canto Helado": "Hielo", "Vaho Gélido": "Hielo", 
  "Contraataque": "Lucha", "Golpe Kárate": "Lucha", "Doble Patada": "Lucha", 
  "Picotazo Venenoso": "Veneno", "Puya Nociva": "Veneno", "Ácido": "Veneno", 
  "Disparo Lodo": "Tierra", "Bofetón Lodo": "Tierra", "Ataque Arena": "Tierra", 
  "Ataque Ala": "Volador", "Tajo Aéreo": "Volador", "Picotazo": "Volador", 
  "Confusión": "Psíquico", "Psicocorte": "Psíquico", "Cabezazo Zen": "Psíquico", 
  "Picadura": "Bicho", "Corte Furia": "Bicho", "Estoicismo": "Bicho", 
  "Lanzarrocas": "Roca", "Antiaéreo": "Roca", 
  "Infortunio": "Fantasma", "Lengüetazo": "Fantasma", "Garra Umbría": "Fantasma", 
  "Dragoaliento": "Dragón", "Cola Dragón": "Dragón", 
  "Mordisco": "Siniestro", "Finta": "Siniestro", "Alarido": "Siniestro", 
  "Ala de Acero": "Acero", "Puño Bala": "Acero", "Cola Férrea": "Acero", 
  "Encanto": "Hada", "Viento Feérico": "Hada"
};

const CHARGE_MOVES_DICT: Record<string, string> = {
  "Hiperrayo": "Normal", "Golpe Cuerpo": "Normal", "Retroceso": "Normal", "Retribución": "Normal",
  "Lanzallamas": "Fuego", "Llamarada": "Fuego", "Anillo Ígneo": "Fuego", "Puño Fuego": "Fuego", "Meteorobola": "Normal", "Sofoco": "Fuego", "Nitrocarga": "Fuego", 
  "Hidrobomba": "Agua", "Surf": "Agua", "Acua Cola": "Agua", "Hidrocañón": "Agua", "Agua Lodosa": "Agua", 
  "Planta Feroz": "Planta", "Latigazo": "Planta", "Rayo Solar": "Planta", "Bomba Germen": "Planta", "Energibola": "Planta", 
  "Rayo": "Eléctrico", "Trueno": "Eléctrico", "Voltio Cruel": "Eléctrico", "Puño Trueno": "Eléctrico", "Chispazo": "Eléctrico", 
  "Rayo Hielo": "Hielo", "Ventisca": "Hielo", "Alud": "Hielo", "Puño Hielo": "Hielo", "Viento Hielo": "Hielo", 
  "Puño Dinámico": "Lucha", "A bocajarro": "Lucha", "Tajo Cruzado": "Lucha", "Onda Certera": "Lucha", "Fuerza Bruta": "Lucha", "Puño Incremento": "Lucha", 
  "Bomba Lodo": "Veneno", "Onda Tóxica": "Veneno", "Colmillo Veneno": "Veneno", "Bomba Ácida": "Veneno", 
  "Terremoto": "Tierra", "Tierra Viva": "Tierra", "Taladradora": "Tierra", "Bucle Arena": "Tierra", "Hueso Palo": "Tierra", 
  "Pájaro Osado": "Volador", "Ataque Aéreo": "Volador", "Golpe Aéreo": "Volador", "Vendaval": "Volador", "Huracán": "Volador",
  "Psíquico": "Psíquico", "Premonición": "Psíquico", "Psicocarga": "Psíquico", 
  "Zumbido": "Bicho", "Tijera X": "Bicho", "Megacuerno": "Bicho", "Plancha": "Bicho", 
  "Roca Afilada": "Roca", "Avalancha": "Roca", "Tumba Rocas": "Roca", "Pedrada": "Roca", "Joya de Luz": "Roca", 
  "Bola Sombra": "Fantasma", "Puño Sombra": "Fantasma", "Golpe Umbrío": "Fantasma", "Sombra Vil": "Fantasma", 
  "Garra Dragón": "Dragón", "Pulso Dragón": "Dragón", "Enfado": "Dragón", "Cometa Draco": "Dragón", 
  "Triturar": "Siniestro", "Juego Sucio": "Siniestro", "Pulso Umbrío": "Siniestro", "Tajo Umbrío": "Siniestro", "Última Baza": "Normal",
  "Cuerpo Pesado": "Acero", "Cabeza de Hierro": "Acero", "Foco Resplandor": "Acero", "Puño Meteoro": "Acero", 
  "Brillo Mágico": "Hada", "Carantoña": "Hada", "Fuerza Lunar": "Hada", "Beso Drenaje": "Hada"
};

const FAST_MOVES_GLOBAL = Object.keys(FAST_MOVES_DICT);
const CHARGE_MOVES_GLOBAL = Object.keys(CHARGE_MOVES_DICT);

const getPokemonDBSprite = (species: string, regional: string = 'Normal') => {
  if (!species) return pokebola;
  let cleanName = species.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (regional !== 'Normal') {
    const regionSuffix: Record<string, string> = {
      'Alola': 'alolan',
      'Galar': 'galarian',
      'Hisui': 'hisuian',
      'Paldea': 'paldean'
    };
    const suffix = regionSuffix[regional] || regional.toLowerCase();
    cleanName = `${cleanName}-${suffix}`;
  }
  
  return `https://img.pokemondb.net/sprites/home/normal/${cleanName}.png`;
};

const getPMDAvatar = (dexNumber: string | undefined) => {
  if (!dexNumber) return pokebola;
  return `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${dexNumber.padStart(4, '0')}/Normal.png`;
};

export function TournamentBoard({ isAdmin }: { isAdmin: boolean }) {
  const { tournaments, players, matches, createTournament, updateTournamentStatus, deleteTournament, registerPlayer, generateRound, setWinner } = useTournaments()
  const [newTName, setNewTName] = useState('')
  const [leagueChoice, setLeagueChoice] = useState<'super' | 'ultra' | 'master'>('super')
  const [selectedT, setSelectedT] = useState<string | null>(null)
  
  const [playerName, setPlayerName] = useState('')
  const [avatarDex, setAvatarDex] = useState('')
  
  const [team, setTeam] = useState<Pokemon[]>(Array(6).fill({ species: '', state: 'Normal', regional: 'Normal', cp: '', fast: '', fastType: 'Normal', charge1: '', charge1Type: 'Normal', charge2: '', charge2Type: 'Normal' }))
  
  const [viewPlayer, setViewPlayer] = useState<TournamentPlayer | null>(null)
  const [confirmWinnerData, setConfirmWinnerData] = useState<{matchId: string, playerId: string, playerName: string} | null>(null)
  const [alertInfo, setAlertInfo] = useState<{ title: string, message: string, type: 'error' | 'success' | 'champion' } | null>(null);
  
  // ESTADOS DE PREVENCIÓN
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const activeT = tournaments.find(t => t.id === selectedT)
  const tPlayers = players.filter(p => p.tournament_id === selectedT)
  const tMatches = matches.filter(m => m.tournament_id === selectedT && m.round === activeT?.current_round)

  const handleUpdatePokemon = (index: number, field: keyof Pokemon, value: string) => {
    const newTeam = [...team]
    
    if (field === 'species') {
      newTeam[index] = { ...newTeam[index], species: value, regional: 'Normal', fast: '', fastType: 'Normal', charge1: '', charge1Type: 'Normal', charge2: '', charge2Type: 'Normal' }
    } else {
      newTeam[index] = { ...newTeam[index], [field]: value }
    }
    
    if (field === 'fast' && FAST_MOVES_DICT[value]) newTeam[index].fastType = FAST_MOVES_DICT[value];
    if (field === 'charge1' && CHARGE_MOVES_DICT[value]) newTeam[index].charge1Type = CHARGE_MOVES_DICT[value];
    if (field === 'charge2' && CHARGE_MOVES_DICT[value]) newTeam[index].charge2Type = CHARGE_MOVES_DICT[value];

    setTeam(newTeam)
  }

  const handleRegister = async () => {
    if (!playerName.trim() || !selectedT || isSubmitting) return

    // VALIDACIÓN DE DUPLICADOS EN EL TORNEO
    const exists = tPlayers.some(p => p.player_name.trim().toLowerCase() === playerName.trim().toLowerCase());
    if (exists) {
      setAlertInfo({ title: "Entrenador Duplicado", message: "Ya existe un entrenador registrado con ese nombre en este torneo.", type: 'error' });
      return;
    }

    const maxCP = activeT?.league === 'super' ? 1500 : activeT?.league === 'ultra' ? 2500 : 99999;
    const overCP = team.some(p => parseInt(p.cp || '0') > maxCP);

    if (overCP) {
      setAlertInfo({ title: "Límite de PC Excedido", message: `El torneo es formato ${activeT?.league.toUpperCase()} (PC máximo: ${maxCP}). Uno de tus Pokémon excede el límite permitido.`, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    await registerPlayer(selectedT, playerName, avatarDex, team)
    setIsSubmitting(false);
    
    setPlayerName(''); 
    setAvatarDex('');
    setTeam(Array(6).fill({ species: '', state: 'Normal', regional: 'Normal', cp: '', fast: '', fastType: 'Normal', charge1: '', charge1Type: 'Normal', charge2: '', charge2Type: 'Normal' }))
    setAlertInfo({ title: "¡Inscripción Exitosa!", message: "Tu equipo ha sido registrado exitosamente. Ya estás participando en el torneo, ¡mucha suerte!", type: 'success' });
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
          <Input placeholder="Ej: Copa Pawmistica..." value={newTName} onChange={e => setNewTName(e.target.value)} className="bg-gray-50 border-0 py-6 text-lg" />
          
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
      
      <datalist id="pokemon-list">{POKEMON_LIST.map(poke => <option key={poke} value={poke} />)}</datalist>
      <datalist id="fast-moves-global">{FAST_MOVES_GLOBAL.map(move => <option key={move} value={move} />)}</datalist>
      <datalist id="charge-moves-global">{CHARGE_MOVES_GLOBAL.map(move => <option key={move} value={move} />)}</datalist>

      {Object.entries(POKEMON_LEGAL_MOVES).map(([pokemon, moves]) => (
        <div key={pokemon}>
          <datalist id={`fast-moves-${pokemon}`}>{moves.fast.map(m => <option key={m} value={m} />)}</datalist>
          <datalist id={`charge-moves-${pokemon}`}>{moves.charge.map(m => <option key={m} value={m} />)}</datalist>
        </div>
      ))}

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
          
          {/* BOTÓN BORRAR ABRE MODAL EN VEZ DE BORRAR DIRECTO */}
          <Button onClick={() => setShowDeleteConfirm(selectedT)} variant="destructive" size="icon" className="shrink-0"><Trash2 className="w-5 h-5"/></Button>
        </div>
      )}

      {/* MODAL CONFIRMAR BORRAR TORNEO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 border-red-400 transform transition-all">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertTriangle className="w-10 h-10 text-red-500 drop-shadow-md" /></div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-wide">¿Borrar Torneo?</h3>
              <p className="text-gray-600 mb-8 text-base">Esta acción es irreversible y eliminará a todos los participantes y llaves generadas.</p>
              <div className="flex gap-3">
                 <Button onClick={() => setShowDeleteConfirm(null)} variant="outline" className="flex-1 py-6 text-gray-500 font-bold border-2 border-gray-200 hover:bg-gray-50 text-lg">Cancelar</Button>
                 <Button onClick={() => { deleteTournament(showDeleteConfirm); setShowDeleteConfirm(null); setSelectedT(null); }} className="flex-1 py-6 bg-red-500 hover:bg-red-600 text-white font-black shadow-lg text-lg">Borrar</Button>
              </div>
           </div>
        </div>
      )}

      {activeT?.status === 'open' && (
        <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8">
          <h3 className="text-xl font-black mb-1">Registro de Hoja Abierta</h3>
          <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Límite: {activeT?.league === 'super' ? '1500 PC' : activeT?.league === 'ultra' ? '2500 PC' : 'Sin límite'}</p>
          
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Nombre de Entrenador *</label>
              <Input placeholder="Tu Nombre o Gamertag" value={playerName} onChange={e => setPlayerName(e.target.value)} className="bg-gray-50 text-lg py-6 border-2 border-gray-200 font-bold" />
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Foto de Perfil para el Torneo (Opcional)</label>
              <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-100 shadow-inner">
                 <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center shrink-0 border-4 border-white overflow-hidden">
                    <img 
                      src={getPMDAvatar(avatarDex)} 
                      alt="Preview" 
                      className="w-14 h-14 object-contain scale-[1.2]" 
                      style={avatarDex ? { imageRendering: 'pixelated' } : {}}
                      onError={(e) => { (e.target as HTMLImageElement).src = pokebola }}
                    />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs text-blue-800 font-medium mb-2 hidden sm:block">Ingresa el <span className="font-black">Número de la Pokédex</span> de tu Pokémon favorito para usarlo como avatar en los combates.</p>
                    <Input type="number" min="1" max="1025" placeholder="Ej: 25 (Pikachu), 94 (Gengar)..." value={avatarDex} onChange={e => setAvatarDex(e.target.value)} className="bg-white font-bold h-10 text-sm w-full sm:w-2/3" />
                 </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[0, 1, 2, 3, 4, 5].map(i => {
              const currentSpecies = team[i].species;
              const hasSpecificMoves = !!POKEMON_LEGAL_MOVES[currentSpecies];
              const fastListId = hasSpecificMoves ? `fast-moves-${currentSpecies}` : "fast-moves-global";
              const chargeListId = hasSpecificMoves ? `charge-moves-${currentSpecies}` : "charge-moves-global";
              
              const sprite = getPokemonDBSprite(currentSpecies, team[i].regional);
              
              return (
                <div key={i} className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
                  <span className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-md z-10">{i + 1}</span>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center relative shrink-0">
                       <img src={sprite} alt="Pokemon" className="w-11 h-11 object-contain drop-shadow-md z-0" onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                       {team[i].state === 'Oscuro' && <img src={imgOscuro} alt="Oscuro" className="absolute -bottom-1.5 -right-1.5 w-6 h-6 drop-shadow-md z-10" />}
                       {team[i].state === 'Purificado' && <img src={imgPurificado} alt="Purificado" className="absolute -bottom-1.5 -right-1.5 w-6 h-6 drop-shadow-md z-10" />}
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                      <Input list="pokemon-list" placeholder="Especie de Pokémon" value={team[i].species} onChange={e => handleUpdatePokemon(i, 'species', e.target.value)} className="w-full bg-white border-gray-300 font-black text-lg" />
                      
                      <div className="flex gap-2">
                        <select value={team[i].state} onChange={e => handleUpdatePokemon(i, 'state', e.target.value)} className="w-1/2 bg-white text-xs border border-gray-300 rounded-md px-2 focus:ring-2 focus:ring-blue-500 outline-none h-9 font-medium text-gray-600">
                          <option value="Normal">Normal</option>
                          <option value="Oscuro">Oscuro</option>
                          <option value="Purificado">Purificado</option>
                        </select>
                        <Input type="number" placeholder="PC Exacto" value={team[i].cp} onChange={e => handleUpdatePokemon(i, 'cp', e.target.value)} className="w-1/2 bg-white border-gray-300 h-9 font-mono font-bold text-center" />
                      </div>
                    </div>
                  </div>

                  {REGIONAL_FORMS[currentSpecies] && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                      <select value={team[i].regional} onChange={e => handleUpdatePokemon(i, 'regional', e.target.value)} className="w-full bg-white text-xs border border-blue-200 rounded-md px-2 focus:ring-2 focus:ring-blue-500 outline-none h-8 font-bold text-blue-700">
                        <option value="Normal">Forma Estándar</option>
                        {REGIONAL_FORMS[currentSpecies].map(form => <option key={form} value={form}>Forma {form}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex gap-2 items-center">
                      <div className="relative w-10 h-10 shrink-0 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer">
                        <img src={POKEMON_TYPES.find(t => t.name === team[i].fastType)?.icon || typeNormal} className="w-6 h-6 object-contain drop-shadow-sm" alt="Tipo" />
                        <select value={team[i].fastType} onChange={e => handleUpdatePokemon(i, 'fastType', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                          {POKEMON_TYPES.map(pt => <option key={pt.name} value={pt.name}>{pt.name}</option>)}
                        </select>
                      </div>
                      <Input list={fastListId} placeholder="Ataque Rápido" value={team[i].fast} onChange={e => handleUpdatePokemon(i, 'fast', e.target.value)} className="flex-1 bg-white border-gray-300 font-bold text-gray-700" />
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <div className="relative w-10 h-10 shrink-0 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer">
                        <img src={POKEMON_TYPES.find(t => t.name === team[i].charge1Type)?.icon || typeNormal} className="w-6 h-6 object-contain drop-shadow-sm" alt="Tipo" />
                        <select value={team[i].charge1Type} onChange={e => handleUpdatePokemon(i, 'charge1Type', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                          {POKEMON_TYPES.map(pt => <option key={pt.name} value={pt.name}>{pt.name}</option>)}
                        </select>
                      </div>
                      <Input list={chargeListId} placeholder="Cargado Primario" value={team[i].charge1} onChange={e => handleUpdatePokemon(i, 'charge1', e.target.value)} className="flex-1 bg-white border-gray-300 font-bold text-gray-700" />
                    </div>

                    <div className="flex gap-2 items-center">
                      <div className="relative w-10 h-10 shrink-0 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer">
                        <img src={POKEMON_TYPES.find(t => t.name === team[i].charge2Type)?.icon || typeNormal} className="w-6 h-6 object-contain drop-shadow-sm" alt="Tipo" />
                        <select value={team[i].charge2Type} onChange={e => handleUpdatePokemon(i, 'charge2Type', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                          {POKEMON_TYPES.map(pt => <option key={pt.name} value={pt.name}>{pt.name}</option>)}
                        </select>
                      </div>
                      <Input list={chargeListId} placeholder="Cargado Secundario (Opc.)" value={team[i].charge2} onChange={e => handleUpdatePokemon(i, 'charge2', e.target.value)} className="flex-1 bg-white border-gray-300 font-bold text-gray-700" />
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
          <Button onClick={handleRegister} disabled={isSubmitting || !playerName.trim() || team.some(p => !p.species)} className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-6 text-xl rounded-xl shadow-lg transition-all">
             {isSubmitting ? "Inscribiendo Equipo..." : "Inscribir mi Equipo"}
          </Button>
        </div>
      )}

      {/* DISEÑO BRACKET CON GANADOR EN DORADO */}
      {activeT?.status === 'active' && (
        <div className="flex flex-col items-center gap-6 mt-8 overflow-hidden w-full">
          
          <div className="flex flex-col justify-center items-center relative z-10 shrink-0 mb-4">
             <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-5 rounded-full border-4 border-yellow-400 shadow-xl mb-3">
                 <Trophy className="w-12 h-12 text-yellow-600 drop-shadow-md" />
             </div>
             <span className="font-black text-gray-800 text-xl uppercase tracking-widest bg-white border-2 border-gray-200 px-6 py-2 rounded-full shadow-sm">
                Ronda {activeT.current_round}
             </span>
          </div>

          <div className="flex flex-col gap-6 w-full max-w-4xl px-4">
            {tMatches.map(m => {
              const p1 = players.find(p => p.id === m.player1_id);
              const p2 = players.find(p => p.id === m.player2_id);
              
              return (
                <div key={m.id} className="relative w-full">
                  <div className="bg-transparent flex flex-col md:flex-row relative group gap-1">
                    
                    {/* PLAYER 1 (IZQUIERDA) - AHORA DORADO SI GANA */}
                    <div 
                      className={`flex-1 p-4 md:p-6 flex items-center gap-4 transition-all cursor-pointer rounded-2xl md:rounded-l-2xl md:rounded-r-none border-2 shadow-lg ${
                        m.winner_id === p1?.id 
                          ? 'bg-gradient-to-r from-yellow-100 to-amber-50 border-yellow-400 shadow-yellow-200/50 z-20 scale-[1.02]' 
                          : 'bg-white border-gray-100 hover:bg-gray-50'
                      }`}
                      onClick={() => isAdmin && !m.winner_id && p1 && p2 && handleWinnerClick(m.id, p1.id, p1.player_name)}
                    >
                       <div className="relative">
                         <div className={`w-16 h-16 rounded-full border-2 shadow-md flex items-center justify-center overflow-hidden z-10 relative ${
                           m.winner_id === p1?.id ? 'bg-gradient-to-br from-yellow-200 to-amber-300 border-yellow-400' : 'bg-gradient-to-br from-blue-100 to-blue-200 border-white'
                         }`}>
                           <img src={getPMDAvatar(p1?.avatar_dex)} alt={p1?.player_name} className="w-full h-full object-contain scale-[1.2]" style={p1?.avatar_dex ? { imageRendering: 'pixelated' } : {}} onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                         </div>
                         {m.winner_id === p1?.id && <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1 border-2 border-white z-20 shadow-sm"><Trophy className="w-4 h-4 text-yellow-900"/></div>}
                       </div>
                       
                       <div className="flex flex-col items-start flex-1 min-w-0">
                         <span className={`font-black text-xl truncate w-full ${m.winner_id === p1?.id ? 'text-yellow-800' : 'text-gray-800'}`}>{p1?.player_name}</span>
                         <button onClick={(e) => { e.stopPropagation(); if (p1) setViewPlayer(p1); }} className={`text-xs font-bold flex items-center gap-1 mt-1 transition-colors ${m.winner_id === p1?.id ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-blue-500'}`}><Eye className="w-3.5 h-3.5"/> Ver Equipo</button>
                       </div>
                    </div>

                    {/* CENTRO (VS) */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center">
                      <div className="bg-gray-900 text-white font-black italic px-4 py-2 rounded-lg border-4 border-white shadow-xl -skew-x-12 tracking-widest">VS</div>
                    </div>

                    {/* PLAYER 2 (DERECHA) - DORADO SI GANA */}
                    {p2 ? (
                      <div 
                        className={`flex-1 p-4 md:p-6 flex items-center gap-4 flex-row-reverse text-right transition-all cursor-pointer rounded-2xl md:rounded-r-2xl md:rounded-l-none border-2 shadow-lg ${
                          m.winner_id === p2?.id 
                            ? 'bg-gradient-to-l from-yellow-100 to-amber-50 border-yellow-400 shadow-yellow-200/50 z-20 scale-[1.02]' 
                            : 'bg-white border-gray-100 hover:bg-gray-50'
                        }`}
                        onClick={() => isAdmin && !m.winner_id && p2 && handleWinnerClick(m.id, p2.id, p2.player_name)}
                      >
                         <div className="relative">
                           <div className={`w-16 h-16 rounded-full border-2 shadow-md flex items-center justify-center overflow-hidden z-10 relative ${
                             m.winner_id === p2?.id ? 'bg-gradient-to-bl from-yellow-200 to-amber-300 border-yellow-400' : 'bg-gradient-to-bl from-red-100 to-red-200 border-white'
                           }`}>
                             <img src={getPMDAvatar(p2?.avatar_dex)} alt={p2?.player_name} className="w-full h-full object-contain scale-[1.2]" style={p2?.avatar_dex ? { imageRendering: 'pixelated' } : {}} onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                           </div>
                           {m.winner_id === p2?.id && <div className="absolute -bottom-2 -left-2 bg-yellow-400 rounded-full p-1 border-2 border-white z-20 shadow-sm"><Trophy className="w-4 h-4 text-yellow-900"/></div>}
                         </div>

                         <div className="flex flex-col items-end flex-1 min-w-0">
                           <span className={`font-black text-xl truncate w-full ${m.winner_id === p2?.id ? 'text-yellow-800' : 'text-gray-800'}`}>{p2?.player_name}</span>
                           <button onClick={(e) => { e.stopPropagation(); setViewPlayer(p2); }} className={`text-xs font-bold flex items-center gap-1 mt-1 transition-colors ${m.winner_id === p2?.id ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-red-500'}`}><Eye className="w-3.5 h-3.5"/> Ver Equipo</button>
                         </div>
                      </div>
                    ) : (
                      <div className="flex-1 p-4 md:p-6 flex items-center justify-center bg-gray-50 rounded-2xl md:rounded-r-2xl md:rounded-l-none border-2 border-gray-100">
                        <div className="bg-yellow-100 text-yellow-700 font-black text-sm px-6 py-2 rounded-full border border-yellow-200 shadow-inner flex items-center gap-2">
                          <Trophy className="w-4 h-4"/> AVANZA AUTOMÁTICO
                        </div>
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
              <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trophy className="w-12 h-12 text-yellow-500 drop-shadow-md" /></div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-wide">¡Ganador de la ronda!</h3>
              <p className="text-gray-600 mb-8 text-lg">¿Confirmar victoria para <span className="font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200">{confirmWinnerData.playerName}</span>?</p>
              <div className="flex gap-3">
                 <Button onClick={() => setConfirmWinnerData(null)} variant="outline" className="flex-1 py-6 text-gray-500 font-bold border-2 border-gray-200 hover:bg-gray-50 text-lg">Cancelar</Button>
                 <Button onClick={() => { setWinner(confirmWinnerData.matchId, confirmWinnerData.playerId); setConfirmWinnerData(null); }} className="flex-1 py-6 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black shadow-lg text-lg">Confirmar</Button>
              </div>
           </div>
        </div>
      )}

      {/* VISTA HOJA ABIERTA INDIVIDUAL */}
      {viewPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewPlayer(null)}>
          <div className="bg-white rounded-[32px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-6 text-center text-gray-900 border-b pb-4 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200 shadow-inner">
                 <img src={getPMDAvatar(viewPlayer.avatar_dex)} className="w-full h-full object-contain scale-[1.2]" style={viewPlayer.avatar_dex ? { imageRendering: 'pixelated' } : {}} onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
              </div>
              Hoja de {viewPlayer.player_name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewPlayer.team.map((poke, i) => {
                const sprite = getPokemonDBSprite(poke.species, poke.regional);
                const fType = POKEMON_TYPES.find(t => t.name === poke.fastType)?.icon || typeNormal;
                const c1Type = POKEMON_TYPES.find(t => t.name === poke.charge1Type)?.icon || typeNormal;
                const c2Type = POKEMON_TYPES.find(t => t.name === poke.charge2Type)?.icon || typeNormal;

                return (
                  <div key={i} className={`bg-white p-4 rounded-2xl shadow-sm border-l-4 ${poke.state === 'Oscuro' ? 'border-purple-600' : poke.state === 'Purificado' ? 'border-yellow-400' : 'border-blue-400'} border-t border-r border-b border-gray-100 flex gap-4 items-center`}>
                    
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center shrink-0 border border-gray-100 shadow-inner relative">
                       <img src={sprite} alt="Pokemon" className="w-16 h-16 object-contain drop-shadow-md z-0" onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                       {poke.state === 'Oscuro' && <img src={imgOscuro} alt="Oscuro" className="absolute -bottom-1 -right-1 w-7 h-7 drop-shadow-md z-10" />}
                       {poke.state === 'Purificado' && <img src={imgPurificado} alt="Purificado" className="absolute -bottom-1 -right-1 w-7 h-7 drop-shadow-md z-10" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2 border-b pb-1">
                        <span className="font-black text-gray-800 text-lg leading-tight">{poke.species} 
                          {poke.regional !== 'Normal' && <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{poke.regional}</span>}
                        </span>
                        <span className="font-mono font-black text-sm bg-gray-900 text-white px-2 py-0.5 rounded-md shrink-0">PC {poke.cp}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1.5 text-sm mt-2">
                        <div className="flex items-center gap-2">
                           <img src={fType} alt={poke.fastType} className="w-5 h-5 object-contain" />
                           <span className="text-gray-700 font-bold">{poke.fast || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <img src={c1Type} alt={poke.charge1Type} className="w-5 h-5 object-contain" />
                           <span className="text-gray-700 font-bold">{poke.charge1 || '-'}</span>
                        </div>
                        {poke.charge2 && (
                          <div className="flex items-center gap-2">
                             <img src={c2Type} alt={poke.charge2Type} className="w-5 h-5 object-contain" />
                             <span className="text-gray-700 font-bold">{poke.charge2}</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
            <Button onClick={() => setViewPlayer(null)} className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 rounded-xl text-lg">Cerrar</Button>
          </div>
        </div>
      )}

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