import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';
import { User } from '../types';

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signInAsGuest: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  linkAnonymousWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  linkAnonymousWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Firebaseユーザーオブジェクトから独自のユーザーオブジェクトを作成する
  const createUserObject = async (firebaseUser: FirebaseUser | null): Promise<User | null> => {
    if (!firebaseUser) return null;
    
    // Firestoreからユーザー情報を取得して、displayNameをFirestoreの値で上書き
    try {
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists() && userSnapshot.data().displayName) {
        return {
          uid: firebaseUser.uid,
          displayName: userSnapshot.data().displayName,
          email: firebaseUser.email,
          isAnonymous: firebaseUser.isAnonymous,
          photoURL: firebaseUser.photoURL
        };
      }
    } catch (err) {
      console.error("Firestoreからのユーザー取得エラー:", err);
    }

    // Firestoreから取得できなかった場合はFirebase Authの値を使用
    return {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      isAnonymous: firebaseUser.isAnonymous,
      photoURL: firebaseUser.photoURL
    };
  };

  // ユーザープロファイルをFirestoreに保存
  const saveUserToFirestore = async (user: User) => {
    const userRef = doc(firestore, 'users', user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || `Guest-${user.uid.substring(0, 5)}`,
        email: user.email,
        isAnonymous: user.isAnonymous,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString()
      });
    } else {
      // 既存ユーザーでdisplayNameがない場合は更新
      const existingData = userSnapshot.data();
      if (!existingData.displayName && user.displayName) {
        await setDoc(userRef, {
          displayName: user.displayName,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }
  };

  // 匿名サインイン
  const signInAsGuest = async () => {
    try {
      setError(null);
      const result = await signInAnonymously(auth);
      const user = await createUserObject(result.user);
      if (user) {
        await saveUserToFirestore(user);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("匿名サインインエラー:", err);
    }
  };

  // メールでのログイン
  const loginWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      // ログイン成功時は onAuthStateChanged で自動的に currentUser が更新される
    } catch (err) {
      setError((err as Error).message);
      console.error("メールログインエラー:", err);
      throw err; // エラーを再度throwして、呼び出し元でキャッチできるようにする
    }
  };

  // メールでの新規登録
  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Firebase Authのプロフィールを更新
      if (result.user) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      const user = await createUserObject(result.user);
      if (user) {
        user.displayName = displayName;
        await saveUserToFirestore(user);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("メール登録エラー:", err);
    }
  };

  // Googleでのログイン
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      
      // Capacitor環境での設定を追加
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = await createUserObject(result.user);
      if (user) {
        await saveUserToFirestore(user);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("Googleログインエラー:", err);
      throw err; // エラーを再度throwして、呼び出し元でキャッチできるようにする
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError((err as Error).message);
      console.error("ログアウトエラー:", err);
    }
  };

  // 匿名アカウントをメールアカウントにリンク
  const linkAnonymousWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        
        // Firebase Authのプロフィールを更新
        await updateProfile(auth.currentUser, {
          displayName: displayName
        });
        
        // ユーザー情報を更新
        const userRef = doc(firestore, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          displayName,
          email,
          isAnonymous: false,
          photoURL: null,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // 現在のユーザー情報を更新
        const updatedUser = await createUserObject(auth.currentUser);
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("アカウントリンクエラー:", err);
    }
  };

  // 匿名アカウントをGoogleアカウントにリンク
  const linkAnonymousWithGoogle = async () => {
    try {
      setError(null);
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("Googleリンクエラー:", err);
    }
  };

  // 認証状態の監視
  useEffect(() => {
    console.log('AuthContext: 認証状態の監視を開始');
    
    // タイムアウトを設定（5秒後にローディング解除）
    const timeout = setTimeout(() => {
      console.log('AuthContext: 認証タイムアウト - ローディング解除');
      setLoading(false);
    }, 5000);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: 認証状態変更検出', firebaseUser ? 'ユーザーあり' : 'ユーザーなし');
      
      try {
        const user = await createUserObject(firebaseUser);
        if (user) {
          await saveUserToFirestore(user);
        }
        setCurrentUser(user);
        setLoading(false);
        clearTimeout(timeout); // 認証成功時はタイムアウトをクリア
      } catch (error) {
        console.error('AuthContext: ユーザー処理エラー', error);
        setLoading(false);
        clearTimeout(timeout);
      }
    }, (error) => {
      console.error('AuthContext: 認証エラー', error);
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    signInAsGuest,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    linkAnonymousWithEmail,
    linkAnonymousWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
