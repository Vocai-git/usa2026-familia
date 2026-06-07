## Fecha
2026-06-07

## Que hicimos hoy
- Saqué el vuelo NY→Miami de Castro/papa (era family_id=null, lo até a moledo + dupliqué para hermanos)
- Arreglé el checklist que no cargaba en móvil — `order('created_at')` sobre columna inexistente (src/pages/Listas.jsx)
- 100% de fotos de atracciones con matcheo temático por palabra clave (src/data/atracciones.js)
- Agregué IA al panel de escritorio (src/pages/admin/Documentos.jsx + server.js /api/parse-document)
- Vista Hoy en inicio (src/components/HoyPanel.jsx); ubicación en vivo en el mapa (src/pages/Mapa.jsx + tabla live_locations)
- Gastos por familia (src/pages/Gastos.jsx + tabla expenses); guía Nueva York solo Moledo (src/pages/NuevaYork.jsx)
- Mapa de cada parque: atracciones coloreadas por espera + tu GPS (src/components/ParkMap.jsx + src/data/parkMaps.js)
- Arreglé notificaciones push de parques — clave VAPID como Uint8Array para Safari (src/pages/Parques.jsx)

## Que quedo terminado
- Todo lo de arriba commiteado (12 commits, último 56d7e95) y deployado en Railway
- Cobertura mapas: USF 18/18, IOA 25/25, Epic 19/19 (Epic aproximado, no está en OSM)
- Checklist visible en móvil; fotos de atracciones al 100%; push de parques funcionando

## Que quedo a medias
- Nada pendiente de la sesión. Falta SOLO pushear a origin (12 commits adelante de origin/main)

## Proximo paso concreto al retomar
- Esperar feedback de Agus tras probar el mapa de parques y el GPS

## Notas/decisiones importantes
- Seguridad NO es prioridad (app efímera ~35 días, familias de confianza) — no insistir
- Railway: `railway up --detach` deploya; `git push` NO deploya. URL prod: https://usa2026-app-production.up.railway.app
- Supabase DDL vía Management API (el CLI tiene colisión de versiones de migración)
- iOS push solo funciona con la PWA instalada
- Familias: moledo, hermanos (Lewin), amigos (Castro), papa (Luis y Andrea)
