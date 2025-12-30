export interface Prize {
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Super Rare' | 'Ultra Rare';
  color: string;
  type: string;
}

export interface GachaItemConfig {
  id: number;
  name: string;
  count: number;
}
