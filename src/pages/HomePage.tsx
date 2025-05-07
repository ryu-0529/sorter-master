import React from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  VStack, 
  Image, 
  useColorModeValue 
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, signInAsGuest } = useAuth();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // ゲストとしてログインしてゲームモード選択画面へ
  const handleStartGame = async () => {
    if (!currentUser) {
      await signInAsGuest();
    }
    navigate('/modes');
  };
  
  // ユーザープロファイル画面へ
  const handleProfileClick = () => {
    navigate('/profile');
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* ヘッダー */}
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="xl" color="brand.500">仕分け職人</Heading>
          {currentUser && (
            <Button 
              onClick={handleProfileClick}
              variant="outline"
              colorScheme="blue"
            >
              プロフィール
            </Button>
          )}
        </Flex>
        
        {/* メインコンテンツ */}
        <Box 
          p={8} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px" 
          borderColor={borderColor}
        >
          <VStack spacing={6} align="center">
            <Image 
              src="/images/logo.png" 
              alt="仕分け職人ロゴ" 
              boxSize="200px"
              fallbackSrc="https://via.placeholder.com/200?text=仕分け職人"
            />
            
            <Text fontSize="xl" textAlign="center">
              車種を素早く正確に分類するスキルを競おう！
              スワイプ操作でカテゴリー分けに挑戦！
            </Text>
            
            <Button 
              size="lg" 
              colorScheme="blue" 
              w="full" 
              onClick={handleStartGame}
            >
              車種振り分けゲーム
            </Button>
            
            <Text color="gray.500" fontSize="sm">
              ※他のゲームモードは準備中です
            </Text>
          </VStack>
        </Box>
        
        {/* フッター */}
        <VStack spacing={2} pt={4}>
          <Text fontSize="sm" color="gray.500">
            仕分け職人 v0.1.0
          </Text>
          <Text fontSize="xs" color="gray.400">
            © 2025 Sorter Master App
          </Text>
        </VStack>
      </VStack>
    </Container>
  );
};

export default HomePage;
