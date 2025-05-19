import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  useColorModeValue,
  useToast,
  Icon
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { joinRoomById } = useGame();
  const { currentUser } = useAuth();
  
  // 状態管理
  const [roomId, setRoomId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // テーマカラー
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // ルーム参加処理
  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      toast({
        title: 'ルームIDが入力されていません',
        description: '有効なルームIDを入力してください',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // この関数はGameContextに実装されていないため
      // 後で実装する必要があります
      await joinRoomById(roomId);
      
      toast({
        title: 'ルームに参加しました',
        description: `ルームID: ${roomId}に参加しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // ゲームプレイ画面に遷移
      navigate('/play');
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'ルーム参加に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
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
          <Heading as="h1" size="xl" color="brand.500">ルーム参加</Heading>
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
          <VStack spacing={6} align="start">
            <Text>
              ルームIDを入力して、既に作成されたルームに参加します。
              ルームIDは、ルーム作成者から提供されます。
            </Text>
            
            <FormControl>
              <FormLabel htmlFor="roomId">ルームID</FormLabel>
              <Input
                id="roomId"
                placeholder="例: xyz-123-abc"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                size="lg"
              />
              <FormHelperText>
                ルーム作成者から提供されたIDを入力してください
              </FormHelperText>
            </FormControl>
            
            <Button
              colorScheme="green"
              size="lg"
              width="full"
              leftIcon={<Icon as={FaSearch} />}
              onClick={handleJoinRoom}
              isLoading={isLoading}
              loadingText="検索中..."
            >
              ルームを検索して参加
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default JoinRoomPage;