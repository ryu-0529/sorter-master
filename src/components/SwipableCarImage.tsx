import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import TinderCard from 'react-tinder-card'; // react-tinder-cardをインポート
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'; // framer-motionをインポート
import { Car } from '../types';
import { SwipeDirection } from '../hooks/useSwipe';

// 複数のrefを結合するユーティリティ関数
type ReactRef<T> = React.RefObject<T> | React.MutableRefObject<T> | React.Ref<T>;

function useMergedRefs<T>(...refs: ReactRef<T>[]): React.RefCallback<T> {
  return useCallback((element: T) => {
    refs.forEach(ref => {
      if (!ref) return;

      // Refが関数の場合
      if (typeof ref === 'function') {
        ref(element);
      } 
      // Refオブジェクトでかつcurrentプロパティがある場合
      else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<T>).current = element;
      }
    });
  }, [refs]);
}

interface SwipableCarImageProps {
  car: Car | null;
  lastResult: 'correct' | 'incorrect' | null;
  swipeDirection: SwipeDirection;
  swiping: boolean;
  swipeDelta: { x: number; y: number };
  onSwipeStart?: () => void;
  onSwiping?: (deltaX: number, deltaY: number) => void;
  onSwiped?: (direction: SwipeDirection, finalDelta: { x: number, y: number }) => void;
}

