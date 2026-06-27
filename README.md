
  # Event Registration and Roulette App

  https://pokemon-gdl.pages.dev/
# User: Pawmot
   # Pass: sellodex2026
  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Verificacion de registro simultaneo

  Para comprobar que 500 registros simultaneos cumplen el umbral de latencia:

  ```bash
  VITE_SUPABASE_URL=https://<project>.supabase.co \
  VITE_SUPABASE_ANON_KEY=<key> \
  npm run check:registration-load
  ```

  La prueba crea 500 usuarios e IPs sinteticas con una ruleta aislada
  `load-<timestamp>`, replica las validaciones previas del registro y luego
  inserta en `participants`. Por defecto falla si el p95 supera 1000 ms o si
  algun registro tarda mas de 5000 ms.

  Variables utiles:

  - `CONCURRENT_REGISTRATIONS=500`
  - `REGISTRATION_LOAD_P95_MS=1000`
  - `REGISTRATION_LOAD_MAX_MS=5000`
  - `REGISTRATION_LOAD_ROULETTE=load-staging`
  - `REGISTRATION_LOAD_CLEANUP=false` para conservar los registros de prueba
    y revisarlos manualmente.
   
