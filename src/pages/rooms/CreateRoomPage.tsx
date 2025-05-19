import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  useColorModeValue,
  useToast,
  Icon,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  useClipboard,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useOutsideClick,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaCopy, FaCheck, FaChevronDown, FaCrown } from 'react-icons/fa';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../../services/firebase';

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { createCustomRoom } = useGame();
  const { currentUser } = useAuth();
  
  // 状態管理
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>('');
  const { hasCopied, onCopy } = useClipboard(roomId);
  
  // プレイヤー情報の状態
  const [roomPlayers, setRoomPlayers] = useState<{[uid: string]: any}>({});
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  
  // テーマカラー
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // プレイヤー名の整形処理（ゲスト名の生成）
  const formatPlayerName = useCallback((player: any, index: number) => {
    // 表示名がある場合はそれを使用
    if (player.displayName && player.displayName.trim() !== '') {
      return player.displayName;
    }
    
    // 表示名がない場合、ゲスト+インデックスを使用
    return `ゲスト${index + 1}`;
  }, []);
  
  // Firebaseからプレイヤー情報をリアルタイムで取得
  useEffect(() => {
    if (!roomId) return;
    
    // game_sessionsからプレイヤー情報を監視
    const playersRef = ref(database, `game_sessions/${roomId}/players`);
    const maxPlayersRef = ref(database, `game_sessions/${roomId}/maxPlayers`);
    
    // プレイヤー情報のリスナー
    const playersUnsubscribe = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        setRoomPlayers(playersData);
        console.log('プレイヤー情報を更新:', playersData);
      }
    });
    
    // 最大プレイヤー数のリスナー
    const maxPlayersUnsubscribe = onValue(maxPlayersRef, (snapshot) => {
      if (snapshot.exists()) {
        const maxPlayersData = snapshot.val();
        setMaxPlayers(maxPlayersData);
        console.log('最大プレイヤー数を更新:', maxPlayersData);
      }
    });
    
    // クリーンアップ関数
    return () => {
      playersUnsubscribe();
      maxPlayersUnsubscribe();
    };
  }, [roomId, database]);
  const handleCreateRoom = async () => {
    if (!currentUser) {
      toast({
        title: 'エラー',
        description: 'ルームを作成するにはログインが必要です',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('ルーム作成: playerCount =', playerCount, typeof playerCount);
      const newRoomId = await createCustomRoom(playerCount);
      setRoomId(newRoomId);
      
      toast({
        title: 'ルーム作成完了',
        description: `ルームID: ${newRoomId} が作成されました`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('ルーム作成エラー:', error);
      toast({
        title: 'エラー',
        description: 'ルームの作成に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // IDをコピーしたときの処理
  const handleCopyRoomId = () => {
    if (roomId) {
      onCopy();
      toast({
        title: 'コピー完了',
        description: 'ルームIDがクリップボードにコピーされました',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };
  
  // ゲーム開始処理
  const handleStartGame = () => {
    navigate('/play');
  };
  
  // ゲームモード選択画面に戻る
  const handleBack = () => {
    navigate('/modes');
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* ヘッダー */}
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="xl" color="brand.500">ルーム作成</Heading>
          <Button 
            leftIcon={<Icon as={FaArrowLeft} />} 
            variant="ghost" 
            onClick={handleBack}
          >
            戻る
          </Button>
        </Flex>
        
        {/* フォームエリア */}
        <Box 
          p={6} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px" 
          borderColor={borderColor}
          w="full"
        >
          <VStack spacing={6} align="stretch">
            <Text>
              カスタムルームを作成して、友だちを招待しましょう。
              作成されたルームIDを共有して、対戦相手に参加してもらいます。
            </Text>
            
            <FormControl>
              <FormLabel htmlFor="playerCount" fontSize="md" fontWeight="bold" mb={2} color="blue.700">最大プレイヤー数</FormLabel>
              
              <Menu placement="bottom" autoSelect={false} closeOnSelect={true} gutter={0}>
                {({ isOpen }) => (
                  <>
                    <MenuButton
                      as={Button}
                      rightIcon={<Icon as={FaChevronDown} transform={isOpen ? "rotate(180deg)" : ""}
                                       transition="all 0.2s" />}
                      leftIcon={<Icon as={FaUsers} color="blue.500" boxSize="20px" />}
                      width="full"
                      height="60px"
                      textAlign="left"
                      borderRadius="md"
                      borderWidth="2px"
                      borderColor={isOpen ? "blue.500" : "blue.400"}
                      bg="white"
                      _hover={{ 
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-300)'
                      }}
                      _active={{
                        bg: 'white',
                      }}
                      transition="all 0.2s"
                      boxShadow={isOpen ? "0 0 0 1px var(--chakra-colors-blue-300)" : "none"}
                      fontSize="xl"
                      fontWeight="medium"
                      px={4}
                      isDisabled={roomId !== ''}
                    >
                      {`${playerCount}人`}
                    </MenuButton>
                    <MenuList
                      minW="full"
                      border="2px solid"
                      borderColor="blue.400"
                      borderRadius="md"
                      mt={-1}
                      shadow="lg"
                      py={1}
                      zIndex={10}
                    >
                      {[2, 3, 4].map((count) => (
                        <MenuItem
                          key={count}
                          onClick={() => {
                            // 値を数値として保存することを明確に
                            const numericCount = Number(count);
                            console.log('プレイヤー数を設定:', numericCount, typeof numericCount);
                            setPlayerCount(numericCount);
                          }}
                          py={3}
                          px={4}
                          bg={playerCount === count ? "blue.50" : "transparent"}
                          _hover={{ bg: "blue.50" }}
                          _focus={{ bg: "blue.50" }}
                          fontSize="lg"
                          icon={
                            playerCount === count ? 
                              <Icon as={FaCheck} color="blue.500" mr={2} /> : 
                              <Box w="16px" h="16px" mr="10px" />
                          }
                          fontWeight={playerCount === count ? "bold" : "normal"}
                          color={playerCount === count ? "blue.700" : "gray.700"}
                          transition="all 0.2s"
                        >
                          {`${count}人`}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </>
                )}
              </Menu>
              
              <Text fontSize="xs" color="blue.600" mt={1}>プレイヤー人数が多いほど、より白熱したゲームに</Text>
            </FormControl>
            
            {!roomId ? (
              <Button
                colorScheme="green"
                size="lg"
                leftIcon={<Icon as={FaUsers} />}
                onClick={handleCreateRoom}
                isLoading={isLoading}
                loadingText="作成中..."
              >
                ルームを作成する
              </Button>
            ) : (
              <VStack spacing={4} w="full">
                <FormControl>
                  <FormLabel htmlFor="roomId">ルームID</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      id="roomId"
                      value={roomId}
                      isReadOnly
                      pr="4.5rem"
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleCopyRoomId}>
                        {hasCopied ? <Icon as={FaCheck} /> : <Icon as={FaCopy} />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                
                {/* プレイヤーリスト */}
                <Box
                  mt={4}
                  p={4}
                  bg="white"
                  borderRadius="md"
                  boxShadow="sm"
                  border="1px"
                  borderColor="gray.200"
                  w="full"
                >
                  <VStack align="stretch" spacing={3}>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold" color="blue.700">
                        参加プレイヤー ({Object.keys(roomPlayers).length}/{maxPlayers}人)
                      </Text>
                      <Badge colorScheme={Object.keys(roomPlayers).length >= maxPlayers ? "green" : "blue"}>
                        {Object.keys(roomPlayers).length >= maxPlayers ? "満員" : "募集中"}
                      </Badge>
                    </Flex>
                    
                    <Divider />
                    
                    {/* 自分（ホスト）の情報 */}
                    {currentUser && roomPlayers[currentUser.uid] && (
                      <HStack>
                        <Box 
                          bg="blue.50" 
                          borderRadius="md" 
                          px={3} 
                          py={2} 
                          w="full"
                        >
                          <HStack justify="space-between">
                            <HStack>
                              <Icon as={FaCrown} color="yellow.500" />
                              <Text fontWeight="bold">
                                {formatPlayerName(roomPlayers[currentUser.uid], 0)} (ホスト)
                              </Text>
                            </HStack>
                            <Badge colorScheme="green">準備完了</Badge>
                          </HStack>
                        </Box>
                      </HStack>
                    )}
                    
                    {/* 他のプレイヤー */}
                    {Object.entries(roomPlayers)
                      .filter(([uid, _]) => uid !== (currentUser?.uid || ''))
                      .map(([uid, player], index) => (
                        <HStack key={uid}>
                          <Box 
                            bg="gray.50" 
                            borderRadius="md" 
                            px={3} 
                            py={2} 
                            w="full"
                          >
                            <HStack justify="space-between">
                              <Text>
                                {formatPlayerName(player, index + 1)}
                              </Text>
                              <Badge colorScheme={player.isReady ? "green" : "gray"}>
                                {player.isReady ? "準備完了" : "待機中"}
                              </Badge>
                            </HStack>
                          </Box>
                        </HStack>
                      ))
                    }
                    
                    {/* 残りの空きスロット */}
                    {Array(maxPlayers - Object.keys(roomPlayers).length).fill(0).map((_, index) => (
                      <HStack key={`empty-${index}`}>
                        <Box 
                          borderRadius="md" 
                          px={3} 
                          py={2} 
                          w="full"
                          borderStyle="dashed"
                          borderWidth="1px"
                          borderColor="gray.200"
                        >
                          <Text color="gray.400">プレイヤー募集中...</Text>
                        </Box>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
                
                <HStack spacing={4} width="full">
                  <Button
                    colorScheme="blue"
                    size="lg"
                    flex={1}
                    onClick={handleStartGame}
                    isDisabled={Object.keys(roomPlayers).length < maxPlayers}
                    title={Object.keys(roomPlayers).length < maxPlayers 
                      ? `全プレイヤー(${maxPlayers}人)が揃うまでお待ちください` 
                      : "ゲームを開始します"}
                  >
                    ゲームを開始
                  </Button>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    flex={1}
                    leftIcon={<Icon as={FaCopy} />}
                    onClick={handleCopyRoomId}
                  >
                    IDをコピー
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>
        </Box>
        
        {/* 説明エリア */}
        {roomId && (
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="lg" 
            boxShadow="md"
            border="1px" 
            borderColor={borderColor}
            w="full"
          >
            <VStack spacing={4} align="start">
              <Heading as="h3" size="md">友だちを招待するには</Heading>
              <Text>
                1. 上のルームIDをコピーして友だちに共有します
              </Text>
              <Text>
                2. 友だちは「ルームに参加」ボタンを押し、ルームIDを入力します
              </Text>
              <Text>
                3. 全員が参加したら、「ゲームを開始」ボタンを押しましょう
              </Text>
              <Text fontWeight="bold">
                設定した最大人数（{playerCount}人）に達すると自動的にゲームが開始されます
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default CreateRoomPage;