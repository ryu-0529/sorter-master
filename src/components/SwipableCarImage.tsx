import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { Car } from '../types';

interface SwipableCarImageProps {
  car: Car | null;
  lastResult: 'correct' | 'incorrect' | null;
  swipeDirection: 'up' | 'down' | 'left' | 'right' | null;
  swiping: boolean;
  swipeDelta: { x: number; y: number };
}

const SwipableCarImage: React.FC<SwipableCarImageProps> = ({ 
  car, 
  lastResult, 
  swipeDirection,
  swiping,
  swipeDelta
}) => {
  const [previousCar, setPreviousCar] = useState<Car | null>(null);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(false);
  const [carKey, setCarKey] = useState<string>('');
  const imageRef = useRef<HTMLDivElement>(null);
  
  // 車が変わったときの処理
  useEffect(() => {
    if (car && (!previousCar || car.id !== previousCar.id)) {
      // 車が変わった
      if (previousCar) {
        // 前の車があれば、新しい車のアニメーション開始
        setAnimatingIn(true);
        setTimeout(() => {
          setAnimatingIn(false);
        }, 300);
      }
      setPreviousCar(car);
      setCarKey(car.id);
    }
  }, [car, previousCar]);
  
  // スワイプ方向が設定されたら出ていくアニメーションを開始
  useEffect(() => {
    if (swipeDirection) {
      setAnimatingOut(true);
      
      // アニメーション時間後に状態をリセット
      const timer = setTimeout(() => {
        setAnimatingOut(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [swipeDirection]);
  
  // アニメーションスタイルを取得
  const getTransformStyle = () => {
    // 新しいカードの入場アニメーション
    if (animatingIn) {
      return { 
        transform: 'scale(1)', 
        opacity: 1,
        transition: 'all 0.3s ease-out'
      };
    }
    
    // スワイプ完了時のアニメーション（画面外へ）
    if (swipeDirection && animatingOut) {
      let transform = '';
      let transition = 'transform 0.3s ease-out';
      
      switch(swipeDirection) {
        case 'up':
          transform = 'translateY(-120%)';
          break;
        case 'down':
          transform = 'translateY(120%)';
          break;
        case 'left':
          transform = 'translateX(-120%)';
          break;
        case 'right':
          transform = 'translateX(120%)';
          break;
        default:
          transform = 'none';
      }
      
      return { transform, transition };
    }
    
    // スワイプ中のドラッグ効果
    if (swiping) {
      const transform = `translate(${swipeDelta.x}px, ${swipeDelta.y}px)`;
      return { transform, transition: 'none' }; // トランジションなし（リアルタイム反映）
    }
    
    // 通常状態
    return { 
      transform: 'none', 
      transition: 'transform 0.2s ease-out' 
    };
  };
  
  // 回転角度の計算（スワイプ方向によって傾きを追加）
  const getRotationStyle = () => {
    if (!swiping || (Math.abs(swipeDelta.x) < 5 && Math.abs(swipeDelta.y) < 5)) {
      return 0;
    }
    
    // X方向の移動に合わせて傾きを計算（最大±15度）
    const rotationFactor = 0.1;
    const maxRotation = 15;
    let rotation = swipeDelta.x * rotationFactor;
    
    // 回転角度を制限
    rotation = Math.min(Math.max(rotation, -maxRotation), maxRotation);
    
    return rotation;
  };
  
  const transformStyle = getTransformStyle();
  const rotation = getRotationStyle();
  // 回転を適用（transformにrotateを追加）
  const finalTransform = {
    ...transformStyle,
    transform: `${transformStyle.transform} rotate(${rotation}deg)`
  };
  
  // 入場アニメーション用のスタイル
  const initialStyle = animatingIn ? {
    transform: 'scale(0.9)',
    opacity: 0,
  } : {};
  
  return (
    <Box
      w="350px"
      h="410px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="xl"
      position="relative"
      mt={4}
      mb={3}
      mx="auto"
      display="flex"
      justifyContent="center"
      alignItems="center"
      backgroundColor="white"
      ref={imageRef}
    >
      {/* 現在の車の画像 */}
      <Box
        as="img"
        src={car?.imageUrl || '/images/placeholder-car.jpg'}
        alt={`車種: ${car?.category || '不明'}`}
        maxW="100%"
        maxH="100%"
        objectFit="contain"
        filter={lastResult ? 'blur(2px)' : 'none'}
        style={{
          ...finalTransform,
          ...initialStyle
        }}
        cursor="grab"
        zIndex={2}
        position="relative"
        opacity={animatingOut ? 0.8 : 1}
        key={carKey} // キーを追加して再レンダリングを制御
      />
      
      {/* スワイプ結果の表示 */}
      {lastResult && (
        <Flex
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg={lastResult === 'correct' ? 'green.500' : 'red.500'}
          opacity="0.7"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          zIndex={3}
        >
          <Icon 
            as={lastResult === 'correct' ? FaCheck : FaTimes} 
            boxSize={24} 
            color="white" 
            mb={3}
          />
          <Text
            color="white"
            fontSize="4xl"
            fontWeight="extrabold"
            textShadow="0 0 12px rgba(0,0,0,0.7)"
            textAlign="center"
            px={4}
            transform="scale(1.2)"
            transition="transform 0.3s ease-in-out"
          >
            {lastResult === 'correct' ? '正解！' : '不正解！'}
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default SwipableCarImage;