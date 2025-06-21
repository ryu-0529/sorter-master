#!/usr/bin/env node

// 車種データベーステストスクリプト
// 新しい車種データベースシステムの動作確認を行います

const fs = require('fs');
const path = require('path');

console.log('🚗 車種データベーステストスクリプト');
console.log('=================================');

// carDatabase.ts ファイルの内容をシミュレート
const CAR_IMAGE_DATABASE = [
  // クロスカントリー (6枚)
  { id: 'crosscountry_001', fileName: 'car1.png', category: 'クロスカントリー' },
  { id: 'crosscountry_002', fileName: 'car10.png', category: 'クロスカントリー' },
  { id: 'crosscountry_003', fileName: 'car11.png', category: 'クロスカントリー' },
  { id: 'crosscountry_004', fileName: 'car12.png', category: 'クロスカントリー' },
  { id: 'crosscountry_005', fileName: 'car13.png', category: 'クロスカントリー' },
  { id: 'crosscountry_006', fileName: 'car14.png', category: 'クロスカントリー' },

  // SUV (6枚)
  { id: 'suv_001', fileName: 'car2.png', category: 'SUV' },
  { id: 'suv_002', fileName: 'car15.png', category: 'SUV' },
  { id: 'suv_003', fileName: 'car16.png', category: 'SUV' },
  { id: 'suv_004', fileName: 'car17.png', category: 'SUV' },
  { id: 'suv_005', fileName: 'car18.png', category: 'SUV' },
  { id: 'suv_006', fileName: 'car19.png', category: 'SUV' },

  // 軽自動車 (6枚)
  { id: 'kei_001', fileName: 'car3.png', category: '軽自動車' },
  { id: 'kei_002', fileName: 'car20.png', category: '軽自動車' },
  { id: 'kei_003', fileName: 'car21.png', category: '軽自動車' },
  { id: 'kei_004', fileName: 'car22.png', category: '軽自動車' },
  { id: 'kei_005', fileName: 'car23.png', category: '軽自動車' },
  { id: 'kei_006', fileName: 'car24.png', category: '軽自動車' },

  // ミニバン (6枚)
  { id: 'minivan_001', fileName: 'car4.png', category: 'ミニバン' },
  { id: 'minivan_002', fileName: 'car25.png', category: 'ミニバン' },
  { id: 'minivan_003', fileName: 'car26.png', category: 'ミニバン' },
  { id: 'minivan_004', fileName: 'car27.png', category: 'ミニバン' },
  { id: 'minivan_005', fileName: 'car28.png', category: 'ミニバン' },
  { id: 'minivan_006', fileName: 'car29.png', category: 'ミニバン' },

  // ワンボックス (6枚)
  { id: 'onebox_001', fileName: 'car5.png', category: 'ワンボックス' },
  { id: 'onebox_002', fileName: 'car30.png', category: 'ワンボックス' },
  { id: 'onebox_003', fileName: 'car31.png', category: 'ワンボックス' },
  { id: 'onebox_004', fileName: 'car32.png', category: 'ワンボックス' },
  { id: 'onebox_005', fileName: 'car33.png', category: 'ワンボックス' },
  { id: 'onebox_006', fileName: 'car34.png', category: 'ワンボックス' },

  // コンパクト (6枚)
  { id: 'compact_001', fileName: 'car6.png', category: 'コンパクト' },
  { id: 'compact_002', fileName: 'car35.png', category: 'コンパクト' },
  { id: 'compact_003', fileName: 'car36.png', category: 'コンパクト' },
  { id: 'compact_004', fileName: 'car37.png', category: 'コンパクト' },
  { id: 'compact_005', fileName: 'car38.png', category: 'コンパクト' },
  { id: 'compact_006', fileName: 'car39.png', category: 'コンパクト' },

  // セダン (6枚)
  { id: 'sedan_001', fileName: 'car7.png', category: 'セダン' },
  { id: 'sedan_002', fileName: 'car40.png', category: 'セダン' },
  { id: 'sedan_003', fileName: 'car41.png', category: 'セダン' },
  { id: 'sedan_004', fileName: 'car42.png', category: 'セダン' },
  { id: 'sedan_005', fileName: 'car43.png', category: 'セダン' },
  { id: 'sedan_006', fileName: 'car44.png', category: 'セダン' },

  // ステーションワゴン (5枚)
  { id: 'wagon_001', fileName: 'car8.png', category: 'ステーションワゴン' },
  { id: 'wagon_002', fileName: 'car45.png', category: 'ステーションワゴン' },
  { id: 'wagon_003', fileName: 'car46.png', category: 'ステーションワゴン' },
  { id: 'wagon_004', fileName: 'car47.png', category: 'ステーションワゴン' },
  { id: 'wagon_005', fileName: 'car48.png', category: 'ステーションワゴン' },

  // クーペ (5枚)
  { id: 'coupe_001', fileName: 'car9.png', category: 'クーペ' },
  { id: 'coupe_002', fileName: 'car49.png', category: 'クーペ' },
  { id: 'coupe_003', fileName: 'car50.png', category: 'クーペ' },
  { id: 'coupe_004', fileName: 'car51.png', category: 'クーペ' },
  { id: 'coupe_005', fileName: 'car52.png', category: 'クーペ' },
];

