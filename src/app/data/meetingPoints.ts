export interface MeetingPoint {
  id: string
  name: string
  area: string
  description: string
  mapsUrl: string
  lat: number
  lng: number
  isMain?: boolean
}

export const meetingPoints: MeetingPoint[] = [
  {
    id: 'parque-morelos',
    name: 'Parque Morelos',
    area: 'Parque Morelos Calz. Independencia Norte, Zona Centro, 44280 Guadalajara, Jal., México.',
    description:
      'Punto de reunión de la comunidad con muchas Poképaradas y gimnasios.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=20.680624,-103.340587',
    lat: 20.680624,
    lng: -103.340587,
    isMain: true,
  },
  {
    id: 'barbataco',
    name: 'Barbataco Parque Morelos',
    area: 'Calz. Independencia Norte 135A, Zona Centro, 44100 Guadalajara, Jal., Mexico',
    description:
      'Restaurante de tacos de barbacoa, aliado de la comunidad, aprovecha la promocion exclusiva enseñando tu registro de campfire.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=20.679045,-103.340005',
    lat: 20.679045,
    lng: -103.340005,
  },
  {
    id: 'mister-homie',
    name: 'MISTER HOMIE',
    area: 'Platón 1447, Independencia, 44379 Guadalajara, Jal.',
    description:
      'Espacio BarArcade para adultos y niños (solo con supervisión), podras jugar en máquinas arcade y consolas de video juegos.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=20.699727,-103.334585',
    lat: 20.699727,
    lng: -103.334585,
  },
  {
    id: 'tiempo-libre',
    name: 'Tiempo Libre Game Room',
    area: 'C. José Clemente Orozco, Santa Teresita, 44600 Guadalajara, Jal.',
    description:
      'Tu punto de encuentro para jugar y convivir, también podrás encontrar: Coleccionables, Juegos de mesa, Pokémon TCG y más.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tiempo+Libre+Game+Room+C.+Jose+Clemente+Orozco+296+Santa+Teresita+44600+Guadalajara+Jal',
    lat: 20.6806,
    lng: -103.3649,
  },
]
