import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Avatar,
  FormControl,
  FormLabel,
  Input,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Image,
  Tooltip,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaGoogle, FaArrowLeft, FaSignOutAlt, FaInfoCircle, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser, loginWithGoogle, loginWithEmail, registerWithEmail, linkAnonymousWithEmail, linkAnonymousWithGoogle, logout } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  
  const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useDisclosure();
  const { isOpen: isRegisterOpen, onOpen: onRegisterOpen, onClose: onRegisterClose } = useDisclosure();
  const { isOpen: isLinkOpen, onOpen: onLinkOpen, onClose: onLinkClose } = useDisclosure();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // メールアドレスでログイン
  const handleEmailLogin = async () => {
    try {
      await loginWithEmail(email, password);
      onLoginClose();
      toast({
        title: 'ログイン成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'ログインエラー',
        description: 'メールアドレスまたはパスワードが正しくありません',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // メールアドレスで新規登録
  const handleEmailRegister = async () => {
    try {
      await registerWithEmail(email, password, displayName);
      onRegisterClose();
      toast({
        title: '登録成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: '登録エラー',
        description: 'アカウント登録に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Googleでログイン
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast({
        title: 'ログイン成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'ログインエラー',
        description: 'Googleログインに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 匿名アカウントをメールアカウントにリンク
  const handleLinkWithEmail = async () => {
    try {
      await linkAnonymousWithEmail(email, password, displayName);
      onLinkClose();
      toast({
        title: 'アカウントリンク成功',
        description: 'ゲストアカウントが正常にリンクされました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'リンクエラー',
        description: 'アカウントのリンクに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 匿名アカウントをGoogleアカウントにリンク
  const handleLinkWithGoogle = async () => {
    try {
      await linkAnonymousWithGoogle();
      toast({
        title: 'アカウントリンク成功',
        description: 'ゲストアカウントが正常にリンクされました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'リンクエラー',
        description: 'アカウントのリンクに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // ログアウト処理
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'ログアウト成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
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
  
  // ホームに戻る
  const handleBackToHome = () => {
    // ログイン済みの場合はホーム画面に、そうでない場合はトップページに戻る
    if (currentUser) {
      navigate('/home');
    } else {
      navigate('/');
    }
  };
  
  return (
    <Container maxW="container.md" py={8}>
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
          <Heading as="h1" size="xl" color="brand.500">プロフィール</Heading>
          <Box w="40px" />
        </Flex>
        
        {/* プロフィールカード */}
        <Box 
          p={8} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px" 
          borderColor={borderColor}
        >
          <VStack spacing={6}>
            <Avatar 
              size="2xl" 
              name={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ゲスト'} 
              src={currentUser?.photoURL || undefined} 
              bg="brand.500"
            />
            
            <VStack spacing={2}>
              <Heading as="h2" size="lg">
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || `ゲスト-${currentUser?.uid.substring(0, 5)}`}
              </Heading>
              
              <VStack spacing={2}>
                <HStack>
                  <Icon as={FaEnvelope} color="gray.500" />
                  <Text color="gray.500">
                    {currentUser?.email || 'メールアドレス未設定'}
                  </Text>
                  {currentUser?.email?.includes('privaterelay.appleid.com') && (
                    <Tooltip 
                      label="このメールアドレスはAppleのプライバシー保護機能です。あなたの実際のメールアドレスに転送されます。" 
                      fontSize="sm"
                      hasArrow
                    >
                      <Icon as={FaShieldAlt} color="green.500" cursor="pointer" />
                    </Tooltip>
                  )}
                </HStack>
                
                {/* Appleプライベートリレーメールの説明 */}
                {currentUser?.email?.includes('privaterelay.appleid.com') && (
                  <Alert status="info" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    <AlertDescription>
                      このメールアドレスはAppleの「メールを非公開」機能で作成されたプライベートアドレスです。
                      このアプリからのメールは、あなたの実際のApple IDメールアドレスに自動で転送されます。
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
              
              <HStack spacing={2}>
                <Text 
                  fontSize="sm" 
                  color="gray.500" 
                  bg={currentUser?.isAnonymous ? 'yellow.100' : 'green.100'} 
                  px={2} 
                  py={1} 
                  borderRadius="full"
                >
                  {currentUser?.isAnonymous ? 'ゲストユーザー' : '登録ユーザー'}
                </Text>
                
                {/* Apple Sign-inユーザーの表示 */}
                {currentUser?.email?.includes('privaterelay.appleid.com') && (
                  <Text 
                    fontSize="sm" 
                    color="blue.500" 
                    bg="blue.50" 
                    px={2} 
                    py={1} 
                    borderRadius="full"
                    fontWeight="medium"
                  >
                    <Icon as={FaShieldAlt} mr={1} />
                    Appleサインイン
                  </Text>
                )}
              </HStack>
            </VStack>
            
            {/* アカウント操作ボタン */}
            <VStack spacing={4} width="100%" pt={4}>
              {currentUser?.isAnonymous ? (
                // ゲストユーザーの場合
                <>
                  <Button 
                    leftIcon={<Icon as={FaUser} />} 
                    colorScheme="blue" 
                    w="full"
                    onClick={onLinkOpen}
                  >
                    アカウントを登録する
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
                    onClick={handleLinkWithGoogle}
                  >
                    Googleでログイン
                  </Button>
                </>
              ) : (
                // 登録ユーザーの場合
                <Button 
                  leftIcon={<Icon as={FaSignOutAlt} />} 
                  colorScheme="red" 
                  w="full"
                  onClick={handleLogout}
                >
                  ログアウト
                </Button>
              )}
            </VStack>
          </VStack>
        </Box>
        
        {/* 未ログインの場合、ログインオプション */}
        {!currentUser && (
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="lg" 
            boxShadow="md"
            border="1px" 
            borderColor={borderColor}
          >
            <VStack spacing={4}>
              <Heading as="h3" size="md">アカウント</Heading>
              
              <Button 
                leftIcon={<Icon as={FaUser} />} 
                colorScheme="blue" 
                w="full"
                onClick={onLoginOpen}
              >
                メールアドレスでログイン
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
              >
                Googleでログイン
              </Button>
              
              <Button 
                variant="link" 
                colorScheme="blue" 
                onClick={onRegisterOpen}
              >
                新規登録はこちら
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>
      
      {/* ログインモーダル */}
      <Modal isOpen={isLoginOpen} onClose={onLoginClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>ログイン</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl id="email" isRequired>
                <FormLabel>メールアドレス</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </FormControl>
              
              <FormControl id="password" isRequired>
                <FormLabel>パスワード</FormLabel>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLoginClose}>
              キャンセル
            </Button>
            <Button colorScheme="blue" onClick={handleEmailLogin}>
              ログイン
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 新規登録モーダル */}
      <Modal isOpen={isRegisterOpen} onClose={onRegisterClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>新規登録</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl id="register-name" isRequired>
                <FormLabel>ニックネーム</FormLabel>
                <Input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                />
              </FormControl>
              
              <FormControl id="register-email" isRequired>
                <FormLabel>メールアドレス</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </FormControl>
              
              <FormControl id="register-password" isRequired>
                <FormLabel>パスワード</FormLabel>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRegisterClose}>
              キャンセル
            </Button>
            <Button colorScheme="blue" onClick={handleEmailRegister}>
              登録
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* アカウントリンクモーダル */}
      <Modal isOpen={isLinkOpen} onClose={onLinkClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>アカウント登録</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                ゲストアカウントを登録アカウントに変換することで、
                スコアやプレイ履歴を引き継ぐことができます。
              </Text>
              
              <FormControl id="link-name" isRequired>
                <FormLabel>ニックネーム</FormLabel>
                <Input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                />
              </FormControl>
              
              <FormControl id="link-email" isRequired>
                <FormLabel>メールアドレス</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </FormControl>
              
              <FormControl id="link-password" isRequired>
                <FormLabel>パスワード</FormLabel>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLinkClose}>
              キャンセル
            </Button>
            <Button colorScheme="blue" onClick={handleLinkWithEmail}>
              アカウント登録
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ProfilePage;
