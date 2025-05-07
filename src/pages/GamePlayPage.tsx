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
  // 方向に応じた表示位置と矢印スタイルを設定
  const getPosition = () => {
    switch (direction) {
      case 'up':
        return { top: '10%', left: '50%', transform: 'translateX(-50%)' };
      case 'right':
        return { top: '50%', right: '10%', transform: 'translateY(-50%)' };
      case 'down':
        return { bottom: '10%', left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { top: '50%', left: '10%', transform: 'translateY(-50%)' };
    }
  };

  const getArrow = () => {
    switch (direction) {
      case 'up': return '↑';
      case 'right': return '→';
      case 'down': return '↓';
      case 'left': return '←';
    }
  };

  return (
    <Box
      position="absolute"
      {...getPosition()}
      bg={isActive ? 'green.500' : 'gray.100'}
      color={isActive ? 'white' : 'gray.600'}
      px={4}
      py={2}
      borderRadius="md"
      fontWeight="bold"
      boxShadow="md"
      zIndex={10}
      textAlign="center"
      transition="all 0.2s"
      _hover={{ bg: 'brand.500', color: 'white' }}
    >
      <Text fontSize="2xl">{getArrow()}</Text>
      <Text fontSize="sm">{category}</Text>
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
  
  // タイマーを管理
  useEffect(() => {
    if (!isGameActive || !currentGame) return;
    
    const startTime = currentGame.startTime;
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isGameActive, currentGame]);
  
  // スワイプ処理のラッパー関数（結果表示のアニメーション用）
  const handleSwipeWithAnimation = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentGame || currentCarIndex >= cars.length) return;
    
    const currentCar = cars[currentCarIndex];
    const expectedCategory = currentGame.directionMap[direction];
    const isCorrect = currentCar.category === expectedCategory;
    
    // スワイプ結果を表示
    setLastResult(isCorrect ? 'correct' : 'incorrect');
    
    // 一定時間後に結果表示をリセット
    setTimeout(() => {
      setLastResult(null);
    }, 500);
    
    // ゲームロジックのスワイプ処理を呼び出し
    handleSwipe(direction);
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
        {...swipeHandlers}
        h="calc(100vh - 150px)"
        position="relative"
        overflow="hidden"
        bg="gray.50"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {/* 方向インジケーター */}
        {Object.entries(currentGame.directionMap).map(([direction, category]) => (
          <DirectionIndicator 
            key={direction}
            direction={direction as 'up' | 'down' | 'left' | 'right'}
            category={category}
            isActive={false}
          />
        ))}
        
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
            >
              <Icon 
                as={lastResult === 'correct' ? FaCheck : FaTimes} 
                boxSize={20} 
                color="white" 
              />
            </Flex>
          )}
        </Box>
        
        {/* カテゴリの指示 */}
        <Box
          position="absolute"
          top="10px"
          left="50%"
          transform="translateX(-50%)"
          bg="rgba(0, 0, 0, 0.7)"
          color="white"
          p={2}
          borderRadius="md"
          fontSize="lg"
          fontWeight="bold"
        >
          カードを正しい方向にスワイプしてください
        </Box>
      </Box>
    </Container>
  );
};

export default GamePlayPage;
