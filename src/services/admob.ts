// /src/services/admob.ts
import { 
  AdMob, 
  BannerAdOptions, 
  BannerAdPosition, 
  BannerAdSize,
  AdMobInitializationOptions
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export class AdMobService {
  private static instance: AdMobService;
  private isInitialized = false;
  private interstitialAdLoaded = false;

  // テスト用広告ID（本番環境では実際のIDに変更してください）
  private readonly TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
  private readonly TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

  // 本番用広告ID（環境変数または設定から取得）
  private readonly PROD_BANNER_ID = process.env.REACT_APP_ADMOB_BANNER_ID || this.TEST_BANNER_ID;
  private readonly PROD_INTERSTITIAL_ID = process.env.REACT_APP_ADMOB_INTERSTITIAL_ID || this.TEST_INTERSTITIAL_ID;

  private constructor() {}

  public static getInstance(): AdMobService {
    if (!AdMobService.instance) {
      AdMobService.instance = new AdMobService();
    }
    return AdMobService.instance;
  }

  /**
   * AdMobを初期化（一時的に無効化）
   */
  public async initialize(): Promise<void> {
    console.log('AdMob: 一時的に無効化中');
    this.isInitialized = true;
  }

  /**
   * バナー広告を表示（一時的に無効化）
   */
  public async showBannerAd(): Promise<void> {
    console.log('AdMob: バナー広告表示（一時的に無効化中）');
  }

  /**
   * バナー広告を非表示（一時的に無効化）
   */
  public async hideBannerAd(): Promise<void> {
    console.log('AdMob: バナー広告非表示（一時的に無効化中）');
  }

  /**
   * インターステイシャル広告を事前ロード（一時的に無効化）
   */
  private async preloadInterstitialAd(): Promise<void> {
    console.log('AdMob: インターステイシャル広告ロード（一時的に無効化中）');
    this.interstitialAdLoaded = true;
  }

  /**
   * インターステイシャル広告を表示（一時的に無効化）
   */
  public async showInterstitialAd(): Promise<void> {
    console.log('AdMob: インターステイシャル広告表示（一時的に無効化中）');
  }

  /**
   * 広告収益の追跡（Firebaseアナリティクスと連携）
   */
  public async trackAdRevenue(value: number, currency: string = 'USD'): Promise<void> {
    console.log(`広告収益追跡（一時的に無効化中）: ${value} ${currency}`);
  }

  /**
   * バナー広告IDを取得
   */
  private getBannerAdId(): string {
    return process.env.NODE_ENV === 'development' ? this.TEST_BANNER_ID : this.PROD_BANNER_ID;
  }

  /**
   * インターステイシャル広告IDを取得
   */
  private getInterstitialAdId(): string {
    return process.env.NODE_ENV === 'development' ? this.TEST_INTERSTITIAL_ID : this.PROD_INTERSTITIAL_ID;
  }

  /**
   * 同意管理（GDPR対応）
   */
  public async requestConsent(): Promise<boolean> {
    console.log('AdMob: 同意管理（一時的に無効化中）');
    return true;
  }

  /**
   * AdMobの状態をリセット
   */
  public reset(): void {
    this.isInitialized = false;
    this.interstitialAdLoaded = false;
  }
}

// シングルトンインスタンスをエクスポート
export const adMobService = AdMobService.getInstance();
