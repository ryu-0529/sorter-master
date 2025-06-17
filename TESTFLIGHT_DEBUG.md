# TestFlight Apple ログインエラー調査ガイド

## 🔍 TestFlightでのAppleログインエラー調査

### 修正完了項目 ✅
1. **Firebase Sign in with Apple統一**: ネイティブプラグインから Firebase ポップアップ方式に統一
2. **詳細エラーログ追加**: エラーコード、メッセージ、スタック情報をコンソールに出力
3. **ユーザーフレンドリーエラーメッセージ**: 具体的なエラー内容をユーザーに表示
4. **ゲストボタンのスタイル変更**: 緑枠のアウトラインスタイルに変更

### TestFlightでの確認方法

#### 1. **Safari開発者ツールでのデバッグ**
TestFlightアプリ起動後：
1. Mac の Safari で `開発` → `iPhone/iPad` → `仕分け職人`
2. コンソールタブでエラーログを確認
3. Apple Sign-in ボタンをタップしてエラーを観察

#### 2. **予想されるエラーと対処法**

**エラー: `auth/popup-blocked`**
- **原因**: Safari のポップアップブロック
- **対処**: Safari設定でポップアップを許可

**エラー: `auth/network-request-failed`**
- **原因**: ネットワーク接続問題
- **対処**: Wi-Fi/セルラー接続を確認

**エラー: `auth/cancelled-popup-request`**
- **原因**: ユーザーがログインをキャンセル
- **対処**: 正常な動作（エラーではない）

**エラー: `auth/invalid-oauth-client-id`**
- **原因**: Firebase プロジェクトの OAuth設定不備
- **対処**: Firebase Console で Apple Sign-in 設定を確認

### Firebase Console での確認項目

1. **Authentication > Sign-in method**
   - Apple が有効になっているか
   - OAuth redirect domain に `sorter-master.firebaseapp.com` が含まれているか

2. **Apple Developer Console**
   - Sign in with Apple capability が有効か
   - Bundle ID `com.sortermaster.app` が正しいか

### 代替解決策

TestFlightでのAppleログインが不安定な場合：

1. **ゲストログイン推奨**: レビュアーには緑枠の「デモモードでプレイ」を案内
2. **Googleログイン**: 代替オプションとして提供
3. **メール登録**: 最後の手段として利用可能

### UI改善完了 ✅

**デモモード/ゲストボタン**:
- ✅ 緑色のアウトライン（`outline` variant）
- ✅ ホバー効果（薄緑背景）
- ✅ アクティブ効果（濃い緑背景）
- ✅ 2px の太い緑枠
- ✅ 目立つ配色で App Store レビュアーがすぐに発見可能

### App Store Connect 再提出準備 

1. **TestFlightアップロード**: 修正版をTestFlightに配信
2. **App Store Connect メモ**:
   ```
   【修正内容】
   - Apple Sign-in: Firebase統一実装で安定性向上
   - デモアクセス: 緑枠ボタンで明確に表示
   - エラーハンドリング: 詳細なログとユーザーフレンドリーメッセージ
   
   【レビュアー様へ】
   最も簡単なアクセス方法: 緑枠の「デモモードでプレイ」ボタン
   ```

3. **Xcode プロジェクト確認**:
   - Sign in with Apple capability が追加済み
   - `App.entitlements` ファイルが含まれている
   - Bundle ID が正しい

これで TestFlight での Apple ログインの安定性が向上し、ゲストボタンが目立つ緑枠になりました！
