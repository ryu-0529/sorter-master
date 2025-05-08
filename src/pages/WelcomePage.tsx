import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Image,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Icon,
  useColorModeValue,
  Divider,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { loginWithEmail, loginWithGoogle, signInAsGuest } = useAuth();

  // フォーム状態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // スタイル
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const boxShadow = useColorModeValue('lg', 'dark-lg');

  // メールログイン処理
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
      navigate('/modes');
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

  // Googleログイン処理
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
      navigate('/modes');
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

  // ゲストログイン処理
  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      await signInAsGuest();
      navigate('/modes');
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'ゲストログインに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 新規登録画面へ
  const handleGoToRegister = () => {
    navigate('/register');
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch" w="full">
        {/* ロゴとタイトル */}
        <VStack spacing={4} alignItems="center">
          {/* <Image
            // src="/images/logo.svg"
            alt="仕分け職人ロゴ"
            boxSize="10px"
            fallbackSrc="https://via.placeholder.com/150?text=仕分け職人"
          /> */}
          <Heading as="h1" size="xl" color="brand.500" textAlign="center">
            仕分け職人
          </Heading>
          <Text fontSize="lg" textAlign="center" color="gray.600">
            素早く正確に分類するスキルを競おう！
          </Text>
        </VStack>

        {/* メインコンテンツ */}
        <Box
          p={8}
          bg={bgColor}
          borderRadius="xl"
          boxShadow={boxShadow}
          border="1px"
          borderColor={borderColor}
        >
          <Tabs variant="soft-rounded" colorScheme="blue" isFitted>
            <TabList mb={4}>
              <Tab>ログイン</Tab>
              <Tab>ゲストプレイ</Tab>
            </TabList>
            
            <TabPanels>
              {/* ログインパネル */}
              <TabPanel>
                <VStack spacing={6}>
                  <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
                    <VStack spacing={4} alignItems="flex-start">
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
                        mt={2}
                        isLoading={isLoading}
                      >
                        ログイン
                      </Button>
                    </VStack>
                  </form>
                  
                  <Divider />
                  
                  <Button
                    leftIcon={<Icon as={FaGoogle} />}
                    colorScheme="red"
                    variant="outline"
                    w="full"
                    onClick={handleGoogleLogin}
                    isLoading={isLoading}
                  >
                    Googleでログイン
                  </Button>
                  
                  <Text fontSize="sm" textAlign="center">
                    アカウントをお持ちでない場合は
                    <Button
                      variant="link"
                      colorScheme="blue"
                      onClick={handleGoToRegister}
                      ml={1}
                    >
                      新規登録
                    </Button>
                  </Text>
                </VStack>
              </TabPanel>
              
              {/* ゲストプレイパネル */}
              <TabPanel>
                  <VStack align="flex-start" spacing={4}>
                  <Text textAlign="center">
                    アカウント登録なしで手軽にプレイできます。
                    ただし、スコアやプレイ履歴は保存されません。
                  </Text>
                  
                  <Button
                    colorScheme="teal"
                    size="lg"
                    w="full"
                    onClick={handleGuestLogin}
                    isLoading={isLoading}
                  >
                    ゲストとしてプレイ
                  </Button>
                  
                  <Text fontSize="sm" textAlign="center" color="gray.500">
                    あとからアカウント登録できます
                  </Text>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        
        {/* フッター */}
        <Text fontSize="xs" textAlign="center" color="gray.400">
          © 2025 仕分け職人 (Sorter Master) App
        </Text>
      </VStack>
    </Container>
  );
};

export default WelcomePage;
