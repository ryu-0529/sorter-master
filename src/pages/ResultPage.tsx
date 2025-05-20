import React, { useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaMedal, FaClock, FaRedo, FaHome } from 'react-icons/fa';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { gameResult, rankings, fetchRankings, startSinglePlayerGame } = useGame();
  const { currentUser } = useAuth();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 結果画面表示時にランキングを更新
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);
  
  // ゲーム結果がない場合
  if (!gameResult) {
    return (
      <Container centerContent maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <Heading>ゲーム結果がありません</Heading>
          <Button colorScheme="blue" onClick={() => navigate('/modes')}>
            ゲームモード選択に戻る
          </Button>
        </VStack>
      </Container>
    );
  }
  
  // 精度（正答率）を計算
  const accuracy = Math.round((gameResult.correctAnswers / gameResult.totalAnswers) * 100);
  
  // 時間を分秒形式に変換
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 自分のランキング順位を取得
  const getMyRanking = (): number => {
    if (!currentUser) return 0;
    
    const myIndex = rankings.findIndex(entry => entry.userId === currentUser.uid);
    return myIndex >= 0 ? myIndex + 1 : 0;
  };
  
  // ランキング表示用のメダル
  const getRankBadge = (rank: number): JSX.Element => {
    switch (rank) {
      case 1:
        return <Icon as={FaTrophy} color="yellow.400" boxSize={5} />;
      case 2:
        return <Icon as={FaMedal} color="gray.400" boxSize={5} />;
      case 3:
        return <Icon as={FaMedal} color="orange.400" boxSize={5} />;
      default:
        return <Text fontWeight="bold">{rank}</Text>;
    }
  };
  
  // 日付をフォーマット
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // ゲームをリトライ
  const handleRetry = () => {
    // 直接ゲームを開始する
    startSinglePlayerGame();
    navigate('/play');
  };
  
  // ゲームモード選択へ
  const handleBackToModes = () => {
    navigate('/modes');
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* ヘッダー */}
        <Flex justifyContent="center" alignItems="center">
          <Heading as="h1" size="xl" color="brand.500">ゲーム結果</Heading>
        </Flex>
        
        {/* スコアカード */}
        <Box 
          p={8} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px" 
          borderColor={borderColor}
        >
          <VStack spacing={6}>
            <Heading as="h2" size="lg" color="brand.600">
              {gameResult.isMultiplayer ? 'マルチプレイヤー対戦結果' : 'あなたのスコア'}
            </Heading>
            
            {gameResult.isMultiplayer && gameResult.playerRank && (
              <Flex
                direction="column"
                align="center"
                justify="center"
                p={6}
                bg={gameResult.playerRank === 1 ? 'yellow.50' : 'gray.50'}
                borderRadius="xl"
                boxShadow="md"
                w="full"
                maxW="md"
                position="relative"
                overflow="hidden"
              >
                {gameResult.playerRank === 1 && (
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h="8px"
                    bg="yellow.400"
                  />
                )}
                
                <Heading size="xl" color={gameResult.playerRank === 1 ? 'yellow.500' : 'gray.600'} mb={2}>
                  {gameResult.playerRank}位 / {gameResult.totalPlayers}人中
                </Heading>
                
                <Text fontWeight="bold" fontSize="md" color="gray.500">
                  {gameResult.playerRank === 1 
                    ? '1位おめでとうございます！最高の成績です！' 
                    : gameResult.playerRank === 2 
                      ? '2位獲得！あと少しで1位でした！'
                      : gameResult.playerRank === 3
                        ? '3位入賞！よくがんばりましたね！'
                        : 'またチャレンジしてより高い順位を目指しましょう！'}
                </Text>
              </Flex>
            )}
            
            <HStack spacing={8} wrap="wrap" justify="center">
              <Box textAlign="center" p={4}>
                <Text fontSize="sm" color="gray.500">総スコア</Text>
                <Text fontSize="4xl" fontWeight="bold" color="blue.500">
                  {gameResult.score}
                </Text>
              </Box>
              
              <Box textAlign="center" p={4}>
                <Text fontSize="sm" color="gray.500">精度</Text>
                <Text fontSize="4xl" fontWeight="bold" color="green.500">
                  {accuracy}%
                </Text>
              </Box>
              
              <Box textAlign="center" p={4}>
                <Text fontSize="sm" color="gray.500">所要時間</Text>
                <Text fontSize="4xl" fontWeight="bold" color="purple.500">
                  {formatTime(gameResult.timeInSeconds)}
                </Text>
              </Box>
              
              {getMyRanking() > 0 && !currentUser?.isAnonymous && (
                <Box textAlign="center" p={4}>
                  <Text fontSize="sm" color="gray.500">ランキング</Text>
                  <Text fontSize="4xl" fontWeight="bold" color="orange.500">
                    {getMyRanking()}位
                  </Text>
                </Box>
              )}
              
              {currentUser?.isAnonymous && (
                <Box textAlign="center" p={4}>
                  <Text fontSize="sm" color="gray.500">ゲストプレイ</Text>
                  <Text fontSize="md" fontWeight="normal" color="gray.500">
                    登録ユーザーになるとランキングに参加できます
                  </Text>
                </Box>
              )}
            </HStack>
            
            <HStack spacing={4}>
              <Button 
                leftIcon={<Icon as={FaRedo} />} 
                colorScheme="blue" 
                onClick={handleRetry}
              >
                リトライ
              </Button>
              <Button 
                leftIcon={<Icon as={FaHome} />} 
                variant="outline" 
                onClick={handleBackToModes}
              >
                ゲームモード選択へ
              </Button>
            </HStack>
          </VStack>
        </Box>
        
        {/* ランキング - ゲストユーザーでない場合のみ表示 */}
        <Box 
          p={6} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px" 
          borderColor={borderColor}
        >
          <VStack spacing={4} align="stretch">
            <Heading as="h2" size="md" display="flex" alignItems="center">
              <Icon as={FaTrophy} color="yellow.400" mr={2} />
              ランキング
              {currentUser?.isAnonymous && (
                <Badge ml={2} colorScheme="gray">閲覧のみ</Badge>
              )}
            </Heading>
            
            {currentUser?.isAnonymous && (
              <Box p={2} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600">
                  ゲストモードではランキングに登録されません。ユーザー登録するとランキングに参加できます。
                </Text>
              </Box>
            )}
            
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th width="10%">順位</Th>
                    <Th width="30%">プレイヤー</Th>
                    <Th width="15%" isNumeric>スコア</Th>
                    <Th width="15%" isNumeric>時間</Th>
                    <Th width="30%">日付</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rankings.slice(0, 10).map((entry, index) => (
                    <Tr 
                      key={entry.id}
                      bg={currentUser && !currentUser.isAnonymous && entry.userId === currentUser.uid ? 'blue.50' : undefined}
                    >
                      <Td>
                        <Flex alignItems="center" justifyContent="center">
                          {getRankBadge(index + 1)}
                        </Flex>
                      </Td>
                      <Td>
                        <Text fontWeight={currentUser && !currentUser.isAnonymous && entry.userId === currentUser.uid ? 'bold' : 'normal'}>
                          {entry.displayName}
                          {currentUser && !currentUser.isAnonymous && entry.userId === currentUser.uid && (
                            <Badge ml={2} colorScheme="blue">あなた</Badge>
                          )}
                        </Text>
                      </Td>
                      <Td isNumeric fontWeight="bold">{entry.score}</Td>
                      <Td isNumeric>
                        <HStack spacing={1} justifyContent="flex-end">
                          <Icon as={FaClock} color="gray.500" boxSize={3} />
                          <Text>{formatTime(entry.time)}</Text>
                        </HStack>
                      </Td>
                      <Td>{formatDate(entry.date)}</Td>
                    </Tr>
                  ))}
                  
                  {rankings.length === 0 && (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={4}>
                        ランキングデータがありません
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default ResultPage;
