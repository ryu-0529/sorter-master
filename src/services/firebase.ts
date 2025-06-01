// /src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter, doc, setDoc, increment, serverTimestamp, writeBatch, deleteDoc, DocumentSnapshot, getCountFromServer, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { Capacitor } from '@capacitor/core';

// 環境変数からFirebase設定を読み込み
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDaIbIkTuh_GACGxuIxuYf6vC_pNH7UB2k",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "sorter-master.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "sorter-master",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "sorter-master.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "63283497482",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:63283497482:ios:10a243cd83132b04856df3",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://sorter-master-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// デバッグ用ログ
console.log('Firebase設定:', {
  apiKey: firebaseConfig.apiKey ? '設定済み' : '未設定',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? '設定済み' : '未設定'
});

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// Capacitor環境に応じて適切な認証インスタンスを作成
let auth: Auth;
if (Capacitor.isNativePlatform()) {
  console.log('Capacitorネイティブ環境で実行中 - indexedDBLocalPersistenceを使用');
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence
  });
} else {
  console.log('Web環境で実行中 - 通常のgetAuth()を使用');
  auth = getAuth(app);
}

// サービスインスタンスをエクスポート
export { auth };
export const firestore = getFirestore(app);
export const database = getDatabase(app);

// ランキング設定定数
export const RANKING_CONFIG = {
  KEEP_TOP: 200,       // 保持する上位ランキング数
  CONTEXT_RANGE: 10,   // ユーザー前後のコンテキスト範囲
  CLEANUP_THRESHOLD: 1000, // クリーンアップを開始するしきい値
  CLEANUP_PROBABILITY: 0.05, // クリーンアップ実行確率（5%）
  CLEANUP_BATCH_SIZE: 50 // 一度に削除する最大数
};

/**
 * ランキングデータを取得し、クライアントサイドで処理する関数
 * @param type ランキングタイプ（'daily', 'weekly', 'monthly', 'all_time'）
 * @param userId 現在のユーザーID（オプション）
 */
export async function fetchAndProcessRankings(type: string, userId?: string) {
  try {
    // 上位ランキングデータの取得（余裕を持って多めに取得）
    const rankingsRef = collection(firestore, 'rankings');
    const rankingsQuery = query(
      rankingsRef,
      where('type', '==', type),
      orderBy('score', 'desc'),
      limit(500) // 安全マージンとして多めに取得
    );
    
    const rankingsSnapshot = await getDocs(rankingsQuery);
    
    // クライアントサイドでのランキング処理
    const rankings: any[] = [];
    let userRank = -1;
    let userIndex = -1;
    
    // 手動でインデックスを管理
    let index = 0;
    rankingsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      if (userId && data.userId === userId) {
        userRank = index + 1;
        userIndex = index;
      }
      rankings.push({
        id: doc.id,
        rank: index + 1,
        ...data
      });
      index++; // インデックスを手動で増加
    });
    
    // 表示用データの選別
    const topRankings = rankings.slice(0, RANKING_CONFIG.KEEP_TOP); // 上位200位
    
    // ユーザー周辺のコンテキスト取得（±10位）
    let userContext: any[] = [];
    if (userId && userIndex >= 0 && userRank > RANKING_CONFIG.KEEP_TOP) {
      // ユーザーが上位200位外の場合
      const startIdx = Math.max(0, userIndex - RANKING_CONFIG.CONTEXT_RANGE);
      const endIdx = Math.min(rankings.length, userIndex + RANKING_CONFIG.CONTEXT_RANGE + 1);
      userContext = rankings.slice(startIdx, endIdx);
    }
    
    // 結果を返す
    return {
      topRankings,
      userRank,
      userContext,
      totalCount: rankings.length
    };
  } catch (error) {
    console.error('ランキング取得エラー:', error);
    throw error;
  }
}

/**
 * 新しいスコアを登録し、必要に応じてランキングデータをクリーンアップする関数
 * @param userId ユーザーID
 * @param displayName 表示名
 * @param score スコア
 * @param correctAnswers 正解数
 * @param totalCards 合計カード数
 * @param timeElapsed 経過時間（秒）
 * @param gameType ランキングタイプ（'daily', 'weekly', 'monthly', 'all_time'）
 */
export async function submitScoreAndCleanup(
  userId: string,
  displayName: string,
  score: number,
  correctAnswers: number,
  totalCards: number,
  timeElapsed: number,
  gameType: string
) {
  try {
    const batch = writeBatch(firestore);
    
    // 1. 新しいスコアを登録
    const rankingsRef = collection(firestore, 'rankings');
    const newRankingRef = doc(rankingsRef);
    
    // 現在のタイムスタンプをクライアントで生成
    const timestamp = new Date();
    
    batch.set(newRankingRef, {
      userId,
      displayName,
      score,
      correctAnswers,
      totalCards,
      timeElapsed,
      type: gameType,
      timestamp,
      retention: {
        level: 'candidate', // 初期値は「候補」
        expires: new Date(timestamp.getTime() + 30 * 24 * 60 * 60 * 1000) // 30日後
      }
    });
    
    // 2. ランダムな確率でクリーンアップを実行
    const shouldTriggerCleanup = Math.random() < RANKING_CONFIG.CLEANUP_PROBABILITY;
    
    if (shouldTriggerCleanup) {
      // 3. 総数を確認
      const countSnapshot = await getCountFromServer(query(
        rankingsRef,
        where('type', '==', gameType)
      ));
      
      const totalCount = countSnapshot.data().count;
      
      // 4. しきい値を超えている場合のみクリーンアップを実行
      if (totalCount > RANKING_CONFIG.CLEANUP_THRESHOLD) {
        // 5. 上位N位以外のデータを取得
        const oldRankingsSnapshot = await getDocs(query(
          rankingsRef,
          where('type', '==', gameType),
          orderBy('score', 'desc'),
          startAfter(RANKING_CONFIG.KEEP_TOP + RANKING_CONFIG.CONTEXT_RANGE * 2),
          limit(RANKING_CONFIG.CLEANUP_BATCH_SIZE)
        ));
        
        // 6. 削除処理
        let deletedCount = 0;
        oldRankingsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          batch.delete(doc.ref);
          deletedCount++;
        });
        
        // 7. 統計情報を更新
        if (deletedCount > 0) {
          const statsRef = doc(collection(firestore, 'ranking_statistics'), 
                              `${gameType}_${new Date().toISOString().slice(0, 10)}`);
          batch.set(statsRef, {
            rankingType: gameType,
            date: timestamp,
            deletedEntries: increment(deletedCount),
            lastCleanup: timestamp
          }, { merge: true });
        }
      }
    }
    
    // バッチ処理を実行
    await batch.commit();
    
    return { success: true };
  } catch (error) {
    console.error('スコア登録エラー:', error);
    throw error;
  }
}

export default app;