import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Firebase設定 (実際のプロジェクトで使用する場合は.envファイルに移動することをお勧めします)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "sorter-master.firebaseapp.com",
  projectId: "sorter-master",
  storageBucket: "sorter-master.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://sorter-master-default-rtdb.firebaseio.com"
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// 認証、Firestore、RealtimeDBインスタンスをエクスポート
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const database = getDatabase(app);

export default app;
