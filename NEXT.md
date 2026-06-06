## Fecha
2026-06-06

## Que hicimos hoy
- Migración completa de GitHub Pages → Railway (server.js para Node + push)
- Implementación de push notifications con app cerrada en iPhone (VAPID + SW custom)
  - src/sw.js — service worker con push handler
  - server.js — background polling Queue-Times + web-push
- Sección Parques: solo 3 parques Universal con live API (sin Disney, sin Volcano Bay)
  - src/pages/Parques.jsx — Volcano Bay como tarjeta con link a Virtual Line
- Carga de datos reales en Supabase:
  - 4 códigos Universal Orlando (confirmación + 3 barcodes)
  - Evento "Primer día Universal Parks" — 12 jun, familia moledo
- filtrarPorPerfil añadida al AppContext (bug fix)
  - src/context/AppContext.jsx

## Que quedo terminado
- fa16be1 — PWA start_url/scope corregidos para Railway
- f541f2b — base path migrado de /usa2026-familia/ a /
- 58ce9c9 — push notifications + mejoras parques
- Dominio Railway generado: usa2026-app-production.up.railway.app
- Datos Universal cargados en Supabase (codes + events)

## Que quedo a medias
- Railway deploy en curso al cerrar (2 commits pusheados, auto-deploy tardó ~5 min)
- Push notifications sin testear end-to-end (necesita app instalada en iPhone)
- Admin.jsx eliminado localmente pero no commiteado (git status lo muestra como deleted)
- supabase/ y .claude/ sin commitear (agregar o ignorar al retomar)
- Datos del viaje pendientes de cargar: vuelos, hoteles (Orlando, NY, Miami), crucero, ESTA, seguro

## Proximo paso concreto al retomar
- Abrir https://usa2026-app-production.up.railway.app y verificar que la app funciona
- Testear push: instalar en iPhone como PWA → ir a Parques → activar alarma → esperar notificación
- Luego cargar vuelos y hotel (pedir documentos a Agus)

## Notas/decisiones importantes
- App movida a Railway definitivamente — GitHub Pages era solo estático, no podía correr Node
- Volcano Bay excluida de la API (usa Virtual Line de Universal, no Queue-Times)
- Disney excluido por completo (no tienen entradas)
- VAPID keys seteadas en Railway via GraphQL API (no en .env local)
- Polling de tiempos de espera: 30 segundos
