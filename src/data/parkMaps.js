// Coordenadas de atracciones por parque, para el mapa de cada parque.
// USF (65) e IOA (64): coordenadas reales (OpenStreetMap).
// Epic Universe (334): aproximadas según el layout del parque (aún no está en OSM).
// Cada item: { k: palabra clave para matchear el nombre de queue-times, lat, lng }

export const PARK_CENTERS = {
  65:  { lat: 28.4775, lng: -81.4685, zoom: 16, aprox: false }, // Universal Studios Florida
  64:  { lat: 28.4715, lng: -81.4715, zoom: 16, aprox: false }, // Islands of Adventure
  334: { lat: 28.4528, lng: -81.4428, zoom: 16, aprox: true },  // Epic Universe (aprox)
}

export const PARK_RIDES = {
  // ── Universal Studios Florida ──
  65: [
    { k: 'minion mayhem', lat: 28.4753, lng: -81.4682 },
    { k: 'villain-con', lat: 28.4756, lng: -81.4679 },
    { k: 'jimmy fallon', lat: 28.4757, lng: -81.4695 },
    { k: 'race through new york', lat: 28.4757, lng: -81.4695 },
    { k: 'mummy', lat: 28.4769, lng: -81.4700 },
    { k: 'gringotts', lat: 28.4802, lng: -81.4700 },
    { k: 'men in black', lat: 28.4809, lng: -81.4676 },
    { k: 'simpsons', lat: 28.4795, lng: -81.4675 },
    { k: 'kang', lat: 28.4793, lng: -81.4680 },
    { k: 'e.t.', lat: 28.4776, lng: -81.4666 },
    { k: 'transformers', lat: 28.4764, lng: -81.4684 },
    { k: 'fast & furious', lat: 28.4784, lng: -81.4701 },
    { k: 'bourne', lat: 28.4760, lng: -81.4669 },
    { k: 'hogwarts', lat: 28.4805, lng: -81.4690 },
    { k: 'ollivander', lat: 28.4800, lng: -81.4698 },
    { k: 'troll', lat: 28.4750, lng: -81.4672 },
  ],
  // ── Islands of Adventure ──
  64: [
    { k: 'hulk', lat: 28.4715, lng: -81.4688 },
    { k: 'hagrid', lat: 28.4734, lng: -81.4735 },
    { k: 'raptor', lat: 28.4709, lng: -81.4735 },
    { k: 'pteranodon', lat: 28.4704, lng: -81.4726 },
    { k: 'river adventure', lat: 28.4703, lng: -81.4738 },
    { k: 'jurassic', lat: 28.4716, lng: -81.4727 },
    { k: 'hippogriff', lat: 28.4725, lng: -81.4738 },
    { k: 'forbidden journey', lat: 28.4718, lng: -81.4740 },
    { k: 'velocicoaster', lat: 28.4711, lng: -81.4725 },
    { k: 'kong', lat: 28.4691, lng: -81.4731 },
    { k: 'storm force', lat: 28.4709, lng: -81.4688 },
    { k: 'doom', lat: 28.4705, lng: -81.4693 },
    { k: 'spider-man', lat: 28.4701, lng: -81.4697 },
    { k: 'popeye', lat: 28.4706, lng: -81.4717 },
    { k: 'ripsaw', lat: 28.4692, lng: -81.4718 },
    { k: 'cat in the hat', lat: 28.4729, lng: -81.4690 },
    { k: 'caro-seuss', lat: 28.4729, lng: -81.4697 },
    { k: 'one fish', lat: 28.4732, lng: -81.4693 },
    { k: 'trolley', lat: 28.4732, lng: -81.4703 },
    { k: 'zoo', lat: 28.4731, lng: -81.4700 },
    { k: 'olive', lat: 28.4706, lng: -81.4717 },
    { k: 'me ship', lat: 28.4706, lng: -81.4717 },
    { k: 'ollivander', lat: 28.4720, lng: -81.4738 },
    { k: 'hogwarts', lat: 28.4716, lng: -81.4737 },
  ],
  // ── Epic Universe (aproximadas, layout por mundos) ──
  334: [
    // Celestial Park (centro)
    { k: 'stardust', lat: 28.4533, lng: -81.4429 },
    { k: 'constellation', lat: 28.4529, lng: -81.4424 },
    // Super Nintendo World (NO)
    { k: 'mine-cart', lat: 28.4547, lng: -81.4440 },
    { k: 'mario kart', lat: 28.4548, lng: -81.4438 },
    { k: 'yoshi', lat: 28.4545, lng: -81.4437 },
    { k: 'bowser', lat: 28.4544, lng: -81.4435 },
    // Dark Universe (NE)
    { k: 'monsters unchained', lat: 28.4547, lng: -81.4417 },
    { k: 'frankenstein', lat: 28.4547, lng: -81.4417 },
    { k: 'werewolf', lat: 28.4544, lng: -81.4414 },
    // Isle of Berk · dragones (SO)
    { k: 'hiccup', lat: 28.4513, lng: -81.4438 },
    { k: 'dragon', lat: 28.4511, lng: -81.4435 },
    { k: 'fyre', lat: 28.4515, lng: -81.4440 },
    { k: 'toothless', lat: 28.4513, lng: -81.4436 },
    // Ministry of Magic (SE)
    { k: 'ministry', lat: 28.4513, lng: -81.4414 },
    { k: 'potter', lat: 28.4513, lng: -81.4414 },
  ],
}

// Devuelve {lat,lng} para un nombre de atracción dentro de un parque, o null
export function rideCoord(parkId, name) {
  const list = PARK_RIDES[parkId] || []
  const n = (name || '').toLowerCase()
  const hit = list.find(r => n.includes(r.k))
  return hit ? { lat: hit.lat, lng: hit.lng } : null
}
