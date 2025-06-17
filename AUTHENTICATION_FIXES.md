# 認証問題修正レポート

## 修正した問題

### 1. Appleログイン時にユーザー名が表示されない問題

**問題**: Apple Sign-in後にユーザーの表示名（displayName）が取得・表示されない

**原因**: 
- Appleの Sign-in では初回認証時のみ名前情報が提供される
- AdditionalUserInfoから取得できる名前情報が適切に処理されていなかった

**修正内容**:
- `getAdditionalUserInfo`をインポートして使用
- 初回認証時（`isNewUser: true`）の場合に名前情報を取得
- ネイティブ環境では`result.response?.fullName`から名前を取得
- Web環境では`additionalUserInfo?.profile`から名前を取得
- 取得した名前情報をFirebase Authのプロフィールとして更新
- Firestoreにも適切に保存

**修正ファイル**: `src/contexts/AuthContext.tsx`

### 2. Googleログインが失敗する問題

**問題**: Googleログインが動作しない

**原因**: 
- Capacitor環境で適切なGoogle Sign-inプラグインが設定されていない
- ネイティブプラグインとWeb版の処理が混在していた

**修正内容**:
- 現在はWeb環境でのFirebase方式のみをサポート
- `signInWithPopup`を使用したGoogleログインに統一
- エラーハンドリングを改善
- 詳細なログ出力を追加

**修正ファイル**: 
- `src/contexts/AuthContext.tsx`
- `.env.local` (Google Client ID設定を追加)

## 追加された設定

### 環境変数
```
REACT_APP_GOOGLE_WEB_CLIENT_ID=63283497482-ljrkk01evqvs3l3e5n0s1qe2abdfhbbf.apps.googleusercontent.com
```

## 今後の改善点

### Google Sign-in プラグインの追加（将来的）
現在はWeb環境でのGoogle Sign-inのみサポートしていますが、将来的にネイティブプラグインを追加する場合：

1. プラグインのインストール:
```bash
npm install @capacitor-community/google-sign-in
```

2. Capacitor設定（`capacitor.config.json`）:
```json
"GoogleAuth": {
  "scopes": ["profile", "email"],
  "serverClientId": "63283497482-ljrkk01evqvs3l3e5n0s1qe2abdfhbbf.apps.googleusercontent.com",
  "forceCodeForRefreshToken": true
}
```

3. iOS設定: GoogleService-Info.plistファイルが必要

## テスト方法

### 1. Appleログインテスト
1. ログインページでAppleログインボタンをクリック
2. Apple IDでサインイン（初回の場合は名前を許可）
3. ログイン後、プロフィールページで表示名が正しく表示されることを確認

### 2. Googleログインテスト
1. ログインページでGoogleログインボタンをクリック
2. Googleアカウントでサインイン
3. ログイン後、プロフィールページで名前とメールが正しく表示されることを確認

## 修正されたコードの主要な変更点

### AuthContext.tsx
- `getAdditionalUserInfo`の追加
- Apple Sign-in での名前取得ロジックの改善
- Google Sign-in の簡素化（Web版のみ）
- エラーハンドリングとログの改善

### .env.local
- Google Web Client IDの追加

これらの修正により、AppleログインとGoogleログインの両方が正常に動作し、ユーザー名も適切に表示されるようになります。
