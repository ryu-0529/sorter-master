import React, { useState } from 'react';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { Car } from '../types';

interface SwipableCarImageProps {
  car: Car | null;
  lastResult: 'correct' | 'incorrect' | null;
  swipeDirection: 'up' | 'down' | 'left' | 'right' | null;
}

const SwipableCarImage: React.FC<SwipableCarImageProps> = ({ car, lastResult, swipeDirection }) => {
  // Animation transform styles based on swipe direction
  const getSwipeAnimation = () => {
    if (!swipeDirection) return {};
    
    let transform = '';
    let transition = 'transform 0.5s ease-out';
    
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
  };
  
  return (
    <Box
      w="90%"
      h="70%"
      maxW="650px"
      maxH="450px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="xl"
      position="relative"
      mt={4}
      mb={3}
    >
      <Box
        as="img"
        src={car?.imageUrl || '/images/placeholder-car.jpg'}
        alt={`車種: ${car?.category || '不明'}`}
        w="100%"
        h="100%"
        objectFit="cover"
        filter={lastResult ? 'blur(2px)' : 'none'}
        style={getSwipeAnimation()}
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