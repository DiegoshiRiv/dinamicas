import { useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Swords, Eye, Trophy, Plus, User, Trash2, AlertCircle, Check, AlertTriangle, X } from 'lucide-react'
import { useTournaments, Pokemon, TournamentPlayer } from '@/hooks/useTournaments'
import pokebola from '@/assets/Pokebola.png'

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
import campeonIcon from '@/assets/campeon.png'

const POKEMON_TYPES = [
  { name: 'Normal', icon: typeNormal }, { name: 'Fuego', icon: typeFuego }, { name: 'Agua', icon: typeAgua }, { name: 'Planta', icon: typePlanta },
  { name: 'Eléctrico', icon: typeElectrico }, { name: 'Hielo', icon: typeHielo }, { name: 'Lucha', icon: typeLucha }, { name: 'Veneno', icon: typeVeneno },
  { name: 'Tierra', icon: typeTierra }, { name: 'Volador', icon: typeVolador }, { name: 'Psíquico', icon: typePsiquico }, { name: 'Bicho', icon: typeBicho },
  { name: 'Roca', icon: typeRoca }, { name: 'Fantasma', icon: typeFantasma }, { name: 'Dragón', icon: typeDragon }, { name: 'Siniestro', icon: typeSiniestro },
  { name: 'Acero', icon: typeAcero }, { name: 'Hada', icon: typeHada }
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
    const regionSuffix: Record<string, string> = { 'Alola': 'alolan', 'Galar': 'galarian', 'Hisui': 'hisuian', 'Paldea': 'paldean' };
    cleanName = `${cleanName}-${regionSuffix[regional] || regional.toLowerCase()}`;
  }
  return `https://img.pokemondb.net/sprites/home/normal/${cleanName}.png`;
};

const getPMDAvatar = (dexNumber: string | undefined) => dexNumber ? `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${dexNumber.padStart(4, '0')}/Normal.png` : pokebola;

