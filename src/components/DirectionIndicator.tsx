import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { CarCategory } from '../types';

interface DirectionIndicatorProps {
  direction: 'up' | 'down' | 'left' | 'right';
  category: CarCategory;
  isActive: boolean;
}

const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({ direction, category, isActive }) => {
  return (
    <Box
      bg={isActive ? 'green.500' : 'gray.100'}
      color={isActive ? 'white' : 'gray.600'}
      px={2}
      py={1}
      borderRadius="md"
      fontWeight="bold"
      boxShadow="md"
      textAlign="center"
      transition="all 0.2s"
      _hover={{ transform: 'scale(1.02)' }}
      _active={{ transform: 'scale(0.98)' }}
      _focus={{ outline: 'none', boxShadow: 'none' }}
      width="150px"
      height="75px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      m={1}
      sx={{
        WebkitTapHighlightColor: "transparent",
        "-webkit-tap-highlight-color": "rgba(0,0,0,0)",
        outline: "none !important"
      }}
    >
      <Text fontSize="xl">{
        direction === 'up' ? '↑' : 
        direction === 'right' ? '→' : 
        direction === 'down' ? '↓' : 
        '←'
      }</Text>
      <Text fontSize="sm" isTruncated maxW="140px">{category}</Text>
    </Box>
  );
};

export default DirectionIndicator;