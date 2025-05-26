// /src/contexts/AdMobContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { adMobService } from '../services/admob';

interface AdMobContextType {
  isAdMobInitialized: boolean;
  showBannerAd: () => Promise<void>;
  hideBannerAd: () => Promise<void>;
  showInterstitialAd: () => Promise<void>;
  isBannerVisible: boolean;
  isInterstitialLoading: boolean;
}

const AdMobContext = createContext<AdMobContextType | undefined>(undefined);

interface AdMobProviderProps {
  children: ReactNode;
}

export const AdMobProvider: React.FC<AdMobProviderProps> = ({ children }) => {
  const [isAdMobInitialized, setIsAdMobInitialized] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);

  useEffect(() => {
    const initializeAdMob = async () => {
      try {
        await adMobService.initialize();
        setIsAdMobInitialized(true);
      } catch (error) {
        console.error('AdMob初期化に失敗しました:', error);
      }
    };

    initializeAdMob();
  }, []);

  const showBannerAd = async () => {
    try {
      await adMobService.showBannerAd();
      setIsBannerVisible(true);
    } catch (error) {
      console.error('バナー広告表示に失敗しました:', error);
    }
  };

  const hideBannerAd = async () => {
    try {
      await adMobService.hideBannerAd();
      setIsBannerVisible(false);
    } catch (error) {
      console.error('バナー広告非表示に失敗しました:', error);
    }
  };

  const showInterstitialAd = async () => {
    if (isInterstitialLoading) {
      console.log('インターステイシャル広告は既にロード中です');
      return;
    }

    try {
      setIsInterstitialLoading(true);
      await adMobService.showInterstitialAd();
    } catch (error) {
      console.error('インターステイシャル広告表示に失敗しました:', error);
    } finally {
      setIsInterstitialLoading(false);
    }
  };

  const value: AdMobContextType = {
    isAdMobInitialized,
    showBannerAd,
    hideBannerAd,
    showInterstitialAd,
    isBannerVisible,
    isInterstitialLoading
  };

  return (
    <AdMobContext.Provider value={value}>
      {children}
    </AdMobContext.Provider>
  );
};

export const useAdMob = (): AdMobContextType => {
  const context = useContext(AdMobContext);
  if (context === undefined) {
    throw new Error('useAdMob must be used within an AdMobProvider');
  }
  return context;
};
