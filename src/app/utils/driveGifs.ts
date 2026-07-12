/** Carpetas compartidas de GIFs para el calendario. */
export const DRIVE_GIF_FOLDERS = {
  /** Megadex Z-A — sprites normales (Skarmory, Raichu…) */
  megaNormal: 'https://drive.google.com/drive/folders/1xI2U0f76k5DoUoLsBH1BbzAU3rcUgiKb',
  /** Shiny Megadex Z-A */
  megaShiny: 'https://drive.google.com/drive/folders/1UEMZ-fLGm8GvC5eoZ88gBpX0zfj4FXz9',
  /** Pokémon HOME — sprites normales */
  homeNormal: 'https://drive.google.com/drive/folders/1hpV8wwRbn3KpfVMixbiEj36MUnYdly3-',
  /** Scarlet/Violet — sprites shiny */
  homeShiny: 'https://drive.google.com/drive/u/0/folders/1BNRjh8dzJ9i6x1Bwqzse1ORtnDr75oLq',
} as const

function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

/** GIFs del calendario (Google Drive). */
export const CALENDAR_GIFS = {
  megaSkarmory: driveViewUrl('1UsDnRQ0Jv3mmZQgzCLNCiuOa4Xf6cyee'),
  megaRaichuX: driveViewUrl('17ja7e811O_WRXKtRaAeUdkLSLJfWNKXt'),
  megaRaichuY: driveViewUrl('14do3znz3CH3VOJgQj3tpalWQPCEkggj8'),
  sobble: driveViewUrl('19gdK8BJ58dU2YmXIDWS35wu_NGHn5S3w'),
  sobbleShiny: driveViewUrl('13lATOCv9y7kacOWzN0OerXgN3ePx9AGb'),
  drizzile: driveViewUrl('1nUWlo8sNI0FHi3Luvq0qYx6FC_JXMoLo'),
  inteleon: driveViewUrl('1gobfC6F5ZSe_F7Psfn3-dvs7LKbDfpja'),
} as const