export function TournamentBoard({ isAdmin }: { isAdmin: boolean }) {
  const { tournaments, players, matches, createTournament, updateTournamentStatus, deleteTournament, registerPlayer, generateRound, setWinner } = useTournaments()
  const createEmptyPokemon = (): Pokemon => ({
    species: '',
    state: 'Normal',
    regional: 'Normal',
    cp: '',
    fast: '',
    fastType: 'Normal',
    charge1: '',
    charge1Type: 'Normal',
    charge2: '',
    charge2Type: 'Normal',
  })
  const [newTName, setNewTName] = useState('')
  const [leagueChoice, setLeagueChoice] = useState<'super' | 'ultra' | 'master'>('super')
  const [selectedT, setSelectedT] = useState<string | null>(null)
  
  const [playerName, setPlayerName] = useState('')
  const [avatarDex, setAvatarDex] = useState('')
  
  const [team, setTeam] = useState<Pokemon[]>(Array.from({ length: 6 }, createEmptyPokemon))
  
  const [viewPlayer, setViewPlayer] = useState<TournamentPlayer | null>(null)
  const [confirmWinnerData, setConfirmWinnerData] = useState<{matchId: string, playerId: string, playerName: string} | null>(null)
  const [alertInfo, setAlertInfo] = useState<{ title: string, message: string, type: 'error' | 'success' | 'champion' } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState<string | null>(null);
  const [devicePlayerId, setDevicePlayerId] = useState<string | null>(null)
  const [deviceIp, setDeviceIp] = useState<string>('')

  const activeT = tournaments.find(t => t.id === selectedT)
  const tPlayers = players.filter(p => p.tournament_id === selectedT)
  const tMatches = matches.filter(m => m.tournament_id === selectedT && m.round === activeT?.current_round)
  const tournamentCompletedMatches = matches
    .filter((m) => m.tournament_id === selectedT && m.winner_id)
    .sort((a, b) => b.round - a.round)
  const championMatch =
    tMatches.length === 1 && tMatches[0].winner_id
      ? tMatches[0]
      : activeT?.status === 'finished'
        ? tournamentCompletedMatches[0]
        : null
  const championPlayer = championMatch?.winner_id
    ? players.find((p) => p.id === championMatch.winner_id)
    : null
  const tournamentAllMatches = matches
    .filter((m) => m.tournament_id === selectedT)
    .sort((a, b) => a.round - b.round)
  const completedMatchesCount = tournamentAllMatches.filter((m) => Boolean(m.winner_id)).length
  const tournamentCancelledMessage = (() => {
    if (!selectedT) return 'No hubo ganador, torneo cancelado.'
    const optionsNoMatches = [
      'No hubo ganador, torneo cancelado antes de iniciar combates.',
      'No hubo ganador, torneo cancelado sin enfrentamientos registrados.',
      'No hubo ganador, torneo cancelado en fase previa.',
    ]
    const optionsNoWinners = [
      'No hubo ganador, torneo cancelado.',
      'No hubo ganador, torneo cancelado por falta de resultados definitivos.',
      'No hubo ganador, torneo cancelado tras cierre anticipado.',
    ]
    const optionsPartialProgress = [
      'No hubo ganador, torneo cancelado con resultados parciales.',
      'No hubo ganador, torneo cancelado antes de definir al campeon.',
      'No hubo ganador, torneo cancelado con rondas incompletas.',
    ]
    const pool =
      tournamentAllMatches.length === 0
        ? optionsNoMatches
        : completedMatchesCount === 0
          ? optionsNoWinners
          : optionsPartialProgress
    const hash = selectedT.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return pool[hash % pool.length]
  })()

  useEffect(() => {
    if (!selectedT) {
      setDevicePlayerId(null)
      return
    }
    const stored = localStorage.getItem(`tournament_player_${selectedT}`)
    setDevicePlayerId(stored || null)
  }, [selectedT])

  useEffect(() => {
    if (isAdmin) return
    let cancelled = false
    const loadIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json')
        if (!res.ok) return
        const json = (await res.json()) as { ip?: string }
        if (!cancelled && json.ip) {
          setDeviceIp(json.ip)
          if (selectedT) {
            const mappedPlayerId = localStorage.getItem(`tournament_player_ip_${selectedT}_${json.ip}`)
            if (mappedPlayerId) setDevicePlayerId(mappedPlayerId)
          }
        }
      } catch {
        // Ignore IP lookup errors, fallback to local player id only.
      }
    }
    void loadIp()
    return () => {
      cancelled = true
    }
  }, [isAdmin, selectedT])

  const handleUpdatePokemon = (index: number, field: keyof Pokemon, value: string) => {
    const newTeam = [...team]
    if (field === 'species') { newTeam[index] = { ...newTeam[index], species: value, regional: 'Normal', fast: '', fastType: 'Normal', charge1: '', charge1Type: 'Normal', charge2: '', charge2Type: 'Normal' } } 
    else { newTeam[index] = { ...newTeam[index], [field]: value } }
    
    if (field === 'fast' && FAST_MOVES_DICT[value]) newTeam[index].fastType = FAST_MOVES_DICT[value];
    if (field === 'charge1' && CHARGE_MOVES_DICT[value]) newTeam[index].charge1Type = CHARGE_MOVES_DICT[value];
    if (field === 'charge2' && CHARGE_MOVES_DICT[value]) newTeam[index].charge2Type = CHARGE_MOVES_DICT[value];
    setTeam(newTeam)
  }

  const handleRegister = async () => {
    if (!playerName.trim() || !selectedT || isSubmitting) return
    const exists = tPlayers.some(p => p.player_name.trim().toLowerCase() === playerName.trim().toLowerCase());
    if (exists) { setAlertInfo({ title: "Entrenador Duplicado", message: "Ya existe un entrenador registrado con ese nombre.", type: 'error' }); return; }

    if (!isAdmin) {
      const hasIncompleteTeamData = team.some((p) =>
        !p.species.trim() ||
        !p.cp.trim() ||
        !p.fast.trim() ||
        !p.charge1.trim() ||
        !p.charge2.trim()
      )
      if (hasIncompleteTeamData) {
        setAlertInfo({ title: "Datos incompletos", message: "Para inscribirte debes llenar todos los campos de los 6 Pokémon.", type: 'error' })
        return
      }
    }

    if (team.some(p => Number(p.cp) < 1)) {
      setAlertInfo({ title: "PC inválido", message: "El PC de cada Pokémon debe ser mayor o igual a 1.", type: 'error' })
      return
    }

    const maxCP = activeT?.league === 'super' ? 1500 : activeT?.league === 'ultra' ? 2500 : 99999;
    if (team.some(p => parseInt(p.cp || '0') > maxCP)) { setAlertInfo({ title: "Límite Excedido", message: `PC máximo permitido: ${maxCP}.`, type: 'error' }); return; }

    setIsSubmitting(true)
    const insertedPlayer = await registerPlayer(selectedT, playerName, avatarDex, team)
    localStorage.setItem(`tournament_player_${selectedT}`, insertedPlayer.id)
    if (deviceIp) localStorage.setItem(`tournament_player_ip_${selectedT}_${deviceIp}`, insertedPlayer.id)
    setDevicePlayerId(insertedPlayer.id)
    setIsSubmitting(false)
    setPlayerName(''); setAvatarDex(''); setTeam(Array.from({ length: 6 }, createEmptyPokemon))
    setAlertInfo({ title: "¡Inscripción Exitosa!", message: "Ya estás participando en el torneo, ¡suerte!", type: 'success' });
  }

  const handleLoadAdminTestTeam = () => {
    const league = activeT?.league ?? 'super'
    const cpByLeague: Record<'super' | 'ultra' | 'master', string[]> = {
      super: ['1498', '1497', '1496', '1499', '1494', '1495'],
      ultra: ['2498', '2497', '2496', '2499', '2494', '2495'],
      master: ['3200', '3350', '3410', '2980', '3520', '3150'],
    }

    const template: Array<{ species: string; fast: string; charge1: string; charge2: string }> = [
      { species: 'Swampert', fast: 'Disparo Lodo', charge1: 'Hidrocañón', charge2: 'Terremoto' },
      { species: 'Charizard', fast: 'Giro Fuego', charge1: 'Garra Dragón', charge2: 'Anillo Ígneo' },
      { species: 'Trevenant', fast: 'Garra Umbría', charge1: 'Bomba Germen', charge2: 'Bola Sombra' },
      { species: 'Medicham', fast: 'Contraataque', charge1: 'Puño Hielo', charge2: 'Psíquico' },
      { species: 'Lanturn', fast: 'Chispa', charge1: 'Surf', charge2: 'Rayo' },
      { species: 'Noctowl', fast: 'Ataque Ala', charge1: 'Ataque Aéreo', charge2: 'Bola Sombra' },
    ]

    const testTeam: Pokemon[] = template.map((poke, idx) => ({
      species: poke.species,
      state: 'Normal',
      regional: 'Normal',
      cp: cpByLeague[league][idx],
      fast: poke.fast,
      fastType: FAST_MOVES_DICT[poke.fast] || 'Normal',
      charge1: poke.charge1,
      charge1Type: CHARGE_MOVES_DICT[poke.charge1] || 'Normal',
      charge2: poke.charge2,
      charge2Type: CHARGE_MOVES_DICT[poke.charge2] || 'Normal',
    }))

    setPlayerName(`Prueba Admin ${tPlayers.length + 1}`)
    setAvatarDex('25')
    setTeam(testTeam)
  }

  const handleNextRound = async (tId: string, round: number) => {
    const res = await generateRound(tId, round);
    if (res?.error) setAlertInfo({ title: "Acción Denegada", message: res.error, type: 'error' });
    else if (res?.champion) setAlertInfo({ title: "¡Tenemos un Campeón!", message: res.message || "", type: 'champion' });
  }

  if (!selectedT) return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {isAdmin && (
        <div className="relative overflow-hidden rounded-[26px] border border-[#dbe7ff] bg-gradient-to-br from-[#eff6ff] via-white to-[#f3f4ff] p-5 shadow-[0_10px_30px_rgba(59,130,246,0.15)] space-y-4">
          <div className="absolute -top-12 -right-10 h-28 w-28 rounded-full bg-[#60a5fa]/20 blur-2xl" aria-hidden />
          <div className="absolute -bottom-14 -left-8 h-28 w-28 rounded-full bg-[#a78bfa]/20 blur-2xl" aria-hidden />

          <div className="relative">
            <h3 className="font-black text-[#1e2a5e] text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#3b82f6]" />
              Crear nuevo torneo
            </h3>
            <p className="text-xs font-semibold text-[#6472a5] mt-1">Define nombre y liga para publicarlo en segundos.</p>
          </div>

          <div className="relative">
            <Input
              placeholder="Ej: Copa Pawmistica..."
              value={newTName}
              onChange={e => setNewTName(e.target.value)}
              className="bg-white/90 border border-[#d9e3fb] py-6 text-base font-semibold text-[#1f2a44] placeholder:text-[#8a94b5] shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Button
              onClick={() => setLeagueChoice('super')}
              className={`h-12 rounded-xl font-black transition-all ${
                leagueChoice === 'super'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-300/40 scale-[1.02]'
                  : 'bg-white border border-[#dbe3f7] text-[#4f5d87] hover:bg-[#f6f9ff]'
              }`}
            >
              Superball
            </Button>
            <Button
              onClick={() => setLeagueChoice('ultra')}
              className={`h-12 rounded-xl font-black transition-all ${
                leagueChoice === 'ultra'
                  ? 'bg-gradient-to-r from-[#111827] to-[#374151] text-[#facc15] shadow-lg shadow-gray-400/30 scale-[1.02]'
                  : 'bg-white border border-[#dbe3f7] text-[#4f5d87] hover:bg-[#f6f9ff]'
              }`}
            >
              UltraBall
            </Button>
            <Button
              onClick={() => setLeagueChoice('master')}
              className={`h-12 rounded-xl font-black transition-all ${
                leagueChoice === 'master'
                  ? 'bg-gradient-to-r from-[#7e22ce] to-[#9333ea] text-white shadow-lg shadow-purple-300/40 scale-[1.02]'
                  : 'bg-white border border-[#dbe3f7] text-[#4f5d87] hover:bg-[#f6f9ff]'
              }`}
            >
              Masterball
            </Button>
          </div>

          <Button
            onClick={() => { createTournament(newTName, leagueChoice); setNewTName('') }}
            disabled={!newTName}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-black text-base shadow-lg shadow-green-300/40 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Publicar torneo
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tournaments.map(t => (
          <div key={t.id} onClick={() => setSelectedT(t.id)} className="bg-white p-6 rounded-[24px] shadow-xl cursor-pointer hover:scale-[1.02] border-l-8 border-blue-500 flex justify-between items-center">
            <div><h3 className="text-xl font-black">{t.name}</h3><p className="text-xs font-black text-gray-400 uppercase">Liga {t.league}</p></div>
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
        <div><h2 className="text-2xl font-black">{activeT?.name}</h2></div>
        <Button onClick={() => setSelectedT(null)} variant="outline" className="border-0 bg-gray-100 font-bold">Volver</Button>
      </div>

      {isAdmin && (
        <div className="bg-purple-50 rounded-[24px] p-6 shadow-inner flex flex-wrap gap-3 items-center">
          <span className="font-bold text-purple-900 w-full mb-2">Panel de Admin</span>
          {activeT?.status === 'open' && <Button onClick={() => handleNextRound(selectedT, 1)} className="bg-blue-600 text-white flex-1">Iniciar Ronda 1</Button>}
          {activeT?.status === 'active' && <Button onClick={() => handleNextRound(selectedT, (activeT.current_round || 1) + 1)} className="bg-blue-600 text-white flex-1">Siguiente Ronda</Button>}
          {activeT?.status !== 'finished' && <Button onClick={() => setShowFinishConfirm(selectedT)} className="bg-gray-800 text-white flex-1">Finalizar Torneo</Button>}
          <Button onClick={() => setShowDeleteConfirm(selectedT)} variant="destructive" className="w-full sm:w-auto font-black">
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar torneo
          </Button>
        </div>
      )}

      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 border-amber-400">
            <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <AlertTriangle className="w-10 h-10 text-amber-600 drop-shadow-md" />
            </div>
            <h3 className="text-2xl font-black mb-2">¿Finalizar torneo?</h3>
            <p className="text-gray-600 mb-8">Se cerrará el torneo actual y se mostrarán los resultados finales.</p>
            <div className="flex gap-3">
              <Button onClick={() => setShowFinishConfirm(null)} variant="outline" className="flex-1">Cancelar</Button>
              <Button
                onClick={() => {
                  updateTournamentStatus(showFinishConfirm, 'finished');
                  setShowFinishConfirm(null);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black"
              >
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 border-red-400">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertTriangle className="w-10 h-10 text-red-500 drop-shadow-md" /></div>
              <h3 className="text-2xl font-black mb-2">¿Borrar Torneo?</h3>
              <p className="text-gray-600 mb-8">Esta acción es irreversible.</p>
              <div className="flex gap-3">
                 <Button onClick={() => setShowDeleteConfirm(null)} variant="outline" className="flex-1">Cancelar</Button>
                 <Button onClick={() => { deleteTournament(showDeleteConfirm); setShowDeleteConfirm(null); setSelectedT(null); }} className="flex-1 bg-red-500 text-white">Borrar</Button>
              </div>
           </div>
        </div>
      )}

      {activeT?.status === 'open' && (
        <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8">
          <h3 className="text-xl font-black mb-4">Registro de Hoja Abierta</h3>
          {isAdmin && (
            <div className="mb-4">
              <Button
                type="button"
                onClick={handleLoadAdminTestTeam}
                className="w-full sm:w-auto bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold"
              >
                Cargar equipo de prueba
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-4 mb-6">
            <Input placeholder="Tu Nombre de Entrenador *" value={playerName} onChange={e => setPlayerName(e.target.value)} className="bg-gray-50 text-lg py-6 border-2 font-bold" />
            <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-100 shadow-inner">
               <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center border-4 border-white overflow-hidden">
                  <img src={getPMDAvatar(avatarDex)} className="w-14 h-14 object-contain scale-[1.2]" style={{ imageRendering: 'pixelated' }} onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
               </div>
               <div className="flex-1"><Input type="number" min="1" max="1025" placeholder="Nº de Pokédex para Avatar" value={avatarDex} onChange={e => setAvatarDex(e.target.value)} className="bg-white font-bold h-10" /></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[0, 1, 2, 3, 4, 5].map(i => {
              const sp = team[i].species; const sprite = getPokemonDBSprite(sp, team[i].regional);
              const fastListId = POKEMON_LEGAL_MOVES[sp] ? `fast-moves-${sp}` : "fast-moves-global";
              const chargeListId = POKEMON_LEGAL_MOVES[sp] ? `charge-moves-${sp}` : "charge-moves-global";
              
              return (
                <div key={i} className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4 relative shadow-sm">
                  <span className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-md z-10">{i + 1}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center relative shrink-0">
                       <img src={sprite} className="w-11 h-11 object-contain drop-shadow-md z-0" onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                       {team[i].state === 'Oscuro' && <img src={imgOscuro} className="absolute -bottom-1.5 -right-1.5 w-6 h-6 drop-shadow-md z-10" />}
                       {team[i].state === 'Purificado' && <img src={imgPurificado} className="absolute -bottom-1.5 -right-1.5 w-6 h-6 drop-shadow-md z-10" />}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <Input list="pokemon-list" placeholder="Pokémon" value={team[i].species} onChange={e => handleUpdatePokemon(i, 'species', e.target.value)} className="w-full bg-white font-black" />
                      <div className="flex gap-2">
                        <select value={team[i].state} onChange={e => handleUpdatePokemon(i, 'state', e.target.value)} className="w-1/2 bg-white text-xs border border-gray-300 rounded-md px-2 font-medium text-gray-600"><option value="Normal">Normal</option><option value="Oscuro">Oscuro</option><option value="Purificado">Purificado</option></select>
                        <Input type="number" min={1} placeholder="PC" value={team[i].cp} onChange={e => handleUpdatePokemon(i, 'cp', e.target.value)} className="w-1/2 bg-white border-gray-300 font-mono font-bold text-center" />
                      </div>
                    </div>
                  </div>

                  {REGIONAL_FORMS[sp] && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                      <select value={team[i].regional} onChange={e => handleUpdatePokemon(i, 'regional', e.target.value)} className="w-full bg-white text-xs rounded-md px-2 font-bold text-blue-700 h-8">
                        <option value="Normal">Forma Estándar</option>{REGIONAL_FORMS[sp].map(form => <option key={form} value={form}>Forma {form}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex gap-2 items-center">
                      <div className="relative w-10 h-10 shrink-0 bg-white rounded-md border flex items-center justify-center cursor-pointer">
                        <img src={POKEMON_TYPES.find(t => t.name === team[i].fastType)?.icon || typeNormal} className="w-6 h-6 object-contain" />
                        <select value={team[i].fastType} onChange={e => handleUpdatePokemon(i, 'fastType', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">{POKEMON_TYPES.map(pt => <option key={pt.name} value={pt.name}>{pt.name}</option>)}</select>
                      </div>
                      <Input list={fastListId} placeholder="Ataque Rápido" value={team[i].fast} onChange={e => handleUpdatePokemon(i, 'fast', e.target.value)} className="flex-1 bg-white font-bold" />
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <div className="relative w-10 h-10 shrink-0 bg-white rounded-md border flex items-center justify-center cursor-pointer">
                        <img src={POKEMON_TYPES.find(t => t.name === team[i].charge1Type)?.icon || typeNormal} className="w-6 h-6 object-contain" />
                        <select value={team[i].charge1Type} onChange={e => handleUpdatePokemon(i, 'charge1Type', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">{POKEMON_TYPES.map(pt => <option key={pt.name} value={pt.name}>{pt.name}</option>)}</select>
                      </div>
                      <Input list={chargeListId} placeholder="Cargado Primario" value={team[i].charge1} onChange={e => handleUpdatePokemon(i, 'charge1', e.target.value)} className="flex-1 bg-white font-bold" />
                    </div>

                    <div className="flex gap-2 items-center">
                      <div className="relative w-10 h-10 shrink-0 bg-white rounded-md border flex items-center justify-center cursor-pointer">
                        <img src={POKEMON_TYPES.find(t => t.name === team[i].charge2Type)?.icon || typeNormal} className="w-6 h-6 object-contain" />
                        <select value={team[i].charge2Type} onChange={e => handleUpdatePokemon(i, 'charge2Type', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">{POKEMON_TYPES.map(pt => <option key={pt.name} value={pt.name}>{pt.name}</option>)}</select>
                      </div>
                      <Input list={chargeListId} placeholder="Cargado Secundario" value={team[i].charge2} onChange={e => handleUpdatePokemon(i, 'charge2', e.target.value)} className="flex-1 bg-white font-bold" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <Button
            onClick={handleRegister}
            disabled={
              isSubmitting ||
              !playerName.trim() ||
              team.some((p) => !p.species.trim()) ||
              (!isAdmin && team.some((p) => !p.cp.trim() || !p.fast.trim() || !p.charge1.trim() || !p.charge2.trim() || Number(p.cp) < 1))
            }
            className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-6 text-xl rounded-xl"
          >
             {isSubmitting ? "Inscribiendo..." : "Inscribir mi Equipo"}
          </Button>
        </div>
      )}

      {!isAdmin && activeT?.status === 'active' && devicePlayerId && (
        <div className="bg-white rounded-2xl border border-[#d7def0] p-4 shadow-sm">
          {(() => {
            const myMatch = tMatches.find((m) => m.player1_id === devicePlayerId || m.player2_id === devicePlayerId)
            const nextMatch = matches.find((m) => m.tournament_id === selectedT && m.round === (activeT.current_round || 1) + 1 && (m.player1_id === devicePlayerId || m.player2_id === devicePlayerId))
            if (!myMatch) {
              return <p className="font-bold text-[#1f2a44] text-sm">Ya pasaste de ronda. Espera a que se publique tu siguiente rival.</p>
            }
            const rivalId = myMatch.player1_id === devicePlayerId ? myMatch.player2_id : myMatch.player1_id
            const rival = players.find((p) => p.id === rivalId)
            const iWon = myMatch.winner_id === devicePlayerId
            const iLost = Boolean(myMatch.winner_id) && myMatch.winner_id !== devicePlayerId
            const nextRivalId = nextMatch ? (nextMatch.player1_id === devicePlayerId ? nextMatch.player2_id : nextMatch.player1_id) : null
            const nextRival = players.find((p) => p.id === nextRivalId)

            if (iWon) {
              return (
                <div className="space-y-1">
                  <p className="font-black text-[#e30248]">Avanzaste a la siguiente ronda.</p>
                  <p className="text-sm font-semibold text-[#1f2a44]">
                    {nextRival ? `Tu siguiente rival es ${nextRival.player_name}.` : 'Tu siguiente rival se anunciara al generar la nueva ronda.'}
                  </p>
                </div>
              )
            }
            if (iLost) {
              return <p className="font-bold text-sm text-[#1f2a44]">Tu combate de esta ronda finalizo. Gracias por participar.</p>
            }
            return <p className="font-bold text-sm text-[#1f2a44]">{rival ? `Tu rival actual es ${rival.player_name}.` : 'Tu rival se asignara en breve.'}</p>
          })()}
        </div>
      )}

      {!isAdmin && championPlayer && (
        <div className="relative overflow-hidden rounded-[28px] border-4 border-[#ffd84d] bg-gradient-to-br from-[#fff7c2] via-white to-[#ffe082] p-5 text-center shadow-[0_12px_32px_rgba(255,184,0,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.9),transparent_34%),radial-gradient(circle_at_20%_90%,rgba(255,216,77,0.45),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(255,47,157,0.18),transparent_24%)]" aria-hidden />
          <div className="relative">
            <div className="mx-auto mb-3 h-20 w-20 rounded-full bg-white p-2 shadow-lg border border-[#ffe082]">
              <img src={campeonIcon} alt="Campeón" className="h-full w-full object-contain" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9a3412]">Campeón del torneo</p>
            <h3 className="mt-1 text-2xl font-black text-[#1f2a44]">{championPlayer.player_name}</h3>
            <p className="mt-2 text-sm font-bold text-[#6b4f00]">
              Felicidades. El torneo ha concluido y ya tenemos ganador.
            </p>
          </div>
        </div>
      )}

      {activeT?.status === 'finished' && (
        <div className="bg-white rounded-[24px] border border-[#e7ddbc] shadow-xl p-5 space-y-4">
          <h3 className="text-xl font-black text-[#7a4f00]">Resultados del torneo</h3>
          {championPlayer ? (
            <div className="rounded-2xl border border-[#f3d37a] bg-[#fff8df] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[#9a6a00]">Ganador</p>
              <p className="text-2xl font-black text-[#1f2a44] mt-1">{championPlayer.player_name}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#f5b88f] bg-[#fff4ec] p-4 text-sm font-semibold text-[#9a3412]">
              {tournamentCancelledMessage}
            </div>
          )}

          <div className="space-y-2">
            {tournamentAllMatches.length > 0 ? (
              tournamentAllMatches.map((match, idx) => {
                const p1 = players.find((p) => p.id === match.player1_id)
                const p2 = players.find((p) => p.id === match.player2_id)
                const winnerName = players.find((p) => p.id === match.winner_id)?.player_name
                return (
                  <div key={match.id} className="rounded-xl border border-[#e8e1cb] bg-[#fffef8] p-3">
                    <p className="text-xs font-black uppercase text-[#8a6b1f]">Ronda {match.round} · Combate {idx + 1}</p>
                    <p className="text-sm font-bold text-[#1f2a44] mt-1">
                      {(p1?.player_name || 'Pendiente')} vs {(p2?.player_name || 'BYE')}
                    </p>
                    <p className="text-xs font-semibold text-[#4b5563] mt-1">
                      {winnerName ? `Ganador: ${winnerName}` : 'Sin ganador confirmado'}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl border border-[#e8e1cb] bg-[#fffef8] p-3 text-sm font-semibold text-[#6b7280]">
                No hay combates registrados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BRACKET ESTILO VS */}
      {activeT?.status === 'active' && (
        <div className="w-full max-w-4xl mx-auto mt-6 rounded-[28px] border border-[#d8dde8] bg-gradient-to-b from-[#eef3f9] to-[#dfe7f1] p-4 sm:p-6 shadow-[0_14px_30px_rgba(30,41,59,0.16)]">
          {(() => {
            const firstRoundMatches = matches.filter((m) => m.tournament_id === selectedT && m.round === 1)
            const bracketPlayerIds = firstRoundMatches.length > 0
              ? firstRoundMatches.flatMap((m) => [m.player1_id, m.player2_id]).filter(Boolean)
              : tPlayers.map((p) => p.id)
            const slotCount = Math.max(bracketPlayerIds.length, 2)
            const visualSlots = Array.from({ length: slotCount }, (_, idx) => players.find((p) => p.id === bracketPlayerIds[idx]))
            const gridCols = Math.min(Math.max(slotCount, 2), 8)
            const gridRows = Math.ceil(slotCount / gridCols)
            const canOpenPlayerSheet = isAdmin || Boolean(devicePlayerId)
            const slotSize = Math.min(10, 78 / gridCols, 24 / gridRows)
            const slotIndexByPlayerId = new Map(bracketPlayerIds.map((id, idx) => [id, idx]))
            const getSlotPosition = (slotIndex: number) => {
              const col = slotIndex % gridCols
              const row = Math.floor(slotIndex / gridCols)
              const x = gridCols === 1 ? 50 : 8 + col * (84 / (gridCols - 1))
              const y = gridRows === 1 ? 43 : 34 + row * (12 / Math.max(gridRows - 1, 1))
              return { x, y }
            }
            const tournamentMatches = matches
              .filter((m) => m.tournament_id === selectedT)
              .sort((a, b) => a.round - b.round)
            const visualMatches = tournamentMatches.length > 0
              ? tournamentMatches
              : Array.from({ length: Math.ceil(bracketPlayerIds.length / 2) }, (_, idx) => ({
                id: `visual-${idx}`,
                tournament_id: selectedT || '',
                round: 1,
                player1_id: bracketPlayerIds[idx * 2] || '',
                player2_id: bracketPlayerIds[idx * 2 + 1] || null,
                winner_id: null,
              }))
            const eliminatedPlayerIds = new Set(
              tournamentMatches.flatMap((match) => {
                if (!match.winner_id) return []
                return [match.player1_id, match.player2_id]
                  .filter((id): id is string => Boolean(id) && id !== match.winner_id)
              })
            )
            const playerSourcePosition = new Map<string, { x: number; y: number }>()
            bracketPlayerIds.forEach((id, idx) => playerSourcePosition.set(id, getSlotPosition(idx)))
            const connectorPaths: { id: string; color: string; filter: string; d: string }[] = []
            const advancedMarkers: { id: string; player: TournamentPlayer; x: number; y: number; round: number }[] = []
            const totalBracketRounds = Math.max(1, Math.ceil(Math.log2(slotCount)))
            const bottomY = 43
            const trophyY = 13
            const trophyLineY = 17
            const roundStep = (bottomY - trophyY) / (totalBracketRounds + 1)
            let bracketNodes = Array.from({ length: slotCount }, (_, idx) => ({
              id: bracketPlayerIds[idx] || `empty-${idx}`,
              ...getSlotPosition(idx),
            }))

            for (let round = 1; round <= totalBracketRounds; round += 1) {
              const nextNodes: typeof bracketNodes = []
              const targetY = bottomY - round * roundStep

              for (let idx = 0; idx < bracketNodes.length; idx += 2) {
                const first = bracketNodes[idx]
                const second = bracketNodes[idx + 1]
                const color = idx % 4 === 0 ? '#ff2f9d' : '#28b7ff'
                const filter = idx % 4 === 0 ? 'url(#pinkGlow)' : 'url(#blueGlow)'

                if (!second) {
                  connectorPaths.push({
                    id: `skeleton-${round}-${idx}`,
                    color,
                    filter,
                    d: `M${first.x} ${first.y} V${targetY}`,
                  })
                  nextNodes.push({ id: first.id, x: first.x, y: targetY })
                  continue
                }

                const midX = (first.x + second.x) / 2
                if (bracketNodes.length === 2) {
                  const finalJoinY = Math.max(targetY - roundStep * 0.65, trophyLineY + 3)
                  connectorPaths.push(
                    {
                      id: `zz-final-${round}-${idx}-left`,
                      color: '#ff2f9d',
                      filter: 'url(#pinkGlow)',
                      d: `M${first.x} ${first.y} V${finalJoinY} H${midX}`,
                    },
                    {
                      id: `zz-final-${round}-${idx}-right`,
                      color: '#28b7ff',
                      filter: 'url(#blueGlow)',
                      d: `M${second.x} ${second.y} V${finalJoinY} H${midX}`,
                    },
                    {
                      id: `zz-final-${round}-${idx}-advance`,
                      color: '#ffd84d',
                      filter: 'url(#pinkGlow)',
                      d: `M${midX} ${finalJoinY} V${trophyLineY}`,
                    }
                  )
                } else {
                  connectorPaths.push({
                    id: `skeleton-${round}-${idx}`,
                    color,
                    filter,
                    d: `M${first.x} ${first.y} V${targetY} H${second.x} V${second.y} M${midX} ${targetY} V${Math.max(targetY - roundStep, trophyY)}`,
                  })
                }
                nextNodes.push({ id: `${first.id}-${second.id}`, x: midX, y: Math.max(targetY - roundStep, trophyY) })
              }

              bracketNodes = nextNodes
            }

            if (bracketNodes[0]) {
              connectorPaths.push({
                id: 'skeleton-champion',
                color: '#ffd84d',
                filter: 'url(#pinkGlow)',
                d: `M${bracketNodes[0].x} ${bracketNodes[0].y} V${trophyY} H50`,
              })
            }

            visualMatches.forEach((match, idx) => {
              const first = playerSourcePosition.get(match.player1_id)
              if (!first) return
              const second = match.player2_id ? playerSourcePosition.get(match.player2_id) : undefined
              const color = idx % 2 === 0 ? '#ff2f9d' : '#28b7ff'
              const filter = idx % 2 === 0 ? 'url(#pinkGlow)' : 'url(#blueGlow)'
              const targetY = Math.max(14 + (Math.max(1, match.round) - 1) * 7, 14)

              if (!second) {
                const advance = { x: first.x, y: Math.max(first.y - 9, targetY) }
                if (match.winner_id) playerSourcePosition.set(match.winner_id, advance)
                const winner = players.find((p) => p.id === match.winner_id)
                if (winner) advancedMarkers.push({ id: `${match.id}-${winner.id}`, player: winner, x: advance.x, y: advance.y, round: match.round })
                return
              }

              const joinY = Math.max(Math.min(first.y, second.y) - 6, targetY + 4)
              const midX = (first.x + second.x) / 2
              const advance = { x: midX, y: Math.max(joinY - 7, targetY) }
              if (match.winner_id) playerSourcePosition.set(match.winner_id, advance)
              const winner = players.find((p) => p.id === match.winner_id)
              if (winner) advancedMarkers.push({ id: `${match.id}-${winner.id}`, player: winner, x: advance.x, y: advance.y, round: match.round })
            })

            const highestRound = Math.max(0, ...tournamentMatches.map((m) => m.round))
            const finalMatch = tournamentMatches.find((m) => m.round === highestRound && m.winner_id)
            const finalWinnerPosition = finalMatch?.winner_id ? playerSourcePosition.get(finalMatch.winner_id) : null
            if (finalMatch?.winner_id && finalWinnerPosition) {
              connectorPaths.push({
                id: `${finalMatch.id}-champion`,
                color: '#ffd84d',
                filter: 'url(#pinkGlow)',
                d: `M${finalWinnerPosition.x} ${finalWinnerPosition.y} V13 H50`,
              })
            }
            const latestAdvancedMarkerByPlayer = new Map<string, string>()
            advancedMarkers.forEach((marker) => latestAdvancedMarkerByPlayer.set(marker.player.id, marker.id))

            return (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[22px] border-4 border-white bg-[#f7d84b] shadow-[inset_0_0_45px_rgba(255,255,255,0.65),0_10px_24px_rgba(120,85,0,0.2)]">
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 52%, rgba(255,255,255,0.65) 0 10%, transparent 11% 100%), radial-gradient(circle at 50% 52%, transparent 0 18%, rgba(255,255,255,0.35) 19% 20%, transparent 21% 100%), radial-gradient(circle at 50% 52%, transparent 0 32%, rgba(255,255,255,0.25) 33% 34%, transparent 35% 100%), linear-gradient(135deg, rgba(255,255,255,0.25), transparent 45%, rgba(255,255,255,0.2))',
                  }}
                  aria-hidden
                />
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                  aria-hidden
                />

                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 56.25" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="0.9" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="0.9" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  {connectorPaths
                    .filter((path) => !path.id.startsWith('zz-final-'))
                    .map((path) => (
                      <path key={path.id} d={path.d} fill="none" stroke={path.color} strokeWidth="1.15" filter={path.filter} strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                  {connectorPaths
                    .filter((path) => path.id.startsWith('zz-final-'))
                    .map((path) => (
                      <path key={path.id} d={path.d} fill="none" stroke={path.color} strokeWidth="1.75" filter={path.filter} strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                </svg>

                <div className="absolute left-1/2 top-[6%] -translate-x-1/2">
                  <div className="h-16 w-16 rounded-full bg-white/80 p-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.2)] border border-white">
                    <img src={campeonIcon} alt="Emblema del torneo" className="h-full w-full object-contain" />
                  </div>
                </div>

                {visualSlots.map((player, idx) => {
                  const position = getSlotPosition(idx)
                  const isEliminated = player ? eliminatedPlayerIds.has(player.id) : false
                  return (
                    <button
                      key={player?.id || `empty-${idx}`}
                      type="button"
                      onClick={() => player && canOpenPlayerSheet && setViewPlayer(player)}
                      disabled={!player || !canOpenPlayerSheet}
                      className={`absolute aspect-square rounded-md border-2 shadow-[0_3px_10px_rgba(0,0,0,0.25)] overflow-hidden flex items-center justify-center -translate-x-1/2 -translate-y-1/2 ${
                        isEliminated
                          ? 'border-gray-400 bg-gray-300/80 grayscale opacity-60'
                          : `${idx % 2 === 0 ? 'border-[#ff2f9d]' : 'border-[#28b7ff]'} bg-white/65`
                      } ${player && canOpenPlayerSheet ? 'hover:scale-110 transition-transform' : 'opacity-75'}`}
                      style={{
                        left: `${position.x}%`,
                        top: `${(position.y / 56.25) * 100}%`,
                        width: `${slotSize}%`,
                      }}
                      aria-label={player ? `Ver equipo de ${player.player_name}` : `Slot vacio ${idx + 1}`}
                    >
                      {player ? (
                        <img src={getPMDAvatar(player.avatar_dex)} className="h-full w-full object-contain scale-[1.18]" style={{ imageRendering: 'pixelated' }} onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                      ) : (
                        <User className="h-5 w-5 text-[#8b7a2a]" />
                      )}
                    </button>
                  )
                })}

                {advancedMarkers.map((marker) => {
                  const isPastPosition = latestAdvancedMarkerByPlayer.get(marker.player.id) !== marker.id
                  return (
                    <button
                      key={marker.id}
                      type="button"
                      onClick={() => canOpenPlayerSheet && setViewPlayer(marker.player)}
                      disabled={!canOpenPlayerSheet}
                      className={`absolute aspect-square rounded-md border-2 overflow-hidden flex items-center justify-center -translate-x-1/2 -translate-y-1/2 ${
                        isPastPosition
                          ? 'border-gray-400 bg-gray-300/80 grayscale opacity-60 shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                          : 'border-[#ffd84d] bg-[#fff7c2] shadow-[0_0_16px_rgba(255,216,77,0.85)]'
                      }`}
                      style={{
                        left: `${marker.x}%`,
                        top: `${(marker.y / 56.25) * 100}%`,
                        width: `${Math.max(slotSize * 0.82, 5)}%`,
                      }}
                      aria-label={`Ganador avanzado ${marker.player.player_name}`}
                      title={isPastPosition ? `Posicion anterior: ${marker.player.player_name}` : `Avanza: ${marker.player.player_name}`}
                    >
                      <img src={getPMDAvatar(marker.player.avatar_dex)} className="h-full w-full object-contain scale-[1.18]" style={{ imageRendering: 'pixelated' }} onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                    </button>
                  )
                })}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#cfae22]/50 to-transparent h-16 pointer-events-none" />
              </div>
            )
          })()}

          {(isAdmin || devicePlayerId) && (
            <>
          <div className="flex flex-col items-center my-5">
            <span className="font-black text-sm sm:text-base uppercase tracking-wider bg-white/90 border border-[#d3dae8] px-5 py-2 rounded-full shadow-sm text-[#1f2a44]">
              Combates de ronda {activeT.current_round}
            </span>
          </div>

          <div className="space-y-4">
            {tMatches.map((m, matchIndex) => {
              const p1 = players.find(p => p.id === m.player1_id)
              const p2 = players.find(p => p.id === m.player2_id)
              const p1Winner = m.winner_id === p1?.id
              const p2Winner = m.winner_id === p2?.id

              return (
                <div key={m.id} className="rounded-xl border border-[#cfd7e6] bg-white/70 p-2.5 sm:p-3 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 md:gap-3 items-center">
                  <div
                    className={`min-h-[72px] px-3 py-2 rounded-md border cursor-pointer flex items-center gap-2.5 shadow-sm transition-transform hover:scale-[1.01] ${
                      p1Winner
                        ? 'bg-[#ffd84d] border-[#d2a100] text-[#3f2f00] animate-pulse'
                        : 'bg-[#e30248] border-[#bf003d] text-white'
                    }`}
                    onClick={() => isAdmin && !m.winner_id && p1 && p2 && setConfirmWinnerData({ matchId: m.id, playerId: p1.id, playerName: p1.player_name })}
                  >
                    <div className="w-9 h-9 rounded-full bg-white border border-white/80 overflow-hidden shrink-0 shadow-sm">
                      <img src={getPMDAvatar(p1?.avatar_dex)} className="w-full h-full object-contain scale-[1.2]" style={{ imageRendering: 'pixelated' }} onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-black uppercase tracking-wide ${p1Winner ? 'text-[#6b5100]' : 'text-white/80'}`}>Lado A</p>
                      <p className="font-black text-base truncate">{p1?.player_name || 'Pendiente'}</p>
                      {p1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewPlayer(p1) }}
                          className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${p1Winner ? 'text-[#5d4300]' : 'text-white/90'}`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver equipo
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center relative px-2">
                    <div className="hidden md:block w-14 h-[4px] bg-[#e30248] rounded-full mr-1.5 shadow-[0_0_6px_rgba(227,2,72,0.45)]" />
                    <div className="h-10 min-w-[56px] px-2 rounded-md bg-white border-2 border-[#cfd7e6] shadow-sm flex flex-col items-center justify-center leading-none">
                      <span className="text-[11px] font-black text-[#374151]">VS</span>
                      <span className="text-[9px] font-bold text-[#6b7280]">CONTRA</span>
                    </div>
                    <div className="hidden md:block w-14 h-[4px] bg-[#0173b9] rounded-full ml-1.5 shadow-[0_0_6px_rgba(1,115,185,0.45)]" />
                  </div>

                  {p2 ? (
                    <div
                      className={`min-h-[72px] px-3 py-2 rounded-md border cursor-pointer flex items-center gap-2.5 shadow-sm transition-transform hover:scale-[1.01] ${
                        p2Winner
                          ? 'bg-[#ffd84d] border-[#d2a100] text-[#3f2f00] animate-pulse'
                          : 'bg-[#0173b9] border-[#005a91] text-white'
                      }`}
                      onClick={() => isAdmin && !m.winner_id && p2 && setConfirmWinnerData({ matchId: m.id, playerId: p2.id, playerName: p2.player_name })}
                    >
                      <div className="w-9 h-9 rounded-full bg-white border border-white/80 overflow-hidden shrink-0 shadow-sm">
                        <img src={getPMDAvatar(p2?.avatar_dex)} className="w-full h-full object-contain scale-[1.2]" style={{ imageRendering: 'pixelated' }} onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[10px] font-black uppercase tracking-wide ${p2Winner ? 'text-[#6b5100]' : 'text-white/80'}`}>Lado B</p>
                        <p className="font-black text-base truncate">{p2.player_name}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewPlayer(p2) }}
                          className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${p2Winner ? 'text-[#5d4300]' : 'text-white/90'}`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver equipo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[72px] px-3 py-2 rounded-md border bg-[#fff7db] border-[#f5d278] text-[#8a6514] flex items-center justify-center font-black text-sm shadow-sm">
                      Avanza automático
                    </div>
                  )}
                </div>
                  <p className="mt-2 text-center text-[11px] font-bold text-[#4b5563]">
                    {m.winner_id
                      ? `El ganador del combate es: ${players.find((p) => p.id === m.winner_id)?.player_name || 'Pendiente'}`
                      : `Combate ${matchIndex + 1}: ${p1?.player_name || 'Pendiente'} vs ${p2?.player_name || 'BYE'}`}
                  </p>
                </div>
              )
            })}
          </div>
            </>
          )}
        </div>
      )}

      {/* CONFIRMAR GANADOR */}
      {confirmWinnerData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl p-8 max-w-sm text-center border-4 border-yellow-400 shadow-2xl">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black mb-2 uppercase">¡Ganador!</h3>
              <p className="text-gray-600 mb-8">Confirmar victoria para <span className="font-bold text-yellow-700">{confirmWinnerData.playerName}</span></p>
              <div className="flex gap-3">
                 <Button onClick={() => setConfirmWinnerData(null)} variant="outline" className="flex-1">Cancelar</Button>
                 <Button onClick={() => { setWinner(confirmWinnerData.matchId, confirmWinnerData.playerId); setConfirmWinnerData(null); }} className="flex-1 bg-yellow-400 text-yellow-900 font-black">Confirmar</Button>
              </div>
           </div>
        </div>
      )}

      {/* VISTA HOJA DEL JUGADOR CON LOS ICONOS DE TIPOS CORRECTOS */}
      {viewPlayer && (
        <div className="fixed inset-x-0 top-0 bottom-[5.75rem] bg-black/80 flex items-center justify-center z-50 p-3" onClick={() => setViewPlayer(null)}>
          <div className="bg-white rounded-[24px] p-3 max-w-4xl w-full max-h-[calc(100dvh-7rem)] overflow-y-auto pb-4" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur rounded-t-[20px] pb-3 mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden border border-blue-200 shrink-0"><img src={getPMDAvatar(viewPlayer.avatar_dex)} className="w-full h-full object-contain scale-[1.2]" style={{ imageRendering: 'pixelated' }} /></div>
                <h2 className="text-lg font-black text-gray-900 truncate">Hoja de {viewPlayer.player_name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewPlayer(null)}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 inline-flex items-center justify-center shrink-0"
                aria-label="Cerrar hoja"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {viewPlayer.team.map((poke, i) => {
                const sprite = getPokemonDBSprite(poke.species, poke.regional);
                const fType = POKEMON_TYPES.find(t => t.name === poke.fastType)?.icon || typeNormal;
                const c1Type = POKEMON_TYPES.find(t => t.name === poke.charge1Type)?.icon || typeNormal;
                const c2Type = POKEMON_TYPES.find(t => t.name === poke.charge2Type)?.icon || typeNormal;

                return (
                  <div key={i} className={`bg-white p-3 rounded-2xl shadow-sm border-l-4 ${poke.state === 'Oscuro' ? 'border-purple-600' : poke.state === 'Purificado' ? 'border-yellow-400' : 'border-blue-400'} border-t border-r border-b border-gray-100 flex gap-3 items-center`}>
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner relative shrink-0">
                       <img src={sprite} className="w-12 h-12 object-contain z-0" onError={(e) => { (e.target as HTMLImageElement).src = pokebola }} />
                       {poke.state === 'Oscuro' && <img src={imgOscuro} className="absolute -bottom-1 -right-1 w-5 h-5 drop-shadow-md z-10" />}
                       {poke.state === 'Purificado' && <img src={imgPurificado} className="absolute -bottom-1 -right-1 w-5 h-5 drop-shadow-md z-10" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1 border-b pb-1">
                        <span className="font-black text-gray-800 text-sm leading-tight break-words">{poke.species} {poke.regional !== 'Normal' && <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{poke.regional}</span>}</span>
                        <span className="font-mono font-black text-xs bg-gray-900 text-white px-2 py-0.5 rounded-md shrink-0">PC {poke.cp}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-xs mt-1">
                        <div className="flex items-center gap-1.5 min-w-0"><img src={fType} className="w-4 h-4 object-contain shrink-0" /><span className="text-gray-700 font-bold truncate">{poke.fast || '-'}</span></div>
                        <div className="flex items-center gap-1.5 min-w-0"><img src={c1Type} className="w-4 h-4 object-contain shrink-0" /><span className="text-gray-700 font-bold truncate">{poke.charge1 || '-'}</span></div>
                        {poke.charge2 && <div className="flex items-center gap-1.5 min-w-0"><img src={c2Type} className="w-4 h-4 object-contain shrink-0" /><span className="text-gray-700 font-bold truncate">{poke.charge2}</span></div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {alertInfo && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setAlertInfo(null)}>
           <div
             className={`bg-white p-8 rounded-3xl text-center max-w-sm shadow-2xl border-4 ${
               alertInfo.type === 'error' ? 'border-orange-400' : 'border-blue-400'
             }`}
             onClick={e => e.stopPropagation()}
           >
              {alertInfo.type === 'error' ? (
                <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              ) : (
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              )}
              <h3 className="text-2xl font-black mb-2">{alertInfo.title}</h3>
              <p className="text-gray-600 mb-8">{alertInfo.message}</p>
              <Button
                onClick={() => setAlertInfo(null)}
                className={`w-full text-white py-4 font-bold ${
                  alertInfo.type === 'error' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Entendido
              </Button>
           </div>
        </div>
      )}
    </div>
  )
}