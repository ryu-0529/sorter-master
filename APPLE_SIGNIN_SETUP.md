# Apple Sign-In設定ガイド

## エラーの原因

現在発生している `auth/operation-not-allowed` エラーは、Firebase ConsoleでApple認証が有効化されていないことが原因です。

## 必要な設定手順

### 1. Apple Developer Consoleでの設定

1. [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list)にアクセス
2. **Identifiers**セクションで、アプリのBundle ID (`com.sortermaster.app`) を選択
3. **Sign In with Apple**にチェックを入れて有効化
4. **Save**をクリック

### 2. Service IDの作成

1. Apple Developer Consoleの**Identifiers**セクションで「+」をクリック
2. **Services IDs**を選択して続行
3. 以下の情報を入力：
   - **Description**: Sorter Master Web
   - **Identifier**: `com.sortermaster.app.signin` (または任意のサービスID)
4. **Continue**をクリックして作成
5. 作成したService IDを選択し、**Sign In with Apple**を有効化
6. **Configure**をクリックして以下を設定：
   - **Primary App ID**: `com.sortermaster.app`を選択
   - **Domains and Subdomains**: `sorter-master.firebaseapp.com`
   - **Return URLs**: `https://sorter-master.firebaseapp.com/__/auth/handler`
7. **Save**をクリック

### 3. Keyの作成

1. Apple Developer Consoleの**Keys**セクションで「+」をクリック
2. **Key Name**を入力（例：Firebase Auth Key）
3. **Sign In with Apple**にチェックを入れる
4. **Configure**をクリックして、Primary App IDに`com.sortermaster.app`を選択
5. **Continue**をクリックして作成
6. **Download**をクリックしてキーファイル（.p8）をダウンロード
7. **Key ID**をメモしておく

### 4. Firebase Consoleでの設定

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクトを選択
3. **Authentication** → **Sign-in method**タブを開く
4. **Apple**プロバイダーの「有効にする」をクリック
5. 以下の情報を入力：
   - **Service ID**: 手順2で作成したService ID（例：`com.sortermaster.app.signin`）
   - **Apple Team ID**: Apple Developer ConsoleのMembership詳細で確認できるTeam ID
   - **Key ID**: 手順3でメモしたKey ID
   - **Private Key**: 手順3でダウンロードした.p8ファイルの内容をコピー＆ペースト
6. **保存**をクリック

### 5. アプリの再ビルドと同期

```bash
# プロジェクトディレクトリで実行
npm run build
npx cap sync ios
```

### 6. Xcodeでの確認

1. Xcodeでプロジェクトを開く
2. **Signing & Capabilities**タブで**Sign In with Apple**が追加されていることを確認
3. Bundle Identifierが`com.sortermaster.app`であることを確認

## トラブルシューティング

### エラー: auth/invalid-credential
- Service ID、Team ID、Key IDが正しく設定されているか確認
- Private Keyが正しくコピーされているか確認
- Service IDのReturn URLsが正しく設定されているか確認

### エラー: auth/operation-not-allowed
- Firebase ConsoleでApple認証が有効化されているか確認
- 設定を保存した後、数分待ってから再試行

### エラー: nonce is missing
- コードでnonceの処理が正しく実装されているか確認（今回の修正で対応済み）

## 注意事項

- Private Keyは一度しかダウンロードできないため、安全な場所に保管してください
- Firebase Consoleの設定変更後、反映まで数分かかる場合があります
- TestFlightでテストする場合、Apple IDに2ファクタ認証が有効になっている必要があります
