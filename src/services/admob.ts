// /src/services/admob.ts
import { 
  AdMob, 
  BannerAdOptions, 
  BannerAdPosition, 
  BannerAdSize,
  AdMobInitializationOptions
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// App Tracking Transparency のためのプラグイン型定義
declare global {
  interface Window {
    AppTrackingTransparency?: {
      requestTrackingAuthorization(): Promise<{ status: string }>;
    };
  }
}

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
   * App Tracking Transparencyの許可をリクエスト
   */
  public async requestTrackingAuthorization(): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        console.log('App Tracking Transparency: iOS以外のプラットフォーム、またはWeb環境のためスキップ');
        return true;
      }

      // iOS 14.5以降でのみ実行
      if (window.AppTrackingTransparency) {
        console.log('App Tracking Transparency: 許可をリクエスト中...');
        const result = await window.AppTrackingTransparency.requestTrackingAuthorization();
        const isAuthorized = result.status === 'authorized';
        console.log('App Tracking Transparency結果:', result.status);
        return isAuthorized;
      } else {
        console.log('App Tracking Transparency: プラグインが利用できません');
        return true; // プラグインがない場合は許可とみなす
      }
    } catch (error) {
      console.error('App Tracking Transparency リクエストエラー:', error);
      return false;
    }
  }

  /**
   * AdMobを初期化
   */
  public async initialize(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('AdMob: Web環境のため初期化をスキップ');
        return;
      }

      if (this.isInitialized) {
        console.log('AdMob: 既に初期化済み');
        return;
      }

      // iOS の場合、App Tracking Transparencyの許可を先にリクエスト
      if (Capacitor.getPlatform() === 'ios') {
        await this.requestTrackingAuthorization();
      }

      const initOptions: AdMobInitializationOptions = {
        testingDevices: ['YOUR_DEVICE_ID'], // テストデバイスIDを追加
        initializeForTesting: process.env.NODE_ENV === 'development'
      };

      await AdMob.initialize(initOptions);

      this.isInitialized = true;
      console.log('AdMob初期化完了');

      // インターステイシャル広告を事前にロード
      await this.preloadInterstitialAd();
    } catch (error) {
      console.error('AdMob初期化エラー:', error);
    }
  }

  /**
   * バナー広告を表示
   */
  public async showBannerAd(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('AdMob: Web環境のためバナー広告をスキップ');
        return;
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      const options: BannerAdOptions = {
        adId: this.getBannerAdId(),
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: process.env.NODE_ENV === 'development'
      };

      await AdMob.showBanner(options);
      console.log('バナー広告表示完了');
    } catch (error) {
      console.error('バナー広告表示エラー:', error);
    }
  }

  /**
   * バナー広告を非表示
   */
  public async hideBannerAd(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      await AdMob.hideBanner();
      console.log('バナー広告非表示完了');
    } catch (error) {
      console.error('バナー広告非表示エラー:', error);
    }
  }

  /**
   * インターステイシャル広告を事前ロード
   */
  private async preloadInterstitialAd(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      const options = {
        adId: this.getInterstitialAdId(),
        isTesting: process.env.NODE_ENV === 'development'
      };

      await AdMob.prepareInterstitial(options);
      this.interstitialAdLoaded = true;
      console.log('インターステイシャル広告ロード完了');
    } catch (error) {
      console.error('インターステイシャル広告ロードエラー:', error);
      this.interstitialAdLoaded = false;
    }
  }

  /**
   * インターステイシャル広告を表示
   */
  public async showInterstitialAd(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('AdMob: Web環境のためインターステイシャル広告をスキップ');
        return;
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.interstitialAdLoaded) {
        console.log('インターステイシャル広告がロードされていません。ロード中...');
        await this.preloadInterstitialAd();
        
        // ロードが完了するまで少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (this.interstitialAdLoaded) {
        await AdMob.showInterstitial();
        console.log('インターステイシャル広告表示完了');
        
        // 次の広告を事前にロード
        this.interstitialAdLoaded = false;
        setTimeout(() => this.preloadInterstitialAd(), 2000);
      } else {
        console.log('インターステイシャル広告のロードに失敗しました');
      }
    } catch (error) {
      console.error('インターステイシャル広告表示エラー:', error);
      this.interstitialAdLoaded = false;
      // エラー時も次の広告をロード
      setTimeout(() => this.preloadInterstitialAd(), 5000);
    }
  }

  /**
   * 広告収益の追跡（Firebaseアナリティクスと連携）
   */
  public async trackAdRevenue(value: number, currency: string = 'USD'): Promise<void> {
    try {
      // ここでFirebaseアナリティクスに収益データを送信
      console.log(`広告収益追跡: ${value} ${currency}`);
    } catch (error) {
      console.error('広告収益追跡エラー:', error);
    }
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
    try {
      // ここで同意管理を実装
      // 実際の実装では、ユーザーの地域に基づいて同意を求める
      return true;
    } catch (error) {
      console.error('同意管理エラー:', error);
      return false;
    }
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
