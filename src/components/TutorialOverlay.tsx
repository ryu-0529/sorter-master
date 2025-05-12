import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Text,
  VStack,
  HStack,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorModeValue
} from '@chakra-ui/react';
import { FaArrowRight, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

// チュートリアルステップの定義
const tutorialSteps = [
  {
    title: 'ようこそ「仕分け職人」へ！',
    content: 'このゲームでは、表示される車の画像を正しい車種カテゴリに素早く分類するスキルを競います。' +
      'スワイプ操作で直感的に遊べるシンプルなゲームです。',
    image: null,
  },
  {
    title: '基本操作：スワイプで分類',
    content: '画面中央に表示される車の画像を上下左右にスワイプして、適切なカテゴリに分類します。' +
      '各方向には異なる車種カテゴリが割り当てられています。',
    image: '/images/tutorial/swipe_directions.svg',
  },
  {
    title: 'カテゴリを確認しよう',
    content: '画面の四隅には、その方向にスワイプした時のカテゴリが表示されています。' +
      '例えば「上方向→SUV」と表示されていれば、上にスワイプするとSUVカテゴリに分類されます。',
    image: '/images/tutorial/categories.svg',
  },
  {
    title: '正確さが重要です',
    content: '正しいカテゴリに分類すると得点が加算されます。間違えても減点はありませんが、' +
      '高いスコアを目指すためには正確な車種判別が重要です。',
    image: null,
  },
  {
    title: 'ゲームモード',
    content: '「ランキング戦」では自分のペースで車を分類し、スコアをランキングに登録できます。' +
      '「通信対戦」では他のプレイヤーと同じカードセットでリアルタイムに競い合います。',
    image: null,
  },
  {
    title: '準備完了！',
    content: 'チュートリアルは以上です。それでは「仕分け職人」の世界をお楽しみください！',
    image: null,
  }
];

// チュートリアルモーダルのプロパティ定義
interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose, onFinish }) => {
  // 現在のチュートリアルステップのインデックス
  const [currentStep, setCurrentStep] = useState(0);
  
  // 背景と文字色
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const headingColor = useColorModeValue('blue.600', 'blue.300');
  
  // 次のステップに進む
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };
  
  // 前のステップに戻る
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // チュートリアルを終了する
  const handleFinish = () => {
    setCurrentStep(0);
    onFinish();
  };
  
  // 現在のステップ情報
  const currentTutorialStep = tutorialSteps[currentStep];
  
  // 進捗状況の表示
  const progress = `${currentStep + 1}/${tutorialSteps.length}`;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} maxW={{ base: "90%", md: "800px" }} minH="500px">
        <ModalHeader 
          bg="blue.500" 
          color="white" 
          borderTopRadius="md"
          fontSize="xl"
        >
          チュートリアル - {progress}
        </ModalHeader>
        <ModalCloseButton color="white" />
        
        <ModalBody p={6}>
          <VStack spacing={6} align="stretch">
            <Heading as="h2" size="lg" color={headingColor} textAlign="center">
              {currentTutorialStep.title}
            </Heading>
            
            <Text fontSize="lg" color={textColor} textAlign="center">
              {currentTutorialStep.content}
            </Text>
            
            {/* チュートリアル画像 (存在する場合のみ表示) */}
            {currentTutorialStep.image && (
              <Box mx="auto" px={8} py={4}>
                <Image 
                  src={currentTutorialStep.image} 
                  alt={`チュートリアル画像 - ${currentTutorialStep.title}`} 
                  borderRadius="md"
                  boxShadow="lg"
                  maxH="300px"
                  objectFit="contain"
                  mx="auto"
                />
              </Box>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter borderTop="1px" borderColor="gray.200" p={4}>
          <HStack spacing={4} width="100%" justifyContent="space-between">
            <Button 
              leftIcon={<Icon as={FaArrowLeft} />} 
              onClick={handlePrev} 
              isDisabled={currentStep === 0}
              colorScheme="gray"
            >
              戻る
            </Button>
            
            <Box>
              {/* ドットでステップ表示 */}
              <HStack spacing={2} justifyContent="center">
                {tutorialSteps.map((_, index) => (
                  <Box 
                    key={index} 
                    w="8px" 
                    h="8px" 
                    borderRadius="full" 
                    bg={index === currentStep ? "blue.500" : "gray.300"}
                  />
                ))}
              </HStack>
            </Box>
            
            {currentStep < tutorialSteps.length - 1 ? (
              <Button 
                rightIcon={<Icon as={FaArrowRight} />} 
                onClick={handleNext} 
                colorScheme="blue"
              >
                次へ
              </Button>
            ) : (
              <Button 
                rightIcon={<Icon as={FaCheckCircle} />} 
                onClick={handleFinish} 
                colorScheme="green"
              >
                完了
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TutorialOverlay;