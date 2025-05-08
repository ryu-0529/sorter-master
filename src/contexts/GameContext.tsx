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
  { id: '1', imageUrl: '/images/cars/car1.png', category: 'クロスカントリー' },
  { id: '2', imageUrl: '/images/cars/car2.png', category: 'SUV' },
  { id: '3', imageUrl: '/images/cars/car3.png', category: '軽自動車' },
  { id: '4', imageUrl: '/images/cars/car4.png', category: 'ミニバン' },
  { id: '5', imageUrl: '/images/cars/car5.png', category: 'ワンボックス' },
  { id: '6', imageUrl: '/images/cars/car6.png', category: 'コンパクト' },
  { id: '7', imageUrl: '/images/cars/car7.png', category: 'セダン' },
  { id: '8', imageUrl: '/images/cars/car8.png', category: 'ステーションワゴン' },
  { id: '9', imageUrl: '/images/cars/car9.png', category: 'クーペ' }
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
  const generateDirectionMap = (gameCars: Car[] = []): DirectionMap => {
    // 現在のゲームで使用されている車のカテゴリを取得
    const usedCategories = new Set(gameCars.map(car => car.category));
    
    // ランダムにカテゴリを選択するが、必ず使用されているカテゴリを含める
    let availableCategories = [...CAR_CATEGORIES];
    let selectedCategories: CarCategory[] = [];
    
    // 使用されているカテゴリを優先的に選択
    usedCategories.forEach(category => {
      selectedCategories.push(category);
      availableCategories = availableCategories.filter(c => c !== category);
    });
    
    // 残りのスロットをランダムなカテゴリで埋める
    if (selectedCategories.length < 4) {
      const remainingCategories = availableCategories
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 - selectedCategories.length);
      
      selectedCategories = [...selectedCategories, ...remainingCategories];
    }
    
    // 4つしか表示できない場合は、ランダムに選ぶが、使用されているカテゴリが必ず含まれるようにする
    if (selectedCategories.length > 4) {
      // 使用カテゴリから必要な数だけランダムに選択
      const randomUsedCategories = Array.from(usedCategories)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
      selectedCategories = randomUsedCategories;
    }
    
    // 最終的に選択されたカテゴリをシャッフル
    selectedCategories = selectedCategories.sort(() => Math.random() - 0.5);
    
    return {
      up: selectedCategories[0],
      right: selectedCategories[1],
      down: selectedCategories[2],
      left: selectedCategories[3]
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

    // ゲームカードを準備
    const gameCards = prepareGameCards();
    
    // 重要: 最初のカードのカテゴリを必ず含むマッピングを生成
    // これによりゲーム開始時から必ず正解可能な選択肢が含まれる
    const firstCard = gameCards[0];
    console.log('最初のカード:', firstCard); // デバッグ用
    
    // 最初のカードのカテゴリを必ず含むマッピングを生成
    const initialDirectionMap = generateShuffledMap(firstCard.category);
    console.log('初期マッピング:', initialDirectionMap); // デバッグ用
    
    // マッピングが正しく生成されているか確認
    const categoryInMap = Object.values(initialDirectionMap).includes(firstCard.category);
    console.log('カテゴリがマップに含まれているか:', categoryInMap); // デバッグ用
    
    // もし最初のカードのカテゴリがマップに含まれていない場合は再生成
    let finalDirectionMap = initialDirectionMap;
    if (!categoryInMap) {
      console.log('カテゴリがマップに含まれていないため再生成します');
      finalDirectionMap = generateShuffledMap(firstCard.category);
      console.log('再生成したマップ:', finalDirectionMap);
    }
    
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
      directionMap: finalDirectionMap, // 修正: 確認済みのマッピングを使用
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
    
    // ゲームカードを準備
    const gameCards = prepareGameCards();
    
    // 重要: 最初のカードのカテゴリを必ず含むマッピングを生成
    const firstCard = gameCards[0];
    console.log('マルチプレイヤー - 最初のカード:', firstCard); // デバッグ用
    
    // 最初のカードのカテゴリを必ず含むマッピングを生成
    const initialDirectionMap = generateShuffledMap(firstCard.category);
    console.log('マルチプレイヤー - 初期マッピング:', initialDirectionMap); // デバッグ用
    
    // マッピングが正しく生成されているか確認
    const categoryInMap = Object.values(initialDirectionMap).includes(firstCard.category);
    console.log('マルチプレイヤー - カテゴリがマップに含まれているか:', categoryInMap); // デバッグ用
    
    // もし最初のカードのカテゴリがマップに含まれていない場合は再生成
    let finalDirectionMap = initialDirectionMap;
    if (!categoryInMap) {
      console.log('マルチプレイヤー - カテゴリがマップに含まれていないため再生成します');
      finalDirectionMap = generateShuffledMap(firstCard.category);
      console.log('マルチプレイヤー - 再生成したマップ:', finalDirectionMap);
    }
    
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
      directionMap: finalDirectionMap, // 修正: 確認済みのマッピングを使用
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
    // マッチメイキングデータにインターフェイスを定義して型安全性を確保
    interface MatchmakingGame {
      status: string;
      playerCount: number;
      creatorId: string;
      created: number;
    }
    
    const waitingGames = Object.entries(matchmaking)
      .filter(([_, game]) => {
        const typedGame = game as MatchmakingGame;
        return typedGame.status === 'waiting' && 
               typedGame.playerCount < 4 && 
               typedGame.creatorId !== currentUser.uid;
      })
      .sort((a, b) => {
        const gameA = a[1] as MatchmakingGame;
        const gameB = b[1] as MatchmakingGame;
        return gameA.created - gameB.created;
      });
    
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

  // 方向マップをシャッフルする関数
  const shuffleDirectionMap = (gameCars: Car[] = []): DirectionMap => {
    // 現在の車のカテゴリを取得（次のカードのカテゴリを使用）
    let currentCarCategory: CarCategory | null = null;
    if (currentCarIndex < gameCars.length) {
      currentCarCategory = gameCars[currentCarIndex].category;
      console.log('現在の車のカテゴリ:', currentCarCategory); // デバッグ用
    }
    
    if (!currentCarCategory) {
      console.log('カテゴリが取得できません。デフォルト処理を使用します。');
      // 現在のカテゴリが取得できない場合（ゲーム終了時など）は元のマップ生成処理を使用
      return generateDirectionMap(gameCars);
    }
    
    // 選択肢を準備（現在の車のカテゴリを必ず含める）
    const categoryPool = [...CAR_CATEGORIES].filter(c => c !== currentCarCategory);
    // ランダムに3つ選ぶ
    const randomCategories = categoryPool
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // 4つのカテゴリ（現在の+ランダムに選んだ3つ）
    const categories = [currentCarCategory, ...randomCategories];
    console.log('選択されたカテゴリ:', categories); // デバッグ用
    
    // 4つのカテゴリをランダムに4方向に配置する
    // これにより、現在の車のカテゴリが必ず含まれるがどの方向かはランダム
    const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);
    console.log('シャッフル後のカテゴリ:', shuffledCategories); // デバッグ用
    
    const result = {
      up: shuffledCategories[0],
      right: shuffledCategories[1],
      down: shuffledCategories[2],
      left: shuffledCategories[3]
    };
    console.log('方向マップ:', result); // デバッグ用
    return result;
  };

  // スワイプ処理
  const handleSwipe = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isGameActive || !currentGame || currentCarIndex >= cars.length) return;
    
    const currentCar = cars[currentCarIndex];
    
    // 現在のカードのカテゴリが方向マップに含まれているか確認
    const currentCategory = currentCar.category;
    console.log('スワイプ時の現在の車のカテゴリ:', currentCategory); // デバッグ用
    let expectedCategory = currentGame.directionMap[direction];
    let isCorrect = currentCategory === expectedCategory;
    
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
    
    // スワイプ後に方向マップをシャッフル（次のカードが存在する場合）
    if (nextIndex < cars.length) {
      // 重要: ここでnextIndexを使用して次のカードを判断する
      const nextCar = cars[nextIndex];
      console.log('次のカード:', nextCar); // デバッグ用
      
      // 次のカードのカテゴリを必ず含んだマップを生成
      const shuffledDirectionMap = generateShuffledMap(nextCar.category);
      console.log('新しい方向マップ:', shuffledDirectionMap); // デバッグ用
      
      // 生成された方向マップが、次のカードのカテゴリを含んでいるか確認
      const categoryInMap = Object.values(shuffledDirectionMap).includes(nextCar.category);
      console.log(`マップに次のカードのカテゴリ(${nextCar.category})が含まれているか:`, categoryInMap);
      
      // もし含まれていない場合は再生成
      let finalDirectionMap = shuffledDirectionMap;
      if (!categoryInMap) {
        console.log('次のカードのカテゴリがマップに含まれていないため再生成します');
        finalDirectionMap = generateShuffledMap(nextCar.category);
        console.log('再生成したマップ:', finalDirectionMap);
      }
      
      setCurrentGame({
        ...currentGame,
        directionMap: finalDirectionMap
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
  
  // 特定のカテゴリを必ず含む方向マップを生成する関数
  const generateShuffledMap = (categoryToInclude: CarCategory): DirectionMap => {
    // 指定されたカテゴリ以外から3つランダムに選択
    const otherCategories = CAR_CATEGORIES
      .filter(c => c !== categoryToInclude)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // 4つのカテゴリ（指定カテゴリ + ランダムに選んだ3つ）
    const allCategories = [categoryToInclude, ...otherCategories];
    
    // 位置をシャッフル
    const shuffled = [...allCategories].sort(() => Math.random() - 0.5);
    
    // 念のため確認: 本当に categoryToInclude が含まれているか
    if (!shuffled.includes(categoryToInclude)) {
      console.error('致命的なエラー: カテゴリが含まれていません。強制的に含めます。', categoryToInclude);
      shuffled[0] = categoryToInclude; // 強制的に含める
    }
    
    // 最終的なマッピングを作成
    const result = {
      up: shuffled[0],
      right: shuffled[1],
      down: shuffled[2],
      left: shuffled[3]
    };
    
    // 最終確認
    const includesCategory = Object.values(result).includes(categoryToInclude);
    console.log(`マップに ${categoryToInclude} が含まれているか:`, includesCategory);
    
    return result;
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

  // 注: スワイプ後に方向マップをシャッフルする機能を追加したため、
  // このuseEffectは不要になりました。新しい実装では各スワイプ後に
  // shuffleDirectionMap関数を呼び出して方向マップを更新しています。

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
