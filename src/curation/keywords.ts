export interface KeywordEntry {
  term: string
  region: "IDN" | "PNG" | "BOTH"
  weight: number
}

export const PAPUA_KEYWORDS: KeywordEntry[] = [
  // Wilayah utama
  { term: "Papua", region: "BOTH", weight: 1 },
  { term: "West Papua", region: "IDN", weight: 2 },
  { term: "Papua Barat", region: "IDN", weight: 2 },
  { term: "Papua Pegunungan", region: "IDN", weight: 2 },
  { term: "Papua Selatan", region: "IDN", weight: 2 },
  { term: "Papua Tengah", region: "IDN", weight: 2 },
  { term: "Papua New Guinea", region: "PNG", weight: 1 },
  { term: "PNG", region: "PNG", weight: 1 },

  // Kota & kabupaten
  { term: "Jayapura", region: "IDN", weight: 2 },
  { term: "Merauke", region: "IDN", weight: 2 },
  { term: "Sorong", region: "IDN", weight: 2 },
  { term: "Manokwari", region: "IDN", weight: 2 },
  { term: "Timika", region: "IDN", weight: 2 },
  { term: "Biak", region: "IDN", weight: 2 },
  { term: "Nabire", region: "IDN", weight: 2 },
  { term: "Wamena", region: "IDN", weight: 2 },
  { term: "Fakfak", region: "IDN", weight: 2 },
  { term: "Kaimana", region: "IDN", weight: 2 },
  { term: "Serui", region: "IDN", weight: 2 },
  { term: "Ransiki", region: "IDN", weight: 2 },
  { term: "Port Numbay", region: "IDN", weight: 2 },
  { term: "Port Moresby", region: "PNG", weight: 2 },
  { term: "Lae", region: "PNG", weight: 1 },

  // Suku & budaya
  { term: "Dani", region: "IDN", weight: 1 },
  { term: "Asmat", region: "IDN", weight: 2 },
  { term: "Mee", region: "IDN", weight: 1 },
  { term: "Biak Numfor", region: "IDN", weight: 2 },
  { term: "Korowai", region: "IDN", weight: 2 },
  { term: "Kamoro", region: "IDN", weight: 2 },
  { term: "Pegunungan Tengah", region: "IDN", weight: 2 },
  { term: "orang asli Papua", region: "IDN", weight: 2 },
  { term: "Melanesia", region: "BOTH", weight: 1 },

  // Isu & organisasi
  { term: "OPM", region: "IDN", weight: 2 },
  { term: "TPNPB", region: "IDN", weight: 2 },
  { term: "KKB", region: "IDN", weight: 2 },
  { term: "otsus Papua", region: "IDN", weight: 2 },
  { term: "otonomi khusus Papua", region: "IDN", weight: 2 },
  { term: "Freeport", region: "IDN", weight: 1 },
  { term: "Grasberg", region: "IDN", weight: 2 },
  { term: "Nemangkawi", region: "IDN", weight: 2 },
  { term: "Papua merdeka", region: "IDN", weight: 2 },
  { term: "self-determination Papua", region: "IDN", weight: 2 },
  { term: "Papuan independence", region: "IDN", weight: 2 },
  { term: "human rights Papua", region: "IDN", weight: 2 },
  { term: "hak asasi Papua", region: "IDN", weight: 2 },
  { term: "konflik Papua", region: "IDN", weight: 2 },
  { term: "Papua conflict", region: "IDN", weight: 2 },
  { term: "militer Papua", region: "IDN", weight: 2 },
  { term: "operasi militer Papua", region: "IDN", weight: 2 },
  { term: "deforestation Papua", region: "BOTH", weight: 1 },
  { term: "deforestasi Papua", region: "IDN", weight: 2 },
  { term: "hutan Papua", region: "IDN", weight: 2 },
  { term: "Papua forest", region: "BOTH", weight: 1 },

  // Geografis
  { term: "Cenderawasih", region: "IDN", weight: 2 },
  { term: "Teluk Cenderawasih", region: "IDN", weight: 2 },
  { term: "Bird of Paradise", region: "BOTH", weight: 1 },
  { term: "Cenderawasih Bay", region: "IDN", weight: 2 },
  { term: "Raja Ampat", region: "IDN", weight: 2 },
  { term: "Puncak Jaya", region: "IDN", weight: 2 },
  { term: "Lorentz", region: "IDN", weight: 2 }
]

export const KEYWORD_TERMS = PAPUA_KEYWORDS.map((k) => k.term)
