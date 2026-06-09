## Fecha
2026-06-08

## Que hicimos hoy
- Arreglé el panel de escritorio que no leía documentos con IA: una función local `fetch` pisaba al `fetch` del navegador → la llamada a /api/parse-document nunca salía (src/pages/admin/Documentos.jsx, renombrada a `loadDocs`)
- Corregí la cuenta regresiva del dashboard: salida real **10 jun 10:00 Madrid** (src/pages/Inicio.jsx:6 y src/components/HoyPanel.jsx:4)

## Que quedo terminado
- 0fd4594 — fix admin IA (fetch shadowing)
- 12452af — cuenta regresiva al 10 jun 10:00 Madrid (revierte el b7b00f7 que la había puesto en julio por error)
- Todo deployado y verificado en Railway (último bundle index-BKZFsHbC.js)

## Que quedo a medias
- Nada de código. SOLO falta pushear a origin (3 commits adelante)
- Pendiente menor: hay un archivo huérfano en storage (el doc que Agus subió antes del fix, quedó sin fila en la base). Limpiar si molesta.

## Proximo paso concreto al retomar
- ¡El viaje arranca el 10 jun! Verificar que la cuenta marque bien y que el panel de escritorio lea documentos con IA al subir uno real

## Notas/decisiones importantes
- La salida es 10 jun 2026, NO julio. El itinerario en la base (Orlando 10-28 jun, crucero, Miami, NY, regreso 14 jul) está correcto — NO tocar, Agus lo confirmó
- Railway: `railway up --detach` deploya; `git push` NO. URL prod: https://usa2026-app-production.up.railway.app
- iOS push solo funciona con la PWA instalada
