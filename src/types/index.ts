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

// プレイヤー状態の型定義 - デジタル存在としての「プレイヤー」の本質
export interface PlayerState {
  displayName: string;
  score: number;
  progress: number;
  isComplete: boolean;
  lastActiveTime?: number;  // プレイヤーの「最後の存在証明」としてのタイムスタンプ
}

// ゲームセッション - 時間と空間の中で展開する「共有された現実」の形式
export interface GameSession {
  id: string;
  players: {
    [uid: string]: PlayerState
  };
  directionMap: DirectionMap;
  cars: Car[];
  startTime: number;
  endTime?: number;
  lastActiveTime?: number;  // セッション全体の「存在の痕跡」
  isActive: boolean;
  maxPlayers?: number;  // カスタムルーム用の最大プレイヤー数
  creatorId?: string;   // ルーム作成者のID
  gameType?: string;    // ゲームタイプ（singleplayer/multiplayerなど）
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
  // マルチプレイヤー用の追加フィールド
  isMultiplayer?: boolean;
  playerRank?: number;
  totalPlayers?: number;
}
