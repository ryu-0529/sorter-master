import React, { useEffect, useState, useRef } from 'react';
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
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useSwipe } from '../hooks/useSwipe';
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
    submitScore
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
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  
  // スワイプ中のドラッグ状態を管理
  const [swiping, setSwiping] = useState<boolean>(false);
  const [swipeDelta, setSwipeDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // 現在のスワイプの軌跡を追跡
  const swipeTrailRef = useRef<Array<{ x: number; y: number }>>([]);
  
  // アニメーション状態を管理
  const [animating, setAnimating] = useState<boolean>(false);
  
  // カード状態の追跡（強制的に再レンダリングさせるため）
  const [cardRenderKey, setCardRenderKey] = useState<number>(0);
  
  // スワイプ中のコールバック
  const handleSwiping = (deltaX: number, deltaY: number) => {
    if (animating) return; // アニメーション中はドラッグしない
    
    setSwiping(true);
    setSwipeDelta({ x: deltaX, y: deltaY });
    
    // スワイプの軌跡を記録（最大10ポイント）
    const newPoint = { x: deltaX, y: deltaY };
    swipeTrailRef.current = [...swipeTrailRef.current.slice(-9), newPoint];
  };
  
  // スワイプハンドラーを取得（スワイプ中のコールバックを渡す）
  const swipeHandlers = useSwipe(handleSwiping);
  
  // currentCarIndex が変わったら cardRenderKey を更新して再レンダリングを強制
  useEffect(() => {
    setCardRenderKey(prev => prev + 1);
  }, [currentCarIndex]);
  
  // ゲーム終了時の処理
  useEffect(() => {
    if (gameResult) {
      submitScore(gameResult);
      navigate('/result');
    }
  }, [gameResult, submitScore, navigate]);
  
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
  
  // スワイプの方向を計算する関数 - 画面の境界に基づいて判定
  const calculateSwipeDirection = (points: Array<{ x: number; y: number }>): 'up' | 'down' | 'left' | 'right' | null => {
    if (points.length === 0) return null;
    
    // 最後のポイントを取得
    const lastPoint = points[points.length - 1];
    const { x, y } = lastPoint;
    
    // デバッグ情報
    console.log(`スワイプポイント - x: ${x}, y: ${y}`);
    
    // 境界線を越えるための閾値
    const boundaryThreshold = 100; // 100pxの範囲を超えた場合に方向が確定
    
    // 境界線を越えているか判定
    if (Math.abs(x) > boundaryThreshold) {
      // X軸方向の境界線を越えている
      return x > 0 ? 'right' : 'left';
    } else if (Math.abs(y) > boundaryThreshold) {
      // Y軸方向の境界線を越えている
      return y > 0 ? 'down' : 'up';
    }
    
    // 境界線を越えていない場合はnullを返す
    return null;
  };
  
  // スワイプ処理のラッパー関数（結果表示のアニメーション用）
  const handleSwipeWithAnimation = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentGame || currentCarIndex >= cars.length || !gameReady || animating) return;
    
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
    
    // スワイプ軌跡をリセット
    swipeTrailRef.current = [];
    
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
  };
  
  // スワイプ完了イベントをカスタムハンドラで処理
  const handleSwipeEnd = (e: any) => {
    if (!gameReady || animating) return;
    
    // スワイプの軌跡から方向を判定
    const direction = calculateSwipeDirection(swipeTrailRef.current);
    
    if (direction) {
      handleSwipeWithAnimation(direction);
    } else {
      // 有効なスワイプでない場合はリセット
      setSwiping(false);
      setSwipeDelta({ x: 0, y: 0 });
    }
    
    // スワイプ軌跡をリセット
    swipeTrailRef.current = [];
  };
  
  // タッチ終了時にスワイプ完了イベントを発火
  const handleTouchEnd = () => {
    if (swiping && !animating) {
      handleSwipeEnd({});
    }
  };
  
  // ゲーム退出処理
  const handleQuitGame = () => {
    leaveGame();
    navigate('/modes');
  };
  
  // 現在のスワイプ方向をハイライト表示するためのヘルパー関数
  const isDirectionActive = (direction: 'up' | 'down' | 'left' | 'right'): boolean => {
    if (!swiping) return false;
    
    const calculatedDirection = calculateSwipeDirection(swipeTrailRef.current);
    return calculatedDirection === direction;
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
        {...(gameReady && !animating ? swipeHandlers : {})}
        h="calc(100vh - 150px)"
        position="relative"
        overflow="hidden"
        bg="gray.50"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        alignItems="center"
        px={2}
        onTouchEnd={gameReady && !animating ? handleTouchEnd : undefined}
        onMouseUp={gameReady && !animating ? handleTouchEnd : undefined}
      >
        {!gameReady ? (
          /* カウントダウン中は車の画像を表示せず、カウントダウンのみを表示する */
          <Flex
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="black" /* 完全に不透明な黒色背景 */
            zIndex="10"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
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
          </Flex>
        ) : (
          /* カウントダウン終了後のみ車の画像を表示 */
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flex="1"
            w="100%"
            cursor={swiping ? "grabbing" : "grab"}
            key={`car-container-${currentCarIndex}-${cardRenderKey}`} // 複合キーを追加
          >
            <SwipableCarImage 
              car={currentCar} 
              lastResult={lastResult} 
              swipeDirection={swipeDirection}
              swiping={swiping}
              swipeDelta={swipeDelta}
            />
          </Box>
        )}
        
        {/* 方向インジケーター (十字キー形式に配置) - 常に表示 */}
        <Box
          w="100%"
          maxW="360px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          pb={2}
          mt="auto"
          sx={{
            WebkitTapHighlightColor: "transparent",
            "-webkit-tap-highlight-color": "rgba(0,0,0,0)",
            "& *": {
              WebkitTapHighlightColor: "transparent",
              "-webkit-tap-highlight-color": "rgba(0,0,0,0)",
              outline: "none !important"
            }
          }}
          position="relative"
          zIndex={5}
        >
          {/* 上方向 */}
          <Box mb={1}>
            {Object.entries(currentGame.directionMap)
              .filter(([dir]) => dir === 'up')
              .map(([direction, category]) => (
                <DirectionIndicator 
                  key={direction}
                  direction={direction as 'up' | 'down' | 'left' | 'right'}
                  category={category}
                  isActive={isDirectionActive('up')}
                />
              ))}
          </Box>
          
          {/* 左右方向 */}
          <Flex justifyContent="center" alignItems="center" w="100%" mb={1}>
            <Box mr={2}>
              {Object.entries(currentGame.directionMap)
                .filter(([dir]) => dir === 'left')
                .map(([direction, category]) => (
                  <DirectionIndicator 
                    key={direction}
                    direction={direction as 'up' | 'down' | 'left' | 'right'}
                    category={category}
                    isActive={isDirectionActive('left')}
                  />
                ))}
            </Box>
            
            <Box ml={2}>
              {Object.entries(currentGame.directionMap)
                .filter(([dir]) => dir === 'right')
                .map(([direction, category]) => (
                  <DirectionIndicator 
                    key={direction}
                    direction={direction as 'up' | 'down' | 'left' | 'right'}
                    category={category}
                    isActive={isDirectionActive('right')}
                  />
                ))}
            </Box>
          </Flex>
          
          {/* 下方向 */}
          <Box>
            {Object.entries(currentGame.directionMap)
              .filter(([dir]) => dir === 'down')
              .map(([direction, category]) => (
                <DirectionIndicator 
                  key={direction}
                  direction={direction as 'up' | 'down' | 'left' | 'right'}
                  category={category}
                  isActive={isDirectionActive('down')}
                />
              ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default GamePlayPage;