const SwipableCarImage: React.FC<SwipableCarImageProps> = ({ 
  car, 
  lastResult, 
  swipeDirection: externalSwipeDirection,
  swiping: externalSwiping,
  swipeDelta: externalSwipeDelta,
  onSwipeStart,
  onSwiping,
  onSwiped
}) => {
  const [previousCar, setPreviousCar] = useState<Car | null>(null);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(false);
  const [carKey, setCarKey] = useState<string>('');
  const imageRef = useRef<HTMLDivElement>(null);
  const tinderCardRef = useRef<any>(null); // TinderCardのref
  
  // framer-motion用の状態
  const x = useMotionValue(0); // 水平方向の位置
  const y = useMotionValue(0); // 垂直方向の位置
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30]); // 回転角度の計算
  
  // カードのスワイプしきい値
  const SWIPE_THRESHOLD = 100;
  
  // 内部のスワイプ状態
  const [internalSwipeDelta, setInternalSwipeDelta] = useState({ x: 0, y: 0 });
  const [internalSwiping, setInternalSwiping] = useState(false);
  const [internalSwipeDirection, setInternalSwipeDirection] = useState<SwipeDirection>(null);
  
  // 車が変わったときの処理
  useEffect(() => {
    if (car) {
      // 初回レンダリングまたは車のIDが変わった場合
      if (!previousCar || car.id !== previousCar.id) {
        console.log('車の変更検出', { newCarId: car.id, prevCarId: previousCar?.id });
        
        // 前の車があれば、新しい車のアニメーション開始
        if (previousCar) {
          setAnimatingIn(true);
          setTimeout(() => {
            setAnimatingIn(false);
          }, 300);
        }
        
        setPreviousCar(car);
        setCarKey(car.id);
        
        // 新しい車に切り替わった時点で位置を確実に中央に戻す
        setAnimatingOut(false);
        setInternalSwipeDelta({ x: 0, y: 0 });
        setInternalSwiping(false);
        setInternalSwipeDirection(null);
        
        // framer-motionの位置をリセット
        x.set(0);
        y.set(0);
      }
    }
  }, [car, previousCar, x, y]);
  
  // スワイプ方向が設定されたら出ていくアニメーションを開始
  useEffect(() => {
    if (externalSwipeDirection) {
      setAnimatingOut(true);
      
      // 方向に基づいて強制的にカードを移動
      if (externalSwipeDirection === 'left') {
        x.set(-500);
      } else if (externalSwipeDirection === 'right') {
        x.set(500);
      } else if (externalSwipeDirection === 'up') {
        y.set(-500);
      } else if (externalSwipeDirection === 'down') {
        y.set(500);
      }
      
      // アニメーション時間後に状態をリセット
      const timer = setTimeout(() => {
        setAnimatingOut(false);
        // 位置をリセット（次のカードのため）
        x.set(0);
        y.set(0);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [externalSwipeDirection, x, y]);
  
  // 使用するスワイプ状態の決定（内部または外部）
  const effectiveSwiping = internalSwiping || externalSwiping;
  const effectiveSwipeDelta = internalSwiping ? internalSwipeDelta : externalSwipeDelta;
  const effectiveSwipeDirection = internalSwipeDirection || externalSwipeDirection;
  
  // framer-motionのドラッグ開始時の処理
  const handleDragStart = () => {
    console.log('ドラッグ開始');
    setInternalSwiping(true);
    if (onSwipeStart) {
      onSwipeStart();
    }
  };
  
  // framer-motionのドラッグ中の処理
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const deltaX = info.offset.x;
    const deltaY = info.offset.y;
    
    // 内部状態を更新
    setInternalSwipeDelta({ x: deltaX, y: deltaY });
    
    // 親コンポーネントのコールバックを呼び出し
    if (onSwiping) {
      onSwiping(deltaX, deltaY);
    }
  };
  
  // framer-motionのドラッグ終了時の処理
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setInternalSwiping(false);
    
    const deltaX = info.offset.x;
    const deltaY = info.offset.y;
    
    // スワイプ方向の判定
    let swipeDir: SwipeDirection = null;
    
    // 閾値を超えているかどうかの判定
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
      // 閾値未満の場合はスワイプとみなさない - 元の位置に戻す
      x.set(0);
      y.set(0);
      return;
    }
    
    // 主要な方向を決定（X軸とY軸のどちらの移動量が大きいか）
    if (absX > absY) {
      // X方向の移動が主要
      swipeDir = deltaX > 0 ? 'right' : 'left';
    } else {
      // Y方向の移動が主要
      swipeDir = deltaY > 0 ? 'down' : 'up';
    }
    
    setInternalSwipeDirection(swipeDir);
    
    // スワイプ方向に基づいてアニメーションを強化
    const FORCE = 500; // 最終的な移動距離
    
    if (swipeDir === 'left') {
      x.set(-FORCE);
    } else if (swipeDir === 'right') {
      x.set(FORCE);
    } else if (swipeDir === 'up') {
      y.set(-FORCE);
    } else if (swipeDir === 'down') {
      y.set(FORCE);
    }
    
    // 親コンポーネントのコールバックを呼び出し
    if (onSwiped && swipeDir) {
      onSwiped(swipeDir, { x: deltaX, y: deltaY });
    }
  };
  
  // TinderCardのスワイプハンドラ（もはや使用しないが、互換性のために残す）
  const handleSwipe = (direction: string) => {
    console.log(`TinderCard スワイプ: ${direction}`);
    
    // react-tinder-cardの方向を既存の方向型に変換
    let swipeDir: SwipeDirection = null;
    switch (direction) {
      case 'left':
        swipeDir = 'left';
        break;
      case 'right':
        swipeDir = 'right';
        break;
      case 'up':
        swipeDir = 'up';
        break;
      case 'down':
        swipeDir = 'down';
        break;
      default:
        swipeDir = null;
    }
    
    setInternalSwipeDirection(swipeDir);
    
    // 親コンポーネントのコールバックを呼び出し
    if (onSwiped && swipeDir) {
      // Deltaは正確でなくても良いので、方向に基づいた仮の値を設定
      const deltaX = (swipeDir === 'left') ? -100 : (swipeDir === 'right') ? 100 : 0;
      const deltaY = (swipeDir === 'up') ? -100 : (swipeDir === 'down') ? 100 : 0;
      
      onSwiped(swipeDir, { x: deltaX, y: deltaY });
    }
  };
  
  // スワイプ中の状態変化を処理
  const handleCardLeftScreen = (direction: string) => {
    console.log(`カードが画面外に: ${direction}`);
    // カードが画面外に出たときの処理（必要に応じて）
  };
  
  // 入場アニメーション用のスタイル
  const initialStyle = animatingIn ? {
    transform: 'scale(0.9)',
    opacity: 0,
  } : {};
  
  // コンポーネントをメモ化してパフォーマンスを向上
  return (
    <Box
      w="350px"
      h="410px"
      position="relative"
      mt={4}
      mb={3}
      mx="auto"
      display="flex"
      justifyContent="center"
      alignItems="center"
      className="card-container"
      ref={imageRef}
      overflow="visible" // カードのアニメーション中にはみ出ることを許可
    >
      <AnimatePresence>
        <motion.div
          key={carKey}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            x,
            y,
            rotate,
            zIndex: 10,
          }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.8} // ドラッグの弾性（値が大きいほど動きが大きくなる）
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300
          }}
          whileTap={{ scale: 1.05 }} // タップ時の拡大エフェクト
        >
          <Box
            style={{ 
              touchAction: 'none', // スクロールを防止し、スワイプを優先
              WebkitTapHighlightColor: 'rgba(0,0,0,0)', // タップ時のハイライトを非表示
              cursor: effectiveSwiping ? "grabbing" : "grab",
              userSelect: 'none',
              WebkitUserSelect: 'none',
              // iOS Safari特有の問題に対処
              pointerEvents: 'auto',
              // 以下のスタイルを追加してiOS Safariでのタッチ処理を改善
              // ベンダープレフィックスプロパティはTypeScriptの型チェックでエラーとなるため削除
            } as React.CSSProperties}
            className="car-container-swipeable"
          >
            {/* 現在の車の画像 */}
            <Box
              as="img"
              className="car-image-swipeable"
              src={car?.imageUrl || '/images/placeholder-car.jpg'}
              alt={`車種: ${car?.category || '不明'}`}
              maxW="100%"
              maxH="100%"
              objectFit="contain"
              filter={lastResult ? 'blur(2px)' : 'none'}
              style={{
                ...initialStyle,
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
                pointerEvents: 'auto', // ポインターイベントを明示的に有効化
                transform: `translate3d(0,0,0)`, // ハードウェアアクセラレーションを有効化
                // TypeScriptのCSSPropertiesに直接ベンダープレフィックスプロパティは指定できない
                // そのためunknownへのキャストを通して型エラーを回避
              } as unknown as React.CSSProperties}
              cursor={effectiveSwiping ? "grabbing" : "grab"}
              zIndex={2}
              position="relative"
              opacity={animatingOut ? 0.8 : 1}
              key={`${carKey}-${effectiveSwiping ? 'swiping' : 'static'}`}
              draggable="false"
            />
            
            {/* スワイプ方向インジケーター */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="100%"
              h="100%"
              pointerEvents="none"
              opacity={effectiveSwiping ? 0.8 : 0}
              transition="opacity 0.2s ease"
            >
              {internalSwipeDelta.x > 50 && (
                <Box
                  position="absolute"
                  right="20px"
                  top="50%"
                  transform="translateY(-50%)"
                  borderRadius="full"
                  bg="green.500"
                  color="white"
                  p={2}
                  fontSize="lg"
                  fontWeight="bold"
                >
                  右
                </Box>
              )}
              {internalSwipeDelta.x < -50 && (
                <Box
                  position="absolute"
                  left="20px"
                  top="50%"
                  transform="translateY(-50%)"
                  borderRadius="full"
                  bg="red.500"
                  color="white"
                  p={2}
                  fontSize="lg"
                  fontWeight="bold"
                >
                  左
                </Box>
              )}
              {internalSwipeDelta.y > 50 && (
                <Box
                  position="absolute"
                  bottom="20px"
                  left="50%"
                  transform="translateX(-50%)"
                  borderRadius="full"
                  bg="blue.500"
                  color="white"
                  p={2}
                  fontSize="lg"
                  fontWeight="bold"
                >
                  下
                </Box>
              )}
              {internalSwipeDelta.y < -50 && (
                <Box
                  position="absolute"
                  top="20px"
                  left="50%"
                  transform="translateX(-50%)"
                  borderRadius="full"
                  bg="purple.500"
                  color="white"
                  p={2}
                  fontSize="lg"
                  fontWeight="bold"
                >
                  上
                </Box>
              )}
            </Box>
            
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
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default SwipableCarImage;