// ユーザー関連の型定義
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  isAnonymous: boolean;
  photoURL: string | null;
}

// 車種カテゴリの型定義
export type CarCategory = 
  | 'クロスカントリー'
  | 'SUV'
  | '軽自動車'
  | 'ミニバン'
  | 'ワンボックス'
  | 'コンパクト'
  | 'セダン'
  | 'ステーションワゴン'
  | 'クーペ';

// ゲームの方向とカテゴリのマッピング
export type DirectionMap = {
  [key in 'up' | 'down' | 'left' | 'right']: CarCategory;
};

// 車の情報
export interface Car {
  id: string;
  imageUrl: string;
  category: CarCategory;
}

// ゲームセッション
export interface GameSession {
  id: string;
  players: {
    [uid: string]: {
      displayName: string;
      score: number;
      progress: number;
      isComplete: boolean;
    }
  };
  directionMap: DirectionMap;
  cars: Car[];
  startTime: number;
  endTime?: number;
  isActive: boolean;
}

// ランキングエントリ
export interface RankingEntry {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  time: number;
  date: number;
}

// ゲーム結果
export interface GameResult {
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  timeInSeconds: number;
}
