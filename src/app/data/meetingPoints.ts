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
      'Punto principal de reunión de la comunidad. Parque urbano amplio con muchas Poképaradas y gimnasios, ideal para Community Day.',
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
      'Restaurante de tacos al lado del parque. Punto de convivencia después de las dinámicas y sorteos.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=20.679045,-103.340005',
    lat: 20.679045,
    lng: -103.340005,
  },
  {
    id: 'mister-homie',
    name: 'MISTER HOMIE',
    area: 'Platón 1447, Independencia, 44379 Guadalajara, Jal.',
    description:
      'Espacio para quedar en grupo, intercambiar amigos y coordinar incursiones.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=20.699727,-103.334585',
    lat: 20.699727,
    lng: -103.334585,
  },
  {
    id: 'tiempo-libre',
    name: 'C. José Clemente Orozco',
    area: 'C. José Clemente Orozco, Santa Teresita, 44600 Guadalajara, Jal.',
    description:
      'Punto de encuentro en Santa Tere. Lugar cómodo para juntas de barrio e intercambios.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tiempo+Libre+Game+Room+C.+Jose+Clemente+Orozco+296+Santa+Teresita+44600+Guadalajara+Jal',
    lat: 20.6806,
    lng: -103.3649,
  },
]
