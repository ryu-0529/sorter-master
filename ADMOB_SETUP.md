# 仕分け職人 AdMob統合ガイド

このプロジェクトにAdMob広告を統合するための設定手順とガイドです。

## 📱 AdMob統合概要

### 実装済み機能
- **バナー広告**: 画面下部に常時表示
- **インターステイシャル広告**: 以下のタイミングで表示
  - ランキング戦スタート時
  - ルーム参加ボタン押下時
  - ルーム作成ボタン押下時

### アーキテクチャ
- `AdMobService`: AdMob操作のコアロジック
- `AdMobContext`: アプリ全体での広告状態管理
- `BannerAdSpace`: バナー広告表示コンポーネント

## ⚙️ セットアップ手順

### 1. AdMobアカウントの設定

1. [Google AdMob](https://admob.google.com/)でアカウントを作成
2. 新しいアプリを追加（iOS/Android別々）
3. 広告ユニットを作成:
   - バナー広告ユニット
   - インターステイシャル広告ユニット

### 2. 環境変数の設定

AdMob設定は既存の`.env.local`ファイルに追加されています。本番環境では以下の値を実際のAdMob IDに変更してください：

```env
# AdMob設定（本番環境用）
REACT_APP_ADMOB_APP_ID=ca-app-pub-YOUR_ACTUAL_PUBLISHER_ID~YOUR_ACTUAL_APP_ID
REACT_APP_ADMOB_BANNER_ID=ca-app-pub-YOUR_ACTUAL_PUBLISHER_ID/YOUR_ACTUAL_BANNER_ID
REACT_APP_ADMOB_INTERSTITIAL_ID=ca-app-pub-YOUR_ACTUAL_PUBLISHER_ID/YOUR_ACTUAL_INTERSTITIAL_ID
REACT_APP_ADMOB_TEST_DEVICE_ID=YOUR_ACTUAL_TEST_DEVICE_ID
```

**現在の開発環境設定（`.env.local`）:**
- Googleの公式テスト用広告IDが設定済み
- 開発中は実際の収益は発生しません
- 本番デプロイ前に実際のIDに変更が必要です

### 3. Capacitor設定の更新

`capacitor.config.json`のAdMobアプリIDを更新:

```json
{
  "plugins": {
    "AdMob": {
      "appId": "ca-app-pub-1234567890123456~1234567890",
      "initializeForTesting": true
    }
  }
}
```

### 4. プラットフォーム固有の設定

#### iOS設定

1. `ios/App/App/Info.plist`にAdMobアプリIDを追加:
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-1234567890123456~1234567890</string>
```

2. `ios/App/App/App.entitlements`にApp Tracking Transparencyの許可を追加:
```xml
<key>NSUserTrackingUsageDescription</key>
<string>This app would like to use your data for ads personalization</string>
```

#### Android設定

1. `android/app/src/main/AndroidManifest.xml`にAdMobアプリIDを追加:
```xml
<application>
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-1234567890123456~1234567890"/>
</application>
```

2. 権限を追加:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### 5. ビルドとデプロイ

```bash
# パッケージインストール
npm install

# Capacitor同期
npm run cap:sync

# iOS/Androidビルド
npm run cap:build:ios
npm run cap:build:android
```

## 🔧 開発・テスト

### テスト広告ID
開発中は自動的にテスト広告IDが使用されます。実際の収益は発生しません。

### デバッグ
- AdMobサービスのログは開発者ツールで確認可能
- Web環境では代替UI（プレースホルダー）が表示されます

## 📊 広告の表示タイミング

### バナー広告
- 全ページの下部に常時表示
- ゲームプレイ中は非表示

### インターステイシャル広告
- ランキング戦開始時
- ルーム参加時
- ルーム作成時
- 適切な間隔で表示（連続表示を避ける）

## 🎯 最適化のポイント

### ユーザーエクスペリエンス
- 広告表示のタイミングを最適化
- ローディング状態の適切な処理
- エラーハンドリングの実装

### 収益最適化
- 広告配置の A/B テスト
- インターステイシャル広告の頻度調整
- ユーザーセグメント別の広告戦略

## ⚠️ 注意事項

### 開発時
- テスト用広告IDを使用
- 本番用IDでテストしない（アカウント停止のリスク）

### 本番環境
- 実際のAdMob IDに変更
- `initializeForTesting: false`に設定
- 広告ポリシーの遵守

### プライバシー
- App Tracking Transparencyの実装（iOS）
- プライバシーポリシーの更新
- GDPR/CCPA対応

## 🚀 追加機能の実装

### リワード動画広告
```typescript
// 実装例
await adMobService.showRewardVideoAd();
```

### ネイティブ広告
```typescript
// 実装例
await adMobService.loadNativeAd();
```

## 📖 参考資料

- [Google AdMob Documentation](https://developers.google.com/admob)
- [Capacitor AdMob Plugin](https://github.com/capacitor-community/admob)
- [Firebase + AdMob Integration](https://firebase.google.com/docs/admob)

## 🤝 サポート

問題が発生した場合:
1. ログを確認
2. AdMob設定の再確認
3. プラットフォーム固有の設定を確認
4. 公式ドキュメントを参照

---

## 今後の改善点

1. **広告収益アナリティクス**: Firebase Analyticsとの連携
2. **A/Bテスト**: 広告配置の最適化
3. **ユーザーセグメンテーション**: 行動に基づく広告戦略
4. **パフォーマンス監視**: 広告表示速度の最適化
