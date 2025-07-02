#\!/bin/bash

echo "=== iOS Google Sign-In 修正内容の検証 ==="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Info.plist URL Schemes の確認..."
if grep -q "com.googleusercontent.apps.63283497482-0c6lol5so2tqqknj9saig7jdk4l19dap" ios/App/App/Info.plist; then
    echo -e "${GREEN}✓ Google URL Scheme が設定されています${NC}"
else
    echo -e "${RED}✗ Google URL Scheme が見つかりません${NC}"
fi

if grep -q "com.sortermaster.app" ios/App/App/Info.plist; then
    echo -e "${GREEN}✓ Firebase Auth URL Scheme が設定されています${NC}"
else
    echo -e "${RED}✗ Firebase Auth URL Scheme が見つかりません${NC}"
fi

echo ""
echo "2. GoogleService-Info.plist の確認..."
if [ -f "ios/App/App/GoogleService-Info.plist" ]; then
    echo -e "${GREEN}✓ GoogleService-Info.plist が存在します${NC}"
    
    if grep -q "com.googleusercontent.apps.63283497482-0c6lol5so2tqqknj9saig7jdk4l19dap" ios/App/App/GoogleService-Info.plist; then
        echo -e "${GREEN}✓ REVERSED_CLIENT_ID が正しく設定されています${NC}"
    else
        echo -e "${RED}✗ REVERSED_CLIENT_ID に問題があります${NC}"
    fi
else
    echo -e "${RED}✗ GoogleService-Info.plist が見つかりません${NC}"
fi

echo ""
echo "3. AppDelegate.swift の確認..."
if grep -q "Auth.auth().canHandle(url)" ios/App/App/AppDelegate.swift; then
    echo -e "${GREEN}✓ Firebase Auth URL handling が設定されています${NC}"
else
    echo -e "${RED}✗ Firebase Auth URL handling が見つかりません${NC}"
fi

if grep -q "GIDSignIn.sharedInstance.handle(url)" ios/App/App/AppDelegate.swift; then
    echo -e "${GREEN}✓ Google Sign-In URL handling が設定されています${NC}"
else
    echo -e "${RED}✗ Google Sign-In URL handling が見つかりません${NC}"
fi

echo ""
echo "4. Capacitor設定の確認..."
if grep -q "FirebaseAuthentication" capacitor.config.json; then
    echo -e "${GREEN}✓ Capacitor Firebase Authentication plugin が設定されています${NC}"
else
    echo -e "${RED}✗ Capacitor Firebase Authentication plugin が見つかりません${NC}"
fi

echo ""
echo "5. package.json の依存関係確認..."
if grep -q "@capacitor-firebase/authentication" package.json; then
    echo -e "${GREEN}✓ @capacitor-firebase/authentication パッケージがインストールされています${NC}"
else
    echo -e "${RED}✗ @capacitor-firebase/authentication パッケージが見つかりません${NC}"
fi

echo ""
echo "6. AuthContext.tsx の確認..."
if grep -q "Capacitor.isNativePlatform()" src/contexts/AuthContext.tsx; then
    echo -e "${GREEN}✓ ネイティブプラットフォーム判定が実装されています${NC}"
else
    echo -e "${RED}✗ ネイティブプラットフォーム判定が見つかりません${NC}"
fi

if grep -q "FirebaseAuthentication.signInWithGoogle()" src/contexts/AuthContext.tsx; then
    echo -e "${GREEN}✓ ネイティブGoogle認証が実装されています${NC}"
else
    echo -e "${RED}✗ ネイティブGoogle認証が見つかりません${NC}"
fi

echo ""
echo "=== 修正内容まとめ ==="
echo "1. Info.plistにFirebase Auth用のURL Schemeを追加"
echo "2. AppDelegate.swiftにデバッグログとFirebase Auth優先のURL処理を追加"  
echo "3. AuthContext.tsxにより詳細なログ出力を追加"
echo "4. CapacitorプロジェクトをiOSで同期"
echo ""
echo "=== 次のステップ ==="
echo "1. Xcodeでプロジェクトを開き: ${YELLOW}npx cap open ios${NC}"
echo "2. デバイスまたはシミュレータでテスト"
echo "3. Safariの開発者ツール または Xcodeのコンソールでログを確認"
echo "4. Googleログインボタンを押した時のログを確認"
echo ""
echo "=== よくある追加のトラブルシューティング ==="
echo "• Firebase Console でGoogle認証が有効になっているかを確認"
echo "• iOS Bundle ID がFirebase プロジェクト設定と一致しているかを確認"
echo "• プロジェクトのクリーンビルド: Product -> Clean Build Folder"
echo "• DerivedDataの削除を試す"
echo ""
