const VENADERO_MARKER = 'venadero'

/** Normaliza usuario: leetspeak, acentos, dígitos y separadores. */
export function normalizeUsername(username: string): string {
  return username
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/2/g, 'z')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/6/g, 'g')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    .replace(/[^a-z]/g, '')
}

/** venaderos, javier venaderos, jvenaderos, venaderos16, v3n@d3r0s, etc. */
export function isVenaderoBlacklisted(username: string): boolean {
  return normalizeUsername(username).includes(VENADERO_MARKER)
}
