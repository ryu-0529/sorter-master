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
  
  // チュートリアル状態
  isTutorialMode: boolean;
  isTutorialOpen: boolean;
  tutorialStep: number;
  tutorialCards: Car[];
  
  // ゲーム管理関数
  startSinglePlayerGame: () => void;
  joinMultiplayerGame: () => Promise<void>;
  createMultiplayerGame: () => Promise<string>;
  createCustomRoom: (playerCount: number) => Promise<string>;
  joinRoomById: (roomId: string) => Promise<void>;
  leaveGame: () => void;
  handleSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void;
  submitScore: (result: GameResult) => Promise<void>;
  fetchRankings: () => Promise<void>;
  
  // チュートリアル管理関数
  startTutorial: () => void;
  closeTutorial: () => void;
  finishTutorial: () => void;
  advanceTutorial: () => void;
  startInteractiveTutorial: () => void;
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
  
  // チュートリアル状態
  const [isTutorialMode, setIsTutorialMode] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [tutorialCards, setTutorialCards] = useState<Car[]>([]);

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
    
    // シングルプレイヤーゲームのIDには明示的なプレフィックスを使用して識別を容易にする
    const singlePlayerGameId = `singleplayer-${uuidv4()}`;
    
    const newGame: GameSession = {
      id: singlePlayerGameId,
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
      isActive: true,
      gameType: 'singleplayer' // ゲームタイプを明示的に設定
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

  // カスタムルームの作成（プレイヤー数を指定）
  const createCustomRoom = async (playerCount: number): Promise<string> => {
    if (!currentUser) throw new Error('ユーザーがログインしていません');
    
    // 最大プレイヤー数を確認（2〜4人）
    const maxPlayers = Math.min(Math.max(playerCount, 2), 4);
    
    // ゲームカードを準備
    const gameCards = prepareGameCards();
    
    // 最初のカードのカテゴリを必ず含むマッピングを生成
    const firstCard = gameCards[0];
    const initialDirectionMap = generateShuffledMap(firstCard.category);
    
    // マッピングが正しく生成されているか確認
    const categoryInMap = Object.values(initialDirectionMap).includes(firstCard.category);
    
    // もし最初のカードのカテゴリがマップに含まれていない場合は再生成
    let finalDirectionMap = initialDirectionMap;
    if (!categoryInMap) {
      finalDirectionMap = generateShuffledMap(firstCard.category);
    }
    
    // ルームIDの生成（カスタムルームは明示的なIDフォーマットを使用）
    // 6桁のランダムな英数字コードを作成
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newGameRef = ref(database, `game_sessions/${roomId}`);
    
    const newGame: GameSession = {
      id: roomId,
      players: {
        [currentUser.uid]: {
          displayName: currentUser.displayName || `Guest-${currentUser.uid.substring(0, 5)}`,
          score: 0,
          progress: 0,
          isComplete: false
        }
      },
      directionMap: finalDirectionMap,
      cars: gameCards,
      startTime: Date.now(),
      isActive: true,
      maxPlayers: maxPlayers  // 最大プレイヤー数を設定
    };
    
    await set(newGameRef, newGame);
    
    // カスタムルーム情報をマッチメイキングとは別に保存
    const roomsRef = ref(database, `custom_rooms/${roomId}`);
    await set(roomsRef, {
      creatorId: currentUser.uid,
      playerCount: 1,
      maxPlayers: maxPlayers,
      created: Date.now(),
      status: 'waiting'
    });
    
    // 現在のゲーム状態を更新
    setCurrentGame(newGame);
    setCars(gameCards);
    setCurrentCarIndex(0);
    setScore(0);
    setIsGameActive(true);
    setGameResult(null);
    
    return roomId;
  };

  // 特定のルームIDを指定して参加
  const joinRoomById = async (roomId: string): Promise<void> => {
    if (!currentUser) throw new Error('ユーザーがログインしていません');
    
    // ルームIDが有効かチェック
    const gameRef = ref(database, `game_sessions/${roomId}`);
    const gameSnapshot = await get(gameRef);
    
    if (!gameSnapshot.exists()) {
      throw new Error('指定されたルームが見つかりません');
    }
    
    const gameData = gameSnapshot.val() as GameSession;
    
    // ゲームがアクティブかチェック
    if (!gameData.isActive) {
      throw new Error('このルームは既に終了しています');
    }
    
    // 最大プレイヤー数をチェック
    const currentPlayerCount = Object.keys(gameData.players).length;
    if (currentPlayerCount >= (gameData.maxPlayers || 4)) {
      throw new Error('このルームは満員です');
    }
    
    // 既に参加しているかチェック
    if (gameData.players[currentUser.uid]) {
      // 既に参加している場合は状態を更新するだけ
      setCurrentGame(gameData);
      setCars(gameData.cars);
      setCurrentCarIndex(0);
      setScore(gameData.players[currentUser.uid].score || 0);
      setIsGameActive(true);
      setGameResult(null);
      return;
    }
    
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
    
    // カスタムルーム情報も更新
    const roomsRef = ref(database, `custom_rooms/${roomId}`);
    const roomSnapshot = await get(roomsRef);
    
    if (roomSnapshot.exists()) {
      await update(roomsRef, {
        playerCount: Object.keys(updatedPlayers).length
      });
      
      // 最大人数に達したら状態を更新
      const roomData = roomSnapshot.val();
      if (Object.keys(updatedPlayers).length >= roomData.maxPlayers) {
        await update(roomsRef, {
          status: 'starting'
        });
      }
    }
    
    // 現在のゲーム状態を更新
    const updatedGameData = {
      ...gameData,
      players: updatedPlayers
    };
    
    setCurrentGame(updatedGameData);
    setCars(gameData.cars);
    setCurrentCarIndex(0);
    setScore(0);
    setIsGameActive(true);
    setGameResult(null);
  };

  // マルチプレイヤーゲーム参加（マッチメイキング方式）
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

  // ゲーム退出 - 存在と不在の境界を設計する関数
  const leaveGame = () => {
    if (!currentUser || !currentGame) return;
    
    // 現在の時刻を記録（最終アクティブタイム）
    const endTime = Date.now();
    
    // ゲームIDからシングルプレイヤーかマルチプレイヤーかを判定
    const isMultiplayerGame = !currentGame.id.startsWith('singleplayer-') && currentGame.id !== 'tutorial';
    
    if (isMultiplayerGame) {
      // マルチプレイヤーゲームの場合
      const gameRef = ref(database, `game_sessions/${currentGame.id}`);
      const playersRef = ref(database, `game_sessions/${currentGame.id}/players/${currentUser.uid}`);
      
      // プレイヤー情報を更新
      update(playersRef, {
        isComplete: true,
        lastActiveTime: endTime
      });
      
      // すべてのプレイヤーが完了したらゲームを終了
      get(gameRef).then((snapshot) => {
        if (snapshot.exists()) {
          const game = snapshot.val();
          const allComplete = Object.values(game.players).every((player: any) => player.isComplete);
          
          if (allComplete) {
            // 全プレイヤーがゲームを終了したらデータを削除するための準備
            // まずはアナリティクスデータを抽出して保存
            const analyticsData = {
              roomId: currentGame.id,
              playerCount: Object.keys(game.players).length,
              maxPlayers: game.maxPlayers || 4,
              startTime: game.startTime,
              endTime,
              duration: (endTime - game.startTime) / 1000,
              // その他の分析に有用なデータ...
            };
            
            // Firestoreにデータを保存
            const analyticsRef = collection(firestore, 'game_analytics');
            addDoc(analyticsRef, analyticsData)
              .then(() => {
                console.log('分析データを保存しました');
                
                // ゲームの状態を更新
                update(gameRef, {
                  isActive: false,
                  endTime: endTime,
                  lastActiveTime: endTime
                });
                
                // 注: データの即時削除は行わず、Cloud Functionsによる定期的なクリーンアップに任せます
                // これにより、クライアント側の処理の信頼性を高め、存在論的な不確実性を軽減します
              })
              .catch(err => console.error('分析データの保存に失敗:', err));
          } else {
            // まだ全員終了していない場合は終了時刻と状態のみ更新
            update(gameRef, {
              lastActiveTime: endTime
            });
          }
        }
      });
    }
    
    // ローカル状態のリセット
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
    // ゲームIDからシングルプレイヤーかマルチプレイヤーかを判定
    const isMultiplayerGame = !currentGame.id.startsWith('singleplayer-') && currentGame.id !== 'tutorial';
    
    if (currentUser && isMultiplayerGame) {
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
      
      // ゲーム結果を生成
      const result: GameResult = {
        score: newScore,
        correctAnswers: newScore,
        totalAnswers: cars.length,
        timeInSeconds
      };
      
      // ゲームIDからシングルプレイヤーかマルチプレイヤーかを判定
      const isMultiplayerGame = !currentGame.id.startsWith('singleplayer-') && currentGame.id !== 'tutorial';
      
      // シングルプレイヤーゲームの場合はここで結果を設定
      if (!isMultiplayerGame || !currentUser) {
        setGameResult(result);
        setIsGameActive(false);
      } else {
        // マルチプレイヤーゲームの場合は完了処理
        update(ref(database, `game_sessions/${currentGame.id}/players/${currentUser.uid}`), {
          isComplete: true,
          score: newScore,
          completionTime: endTime,
          timeInSeconds
        });
        
        // プレイヤーの順位を計算
        calculateMultiplayerRanking(currentGame.id, currentUser.uid, newScore, timeInSeconds)
          .then(playerRank => {
            if (playerRank) {
              // マルチプレイヤー情報を含めた結果を設定
              const multiplayerResult: GameResult = {
                ...result,
                isMultiplayer: true,
                playerRank,
                totalPlayers: Object.keys(currentGame.players).length
              };
              setGameResult(multiplayerResult);
            } else {
              // 順位計算に失敗した場合は通常の結果を設定
              setGameResult(result);
            }
            setIsGameActive(false);
          });
      }
    } else {
      // ゲームが終了していない場合のみ、次のカードの方向マップをセットアップ
      try {
        // 防御的にカードの存在を確認
        if (nextIndex < cars.length) {
          const nextCar = cars[nextIndex];
          
          if (nextCar && nextCar.category) {
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
            
            // 重要: 更新されるオブジェクトが既存のcurrentGameオブジェクトを正しく複製していることを確認
            if (currentGame) {
              setCurrentGame({
                ...currentGame,
                directionMap: finalDirectionMap
              });
            }
          } else {
            console.error('次のカードが不正な形式です', nextCar);
          }
        }
      } catch (error) {
        console.error('方向マップの更新中にエラーが発生しました:', error);
        // エラーが発生しても、ゲームの状態は保持する（不整合が起きないようにする）
      }
    }
  };
  
  // マルチプレイヤーゲーム用の順位計算と結果処理
  const calculateMultiplayerRanking = async (gameId: string, playerId: string, playerScore: number, playerTime: number) => {
    try {
      console.log('マルチプレイヤーの順位計算を開始します');
      
      // ゲームデータを取得
      const gameRef = ref(database, `game_sessions/${gameId}`);
      const gameSnapshot = await get(gameRef);
      
      if (!gameSnapshot.exists()) {
        console.error('ゲームデータが見つかりません');
        return;
      }
      
      const gameData = gameSnapshot.val() as GameSession;
      
      // すべてのプレイヤーが完了しているかチェック
      const allPlayersComplete = Object.values(gameData.players).every((player: any) => player.isComplete);
      
      // 現在のプレイヤーの順位データを計算・更新
      const playerRankingRef = ref(database, `game_sessions/${gameId}/players/${playerId}/ranking`);
      
      // プレイヤーの順位を計算
      // スコアが高い順、同点の場合は時間が短い順でランク付け
      const playerRankings = Object.entries(gameData.players)
        .map(([uid, playerData]: [string, any]) => ({
          uid,
          displayName: playerData.displayName,
          score: playerData.score || 0,
          time: playerData.timeInSeconds || Infinity,
          isComplete: playerData.isComplete || false
        }))
        .filter(player => player.isComplete || player.uid === playerId) // 完了したプレイヤーと自分自身のみ
        .sort((a, b) => {
          // スコアが高い順（降順）
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // 同点の場合は時間が短い順（昇順）
          return a.time - b.time;
        });
      
      // 現在のプレイヤーの順位を特定
      const playerRank = playerRankings.findIndex(p => p.uid === playerId) + 1;
      
      // 順位データをFirebaseに保存
      await update(playerRankingRef, {
        rank: playerRank,
        totalPlayers: Object.keys(gameData.players).length,
        allComplete: allPlayersComplete
      });
      
      // すべてのプレイヤーが完了した場合は、ゲーム全体の順位データを保存
      if (allPlayersComplete) {
        // 全プレイヤーの最終順位を保存
        const finalRankingsRef = ref(database, `game_sessions/${gameId}/finalRankings`);
        await set(finalRankingsRef, playerRankings.map((player, index) => ({
          uid: player.uid,
          displayName: player.displayName,
          score: player.score,
          time: player.time,
          rank: index + 1
        })));
        
        // ゲームの状態を「完了」に更新
        await update(gameRef, {
          isActive: false,
          isComplete: true,
          endTime: Date.now()
        });
        
        console.log('全プレイヤーが完了しました。最終順位を保存しました。');
      } else {
        console.log(`プレイヤー ${playerId} の暫定順位: ${playerRank}/${Object.keys(gameData.players).length}`);
      }
      
      return playerRank;
    } catch (error) {
      console.error('順位計算中にエラーが発生しました:', error);
      return null;
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
    
    // チュートリアルモードの場合はランキングに登録しない
    if (isTutorialMode || (currentGame && currentGame.id === 'tutorial')) {
      console.log('チュートリアルモードはランキングに登録されません');
      await fetchRankings(); // ランキングは更新する
      return;
    }
    
    // ゲストユーザー（匿名認証）の場合はランキングに登録しない
    if (currentUser.isAnonymous) {
      console.log('ゲストユーザーはランキングに登録されません');
      await fetchRankings(); // ランキングは更新する
      return;
    }
    
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
    // シングルプレイヤーゲームの場合は、Firebase監視は不要
    const isMultiplayerGame = currentGame && !currentGame.id.startsWith('singleplayer-') && currentGame.id !== 'tutorial';
    
    if (!currentUser || !currentGame || !isMultiplayerGame) return;
    
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

  // チュートリアル用のカードセットを準備する関数
  const prepareTutorialCards = (): Car[] => {
    // チュートリアル用に最初の数枚の車をコピー（シンプルなセットを使用）
    return [
      { id: 't1', imageUrl: '/images/cars/car1.png', category: 'クロスカントリー' },
      { id: 't2', imageUrl: '/images/cars/car2.png', category: 'SUV' },
      { id: 't3', imageUrl: '/images/cars/car3.png', category: '軽自動車' },
      { id: 't4', imageUrl: '/images/cars/car4.png', category: 'ミニバン' },
      { id: 't5', imageUrl: '/images/cars/car5.png', category: 'ワンボックス' }
    ];
  };
  
  // インタラクティブなチュートリアルを開始する関数
  const startInteractiveTutorial = () => {
    if (!currentUser) return;
    
    console.log('インタラクティブチュートリアルを開始します');
    setIsTutorialMode(true);
    
    // チュートリアル用のカードを準備
    const tutorialCards = prepareTutorialCards();
    setTutorialCards(tutorialCards);
    
    // 最初のカードのカテゴリを必ず含むマッピングを作成（最初は固定の方向に設定）
    const firstCard = tutorialCards[0];
    const fixedDirectionMap: DirectionMap = {
      up: 'クロスカントリー',  // 最初のカードのカテゴリは上方向に固定
      right: 'SUV',
      down: 'ミニバン',
      left: 'ステーションワゴン'
    };
    
    // チュートリアル用のゲームセッションを作成
    const tutorialGame: GameSession = {
      id: 'tutorial',
      players: {
        [currentUser.uid]: {
          displayName: currentUser.displayName || `Guest-${currentUser.uid.substring(0, 5)}`,
          score: 0,
          progress: 0,
          isComplete: false
        }
      },
      directionMap: fixedDirectionMap,
      cars: tutorialCards,
      startTime: Date.now(),
      isActive: true
    };
    
    // ゲーム状態を設定
    setCurrentGame(tutorialGame);
    setCars(tutorialCards);
    setCurrentCarIndex(0);
    setScore(0);
    setIsGameActive(true);
    setGameResult(null);
    setTutorialStep(0);
  };
  
  // チュートリアルステップを進める関数
  const advanceTutorial = () => {
    const nextStep = tutorialStep + 1;
    console.log(`チュートリアルステップを進めます: ${tutorialStep} -> ${nextStep}`);
    setTutorialStep(nextStep);
  };
  
  // （従来型の）チュートリアルを開始する関数
  const startTutorial = () => {
    console.log('チュートリアルモードを開始します');
    setIsTutorialMode(true);
    setIsTutorialOpen(true);
  };
  
  // チュートリアルを閉じる関数
  const closeTutorial = () => {
    console.log('チュートリアルを閉じます');
    setIsTutorialOpen(false);
  };
  
  // チュートリアルを完了する関数
  const finishTutorial = () => {
    console.log('チュートリアルを完了します');
    setIsTutorialOpen(false);
    setIsTutorialMode(false);
    setTutorialStep(0);
    
    // ゲーム状態もクリア
    if (currentGame?.id === 'tutorial') {
      setCurrentGame(null);
      setCars([]);
      setCurrentCarIndex(0);
      setScore(0);
      setIsGameActive(false);
    }
  };

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
    
    // チュートリアル状態
    isTutorialMode,
    isTutorialOpen,
    tutorialStep,
    tutorialCards,
    
    // ゲーム管理関数
    startSinglePlayerGame,
    joinMultiplayerGame,
    createMultiplayerGame,
    createCustomRoom,
    joinRoomById,
    leaveGame,
    handleSwipe,
    submitScore,
    fetchRankings,
    
    // チュートリアル管理関数
    startTutorial,
    closeTutorial,
    finishTutorial,
    advanceTutorial,
    startInteractiveTutorial
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
