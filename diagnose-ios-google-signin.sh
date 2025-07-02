#!/bin/bash

echo "🔍 iOS Google Sign-In診断スクリプト"
echo "======================================"

# カラーコード
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. GoogleService-Info.plistの確認
echo -e "\n${YELLOW}1. GoogleService-Info.plist確認${NC}"
if [ -f "ios/App/App/GoogleService-Info.plist" ]; then
    echo -e "${GREEN}✓ GoogleService-Info.plistが存在します${NC}"
    
    # CLIENT_IDの確認
    CLIENT_ID=$(grep -A1 "CLIENT_ID" ios/App/App/GoogleService-Info.plist | tail -n1 | sed 's/<[^>]*>//g' | xargs)
    echo "CLIENT_ID: ${CLIENT_ID}"
    
    # REVERSED_CLIENT_IDの確認
    REVERSED_CLIENT_ID=$(grep -A1 "REVERSED_CLIENT_ID" ios/App/App/GoogleService-Info.plist | tail -n1 | sed 's/<[^>]*>//g' | xargs)
    echo "REVERSED_CLIENT_ID: ${REVERSED_CLIENT_ID}"
else
    echo -e "${RED}✗ GoogleService-Info.plistが見つかりません${NC}"
fi

# 2. Info.plistのURL Schemes確認
echo -e "\n${YELLOW}2. Info.plistのURL Schemes確認${NC}"
if [ -f "ios/App/App/Info.plist" ]; then
    echo -e "${GREEN}✓ Info.plistが存在します${NC}"
    
    # CFBundleURLTypesの存在確認
    if grep -q "CFBundleURLTypes" ios/App/App/Info.plist; then
        echo -e "${GREEN}✓ CFBundleURLTypesが設定されています${NC}"
        
        # URL Schemesの内容を表示
        echo "URL Schemes:"
        grep -A20 "CFBundleURLTypes" ios/App/App/Info.plist | grep -B5 -A5 "CFBundleURLSchemes" || echo "URL Schemesの詳細が取得できません"
    else
        echo -e "${RED}✗ CFBundleURLTypesが設定されていません${NC}"
    fi
else
    echo -e "${RED}✗ Info.plistが見つかりません${NC}"
fi

# 3. Podfile確認
echo -e "\n${YELLOW}3. Podfile確認${NC}"
if [ -f "ios/App/Podfile" ]; then
    echo -e "${GREEN}✓ Podfileが存在します${NC}"
    
    # CapacitorFirebaseAuthentication/Googleの確認
    if grep -q "CapacitorFirebaseAuthentication/Google" ios/App/Podfile; then
        echo -e "${GREEN}✓ CapacitorFirebaseAuthentication/Googleが設定されています${NC}"
    else
        echo -e "${RED}✗ CapacitorFirebaseAuthentication/Googleが設定されていません${NC}"
    fi
else
    echo -e "${RED}✗ Podfileが見つかりません${NC}"
fi

# 4. AppDelegate.swift確認
echo -e "\n${YELLOW}4. AppDelegate.swift確認${NC}"
if [ -f "ios/App/App/AppDelegate.swift" ]; then
    echo -e "${GREEN}✓ AppDelegate.swiftが存在します${NC}"
    
    # URL処理メソッドの確認
    if grep -q "func application.*open url" ios/App/App/AppDelegate.swift; then
        echo -e "${GREEN}✓ URL処理メソッドが実装されています${NC}"
    else
        echo -e "${RED}✗ URL処理メソッドが実装されていません${NC}"
    fi
    
    # Auth.auth().canHandle確認
    if grep -q "Auth.auth().canHandle" ios/App/App/AppDelegate.swift; then
        echo -e "${GREEN}✓ Firebase Auth URL処理が実装されています${NC}"
    else
        echo -e "${RED}✗ Firebase Auth URL処理が実装されていません${NC}"
    fi
    
    # GIDSignIn.sharedInstance.handle確認
    if grep -q "GIDSignIn.sharedInstance.handle" ios/App/App/AppDelegate.swift; then
        echo -e "${GREEN}✓ Google Sign-In URL処理が実装されています${NC}"
    else
        echo -e "${RED}✗ Google Sign-In URL処理が実装されていません${NC}"
    fi
else
    echo -e "${RED}✗ AppDelegate.swiftが見つかりません${NC}"
fi

# 5. capacitor.config.json確認
echo -e "\n${YELLOW}5. capacitor.config.json確認${NC}"
if [ -f "capacitor.config.json" ]; then
    echo -e "${GREEN}✓ capacitor.config.jsonが存在します${NC}"
    
    # FirebaseAuthentication設定の確認
    if grep -q "FirebaseAuthentication" capacitor.config.json; then
        echo -e "${GREEN}✓ FirebaseAuthentication設定が存在します${NC}"
        
        # skipNativeAuthの確認
        if grep -q '"skipNativeAuth": false' capacitor.config.json; then
            echo -e "${GREEN}✓ skipNativeAuth: falseが設定されています${NC}"
        else
            echo -e "${RED}✗ skipNativeAuth: falseが設定されていません${NC}"
        fi
        
        # google.comプロバイダーの確認
        if grep -q "google.com" capacitor.config.json; then
            echo -e "${GREEN}✓ google.comプロバイダーが設定されています${NC}"
        else
            echo -e "${RED}✗ google.comプロバイダーが設定されていません${NC}"
        fi
    else
        echo -e "${RED}✗ FirebaseAuthentication設定が存在しません${NC}"
    fi
else
    echo -e "${RED}✗ capacitor.config.jsonが見つかりません${NC}"
fi

# 6. 推奨される修正アクション
echo -e "\n${YELLOW}推奨される修正アクション：${NC}"
echo "1. プロジェクトをクリーンビルド: cd ios/App && rm -rf ~/Library/Developer/Xcode/DerivedData"
echo "2. Podsを再インストール: cd ios/App && rm -rf Pods Podfile.lock && pod install"
echo "3. Capacitorを同期: npx cap sync ios"
echo "4. Xcodeでプロジェクトを開いて実行: npx cap open ios"
echo "5. Safari開発メニューでWebインスペクタを使用してJavaScriptコンソールを確認"

echo -e "\n${YELLOW}Firebase Console確認事項：${NC}"
echo "1. Firebase Console > Authentication > Sign-in method で Google が有効になっているか確認"
echo "2. Firebase Console > Project settings > Your apps > iOS app で Bundle ID が正しく設定されているか確認"
echo "3. OAuth consent screen が正しく設定されているか確認"

echo -e "\n診断完了！"
