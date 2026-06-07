// Info de atracciones de Universal Orlando (en español).
// Se busca por palabra clave dentro del nombre que devuelve la API.

const ATRACCIONES = [
  // ── Epic Universe ──
  { k: ['stardust'], emoji: '🎢', tipo: 'Montaña rusa', color: '#7C3AED', desc: 'Montaña rusa doble en la que dos trenes corren en paralelo y se cruzan a toda velocidad. De las más rápidas del parque.' },
  { k: ['constellation'], emoji: '🎠', tipo: 'Familiar', color: '#0EA5E9', desc: 'Calesita espacial suave, ideal para los más chicos y para toda la familia.' },
  { k: ['ministry', 'battle at the ministry'], emoji: '🪄', tipo: 'Dark ride', color: '#8B5CF6', desc: 'Atracción de Harry Potter por el Ministerio de Magia: pantallas, efectos y magia sin grandes sustos.' },
  { k: ['mario kart', 'bowser'], emoji: '🏎️', tipo: 'Realidad aumentada', color: '#EF4444', desc: 'Carrera de Mario Kart con gafas de realidad aumentada: tirás caparazones y competís contra Bowser. Para todas las edades.' },
  { k: ['yoshi'], emoji: '🦕', tipo: 'Familiar', color: '#22C55E', desc: 'Paseo tranquilo a lomos de Yoshi con vistas del mundo de Mario. Perfecta para peques.' },
  { k: ['mine-cart', 'mine cart', 'donkey kong'], emoji: '🛒', tipo: 'Montaña rusa familiar', color: '#F59E0B', desc: 'Montaña rusa de vagonetas de Donkey Kong que parece saltar por las vías rotas. Emoción media, apta para chicos.' },
  { k: ['hiccup', 'wing glider'], emoji: '🐉', tipo: 'Montaña rusa familiar', color: '#16A34A', desc: 'Volás como un dragón sobre la Isla de Berk (Cómo entrenar a tu dragón). Suave y muy visual.' },
  { k: ['fyre drill'], emoji: '💦', tipo: 'Agua', color: '#0EA5E9', desc: 'Atracción interactiva donde apagás fuegos con agua desde un barco dragón. Para toda la familia.' },
  { k: ['dragon racer'], emoji: '🐲', tipo: 'Montaña rusa familiar', color: '#16A34A', desc: 'Montaña rusa suave de dragones, pensada para los más jóvenes.' },
  { k: ['werewolf', 'curse of the'], emoji: '🐺', tipo: 'Montaña rusa', color: '#6B7280', desc: 'Montaña rusa giratoria del Mundo Oscuro (monstruos clásicos). Ambiente tenebroso, emoción media.' },
  { k: ['monsters unchained', 'frankenstein'], emoji: '🧟', tipo: 'Dark ride', color: '#6B7280', desc: 'Atracción oscura con los monstruos clásicos de Universal. Da algo de miedo: mejor para grandes.' },

  // ── Universal Studios Florida ──
  { k: ['gringotts'], emoji: '🐉', tipo: 'Montaña rusa + 4D', color: '#F59E0B', desc: 'Recorrido por el banco Gringotts de Harry Potter con caídas y pantallas 3D. Emoción media-alta.' },
  { k: ['mummy', 'momia'], emoji: '⚰️', tipo: 'Montaña rusa en la oscuridad', color: '#92400E', desc: 'Montaña rusa interior de La Momia: acelerones, fuego y sustos en penumbra. Para los que buscan emoción.' },
  { k: ['rip ride', 'rockit'], emoji: '🎸', tipo: 'Montaña rusa', color: '#EC4899', desc: 'Montaña rusa intensa donde elegís tu canción mientras subís en vertical. De las más fuertes.' },
  { k: ['transformers'], emoji: '🤖', tipo: 'Simulador 3D', color: '#3B82F6', desc: 'Batalla en 3D junto a los Autobots contra los Decepticons. Mucho movimiento y efectos.' },
  { k: ['minion', 'despicable'], emoji: '🍌', tipo: 'Simulador 3D', color: '#FACC15', desc: 'Simulador divertido para convertirte en Minion. Familiar y muy gracioso.' },
  { k: ['men in black', 'alien attack'], emoji: '👽', tipo: 'Interactiva', color: '#1F2937', desc: 'Disparás a los aliens desde el coche y competís por puntos. Para toda la familia.' },
  { k: ['simpsons'], emoji: '🍩', tipo: 'Simulador', color: '#FACC15', desc: 'Simulador alocado por el parque de Krustyland con los Simpson. Familiar.' },
  { k: ['e.t.', 'et adventure'], emoji: '🚲', tipo: 'Dark ride familiar', color: '#22C55E', desc: 'Paseo clásico y tierno volando con E.T. en bicicleta. Ideal para chicos.' },
  { k: ['fast & furious', 'supercharged'], emoji: '🚗', tipo: 'Simulador', color: '#EF4444', desc: 'Persecución a toda velocidad con el equipo de Fast & Furious. Más show que emoción fuerte.' },
  { k: ['hogwarts express'], emoji: '🚂', tipo: 'Transporte temático', color: '#7C3AED', desc: 'Tren de Hogwarts que conecta los dos parques de Harry Potter. Necesitás entrada a ambos parques.' },
  { k: ['bourne'], emoji: '🎭', tipo: 'Espectáculo', color: '#0EA5E9', desc: 'Show en vivo de acción tipo Jason Bourne, con efectos y dobles de riesgo.' },

  // ── Islands of Adventure ──
  { k: ['hulk'], emoji: '💚', tipo: 'Montaña rusa', color: '#22C55E', desc: 'Montaña rusa lanzada con looping del increíble Hulk. De las más intensas del parque.' },
  { k: ['spider-man', 'spiderman'], emoji: '🕷️', tipo: 'Dark ride 3D', color: '#EF4444', desc: 'Aventura 3D con movimiento junto a Spider-Man. Clásico imperdible, apto para casi todos.' },
  { k: ['velocicoaster'], emoji: '🦖', tipo: 'Montaña rusa extrema', color: '#F97316', desc: 'Una de las montañas rusas más rápidas e intensas: lanzamientos y giros con dinosaurios. Solo para valientes.' },
  { k: ['jurassic park river', 'river adventure'], emoji: '🦕', tipo: 'Agua', color: '#16A34A', desc: 'Paseo en bote por Jurassic Park que termina en una gran caída de agua. Te mojás.' },
  { k: ['hagrid'], emoji: '🏍️', tipo: 'Montaña rusa familiar', color: '#7C3AED', desc: 'Montaña rusa en moto mágica por el bosque de Harry Potter. Emoción media, muy buena para toda la familia.' },
  { k: ['forbidden journey'], emoji: '🪄', tipo: 'Dark ride', color: '#8B5CF6', desc: 'Vuelo mágico por Hogwarts con robots y pantallas. Mucho movimiento, puede marear un poco.' },
  { k: ['kong', 'skull island'], emoji: '🦍', tipo: 'Simulador', color: '#92400E', desc: 'Recorrido en camión por la isla de King Kong con criaturas en 3D. Algún susto.' },
  { k: ['doctor doom', 'fearfall'], emoji: '😈', tipo: 'Torre de caída', color: '#EF4444', desc: 'Te disparan hacia arriba y caés en caída libre. Corto pero intenso.' },
  { k: ['cat in the hat'], emoji: '🐱', tipo: 'Dark ride familiar', color: '#0EA5E9', desc: 'Paseo giratorio por el cuento del Gato Ensombrerado. Ideal para los más chicos.' },
  { k: ['bilge-rat', 'popeye'], emoji: '💦', tipo: 'Agua (rápidos)', color: '#0EA5E9', desc: 'Rápidos en balsa con Popeye: te empapás seguro. Diversión familiar.' },
  { k: ['ripsaw falls', 'dudley'], emoji: '💦', tipo: 'Agua (troncos)', color: '#16A34A', desc: 'Atracción de troncos con gran caída final. Te mojás bastante.' },
  { k: ['hippogriff'], emoji: '🦅', tipo: 'Montaña rusa familiar', color: '#22C55E', desc: 'Montañita rusa suave por la cabaña de Hagrid. Perfecta como primera montaña rusa para chicos.' },
  { k: ['pteranodon'], emoji: '🦎', tipo: 'Familiar', color: '#16A34A', desc: 'Sobrevolás Jurassic Park colgado. Requisitos de altura particulares (para chicos acompañados).' },
]

