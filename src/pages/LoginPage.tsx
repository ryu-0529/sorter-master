import React, { useState, useEffect } from 'react';
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
  Input,
  InputGroup,
  InputRightElement,
  Icon,
  Image,
  useColorModeValue,
  useToast,
  Divider
} from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { FaApple, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser, loading, loginWithEmail, loginWithGoogle, loginWithApple, signInAsGuest } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 認証状態を監視して自動的にホームページに遷移
  useEffect(() => {
    if (!loading && currentUser) {
      console.log('LoginPage: ユーザーがログイン済み、ホームページに遷移');
      navigate('/home');
    }
  }, [currentUser, loading, navigate]);
  
  // メールでログイン
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: '入力エラー',
        description: 'メールアドレスとパスワードを入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await loginWithEmail(email, password);
      toast({
        title: 'ログイン成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      // navigate('/home') は useEffect で自動的に処理される
    } catch (error) {
      toast({
        title: 'ログインエラー',
        description: 'メールアドレスまたはパスワードが正しくありません',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Googleでログイン
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      toast({
        title: 'ログイン成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      // navigate('/home') は useEffect で自動的に処理される
    } catch (error) {
      toast({
        title: 'ログインエラー',
        description: 'Googleログインに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Appleでログイン
  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithApple();
      toast({
        title: 'ログイン成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      // navigate('/home') は useEffect で自動的に処理される
    } catch (error) {
      toast({
        title: 'ログインエラー',
        description: 'Appleログインに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // ゲストとしてログイン
  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      await signInAsGuest();
      toast({
        title: 'ゲストログイン成功',
        description: '後からアカウント登録も可能です',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      // navigate('/home') は useEffect で自動的に処理される
    } catch (error) {
      toast({
        title: 'ログインエラー',
        description: 'ゲストログインに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        {/* ヘッダー */}
        <Flex justifyContent="center" alignItems="center">
          <Heading as="h1" size="xl" color="brand.500">ログイン</Heading>
        </Flex>
        
        {/* ログインフォーム */}
        <Box 
          p={8} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px" 
          borderColor={borderColor}
        >
          <form onSubmit={handleEmailLogin}>
            <VStack spacing={6}>
              <FormControl id="email" isRequired>
                <FormLabel>メールアドレス</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="example@mail.com"
                />
              </FormControl>
              
              <FormControl id="password" isRequired>
                <FormLabel>パスワード</FormLabel>
                <InputGroup>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="パスワードを入力"
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Icon as={showPassword ? FaEyeSlash : FaEye} />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <Button 
                type="submit" 
                colorScheme="blue" 
                w="full"
                isLoading={isLoading}
              >
                ログイン
              </Button>
            </VStack>
          </form>
          
          <Divider my={6} />
          
          <VStack spacing={4}>
            {/* Sign in with Apple - 最優先で表示 */}
            <Button 
              leftIcon={<Icon as={FaApple} />}
              bg="#000000"
              color="white"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="600"
              border="1px"
              borderColor="#000000"
              borderRadius="6px"
              height="44px"
              px={4}
              _hover={{ bg: "#1a1a1a" }}
              _active={{ bg: "#333333" }}
              w="full"
              onClick={handleAppleLogin}
              isLoading={isLoading}
            >
              Sign in with Apple
            </Button>
            
            <Button 
              leftIcon={<Image src="/images/google-logo.svg" alt="Google logo" boxSize="18px" />}
              bg="white"
              color="#1F1F1F"
              fontFamily="Roboto, sans-serif"
              fontWeight="500"
              border="1px"
              borderColor="#dadce0"
              borderRadius="4px"
              height="40px"
              px={4}
              _hover={{ boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.3)" }}
              w="full"
              onClick={handleGoogleLogin}
              isLoading={isLoading}
            >
              Googleでログイン
            </Button>
            
            <Button 
              variant="outline" 
              colorScheme="green"
              borderWidth="2px"
              borderColor="green.500"
              color="green.600"
              bg="white"
              _hover={{ 
                bg: "green.50",
                borderColor: "green.600",
                color: "green.700"
              }}
              _active={{ 
                bg: "green.100",
                borderColor: "green.700"
              }}
              w="full"
              onClick={handleGuestLogin}
              isLoading={isLoading}
            >
              ゲストとしてプレイ
            </Button>
            
            <Text fontSize="sm" textAlign="center">
              アカウントをお持ちでない方は{' '}
              <Link to="/register">
                <Text as="span" color="blue.500" fontWeight="bold">
                  新規登録
                </Text>
              </Link>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default LoginPage;
