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
  Divider,
  FormHelperText
} from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { registerWithEmail, loginWithGoogle, signInAsGuest } = useAuth();
  
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // メールで新規登録
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 入力検証
    if (!displayName || !email || !password || !confirmPassword) {
      toast({
        title: '入力エラー',
        description: 'すべての項目を入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: 'パスワードエラー',
        description: 'パスワードが一致しません',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: 'パスワードエラー',
        description: 'パスワードは6文字以上で設定してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await registerWithEmail(email, password, displayName);
      toast({
        title: '登録成功',
        description: 'アカウントが作成されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/home');
    } catch (error) {
      toast({
        title: '登録エラー',
        description: 'アカウント登録に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Googleで登録
  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      toast({
        title: 'Googleアカウント連携成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/home');
    } catch (error) {
      toast({
        title: '登録エラー',
        description: 'Googleアカウント連携に失敗しました',
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
          <Heading as="h1" size="xl" color="brand.500">新規登録</Heading>
          <Box w="40px" />
        </Flex>
        
        {/* 登録フォーム */}
        <Box 
          p={8} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px" 
          borderColor={borderColor}
        >
          <form onSubmit={handleEmailRegister}>
            <VStack spacing={4}>
              <FormControl id="displayName" isRequired>
                <FormLabel>ニックネーム</FormLabel>
                <Input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="ゲーム内で表示される名前"
                />
              </FormControl>
              
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
                    placeholder="6文字以上のパスワード"
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
                <FormHelperText>6文字以上で設定してください</FormHelperText>
              </FormControl>
              
              <FormControl id="confirmPassword" isRequired>
                <FormLabel>パスワード（確認）</FormLabel>
                <InputGroup>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="同じパスワードを入力"
                  />
                </InputGroup>
              </FormControl>
              
              <Button 
                type="submit" 
                colorScheme="blue" 
                w="full"
                isLoading={isLoading}
                mt={2}
              >
                アカウント作成
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
              onClick={handleGoogleRegister}
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
              すでにアカウントをお持ちの方は{' '}
              <Link to="/login">
                <Text as="span" color="blue.500" fontWeight="bold">
                  ログイン
                </Text>
              </Link>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default RegisterPage;
