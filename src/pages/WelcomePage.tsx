import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Spinner,
  Center
} from '@chakra-ui/react';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    console.log('🏠 WelcomePageコンポーネントがマウントされました');
    console.log('現在のユーザー:', currentUser);
    console.log('ローディング状態:', loading);
    
    // 認証状態の確認が完了したら適切なページにリダイレクト
    if (!loading) {
      if (currentUser) {
        // ログイン済みの場合はホームページへ
        console.log('ユーザーがログイン済み。ホームページへリダイレクト');
        navigate('/home');
      } else {
        // 未ログインの場合はログインページへ
        console.log('ユーザーが未ログイン。ログインページへリダイレクト');
        navigate('/login');
      }
    }
  }, [currentUser, loading, navigate]);

  // ローディング中の表示
  if (loading) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="brand.500"
            size="xl"
          />
          <Text color="gray.600">読み込み中...</Text>
        </VStack>
      </Center>
    );
  }

  // 通常はリダイレクトされるため、この部分は表示されないはず
  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="lg" centerContent>
        <VStack spacing={8}>
          <Heading as="h1" size="2xl" color="brand.500">
            🚗 仕分け職人
          </Heading>
          
          <Text fontSize="xl" color="gray.600" textAlign="center">
            素早く正確に分類するスキルを競おう！
          </Text>
          
          <Text color="gray.500" fontSize="sm">
            リダイレクト中...
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default WelcomePage;
