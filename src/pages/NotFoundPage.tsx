import React from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text, 
  VStack,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // ホームに戻る
  const handleBackToHome = () => {
    navigate('/');
  };
  
  return (
    <Container maxW="container.md" py={16}>
      <VStack spacing={8} align="center">
        <Icon as={FaExclamationTriangle} boxSize={16} color="orange.500" />
        
        <Heading as="h1" size="2xl" textAlign="center">
          404
        </Heading>
        
        <Heading as="h2" size="lg" textAlign="center" color="gray.600">
          ページが見つかりません
        </Heading>
        
        <Box 
          p={8} 
          bg={bgColor} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px" 
          borderColor={borderColor}
          w="100%"
          textAlign="center"
        >
          <VStack spacing={6}>
            <Text fontSize="lg">
              お探しのページは存在しないか、移動した可能性があります。
            </Text>
            
            <Button 
              leftIcon={<Icon as={FaHome} />} 
              colorScheme="blue" 
              size="lg"
              onClick={handleBackToHome}
            >
              ホームに戻る
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default NotFoundPage;
