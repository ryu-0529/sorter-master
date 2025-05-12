import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion'; // framer-motionをインポート
import { CarCategory } from '../types';

// 方向インジケーターのコンポーネント - スワイプの方向を視覚的に表示
interface DirectionIndicatorProps {
  direction: 'up' | 'down' | 'left' | 'right';
  category: CarCategory;
  isActive: boolean;
}

const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({ direction, category, isActive }) => {
  // 方向に応じた色を設定
  const getDirectionColor = () => {
    switch (direction) {
      case 'up':
        return 'purple';
      case 'down':
        return 'blue';
      case 'left':
        return 'red';
      case 'right':
        return 'green';
      default:
        return 'gray';
    }
  };
  
  // 方向に応じたスタイルを設定
  const getDirectionStyle = () => {
    const isVertical = direction === 'left' || direction === 'right';
    
    return {
      width: isVertical ? '40px' : '240px', // 上下（セダン、クロスカントリー）の幅を240pxに拡大
      height: isVertical ? '400px' : '40px',
      writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
      textOrientation: isVertical ? 'upright' : 'mixed',
    };
  };
  
  const directionColor = getDirectionColor();
  const directionStyle = getDirectionStyle();
  
  // 方向に応じたアニメーションを設定
  const getDirectionAnimation = () => {
    switch (direction) {
      case 'up':
        return { y: -8 };
      case 'down':
        return { y: 8 };
      case 'left':
        return { x: -8 };
      case 'right':
        return { x: 8 };
      default:
        return {};
    }
  };
  
  // アニメーションのバリアント
  const boxVariants = {
    idle: { 
      scale: 1,
      backgroundColor: `var(--chakra-colors-${directionColor}-100)`,
      color: 'var(--chakra-colors-gray-600)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    active: { 
      scale: 1.05,
      backgroundColor: `var(--chakra-colors-${directionColor}-500)`,
      color: 'white',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.15)'
    },
    hover: { 
      scale: 1.02,
      boxShadow: '0 6px 8px rgba(0, 0, 0, 0.12)'
    }
  };
  
  // 矢印のアニメーション
  const arrowVariants = {
    idle: { 
      scale: 1,
      ...getDirectionAnimation(),
      opacity: 0.7
    },
    active: { 
      scale: 1.2,
      ...getDirectionAnimation(),
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 0.5
      }
    }
  };
  
  return (
    <Box
      as={motion.div}
      initial="idle"
      animate={isActive ? "active" : "idle"}
      whileHover="hover"
      variants={boxVariants}
      px={2}
      py={1}
      borderRadius="md"
      fontWeight="bold"
      textAlign="center"
      width={directionStyle.width}
      height={directionStyle.height}
      display="flex"
      flexDirection={direction === "down" ? "column-reverse" : "column"} 
      justifyContent="center"
      alignItems="center"
      m={1}
      position="relative"
      borderWidth="0px"
      borderColor="transparent"
      borderStyle="none"
      sx={{
        WebkitTapHighlightColor: "transparent",
        "-webkit-tap-highlight-color": "rgba(0,0,0,0)",
        outline: "none !important",
        writingMode: directionStyle.writingMode,
        textOrientation: directionStyle.textOrientation
      }}
      // Chakra UIのtransitionプロパティではなくstyle経由でframer-motionのtransitionを設定
      style={{
        transition: "none" // Chakraのデフォルトトランジションを無効化
      }}
    >
{/* 矢印を削除 */}
      <Text 
        fontSize="sm"
        isTruncated 
        maxW={direction === 'left' || direction === 'right' ? "40px" : "200px"}
        fontWeight="bold"
        p={1}
        sx={{
          writingMode: directionStyle.writingMode,
          textOrientation: directionStyle.textOrientation
        }}
      >
        {category}
      </Text>
    </Box>
  );
};

export default DirectionIndicator;