# 仕分け職人 (Sorter Master) アプリ

車種を素早く正確に分類するスキルを競うモバイルゲームアプリです。

## 概要

「仕分け職人」は、表示される車の画像を適切なカテゴリにスワイプ操作で分類するゲームです。ランキング戦（1人用）と通信対戦（最大4人）のモードが用意されています。

## 主な機能

- クロスプラットフォーム対応（Web/PWA, iOS, Android）
- オプショナルユーザー登録システム（匿名プレイも可能）
- リアルタイム通信対戦
- ランキングシステム
- スワイプによる直感的な操作性

## 技術スタック

- **フロントエンド**: React + TypeScript
- **UIライブラリ**: Chakra UI
- **スワイプ検出**: react-swipeable
- **バックエンド**: Firebase
  - Authentication（認証）
  - Firestore（データベース）
  - Realtime Database（リアルタイム通信）
- **PWA対応**: オフラインプレイやインストール可能なアプリ体験

## 車種カテゴリ

- クロスカントリー
- SUV
- 軽自動車
- ミニバン
- ワンボックス
- コンパクト
- セダン
- ステーションワゴン
- クーペ

## インストールと実行

### 必要条件

- Node.js 16.x以上
- npm 8.x以上または yarn 1.22.x以上

### セットアップ手順

1. リポジトリをクローン

```bash
git clone https://github.com/yourusername/sorter-master.git
cd sorter-master
```

2. 依存パッケージをインストール

```bash
npm install
# または
yarn
```

3. Firebaseの設定

`src/services/firebase.ts`ファイルを編集し、自身のFirebase設定を追加します。

4. 開発サーバーを起動

```bash
npm start
# または
yarn start
```

5. ビルド

```bash
npm run build
# または
yarn build
```

## プロジェクト構造

```
sorter-master/
├── public/               # 静的アセット
│   ├── images/           # 画像ファイル
│   └── ...
├── src/                  # ソースコード
│   ├── components/       # UIコンポーネント
│   ├── contexts/         # コンテキスト（状態管理）
│   ├── hooks/            # カスタムフック
│   ├── pages/            # ページコンポーネント
│   ├── services/         # Firebase接続などのサービス
│   ├── types/            # TypeScript型定義
│   └── utils/            # ユーティリティ関数
└── ...
```

## ライセンス

MIT

## 制作者

このプロジェクトは[Anthropic Claude 3.7 Sonnet](https://www.anthropic.com/claude)で生成されました。
