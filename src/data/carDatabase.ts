import { Car, CarCategory } from '../types';

// 車種ごとの画像データベース
export interface CarImageData {
  id: string;           // 画像の一意ID (例: "crosscountry_001")
  fileName: string;     // ファイル名 (例: "car1.png")
  category: CarCategory;
  displayName?: string; // 表示用の名前 (オプション)
}

// 各車種ごとの画像リスト
export const CAR_IMAGE_DATABASE: CarImageData[] = [
  // クロスカントリー (6枚)
  { id: 'crosscountry_001', fileName: 'crosscountry1.png', category: 'クロスカントリー' },
  { id: 'crosscountry_002', fileName: 'crosscountry2.png', category: 'クロスカントリー' },
  { id: 'crosscountry_003', fileName: 'crosscountry3.png', category: 'クロスカントリー' },
  { id: 'crosscountry_004', fileName: 'crosscountry4.png', category: 'クロスカントリー' },
  { id: 'crosscountry_005', fileName: 'crosscountry5.png', category: 'クロスカントリー' },
  { id: 'crosscountry_006', fileName: 'crosscountry6.png', category: 'クロスカントリー' },

  // SUV (6枚)
  { id: 'suv_001', fileName: 'suv1.png', category: 'SUV' },
  { id: 'suv_002', fileName: 'suv2.png', category: 'SUV' },
  { id: 'suv_003', fileName: 'suv3.png', category: 'SUV' },
  { id: 'suv_004', fileName: 'suv4.png', category: 'SUV' },
  { id: 'suv_005', fileName: 'suv5.png', category: 'SUV' },
  { id: 'suv_006', fileName: 'suv6.png', category: 'SUV' },

  // 軽自動車 (6枚)
  { id: 'kei_001', fileName: 'kei1.png', category: '軽自動車' },
  { id: 'kei_002', fileName: 'kei2.png', category: '軽自動車' },
  { id: 'kei_003', fileName: 'kei3.png', category: '軽自動車' },
  { id: 'kei_004', fileName: 'kei4.png', category: '軽自動車' },
  { id: 'kei_005', fileName: 'kei5.png', category: '軽自動車' },
  { id: 'kei_006', fileName: 'kei6.png', category: '軽自動車' },

  // ミニバン (6枚)
  { id: 'minivan_001', fileName: 'minivan1.png', category: 'ミニバン' },
  { id: 'minivan_002', fileName: 'minivan2.png', category: 'ミニバン' },
  { id: 'minivan_003', fileName: 'minivan3.png', category: 'ミニバン' },
  { id: 'minivan_004', fileName: 'minivan4.png', category: 'ミニバン' },
  { id: 'minivan_005', fileName: 'minivan5.png', category: 'ミニバン' },
  { id: 'minivan_006', fileName: 'minivan6.png', category: 'ミニバン' },

  // ワンボックス (6枚)
  { id: 'onebox_001', fileName: 'onebox1.png', category: 'ワンボックス' },
  { id: 'onebox_002', fileName: 'onebox2.png', category: 'ワンボックス' },
  { id: 'onebox_003', fileName: 'onebox3.png', category: 'ワンボックス' },
  { id: 'onebox_004', fileName: 'onebox4.png', category: 'ワンボックス' },
  { id: 'onebox_005', fileName: 'onebox5.png', category: 'ワンボックス' },
  { id: 'onebox_006', fileName: 'onebox6.png', category: 'ワンボックス' },

  // コンパクト (6枚)
  { id: 'compact_001', fileName: 'compact1.png', category: 'コンパクト' },
  { id: 'compact_002', fileName: 'compact2.png', category: 'コンパクト' },
  { id: 'compact_003', fileName: 'compact3.png', category: 'コンパクト' },
  { id: 'compact_004', fileName: 'compact4.png', category: 'コンパクト' },
  { id: 'compact_005', fileName: 'compact5.png', category: 'コンパクト' },
  { id: 'compact_006', fileName: 'compact6.png', category: 'コンパクト' },

  // セダン (6枚)
  { id: 'sedan_001', fileName: 'sedan1.png', category: 'セダン' },
  { id: 'sedan_002', fileName: 'sedan2.png', category: 'セダン' },
  { id: 'sedan_003', fileName: 'sedan3.png', category: 'セダン' },
  { id: 'sedan_004', fileName: 'sedan4.png', category: 'セダン' },
  { id: 'sedan_005', fileName: 'sedan5.png', category: 'セダン' },
  { id: 'sedan_006', fileName: 'sedan6.png', category: 'セダン' },

  // ステーションワゴン (5枚)
  { id: 'wagon_001', fileName: 'wagon1.png', category: 'ステーションワゴン' },
  { id: 'wagon_002', fileName: 'wagon2.png', category: 'ステーションワゴン' },
  { id: 'wagon_003', fileName: 'wagon3.png', category: 'ステーションワゴン' },
  { id: 'wagon_004', fileName: 'wagon4.png', category: 'ステーションワゴン' },
  { id: 'wagon_005', fileName: 'wagon5.png', category: 'ステーションワゴン' },
  { id: 'wagon_006', fileName: 'wagon6.png', category: 'ステーションワゴン' },

  // クーペ (5枚)
  { id: 'coupe_001', fileName: 'coupe1.png', category: 'クーペ' },
  { id: 'coupe_002', fileName: 'coupe2.png', category: 'クーペ' },
  { id: 'coupe_003', fileName: 'coupe3.png', category: 'クーペ' },
  { id: 'coupe_004', fileName: 'coupe4.png', category: 'クーペ' },
  { id: 'coupe_005', fileName: 'coupe5.png', category: 'クーペ' },
  { id: 'coupe_006', fileName: 'coupe6.png', category: 'クーペ' },
];

