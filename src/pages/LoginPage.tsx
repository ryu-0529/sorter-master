import React, { useState } from 'react';
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
import { FaGoogle, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { loginWithEmail, loginWithGoogle, signInAsGuest } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
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
        duration: 3000,
        isClosable: true,
      });
      navigate('/home');
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
        duration: 3000,
        isClosable: true,
      });
      navigate('/home');
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
  
  // ゲストとしてログイン
  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      await signInAsGuest();
      toast({
        title: 'ゲストログイン成功',
        description: '後からアカウント登録も可能です',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/home');
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
  
  // ホームに戻る
  const handleBackToHome = () => {
    navigate('/');
  };
  
  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        {/* ヘッダー */}
        <Flex justifyContent="space-between" alignItems="center">
          <Button 
            leftIcon={<Icon as={FaArrowLeft} />} 
            variant="ghost" 
            onClick={handleBackToHome}
          >
            戻る
          </Button>
          <Heading as="h1" size="xl" color="brand.500">ログイン</Heading>
          <Box w="40px" />
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
              variant="ghost" 
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
