import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Progress,
  Badge,
  Button,
  Icon,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion'; // framer-motionをインポート
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useSwipe, SwipeDirection } from '../hooks/useSwipe';
import DirectionIndicator from '../components/DirectionIndicator';
import SwipableCarImage from '../components/SwipableCarImage';

// メインのゲームプレイ画面
const GamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { 
    currentGame, 
    cars, 
    currentCarIndex, 
    score, 
    isGameActive,
    gameResult,
    leaveGame,
    handleSwipe,
    submitScore,
    isTutorialMode,
    tutorialStep,
    advanceTutorial,
    finishTutorial
  } = useGame();
  const { currentUser } = useAuth();
  
  // 色設定
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // カウントダウン状態を管理
  const [countdown, setCountdown] = useState<number | null>(3);
  const [gameReady, setGameReady] = useState<boolean>(false);
  
  // ゲーム開始からの経過時間を管理
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  // 最後のスワイプ結果（正解/不正解）を管理
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);
  
  // スワイプ方向を管理 (アニメーション用)
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  
  // スワイプ中のドラッグ状態を管理
  const [swiping, setSwiping] = useState<boolean>(false);
  const [swipeDelta, setSwipeDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // アニメーション状態を管理
  const [animating, setAnimating] = useState<boolean>(false);
  
  // カード（車の画像）のref
  const cardRef = useRef<HTMLDivElement>(null);
  
  // カード状態の追跡（強制的に再レンダリングさせるため）
  const [cardRenderKey, setCardRenderKey] = useState<number>(0);
  
  // 画像上にカーソルやタッチがあるかをチェックする関数
  const isPointInsideCarContainer = useCallback((e: React.TouchEvent | React.MouseEvent): boolean => {
    if (!cardRef.current) return false;
    
    const cardRect = cardRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    // マウスイベントかタッチイベントかを判定
    if ('touches' in e) {
      // タッチイベントの場合
      if (e.touches.length === 0) {
        return false;
      }
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // マウスイベントの場合
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // 位置が画像コンテナの範囲内か判定
    const isInside = (
      clientX >= cardRect.left &&
      clientX <= cardRect.right &&
      clientY >= cardRect.top &&
      clientY <= cardRect.bottom
    );
    
    console.log('ポイント判定', { isInside, x: clientX, y: clientY, rect: cardRect });
    return isInside;
  }, []);
  
  // スワイプ処理のラッパー関数（結果表示のアニメーション用）
  const handleSwipeWithAnimation = useCallback((direction: SwipeDirection) => {
    if (!direction || !currentGame || currentCarIndex >= cars.length || !gameReady || animating) return;
    
    // アニメーション中フラグを設定
    setAnimating(true);
    
    const currentCar = cars[currentCarIndex];
    const expectedCategory = currentGame.directionMap[direction];
    
    // 画像のカテゴリと一致するかチェック
    const isCorrect = currentCar.category === expectedCategory;
    
    // スワイプ方向を設定
    setSwipeDirection(direction);
    
    // スワイプ結果を表示
    setLastResult(isCorrect ? 'correct' : 'incorrect');
    
    // スワイプ状態をリセット - 判定後即座に初期位置に戻す
    setSwiping(false);
    setSwipeDelta({ x: 0, y: 0 });
    
    // 結果表示を見せてから次のカードに進む
    setTimeout(() => {
      // 次のカードに進む前に明示的に初期位置に戻す
      setSwipeDelta({ x: 0, y: 0 });
      
      // ゲームロジックのスワイプ処理を呼び出し（次のカードに進む）
      handleSwipe(direction);
      
      // 次のカードを表示する前に必ずアニメーション状態をリセット
      setTimeout(() => {
        // もう一度位置を確実にリセット
        setSwipeDelta({ x: 0, y: 0 });
        
        // 結果表示を消去
        setLastResult(null);
        setSwipeDirection(null);
        setAnimating(false);
        
        // cardRenderKeyを更新して強制的に再レンダリング
        setCardRenderKey(prev => prev + 1);
      }, 300);
    }, 800);
  }, [currentGame, cars, currentCarIndex, gameReady, animating, handleSwipe]);
  
  // ドラッグ開始時の処理
  const handleDragStart = useCallback(() => {
    if (animating || !gameReady) return;
    setSwiping(true);
  }, [animating, gameReady]);
  
  // ドラッグ中の処理
  const handleDragging = useCallback((deltaX: number, deltaY: number) => {
    if (animating || !gameReady) return;
    
    // スワイプデータを更新
    setSwipeDelta({ x: deltaX, y: deltaY });
    
    // デバッグ情報
    console.log(`ドラッグ中 - x: ${deltaX}, y: ${deltaY}`);
  }, [animating, gameReady]);
  
  // ドラッグ終了時の処理
  const handleDragEnd = useCallback((direction: SwipeDirection, finalDelta: { x: number, y: number }) => {
    if (animating || !gameReady || !direction) return;
    
    // 方向が検出されたらアニメーション開始
    handleSwipeWithAnimation(direction);
    
    // 状態リセット（念のため）
    setSwipeDelta({ x: 0, y: 0 });
    setSwiping(false);
  }, [animating, gameReady, handleSwipeWithAnimation]);
  
  // スワイプハンドラーを設定
  const dragHandlers = useSwipe(
    handleDragStart,
    handleDragging,
    handleDragEnd,
    50 // スワイプと判定する閾値
  );
  
  // framer-motionではドラッグイベントを内部的に処理するため、
  // タッチイベントのリスナーはほとんど必要ないが、バックアップとして残す
  const filteredDragHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      // ゲームの準備ができている場合にのみ処理
      if (gameReady && !animating) {
        // framer-motionでドラッグ処理が主導されるため、単純なログのみ
        console.log('タッチイベント検出');
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      // 必要に応じてデバッグ情報のみ
      if (gameReady && !animating && swiping) {
        console.log('タッチ移動イベント');
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      // 必要に応じてデバッグ情報のみ
      if (gameReady && !animating) {
        console.log('タッチ終了イベント');
      }
    },
    onMouseDown: (e: React.MouseEvent) => {
      // 必要に応じてデバッグ情報のみ
      if (gameReady && !animating) {
        console.log('マウスダウンイベント');
      }
    },
    onMouseMove: (e: React.MouseEvent) => {
      // 必要に応じてデバッグ情報のみ
      if (swiping && gameReady && !animating) {
        console.log('マウス移動イベント');
      }
    },
    onMouseUp: (e: React.MouseEvent) => {
      // 必要に応じてデバッグ情報のみ
      if (gameReady && !animating) {
        console.log('マウスアップイベント');
      }
    }
  };
  
  // currentCarIndex が変わったら cardRenderKey を更新して再レンダリングを強制
  useEffect(() => {
    setCardRenderKey(prev => prev + 1);
  }, [currentCarIndex]);
  
  // ゲーム終了時の処理
  useEffect(() => {
    if (gameResult && !isTutorialMode) {
      // チュートリアルモード以外の場合にのみ結果画面に遷移
      submitScore(gameResult);
      navigate('/result');
    }
  }, [gameResult, submitScore, navigate, isTutorialMode]);
  
  // カウントダウンを管理
  useEffect(() => {
    if (!isGameActive || !currentGame || gameReady) return;
    
    if (countdown === null) {
      // カウントダウンが終了したらゲームを開始
      setGameReady(true);
      return;
    }
    
    // 1秒ごとにカウントダウン
    const countdownTimer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        setCountdown(null); // カウントダウン終了
      }
    }, 1000);
    
    return () => clearTimeout(countdownTimer);
  }, [countdown, isGameActive, currentGame, gameReady]);
  
  // タイマーを管理
  useEffect(() => {
    if (!isGameActive || !currentGame || !gameReady) return;
    
    const startTime = currentGame.startTime;
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isGameActive, currentGame, gameReady]);
  
  // チュートリアルモードで5枚の仕分けが終わったら完了ステップに進める
  useEffect(() => {
    // チュートリアルモードの場合のみ処理を実行
    if (isTutorialMode && currentCarIndex === 5 && tutorialStep !== 4) {
      // 5枚の仕分けが終わったらチュートリアル完了とする
      // advanceTutorialを呼び出してステップ4に進める
      advanceTutorial();
    }
  }, [isTutorialMode, currentCarIndex, tutorialStep, advanceTutorial]);
  
  // チュートリアル完了時、ゲームモード選択画面に自動遷移
  useEffect(() => {
    if (isTutorialMode && tutorialStep === 4) {
      // チュートリアル完了状態をリセットしてからモード選択画面に遷移
      finishTutorial();
      navigate('/modes');
    }
  }, [isTutorialMode, tutorialStep, navigate, finishTutorial]);
  
  // ゲーム退出処理
  const handleQuitGame = useCallback(() => {
    leaveGame();
    navigate('/modes');
  }, [leaveGame, navigate]);
  
  // 現在のスワイプ方向をハイライト表示するためのヘルパー関数
  const isDirectionActive = useCallback((direction: SwipeDirection): boolean => {
    if (!swiping || !swipeDirection) return false;
    return swipeDirection === direction;
  }, [swiping, swipeDirection]);
  
  // チュートリアル完了画面表示用コンポーネント
  const TutorialCompletionScreen = () => {
    const { finishTutorial } = useGame();
    const navigate = useNavigate();
    
    const handleCompletion = () => {
      finishTutorial();
      navigate('/modes');
    };
    
    return (
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg="rgba(0, 0, 0, 0.6)"
        color="white"
        p={5}
        borderRadius="lg"
        maxW="80%"
        textAlign="center"
        zIndex={1000}
        boxShadow="lg"
        backdropFilter="blur(3px)"
        border="1px solid"
        borderColor="blue.300"
      >
        <Heading size="md" mb={3} color="blue.300">
          チュートリアル完了！
        </Heading>
        <Text mb={4}>これでチュートリアルは終了です。実際のゲームでは制限時間内にできるだけ多くの車を正しく分類しましょう。</Text>
        <Text fontSize="sm" color="gray.300" mb={3}>
          背景のゲーム画面を確認することができます。
        </Text>
        <Button
          colorScheme="blue"
          onClick={handleCompletion}
          mt={2}
          size="lg"
        >
          モード選択に戻る
        </Button>
      </Box>
    );
  };
  
  // チュートリアルのステップに応じたガイダンスメッセージを取得する関数
  const getTutorialMessage = () => {
    if (!isTutorialMode) return null;
    
    switch (tutorialStep) {
      case 0:
        return {
          title: 'まずは画面を見てみましょう',
          content: '車の画像が中央に表示され、上下左右には車種カテゴリが表示されています。表示された車を適切なカテゴリにスワイプして分類しましょう。',
          nextAction: '画面を確認したら次へ進みましょう',
        };
      case 1:
        return {
          title: 'カテゴリを確認しよう',
          content: '画面の四方には車種カテゴリが表示されています。現在の車（クロスカントリー）の正しいカテゴリは「上」方向に表示されています。',
          nextAction: '上方向にスワイプしてみましょう',
        };
      case 2:
        return {
          title: 'スワイプの方法',
          content: '車の画像を指やマウスでドラッグして上下左右にスワイプします。正しいカテゴリ方向にスワイプすると得点が加算されます。',
          nextAction: '次の車でもスワイプしてみましょう',
        };
      case 3:
        return {
          title: 'ゲームの進行',
          content: '全ての車を分類するとゲームが終了します。できるだけ多くの車を正確に分類して高得点を目指しましょう！',
          nextAction: 'チュートリアルはもうすぐ終了です',
        };
      case 4:
        return {
          title: 'チュートリアル完了！',
          content: 'これでチュートリアルは終了です。実際のゲームでは制限時間内にできるだけ多くの車を正しく分類しましょう。',
          nextAction: '「完了」を押すとチュートリアルを終了します',
        };
      default:
        return null;
    }
  };
  
  // チュートリアルガイダンス表示用コンポーネント（初期段階のみ表示）
  const TutorialGuidance = () => {
    const tutorialMessage = {
      title: 'チュートリアルを開始します',
      content: '車の画像が中央に表示され、上下左右には車種カテゴリが表示されています。表示された車を適切なカテゴリにスワイプして分類してください。5枚分の仕分けが終わるとチュートリアルは完了です。',
      nextAction: '画面を確認したら車の分類を始めましょう',
    };
    
    const { advanceTutorial } = useGame();
    
    return (
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg="rgba(0, 0, 0, 0.7)"
        color="white"
        p={5}
        borderRadius="lg"
        maxW="80%"
        textAlign="center"
        zIndex={1000}
        boxShadow="lg"
      >
        <Heading size="md" mb={3} color="blue.300">
          {tutorialMessage.title}
        </Heading>
        <Text mb={4}>{tutorialMessage.content}</Text>
        <Button
          colorScheme="blue"
          onClick={() => advanceTutorial()}
          mt={2}
        >
          開始
        </Button>
      </Box>
    );
  };
  
  // ゲーム画面が初期化されていない場合
  if (!currentGame || !isGameActive) {
    return (
      <Container centerContent maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <Heading>ゲームが開始されていません</Heading>
          <Button colorScheme="blue" onClick={() => navigate('/modes')}>
            ゲームモード選択に戻る
          </Button>
        </VStack>
      </Container>
    );
  }
  
  // 現在のカード情報
  const currentCar = cars[currentCarIndex < cars.length ? currentCarIndex : cars.length - 1];
  const progress = Math.floor((currentCarIndex / cars.length) * 100);
  const remainingCards = cars.length - currentCarIndex;
  
  // マルチプレイヤーモードかどうか
  const isMultiplayer = currentGame.id !== undefined && Object.keys(currentGame.players).length > 1;

  return (
    <Container maxW="container.xl" p={0} h="100vh" position="relative">
      {/* チュートリアル開始ガイダンス - 初期段階でのみ表示 */}
      {isTutorialMode && tutorialStep === 0 && <TutorialGuidance />}
      
      {/* チュートリアル完了画面 - チュートリアルモードで5枚分の仕分けが終わった場合のみ表示 */}
      {isTutorialMode && tutorialStep === 4 && <TutorialCompletionScreen />}
      
      {/* ゲーム情報ヘッダー */}
      <Box bg="gray.100" p={4} borderBottom="1px" borderColor={borderColor}>
        <Flex justifyContent="space-between" alignItems="center">
          <HStack spacing={4}>
            <Badge colorScheme="blue" p={2} fontSize="md">
              スコア: {score} / {cars.length}
            </Badge>
            <Badge colorScheme="green" p={2} fontSize="md">
              残り: {remainingCards}枚
            </Badge>
          </HStack>
          
          <HStack spacing={4}>
            <Badge colorScheme="red" p={2} fontSize="md">
              <Icon as={FaClock} mr={1} />
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </Badge>
            <Button size="sm" colorScheme="red" onClick={handleQuitGame}>
              終了
            </Button>
          </HStack>
        </Flex>
        
        {/* 進捗バー */}
        <Progress 
          value={progress} 
          size="sm" 
          colorScheme="blue" 
          mt={2} 
          borderRadius="full"
        />
      </Box>
      
      {/* マルチプレイヤー情報 */}
      {isMultiplayer && (
        <Box bg="gray.50" p={2} borderBottom="1px" borderColor={borderColor}>
          <Heading size="sm" mb={2}>対戦相手の進捗状況</Heading>
          <VStack spacing={2} align="stretch">
            {Object.entries(currentGame.players).map(([playerId, player]) => (
              currentUser?.uid !== playerId && (
                <Flex key={playerId} alignItems="center">
                  <Text fontSize="sm" width="100px" isTruncated>{player.displayName}</Text>
                  <Progress 
                    value={player.progress} 
                    size="xs" 
                    colorScheme="green" 
                    flex={1} 
                    mr={2}
                    borderRadius="full"
                  />
                  <Text fontSize="xs">{player.score}点</Text>
                </Flex>
              )
            ))}
          </VStack>
        </Box>
      )}
      
      {/* メインのゲーム画面 */}
      <Box 
        h="calc(100vh - 150px)"
        position="relative"
        overflow="visible" // overflow: visibleに変更して、スワイプアニメーションがはみ出すのを許可
        bg="gray.800" // アスファルト色を少し明るく調整
        display="flex"
        flexDirection="column"
        justifyContent="center" // 中央配置に変更
        alignItems="center"
        px={2}
        // framer-motionで直接ドラッグ処理をするため、タッチイベントはほぼ不要
        onTouchStart={filteredDragHandlers.onTouchStart}
        onTouchMove={filteredDragHandlers.onTouchMove}
        onTouchEnd={filteredDragHandlers.onTouchEnd}
        onMouseDown={filteredDragHandlers.onMouseDown}
        onMouseMove={filteredDragHandlers.onMouseMove}
        onMouseUp={filteredDragHandlers.onMouseUp}
        sx={{
          // 一本道の高速道路風の背景スタイル
          position: 'relative',
          // 背景に遠近感を出すためのグラデーション
          backgroundImage: `
            linear-gradient(to bottom, #888 0%, #555 100%),
            linear-gradient(to right, transparent 48%, white 48%, white 52%, transparent 52%)
          `,
          backgroundSize: '100% 100%, 20px 100%',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat, repeat-y',
          // 中央の白い点線
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            height: '100%',
            width: '12px',
            transform: 'translateX(-50%)',
            background: 'repeating-linear-gradient(to bottom, white, white 20px, transparent 20px, transparent 40px)',
            opacity: 0.7,
            zIndex: 1
          },
          // 道路のガードレール
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(to bottom, transparent 10%, rgba(200, 200, 200, 0.7) 10%, rgba(200, 200, 200, 0.7) 12%, transparent 12%),
              linear-gradient(to bottom, transparent 90%, rgba(200, 200, 200, 0.7) 90%, rgba(200, 200, 200, 0.7) 92%, transparent 92%)
            `,
            backgroundSize: '100% 100%',
            pointerEvents: 'none',
            zIndex: 2
          },
          // 遠近感を出すための擬似要素
          '&:before, &:after': {
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          },
          touchAction: "none", // より強力なタッチイベント制御のため、すべてのデフォルトタッチアクションを無効化
          WebkitTapHighlightColor: "rgba(0,0,0,0)", // タップのハイライトを無効化
          WebkitTouchCallout: "none", // タッチメニューを無効化
          WebkitUserSelect: "none", // テキスト選択を無効化
          userSelect: "none", // テキスト選択を無効化（すべてのブラウザ）
          cursor: swiping ? "grabbing" : "default", // スワイプ中はグラブカーソルを表示
          "& .car-container-swipeable, & .car-image-swipeable": {
            touchAction: "none", // 車の画像コンテナと画像自体では完全にブラウザのタッチ動作を無効化
            userSelect: "none",
            WebkitUserSelect: "none",
            // WebKitベンダープロパティはChakra UIのsxプロパティ内では問題なく使用できる
            WebkitTouchCallout: "none", // タッチコールアウトを無効化
            "-webkit-tap-highlight-color": "rgba(0,0,0,0)" // タップハイライトを無効化
          }
        }}
      >
        <AnimatePresence>
          {!gameReady ? (
            /* カウントダウン中は車の画像を表示せず、カウントダウンのみを表示する */
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                background: 'black',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%'
              }}
            >
              <Text
                fontSize="8xl"
                fontWeight="extrabold"
                color="white"
                textShadow="0 0 20px rgba(255, 255, 255, 0.7)"
                animation="pulse 1s infinite"
                transform="scale(1.5)"
                mb={5}
              >
                {countdown}
              </Text>
              <Text
                fontSize="3xl"
                fontWeight="bold"
                color="white"
                mt={4}
                animation="fadeIn 1s ease-in-out"
                textShadow="0 0 10px rgba(255, 255, 255, 0.5)"
              >
                準備をしてください！
              </Text>
              <Text
                fontSize="xl"
                color="gray.300"
                mt={8}
                animation="bounce 2s infinite"
              >
                スワイプの準備をしよう
              </Text>
            </motion.div>
          ) : (
            // 新しいレイアウト: 四隅に選択肢、中央に車種画像を配置
            <Flex
              direction="column"
              alignItems="center"
              justifyContent="space-between"
              w="100%"
              h="100%"
              position="relative"
              py={4}
              px={2}
            >
              {/* 上方向のカテゴリ */}
              <Box zIndex={5}>
                {Object.entries(currentGame.directionMap)
                  .filter(([dir]) => dir === 'up')
                  .map(([direction, category]) => (
                    <DirectionIndicator 
                      key={direction}
                      direction={'up'}
                      category={category}
                      isActive={isDirectionActive('up')}
                    />
                  ))}
              </Box>
              
              {/* メイン部分: 左右のカテゴリと中央の車画像 */}
              <Flex alignItems="center" justifyContent="center" w="90%" flex="1" zIndex={5} mx="auto">
                {/* 左方向のカテゴリ */}
                <Box pl={1}>
                  {Object.entries(currentGame.directionMap)
                    .filter(([dir]) => dir === 'left')
                    .map(([direction, category]) => (
                      <DirectionIndicator 
                        key={direction}
                        direction={'left'}
                        category={category}
                        isActive={isDirectionActive('left')}
                      />
                    ))}
                </Box>
                
                {/* 中央の車画像 */}
                <motion.div
                  key={`car-container-${currentCarIndex}-${cardRenderKey}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: swiping ? "grabbing" : "grab",
                    position: 'relative',
                    zIndex: 10
                  }}
                  ref={cardRef}
                >
                  <SwipableCarImage 
                    car={currentCar} 
                    lastResult={lastResult} 
                    swipeDirection={swipeDirection}
                    swiping={swiping}
                    swipeDelta={swipeDelta}
                    onSwipeStart={handleDragStart}
                    onSwiping={handleDragging}
                    onSwiped={handleDragEnd}
                  />
                </motion.div>
                
                {/* 右方向のカテゴリ */}
                <Box>
                  {Object.entries(currentGame.directionMap)
                    .filter(([dir]) => dir === 'right')
                    .map(([direction, category]) => (
                      <DirectionIndicator 
                        key={direction}
                        direction={'right'}
                        category={category}
                        isActive={isDirectionActive('right')}
                      />
                    ))}
                </Box>
              </Flex>
              
              {/* 下方向のカテゴリ */}
              <Box zIndex={5}>
                {Object.entries(currentGame.directionMap)
                  .filter(([dir]) => dir === 'down')
                  .map(([direction, category]) => (
                    <DirectionIndicator 
                      key={direction}
                      direction={'down'}
                      category={category}
                      isActive={isDirectionActive('down')}
                    />
                  ))}
              </Box>
            </Flex>
          )}
        </AnimatePresence>
      </Box>
    </Container>
  );
};

export default GamePlayPage;