// カテゴリごとに画像を取得するヘルパー関数
export const getImagesByCategory = (category: CarCategory): CarImageData[] => {
  return CAR_IMAGE_DATABASE.filter(image => image.category === category);
};

// ランダムな画像を1枚選択するヘルパー関数
export const getRandomImageByCategory = (category: CarCategory): CarImageData | null => {
  const images = getImagesByCategory(category);
  if (images.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

// 指定された数の車を各カテゴリからランダムに選択してゲーム用カードを生成
export const generateGameCards = (totalCards: number = 20): Car[] => {
  const cards: Car[] = [];
  const categories: CarCategory[] = [
    'クロスカントリー',
    'SUV',
    '軽自動車',
    'ミニバン',
    'ワンボックス',
    'コンパクト',
    'セダン',
    'ステーションワゴン',
    'クーペ'
  ];

  for (let i = 0; i < totalCards; i++) {
    // ランダムにカテゴリを選択
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // そのカテゴリからランダムに画像を選択
    const randomImage = getRandomImageByCategory(randomCategory);
    
    if (randomImage) {
      cards.push({
        id: `${randomImage.id}_${Date.now()}_${i}`, // 一意のIDを生成
        imageUrl: `/images/cars/${randomImage.fileName}`,
        category: randomImage.category
      });
    }
  }

  return cards;
};

// 特定のカテゴリからランダムに車を生成（デバッグ用）
export const generateCarFromCategory = (category: CarCategory): Car | null => {
  const randomImage = getRandomImageByCategory(category);
  
  if (!randomImage) return null;
  
  return {
    id: `${randomImage.id}_${Date.now()}`,
    imageUrl: `/images/cars/${randomImage.fileName}`,
    category: randomImage.category
  };
};

// 全車種の統計情報を取得
export const getCarDatabaseStats = () => {
  const stats: Record<CarCategory, number> = {
    'クロスカントリー': 0,
    'SUV': 0,
    '軽自動車': 0,
    'ミニバン': 0,
    'ワンボックス': 0,
    'コンパクト': 0,
    'セダン': 0,
    'ステーションワゴン': 0,
    'クーペ': 0
  };

  CAR_IMAGE_DATABASE.forEach(image => {
    stats[image.category]++;
  });

  return {
    totalImages: CAR_IMAGE_DATABASE.length,
    categoryStats: stats
  };
};
