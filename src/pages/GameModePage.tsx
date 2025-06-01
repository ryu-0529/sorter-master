import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Icon,
  useColorModeValue,
  useToast 
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaUsers, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useAdMob } from '../contexts/AdMobContext';
import TutorialOverlay from '../components/TutorialOverlay';
import BannerAdSpace from '../components/BannerAdSpace';

const GameModePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { 
    startSinglePlayerGame, 
    joinMultiplayerGame, 
    createMultiplayerGame,
    startTutorial,
    closeTutorial,
    finishTutorial,
    isTutorialOpen,
    startInteractiveTutorial
  } = useGame();
  const { currentUser } = useAuth();
  const { showInterstitialAd } = useAdMob();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // ランキング戦（1人プレイ）開始
  const handleStartSinglePlayer = async () => {
    // インターステイシャル広告を表示
    await showInterstitialAd();
    
    startSinglePlayerGame();
    navigate('/game-play');
  };
  
  // 通信対戦（マッチメイキング）開始
  const handleJoinMultiplayer = async () => {
    try {
      await joinMultiplayerGame();
      toast({
        title: 'マッチメイキング中...',
        description: '他のプレイヤーを探しています',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      navigate('/game-play');
    } catch (error) {
      toast({
        title: 'エラー',
        description: '通信対戦の開始に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 通信対戦（ルーム作成）開始
  const handleCreateMultiplayer = async () => {
    try {
      const gameId = await createMultiplayerGame();
      toast({
        title: 'ルーム作成完了',
        description: `ルームID: ${gameId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/game-play');
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'ルームの作成に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // チュートリアル画面を開く
  const handleStartTutorial = () => {
    // インタラクティブなチュートリアルを開始し、ゲームプレイ画面に遷移
    startInteractiveTutorial();
    navigate('/game-play');
  };
  
  // ホーム画面へ戻る
  const handleBackToHome = () => {
    navigate('/home');
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      {/* チュートリアルオーバーレイ */}
      <TutorialOverlay 
        isOpen={isTutorialOpen} 
        onClose={closeTutorial} 
        onFinish={finishTutorial} 
      />
      
      <VStack spacing={8} align="stretch">
        {/* ヘッダー */}
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="xl" color="brand.500">ゲームモード選択</Heading>
          <Button 
            leftIcon={<Icon as={FaArrowLeft} />} 
            variant="ghost" 
            onClick={handleBackToHome}
          >
            戻る
          </Button>
        </Flex>
        
        {/* ゲームモード一覧 */}
        <VStack spacing={4}>
          {/* ランキング戦 */}
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="lg" 
            boxShadow="md"
            border="1px" 
            borderColor={borderColor}
            w="full"
          >
            <HStack spacing={4} alignItems="flex-start">
              <Icon as={FaTrophy} boxSize={10} color="yellow.500" />
              <VStack align="start" spacing={3} flex={1}>
                <Heading as="h2" size="md">ランキング戦（1人プレイ）</Heading>
                <Text>
                  制限時間内にできるだけ多くの車種を正確に分類しよう！
                  あなたのスコアはランキングに記録されます。
                </Text>
                <Button 
                  colorScheme="blue" 
                  onClick={handleStartSinglePlayer}
                >
                  スタート
                </Button>
              </VStack>
            </HStack>
          </Box>
          
          {/* 通信対戦 */}
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="lg" 
            boxShadow="md"
            border="1px" 
            borderColor={borderColor}
            w="full"
          >
            <HStack spacing={4} alignItems="flex-start">
              <Icon as={FaUsers} boxSize={10} color="green.500" />
              <VStack align="start" spacing={3} flex={1}>
                <Heading as="h2" size="md">通信対戦（最大4人）</Heading>
                <Text>
                  他のプレイヤーとリアルタイムで対戦！
                  同じカードセットで正確さとスピードを競い合おう。
                </Text>
                <VStack spacing={4} align="flex-start">
                  <Button 
                    colorScheme="green" 
                    onClick={() => navigate('/join-room')}
                    width="200px"
                  >
                    ルームに参加
                  </Button>
                  <Button 
                    variant="outline" 
                    colorScheme="green"
                    onClick={() => navigate('/create-room')}
                    width="200px"
                  >
                    ルーム作成
                  </Button>
                </VStack>
              </VStack>
            </HStack>
          </Box>
          
          {/* チュートリアル */}
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="lg" 
            boxShadow="md"
            border="1px" 
            borderColor={borderColor}
            w="full"
          >
            <HStack spacing={4} alignItems="flex-start">
              <Icon as={FaInfoCircle} boxSize={10} color="purple.500" />
              <VStack align="start" spacing={3} flex={1}>
                <Heading as="h2" size="md">チュートリアル</Heading>
                <Text>
                  ゲームのルールと遊び方を学ぼう！
                  初めての方はここからスタートしましょう。
                </Text>
                <Button 
                  colorScheme="purple" 
                  onClick={handleStartTutorial}
                >
                  始める
                </Button>
              </VStack>
            </HStack>
          </Box>
        </VStack>
        
        {/* バナー広告用スペース */}
        <Box pb={16}>
          {/* バナー広告エリア分のスペースを確保 */}
        </Box>
      </VStack>
      
      {/* バナー広告 */}
      <BannerAdSpace />
    </Container>
  );
};

export default GameModePage;
