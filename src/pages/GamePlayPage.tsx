import React, { useEffect, useState } from 'react';
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
import { FaClock, FaTimes, FaCheck } from 'react-icons/fa';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useSwipe } from '../hooks/useSwipe';
import { CarCategory, DirectionMap } from '../types';

// 方向表示用のコンポーネント
interface DirectionIndicatorProps {
  direction: 'up' | 'down' | 'left' | 'right';
  category: CarCategory;
  isActive: boolean;
}

const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({ direction, category, isActive }) => {
  return (
    <Box
      bg={isActive ? 'green.500' : 'gray.100'}
      color={isActive ? 'white' : 'gray.600'}
      px={4}
      py={2}
      borderRadius="md"
      fontWeight="bold"
      boxShadow="md"
      textAlign="center"
      transition="all 0.2s"
      _hover={{ bg: 'brand.500', color: 'white' }}
      width="160px"
      height="80px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Text fontSize="2xl">{
        direction === 'up' ? '↑' : 
        direction === 'right' ? '→' : 
        direction === 'down' ? '↓' : 
        '←'
      }</Text>
      <Text fontSize="sm" isTruncated maxW="140px">{category}</Text>
    </Box>
  );
};

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
  
  // スワイプハンドラーを取得
  const swipeHandlers = useSwipe();
  
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
  
  // スワイプ処理のラッパー関数（結果表示のアニメーション用）
  const handleSwipeWithAnimation = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentGame || currentCarIndex >= cars.length || !gameReady) return;
    
    const currentCar = cars[currentCarIndex];
    const expectedCategory = currentGame.directionMap[direction];
    
    // 画像のカテゴリと一致するかチェック
    const isCorrect = currentCar.category === expectedCategory;
    
    // スワイプ結果を表示
    setLastResult(isCorrect ? 'correct' : 'incorrect');
    
    // 一定時間後に結果表示をリセット
    setTimeout(() => {
      setLastResult(null);
    }, 1500);
    
    // ゲームロジックのスワイプ処理を呼び出し
    handleSwipe(direction);
    
    // 注: ここではUIの更新は必要ありません。handleSwipe内でcurrentGameが更新されるため、
    // Reactのレンダリングサイクルで自動的に方向インジケーターが更新されます。
  };
  
  // ゲーム退出処理
  const handleQuitGame = () => {
    leaveGame();
    navigate('/modes');
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
        {...(gameReady ? swipeHandlers : {})}
        h="calc(100vh - 150px)"
        position="relative"
        overflow="hidden"
        bg="gray.50"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        alignItems="center"
      >
        {/* カウントダウンオーバーレイ */}
        {!gameReady && (
          <Flex
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.7)"
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
        )}
        {/* 車の画像 */}
        <Box
          w="80%"
          h="60%"
          maxW="500px"
          maxH="300px"
          borderRadius="lg"
          overflow="hidden"
          boxShadow="xl"
          position="relative"
          mt={8}
          mb="auto"
          className="css-y53gux"
        >
          <Box
            as="img"
            src={currentCar?.imageUrl || '/images/placeholder-car.jpg'}
            alt={`車種: ${currentCar?.category || '不明'}`}
            w="100%"
            h="100%"
            objectFit="cover"
            filter={lastResult ? 'blur(2px)' : 'none'}
          />
          
          {/* スワイプ結果の表示 */}
          {lastResult && (
            <Flex
              position="absolute"
              top="0"
              left="0"
              w="100%"
              h="100%"
              bg={lastResult === 'correct' ? 'green.500' : 'red.500'}
              opacity="0.7"
              justifyContent="center"
              alignItems="center"
              flexDirection="column"
            >
              <Icon 
                as={lastResult === 'correct' ? FaCheck : FaTimes} 
                boxSize={24} 
                color="white" 
                mb={3}
              />
              <Text
                color="white"
                fontSize="4xl"
                fontWeight="extrabold"
                textShadow="0 0 12px rgba(0,0,0,0.7)"
                textAlign="center"
                px={4}
                transform="scale(1.2)"
                transition="transform 0.3s ease-in-out"
              >
                {lastResult === 'correct' ? '正解！' : '不正解！'}
              </Text>
            </Flex>
          )}
        </Box>
        
        {/* 方向インジケーター (十字キー形式に配置) */}
        <Box
          w="100%"
          maxW="300px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          pb={4}
          mt="auto"
        >
          {/* 上方向 */}
          <Box mb={2}>
            {Object.entries(currentGame.directionMap)
              .filter(([dir]) => dir === 'up')
              .map(([direction, category]) => (
                <DirectionIndicator 
                  key={direction}
                  direction={direction as 'up' | 'down' | 'left' | 'right'}
                  category={category}
                  isActive={false}
                />
              ))}
          </Box>
          
          {/* 左右方向 */}
          <Flex justifyContent="center" alignItems="center" w="100%" mb={2}>
            <Box mr={4}>
              {Object.entries(currentGame.directionMap)
                .filter(([dir]) => dir === 'left')
                .map(([direction, category]) => (
                  <DirectionIndicator 
                    key={direction}
                    direction={direction as 'up' | 'down' | 'left' | 'right'}
                    category={category}
                    isActive={false}
                  />
                ))}
            </Box>
            
            <Box ml={4}>
              {Object.entries(currentGame.directionMap)
                .filter(([dir]) => dir === 'right')
                .map(([direction, category]) => (
                  <DirectionIndicator 
                    key={direction}
                    direction={direction as 'up' | 'down' | 'left' | 'right'}
                    category={category}
                    isActive={false}
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
                  isActive={false}
                />
              ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default GamePlayPage;