// カテゴリごとに画像を取得するヘルパー関数
const getImagesByCategory = (category) => {
  return CAR_IMAGE_DATABASE.filter(image => image.category === category);
};

// ランダムな画像を1枚選択するヘルパー関数
const getRandomImageByCategory = (category) => {
  const images = getImagesByCategory(category);
  if (images.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

// 指定された数の車を各カテゴリからランダムに選択してゲーム用カードを生成
const generateGameCards = (totalCards = 20) => {
  const cards = [];
  const categories = [
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

// 全車種の統計情報を取得
const getCarDatabaseStats = () => {
  const stats = {
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

// 画像ファイルの存在確認
const checkImageFiles = () => {
  const carsDir = path.join(__dirname, 'public', 'images', 'cars');
  const missingFiles = [];
  const existingFiles = [];

  CAR_IMAGE_DATABASE.forEach(image => {
    const filePath = path.join(carsDir, image.fileName);
    if (fs.existsSync(filePath)) {
      existingFiles.push(image.fileName);
    } else {
      missingFiles.push(image.fileName);
    }
  });

  return { existingFiles, missingFiles };
};

// テスト実行
console.log('\n📊 データベース統計情報:');
const stats = getCarDatabaseStats();
console.log(`   - 総画像数: ${stats.totalImages} 枚`);
console.log('   - カテゴリ別内訳:');
Object.entries(stats.categoryStats).forEach(([category, count]) => {
  console.log(`     * ${category}: ${count} 枚`);
});

console.log('\n📁 画像ファイル存在確認:');
const fileCheck = checkImageFiles();
console.log(`   - 存在するファイル: ${fileCheck.existingFiles.length} 枚`);
console.log(`   - 不足ファイル: ${fileCheck.missingFiles.length} 枚`);

if (fileCheck.missingFiles.length > 0) {
  console.log('   🚨 不足ファイル一覧:');
  fileCheck.missingFiles.forEach(file => {
    console.log(`     * ${file}`);
  });
}

console.log('\n🎮 ゲームカード生成テスト:');
const testCards = generateGameCards(10);
console.log(`   - 生成されたカード数: ${testCards.length} 枚`);
console.log('   - サンプルカード:');
testCards.slice(0, 5).forEach((card, index) => {
  console.log(`     ${index + 1}. ${card.category} - ${card.imageUrl}`);
});

console.log('\n🔍 各カテゴリからランダム選択テスト:');
const categories = ['クロスカントリー', 'SUV', '軽自動車', 'ミニバン', 'ワンボックス'];
categories.forEach(category => {
  const randomImage = getRandomImageByCategory(category);
  if (randomImage) {
    console.log(`   - ${category}: ${randomImage.fileName} (${randomImage.id})`);
  } else {
    console.log(`   - ${category}: ❌ 画像が見つかりません`);
  }
});

console.log('\n✨ 車種データベーステスト完了！');

if (fileCheck.missingFiles.length === 0) {
  console.log('🎉 すべての画像ファイルが正常に配置されています！');
} else {
  console.log('⚠️  一部の画像ファイルが不足しています。プレースホルダー画像を実際の車種画像に置き換えてください。');
}
