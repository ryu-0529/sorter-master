import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
  Grid,
  Icon,
  useToast
} from '@chakra-ui/react';
import { FaCar, FaSignOutAlt, FaCog, FaUser } from 'react-icons/fa';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const toast = useToast();
  
  useEffect(() => {
    console.log('🏠 HomePageコンポーネントがマウントされました');
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleStartCarSortingGame = () => {
    navigate('/modes');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'ログアウトエラー',
        description: 'ログアウトに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Box height="100vh" display="flex" flexDirection="column" bg="gray.50">
      {/* ヘッダー - 固定 */}
      <Box bg="white" shadow="sm" flexShrink={0}>
        <Container maxW="lg" py={4}>
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Avatar
                size="sm"
                name={currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                src={currentUser.photoURL || undefined}
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="bold">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'ゲストユーザー'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {currentUser.email || 'ゲストモード'}
                </Text>
              </VStack>
            </HStack>
            
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaCog />}
                variant="ghost"
                aria-label="メニュー"
              />
              <MenuList>
                <MenuItem icon={<FaUser />} onClick={handleProfile}>
                  プロフィール
                </MenuItem>
                <Divider />
                <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>
                  ログアウト
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Container>
      </Box>

      {/* メインコンテンツ - スクロール可能エリア */}
      <Box flex="1" overflow="auto">
        <Container maxW="lg" py={8}>
          <VStack spacing={8}>
            {/* タイトル */}
            <VStack spacing={2}>
              <Heading as="h1" size="2xl" color="brand.500">
                ゲーム一覧
              </Heading>
              <Text color="gray.600" fontSize="lg">
                プレイしたいゲームを選択してください
              </Text>
            </VStack>

            {/* ゲームメニュー */}
            <Grid
              templateColumns="repeat(auto-fit, minmax(280px, 1fr))"
              gap={6}
              w="full"
            >
              {/* 車種仕分けゲーム */}
              <Card
                cursor="pointer"
                onClick={handleStartCarSortingGame}
                _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                transition="all 0.2s"
                position="relative"
                overflow="hidden"
              >
                <CardBody>
                  <VStack spacing={4}>
                    <Icon as={FaCar} boxSize={12} color="brand.500" />
                    <Heading size="md">車種仕分けゲーム</Heading>
                    <Text color="gray.600" textAlign="center">
                      車種を素早く正確に分類しよう！
                    </Text>
                    <Button colorScheme="blue" size="lg" w="full">
                      ゲームを始める
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
