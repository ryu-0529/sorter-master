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
    // 高速道路標識風に全て緑ベースに統一
    return 'green';
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
      backgroundColor: `var(--chakra-colors-green-600)`, // 高速道路の標識風の緑色
      color: 'white', // 白いフォントに変更
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' // より立体的な看板の影
    },
    active: { 
      scale: 1.05,
      backgroundColor: `var(--chakra-colors-green-700)`, // アクティブ時はより濃い緑に
      color: 'white',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.4)'
    },
    hover: { 
      scale: 1.02,
      boxShadow: '0 6px 10px rgba(0, 0, 0, 0.35)'
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
      fontWeight="extrabold" // より太いフォントに変更
      textAlign="center"
      width={directionStyle.width}
      height={directionStyle.height}
      display="flex"
      flexDirection={direction === "down" ? "column-reverse" : "column"} 
      justifyContent="center"
      alignItems="center"
      m={1}
      position="relative"
      borderWidth="2px" // 境界線を追加
      borderColor="white" // 白い境界線
      borderStyle="solid"
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