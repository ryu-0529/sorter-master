import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ref, onValue, set, update, push, get } from 'firebase/database';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { database, firestore } from '../services/firebase';
import { useAuth } from './AuthContext';
import { 
  Car, 
  CarCategory, 
  DirectionMap, 
  GameSession, 
  GameResult, 
  RankingEntry 
} from '../types';

// ゲームのカテゴリ
const CAR_CATEGORIES: CarCategory[] = [
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

// ダミーの車データ (実際のアプリでは画像URLを適切に設定)
const DUMMY_CARS: Car[] = [
  { id: '1', imageUrl: '/images/car1.jpg', category: 'セダン' },
  { id: '2', imageUrl: '/images/car2.jpg', category: 'SUV' },
  { id: '3', imageUrl: '/images/car3.jpg', category: 'コンパクト' },
  { id: '4', imageUrl: '/images/car4.jpg', category: '軽自動車' },
  { id: '5', imageUrl: '/images/car5.jpg', category: 'ミニバン' },
  { id: '6', imageUrl: '/images/car6.jpg', category: 'クロスカントリー' },
  { id: '7', imageUrl: '/images/car7.jpg', category: 'ワンボックス' },
  { id: '8', imageUrl: '/images/car8.jpg', category: 'ステーションワゴン' },
  { id: '9', imageUrl: '/images/car9.jpg', category: 'クーペ' },
  { id: '10', imageUrl: '/images/car10.jpg', category: 'セダン' }
];

interface GameContextProps {
  // ゲームの状態
  currentGame: GameSession | null;
  cars: Car[];
  currentCarIndex: number;
  score: number;
  isGameActive: boolean;
  gameResult: GameResult | null;
  rankings: RankingEntry[];
  
  // ゲーム管理関数
  startSinglePlayerGame: () => void;
  joinMultiplayerGame: () => Promise<void>;
  createMultiplayerGame: () => Promise<string>;
  leaveGame: () => void;
  handleSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void;
  submitScore: (result: GameResult) => Promise<void>;
  fetchRankings: () => Promise<void>;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // ゲーム状態
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [currentCarIndex, setCurrentCarIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);

  // ランダムな方向とカテゴリのマッピングを作成
  const generateDirectionMap = (): DirectionMap => {
    const shuffledCategories = [...CAR_CATEGORIES].sort(() => Math.random() - 0.5).slice(0, 4);
    
    return {
      up: shuffledCategories[0],
      right: shuffledCategories[1],
      down: shuffledCategories[2],
      left: shuffledCategories[3]
    };
  };

  // ゲームカードの準備 (実際のアプリではサーバーから取得)
  const prepareGameCards = (count: number = 20): Car[] => {
    // 実際のアプリでは、サーバーから車の画像と正しいカテゴリを取得
    // 今回はダミーデータを使用
    return Array(count).fill(0).map((_, index) => {
      const randomCar = DUMMY_CARS[Math.floor(Math.random() * DUMMY_CARS.length)];
      return {
        ...randomCar,
        id: uuidv4() // 一意のIDを生成
      };
    });
  };

  // シングルプレイヤーゲーム開始
  const startSinglePlayerGame = () => {
    if (!currentUser) return;

    const gameCards = prepareGameCards();
    const directionMap = generateDirectionMap();
    
    const newGame: GameSession = {
      id: uuidv4(),
      players: {
        [currentUser.uid]: {
          displayName: currentUser.displayName || `Guest-${currentUser.uid.substring(0, 5)}`,
          score: 0,
          progress: 0,
          isComplete: false
        }
      },
      directionMap,
      cars: gameCards,
      startTime: Date.now(),
      isActive: true
    };
    
    setCurrentGame(newGame);
    setCars(gameCards);
    setCurrentCarIndex(0);
    setScore(0);
    setIsGameActive(true);
    setGameResult(null);
  };

  // マルチプレイヤーゲーム作成
  const createMultiplayerGame = async (): Promise<string> => {
    if (!currentUser) throw new Error('ユーザーがログインしていません');
    
    const gameCards = prepareGameCards();
    const directionMap = generateDirectionMap();
    
    const newGameRef = push(ref(database, 'game_sessions'));
    const gameId = newGameRef.key as string;
    
    const newGame: GameSession = {
      id: gameId,
      players: {
        [currentUser.uid]: {
          displayName: currentUser.displayName || `Guest-${currentUser.uid.substring(0, 5)}`,
          score: 0,
          progress: 0,
          isComplete: false
        }
      },
      directionMap,
      cars: gameCards,
      startTime: Date.now(),
      isActive: true
    };
    
    await set(newGameRef, newGame);
    
    // マッチメイキングキューに追加
    const matchmakingRef = ref(database, `matchmaking/${gameId}`);
    await set(matchmakingRef, {
      creatorId: currentUser.uid,
      playerCount: 1,
      created: Date.now(),
      status: 'waiting'
    });
    
    return gameId;
  };

  // マルチプレイヤーゲーム参加
  const joinMultiplayerGame = async () => {
    if (!currentUser) return;
    
    // 参加可能なゲームを検索
    const matchmakingRef = ref(database, 'matchmaking');
    const snapshot = await get(matchmakingRef);
    
    if (!snapshot.exists()) {
      // ゲームがなければ新しいゲームを作成
      await createMultiplayerGame();
      return;
    }
    
    const matchmaking = snapshot.val();
    // 待機中のゲームを探す
    const waitingGames = Object.entries(matchmaking)
      .filter(([_, game]: [string, any]) => 
        game.status === 'waiting' && 
        game.playerCount < 4 && 
        game.creatorId !== currentUser.uid
      )
      .sort((a, b) => a[1].created - b[1].created);
    
    if (waitingGames.length === 0) {
      // 待機中のゲームがなければ新しいゲームを作成
      await createMultiplayerGame();
      return;
    }
    
    // 最も古い待機中のゲームに参加
    const [gameId, game] = waitingGames[0];
    
    // ゲーム参加処理
    const gameRef = ref(database, `game_sessions/${gameId}`);
    const gameSnapshot = await get(gameRef);
    
    if (!gameSnapshot.exists()) {
      throw new Error('ゲームが見つかりません');
    }
    
    const gameData = gameSnapshot.val();
    
    // プレイヤー情報を更新
    const updatedPlayers = {
      ...gameData.players,
      [currentUser.uid]: {
        displayName: currentUser.displayName || `Guest-${currentUser.uid.substring(0, 5)}`,
        score: 0,
        progress: 0,
        isComplete: false
      }
    };
    
    // ゲーム情報を更新
    await update(gameRef, {
      players: updatedPlayers
    });
    
    // マッチメイキング情報を更新
    await update(ref(database, `matchmaking/${gameId}`), {
      playerCount: Object.keys(updatedPlayers).length
    });
    
    if (Object.keys(updatedPlayers).length >= 4) {
      // プレイヤーが4人になったらゲーム開始
      await update(ref(database, `matchmaking/${gameId}`), {
        status: 'starting'
      });
    }
  };

  // ゲーム退出
  const leaveGame = () => {
    if (!currentUser || !currentGame) return;
    
    if (currentGame.id !== uuidv4()) {
      // マルチプレイヤーゲームの場合
      const gameRef = ref(database, `game_sessions/${currentGame.id}`);
      const playersRef = ref(database, `game_sessions/${currentGame.id}/players/${currentUser.uid}`);
      
      // プレイヤー情報を削除
      update(playersRef, {
        isComplete: true
      });
      
      // すべてのプレイヤーが完了したらゲームを終了
      get(gameRef).then((snapshot) => {
        if (snapshot.exists()) {
          const game = snapshot.val();
          const allComplete = Object.values(game.players).every((player: any) => player.isComplete);
          
          if (allComplete) {
            update(gameRef, {
              isActive: false,
              endTime: Date.now()
            });
          }
        }
      });
    }
    
    setCurrentGame(null);
    setCars([]);
    setCurrentCarIndex(0);
    setScore(0);
    setIsGameActive(false);
  };

  // スワイプ処理
  const handleSwipe = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isGameActive || !currentGame || currentCarIndex >= cars.length) return;
    
    const currentCar = cars[currentCarIndex];
    const expectedCategory = currentGame.directionMap[direction];
    const isCorrect = currentCar.category === expectedCategory;
    
    // スコア更新
    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);
    
    // 次のカードへ
    const nextIndex = currentCarIndex + 1;
    setCurrentCarIndex(nextIndex);
    
    // ゲーム進捗更新
    if (currentUser && currentGame.id !== uuidv4()) {
      // マルチプレイヤーゲームの場合はFirebaseを更新
      const progress = Math.floor((nextIndex / cars.length) * 100);
      
      update(ref(database, `game_sessions/${currentGame.id}/players/${currentUser.uid}`), {
        score: newScore,
        progress
      });
    }
    
    // ゲーム終了チェック
    if (nextIndex >= cars.length) {
      const endTime = Date.now();
      const timeInSeconds = Math.floor((endTime - currentGame.startTime) / 1000);
      
      const result: GameResult = {
        score: newScore,
        correctAnswers: newScore,
        totalAnswers: cars.length,
        timeInSeconds
      };
      
      setGameResult(result);
      setIsGameActive(false);
      
      if (currentUser && currentGame.id !== uuidv4()) {
        // マルチプレイヤーゲームの場合
        update(ref(database, `game_sessions/${currentGame.id}/players/${currentUser.uid}`), {
          isComplete: true
        });
      }
    }
  };

  // スコア送信
  const submitScore = async (result: GameResult) => {
    if (!currentUser) return;
    
    const rankingEntry: RankingEntry = {
      id: uuidv4(),
      userId: currentUser.uid,
      displayName: currentUser.displayName || `Guest-${currentUser.uid.substring(0, 5)}`,
      score: result.score,
      time: result.timeInSeconds,
      date: Date.now()
    };
    
    await addDoc(collection(firestore, 'rankings'), rankingEntry);
    await fetchRankings();
  };

  // ランキング取得
  const fetchRankings = async () => {
    const rankingsQuery = query(
      collection(firestore, 'rankings'),
      orderBy('score', 'desc'),
      orderBy('time', 'asc'),
      limit(100)
    );
    
    const querySnapshot = await getDocs(rankingsQuery);
    const rankingsList: RankingEntry[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data() as RankingEntry;
      rankingsList.push({
        ...data,
        id: doc.id
      });
    });
    
    setRankings(rankingsList);
  };

  // マルチプレイヤーゲームのリアルタイム更新を監視
  useEffect(() => {
    if (!currentUser || !currentGame || currentGame.id === uuidv4()) return;
    
    const gameRef = ref(database, `game_sessions/${currentGame.id}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val();
        setCurrentGame(gameData);
        
        if (!gameData.isActive) {
          setIsGameActive(false);
        }
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, currentGame]);

  // 初期ランキング取得
  useEffect(() => {
    fetchRankings();
  }, []);

  const value = {
    currentGame,
    cars,
    currentCarIndex,
    score,
    isGameActive,
    gameResult,
    rankings,
    
    startSinglePlayerGame,
    joinMultiplayerGame,
    createMultiplayerGame,
    leaveGame,
    handleSwipe,
    submitScore,
    fetchRankings
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
