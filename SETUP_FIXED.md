# 「仕分け職人」iOSセットアップ完了ガイド

## ✅ 修正完了内容

### 1. iOS デプロイメントターゲット問題の解決
- **問題**: AdMobプラグイン v7.0.3 が iOS 13.0 より高いデプロイメントターゲットを要求
- **解決**: iOS デプロイメントターゲットを 14.0 に更新

**修正されたファイル:**
- `ios/App/Podfile` - `platform :ios, '14.0'`
- `ios/App/App.xcodeproj/project.pbxproj` - 4箇所の `IPHONEOS_DEPLOYMENT_TARGET = 14.0`
- `capacitor.config.json` - 非推奨の `bundledWebRuntime` 設定を削除

### 2. Capacitor プロジェクト状態
- ✅ iOS プロジェクト正常に作成・設定完了
- ✅ Android プロジェクト正常に作成・設定完了
- ✅ Pods インストール完了
- ✅ Web アセット同期完了
- ✅ Xcode プロジェクト正常に開くことを確認

## 🚀 次のステップ

### Step 1: Xcode での iOS 設定
現在 Xcode が開いているので、以下を確認・設定してください：

1. **Team & Signing** の設定
   - 「Signing & Capabilities」タブ
   - 「Team」でデベロッパーアカウントを選択
   - 「Bundle Identifier」を確認 (`com.sortermaster.app`)

2. **ビルドターゲット** の確認
   - Deployment Target が iOS 14.0 になっていることを確認

### Step 2: 開発用ビルド・実行コマンド

```bash
# Web アプリをビルドしてiOSに同期
npm run build && npx cap copy ios

# Xcode を開く
npx cap open ios

# Android Studio を開く（Android開発時）
npx cap open android

# Web アプリをビルドしてAndroidに同期
npm run build && npx cap copy android
```

### Step 3: Firebase設定 (必要に応じて)
1. `ios/App/App/GoogleService-Info.plist` (iOS用)
2. `android/app/google-services.json` (Android用)

### Step 4: AdMob設定
- 本番用AdMob IDに変更（現在はテスト用）
- `capacitor.config.json` の AdMob 設定を確認

## 📱 プロジェクト構造

```
sorter-master/
├── ios/                    # iOS ネイティブプロジェクト (Xcode)
├── android/               # Android ネイティブプロジェクト (Android Studio)
├── src/                   # React アプリケーション
├── build/                 # ビルド済み Web アセット
├── capacitor.config.json  # Capacitor 設定
└── package.json          # Node.js 依存関係
```

## ⚡ 利用可能なスクリプト

```bash
# 開発サーバー起動
npm start

# Web アプリビルド
npm run build

# Firebase デプロイ
npm run deploy

# iOS/Android プロジェクトを開く
npx cap open ios
npx cap open android

# 各プラットフォームにコピー
npx cap copy ios
npx cap copy android
```

## 🔧 トラブルシューティング

### iOS ビルドエラー時
1. Xcode で Product → Clean Build Folder
2. `ios/App/Pods` フォルダを削除
3. `cd ios/App && pod install`

### Android ビルドエラー時
1. Android Studio で Build → Clean Project
2. Gradle 同期の再実行

## ✨ 現在の状態
- ✅ iOS プロジェクト: 完全に設定済み
- ✅ Android プロジェクト: 完全に設定済み
- ✅ Capacitor 設定: 最適化済み
- ✅ AdMob プラグイン: 正常に動作する状態

開発を始める準備が整いました！
