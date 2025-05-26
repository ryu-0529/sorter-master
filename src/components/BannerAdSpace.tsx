// /src/components/BannerAdSpace.tsx
import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { useAdMob } from '../contexts/AdMobContext';

interface BannerAdSpaceProps {
  showAd?: boolean;
}

export const BannerAdSpace: React.FC<BannerAdSpaceProps> = ({ showAd = true }) => {
  const { showBannerAd, hideBannerAd, isAdMobInitialized, isBannerVisible } = useAdMob();

  useEffect(() => {
    if (!isAdMobInitialized) return;

    if (showAd) {
      showBannerAd();
    } else {
      hideBannerAd();
    }

    // クリーンアップ：コンポーネントがアンマウントされたら広告を非表示
    return () => {
      if (isBannerVisible) {
        hideBannerAd();
      }
    };
  }, [showAd, isAdMobInitialized, showBannerAd, hideBannerAd, isBannerVisible]);

  // Web環境での代替表示
  if (!isBannerVisible && showAd) {
    return (
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        height="60px"
        bg="gray.100"
        border="1px solid"
        borderColor="gray.300"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="sm"
        color="gray.600"
        zIndex={1000}
        px={4}
      >
        広告スペース (モバイルアプリでのみ表示)
      </Box>
    );
  }

  // ネイティブアプリでは、AdMobが直接バナーを表示するため、
  // スペーサーとしてのBoxを返す
  return showAd ? (
    <Box height="60px" bg="transparent" />
  ) : null;
};

export default BannerAdSpace;