const FALLBACK = { emoji: '🎢', tipo: 'Atracción', color: '#C8602A', desc: 'Atracción del parque. El tiempo de espera se actualiza en vivo.' }

// Fotos reales (subidas a la app, servidas por /api/doc → andan offline también)
const FOTOS = {
  'hulk': 'atracciones/hulk.jpg',
  'velocicoaster': 'atracciones/velocicoaster.jpg',
  'hagrid': 'atracciones/hagrid.jpg',
  'forbidden journey': 'atracciones/forbidden-journey.jpg',
  'gringotts': 'atracciones/gringotts.jpg',
  'mummy': 'atracciones/mummy.jpg',
  'rockit': 'atracciones/rockit.jpg',
  'spider-man': 'atracciones/spider-man.jpg',
  'river adventure': 'atracciones/river-adventure.png',
  'transformers': 'atracciones/transformers.jpg',
  'minion': 'atracciones/minion.jpg',
  'men in black': 'atracciones/men-in-black.png',
  'simpsons': 'atracciones/simpsons.jpg',
  'e.t.': 'atracciones/e-t.png',
  'fast & furious': 'atracciones/fast-furious.jpg',
  'kong': 'atracciones/kong.png',
  'doctor doom': 'atracciones/doctor-doom.jpg',
  'cat in the hat': 'atracciones/cat-in-the-hat.png',
  'popeye': 'atracciones/popeye.jpg',
  'ripsaw falls': 'atracciones/ripsaw-falls.webp',
  'hippogriff': 'atracciones/hippogriff.jpg',
  'stardust': 'atracciones/stardust.jpg',
  'mario kart': 'atracciones/mario-kart.jpg',

  // ── Matcheo temático: cubre el resto de atracciones con la foto del mundo/IP ──
  // Super Nintendo World (Epic Universe)
  'mine-cart': 'atracciones/mario-kart.jpg',
  'yoshi': 'atracciones/mario-kart.jpg',
  'bowser': 'atracciones/mario-kart.jpg',
  'donkey kong': 'atracciones/mario-kart.jpg',
  'mario': 'atracciones/mario-kart.jpg',
  // Isle of Berk — Cómo entrenar a tu dragón (Epic Universe)
  'hiccup': 'atracciones/hippogriff.jpg',
  'toothless': 'atracciones/hippogriff.jpg',
  'dragon': 'atracciones/hippogriff.jpg',
  'wing glider': 'atracciones/hippogriff.jpg',
  'fyre': 'atracciones/hippogriff.jpg',
  // Dark Universe — monstruos (Epic Universe)
  'werewolf': 'atracciones/mummy.jpg',
  'frankenstein': 'atracciones/mummy.jpg',
  'monster': 'atracciones/mummy.jpg',
  // Mundo mágico de Harry Potter
  'ministry': 'atracciones/gringotts.jpg',
  'hogwarts': 'atracciones/gringotts.jpg',
  'ollivanders': 'atracciones/gringotts.jpg',
  'potter': 'atracciones/forbidden-journey.jpg',
  // Celestial Park (Epic Universe)
  'constellation': 'atracciones/stardust.jpg',
  // Jurassic Park / World (Islands of Adventure)
  'jurassic': 'atracciones/river-adventure.png',
  'pteranodon': 'atracciones/river-adventure.png',
  'raptor': 'atracciones/velocicoaster.jpg',
  // Seuss Landing (Islands of Adventure)
  'seuss': 'atracciones/cat-in-the-hat.png',
  'fish': 'atracciones/cat-in-the-hat.png',
  'zoo': 'atracciones/cat-in-the-hat.png',
  'trolley': 'atracciones/cat-in-the-hat.png',
  // Marvel (Islands of Adventure)
  'storm force': 'atracciones/hulk.jpg',
  // Popeye / Toon Lagoon
  'olive': 'atracciones/popeye.jpg',
  'me ship': 'atracciones/popeye.jpg',
  // Nueva York / Springfield (Universal Studios)
  'jimmy fallon': 'atracciones/rockit.jpg',
  'race through new york': 'atracciones/rockit.jpg',
  'kang': 'atracciones/simpsons.jpg',
  'kodos': 'atracciones/simpsons.jpg',
  // Trolls (colorido infantil)
  'troll': 'atracciones/minion.jpg',
}

export function infoAtraccion(nombre) {
  const n = (nombre || '').toLowerCase()
  const found = ATRACCIONES.find(a => a.k.some(key => n.includes(key))) || FALLBACK
  let img = null
  for (const [key, path] of Object.entries(FOTOS)) {
    if (n.includes(key)) { img = `/api/doc?path=${encodeURIComponent(path)}`; break }
  }
  return { ...found, img }
}
