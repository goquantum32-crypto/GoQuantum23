
export const MOZ_ROUTES = [
  'MAPUTO', 'MACIA', 'XAI-XAI', 'CHÓKWÈ', 'CHIBUTO', 'MANJACAZE', 
  'ZAVALA', 'INHARRIME', 'MAXIXE', 'HOMOÍNE', 'PANDA', 'MASSINGA', 'VILANCULOS'
];

const PRICE_TABLE: Record<string, Record<string, number>> = {
  'MAPUTO': {
    'MACIA': 300, 'XAI-XAI': 500, 'CHÓKWÈ': 600, 'CHIBUTO': 650, 'MANJACAZE': 700,
    'ZAVALA': 750, 'INHARRIME': 800, 'MAXIXE': 900, 'HOMOÍNE': 950, 'PANDA': 1000,
    'MASSINGA': 1100, 'VILANCULOS': 1200
  },
  'VILANCULOS': {
    'MASSINGA': 1100, 'PANDA': 1000, 'HOMOÍNE': 950, 'MAXIXE': 900, 'INHARRIME': 800,
    'ZAVALA': 750, 'MANJACAZE': 700, 'CHIBUTO': 650, 'CHÓKWÈ': 600, 'XAI-XAI': 500,
    'MACIA': 300, 'MAPUTO': 1200
  }
};

export const calculatePrice = (origin: string, destination: string): number | null => {
  if (PRICE_TABLE[origin] && PRICE_TABLE[origin][destination]) {
    return PRICE_TABLE[origin][destination];
  }
  // Se for uma rota intermediária não listada explicitamente, calcula proporcional
  const oIdx = MOZ_ROUTES.indexOf(origin);
  const dIdx = MOZ_ROUTES.indexOf(destination);
  if (oIdx === -1 || dIdx === -1) return null;
  const diff = Math.abs(dIdx - oIdx);
  return 300 + (diff * 75); 
};
