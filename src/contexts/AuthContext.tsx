import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';
import { User } from '../types';
import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signInAsGuest: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  linkAnonymousWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  linkAnonymousWithGoogle: () => Promise<void>;
  linkAnonymousWithApple: () => Promise<void>;
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

  // Googleでのログイン（Capacitor環境に最適化）
  const loginWithGoogle = async () => {
    try {
      setError(null);
      console.log('Google Sign-in: 開始');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      let result;
      
      if (Capacitor.isNativePlatform()) {
        // ネイティブ環境ではredirectを使用
        console.log('Google Sign-in: Redirect方式を使用（ネイティブ環境）');
        await signInWithRedirect(auth, provider);
        // この時点ではまだ認証は完了していない（リダイレクト後に処理される）
        return;
      } else {
        // Web環境ではpopupを使用
        console.log('Google Sign-in: Popup方式を使用（Web環境）');
        result = await signInWithPopup(auth, provider);
      }
      
      if (result) {
        console.log('Google Sign-in: Firebase認証成功', result.user.uid);
        
        const user = await createUserObject(result.user);
        if (user) {
          console.log('Google Sign-in: ユーザー情報作成成功', user);
          await saveUserToFirestore(user);
          console.log('Google Sign-in: Firestore保存成功');
        }
      }
    } catch (err: any) {
      console.error("Google Sign-in: 詳細エラー情報", {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      
      // より具体的なエラーメッセージを設定
      let userFriendlyMessage = 'Googleログインに失敗しました';
      
      if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMessage = 'ログインがキャンセルされました';
      } else if (err.code === 'auth/popup-blocked') {
        userFriendlyMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください';
      } else if (err.code === 'auth/cancelled-popup-request') {
        userFriendlyMessage = 'ログインリクエストがキャンセルされました';
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMessage = 'ネットワークエラーが発生しました。接続を確認してください';
      } else if (err.code === 'auth/operation-not-allowed') {
        userFriendlyMessage = 'Google認証がFirebase Consoleで有効化されていません。管理者にお問い合わせください。';
      }
      
      setError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }
  };

  // Nonceを生成するヘルパー関数
  const generateNonce = (length = 32) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < length; i++) {
      nonce += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return nonce;
  };

  // SHA256でハッシュ化するヘルパー関数
  const sha256 = async (plain: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Appleでのログイン（Capacitor環境に最適化）
  const loginWithApple = async () => {
    try {
      setError(null);
      console.log('Apple Sign-in: 開始');
      
      // Capacitor環境ではネイティブプラグインを優先使用
      if (Capacitor.isNativePlatform()) {
        console.log('ネイティブ Sign in with Apple プラグインを使用');
        
        try {
          // Nonceを生成してハッシュ化
          const rawNonce = generateNonce();
          const hashedNonce = await sha256(rawNonce);
          
          // Apple Sign-In設定
          const options = {
            clientId: 'com.sortermaster.app', // .signinは不要
            redirectURI: 'https://sorter-master.firebaseapp.com/__/auth/handler',
            scopes: 'email name',
            nonce: hashedNonce, // ハッシュ化したnonceを送信
            state: Math.random().toString(36).substring(2, 15),
            responseType: 'code id_token'
          };
          
          console.log('Apple Sign-in: ネイティブ認証開始');
          const result = await SignInWithApple.authorize(options);
          console.log('Apple Sign-in: ネイティブ認証結果（ID Token取得）', result);
          
          // Appleから返されたidentityTokenを使用してFirebaseにサインイン
          if (result.response?.identityToken) {
            const provider = new OAuthProvider('apple.com');
            
            try {
              // Firebase認証用のcredentialを作成（nonceを含む）
              const credential = provider.credential({
                idToken: result.response.identityToken,
                rawNonce: rawNonce // 元のnonceを送信
              });
              
              console.log('Apple Sign-in: Firebase認証開始');
              const firebaseResult = await signInWithCredential(auth, credential);
              console.log('Apple Sign-in: Firebase認証成功', firebaseResult.user.uid);
              
              // AdditionalUserInfoから初回認証情報を取得
              const additionalUserInfo = getAdditionalUserInfo(firebaseResult);
              console.log('Apple Sign-in: Additional User Info:', additionalUserInfo);
              
              // Apple Sign-inから名前情報を取得（初回のみ）
              let displayName = firebaseResult.user.displayName;
              if (additionalUserInfo?.isNewUser && (result.response?.givenName || result.response?.familyName)) {
                const { givenName, familyName } = result.response;
                if (givenName || familyName) {
                  displayName = `${familyName || ''} ${givenName || ''}`.trim();
                  console.log('Apple Sign-in: 名前情報を取得:', displayName);
                  
                  // Firebase Authのプロフィールを更新
                  await updateProfile(firebaseResult.user, {
                    displayName: displayName
                  });
                }
              }
              
              const user = await createUserObject(firebaseResult.user);
              if (user) {
                // 名前情報が取得できた場合は更新
                if (displayName && displayName !== user.displayName) {
                  user.displayName = displayName;
                }
                console.log('Apple Sign-in: ユーザー情報作成成功', user);
                await saveUserToFirestore(user);
                console.log('Apple Sign-in: Firestore保存成功');
              }
            } catch (firebaseError: any) {
              console.error('Firebase認証エラー:', firebaseError);
              
              // auth/operation-not-allowed の場合の詳細処理
              if (firebaseError.code === 'auth/operation-not-allowed') {
                console.error('Firebase ConsoleでApple認証が無効になっています');
                throw new Error('Apple認証が設定されていません。Firebase ConsoleでApple認証を有効化してください。');
              }
              
              // auth/invalid-credential の場合
              if (firebaseError.code === 'auth/invalid-credential') {
                console.error('Apple認証の設定が正しくありません');
                throw new Error('Apple認証の設定を確認してください。Service ID、Team ID、Key IDが正しく設定されているか確認してください。');
              }
              
              // 他のFirebaseエラーの場合は再スロー
              throw firebaseError;
            }
          } else {
            throw new Error('Apple認証からidentityTokenが取得できませんでした');
          }
        } catch (nativeError: any) {
          console.error('ネイティブApple Sign-in エラー:', nativeError);
          
          // エラーメッセージに基づいた処理
          if (nativeError.message && nativeError.message.includes('Apple認証が設定されていません')) {
            throw nativeError;
          }
          
          throw new Error('Apple Sign-Inに失敗しました。設定を確認してください。');
        }
      } else {
        // Web環境では Firebase方式
        console.log('Web Firebase Sign in with Apple を使用');
        
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        provider.setCustomParameters({
          locale: 'ja'
        });
        
        console.log('Apple Sign-in: Firebase認証開始');
        const result = await signInWithPopup(auth, provider);
        console.log('Apple Sign-in: Firebase認証成功', result.user.uid);
        
        // AdditionalUserInfoから初回認証情報を取得
        const additionalUserInfo = getAdditionalUserInfo(result);
        console.log('Apple Sign-in Web: Additional User Info:', additionalUserInfo);
        
        // Apple Sign-inから名前情報を取得（初回のみ）
        let displayName = result.user.displayName;
        if (additionalUserInfo?.isNewUser && additionalUserInfo?.profile) {
          const profile = additionalUserInfo.profile as any;
          if (profile.name) {
            displayName = `${profile.name.lastName || ''} ${profile.name.firstName || ''}`.trim();
            console.log('Apple Sign-in Web: 名前情報を取得:', displayName);
            
            // Firebase Authのプロフィールを更新
            await updateProfile(result.user, {
              displayName: displayName
            });
          }
        }
        
        const user = await createUserObject(result.user);
        if (user) {
          // 名前情報が取得できた場合は更新
          if (displayName && displayName !== user.displayName) {
            user.displayName = displayName;
          }
          console.log('Apple Sign-in Web: ユーザー情報作成成功', user);
          await saveUserToFirestore(user);
          console.log('Apple Sign-in Web: Firestore保存成功');
        }
      }
    } catch (err: any) {
      console.error("Apple Sign-in: 詳細エラー情報", {
        code: err.code,
        message: err.message,
        customData: err.customData,
        stack: err.stack
      });
      
      // より具体的なエラーメッセージを設定
      let userFriendlyMessage = 'Appleログインに失敗しました';
      
      if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMessage = 'ログインがキャンセルされました';
      } else if (err.code === 'auth/popup-blocked') {
        userFriendlyMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください';
      } else if (err.code === 'auth/cancelled-popup-request') {
        userFriendlyMessage = 'ログインリクエストがキャンセルされました';
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMessage = 'ネットワークエラーが発生しました。接続を確認してください';
      } else if (err.code === 'auth/argument-error') {
        userFriendlyMessage = 'Apple Sign-inの設定に問題があります。Firebase Consoleの設定を確認してください';
      } else if (err.code === 'auth/operation-not-allowed') {
        userFriendlyMessage = 'Apple認証がFirebase Consoleで有効化されていません。管理者にお問い合わせください。';
      } else if (err.message && err.message.includes('Firebase Console')) {
        userFriendlyMessage = err.message;
      } else if (err.message && err.message.includes('Apple認証')) {
        userFriendlyMessage = err.message;
      }
      
      setError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
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

  // 匿名アカウントをAppleアカウントにリンク
  const linkAnonymousWithApple = async () => {
    try {
      setError(null);
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        await signInWithPopup(auth, provider);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("Appleリンクエラー:", err);
    }
  };

  // リダイレクト結果の処理（ネイティブ環境用）
  const handleRedirectResult = useCallback(async () => {
    try {
      console.log('Google Sign-in: リダイレクト結果を確認中');
      const result = await getRedirectResult(auth);
      
      if (result) {
        console.log('Google Sign-in: リダイレクト認証成功', result.user.uid);
        
        const user = await createUserObject(result.user);
        if (user) {
          console.log('Google Sign-in: ユーザー情報作成成功', user);
          await saveUserToFirestore(user);
          console.log('Google Sign-in: Firestore保存成功');
        }
      }
    } catch (err: any) {
      console.error('Google Sign-in: リダイレクト結果エラー', err);
      setError('Googleログインに失敗しました');
    }
  }, []);
  
  // 認証状態の監視
  useEffect(() => {
    console.log('AuthContext: 認証状態の監視を開始');
    
    // リダイレクト結果をチェック（ネイティブ環境用）
    if (Capacitor.isNativePlatform()) {
      handleRedirectResult();
    }
    
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
  }, [handleRedirectResult]);

  const value = {
    currentUser,
    loading,
    error,
    signInAsGuest,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithApple,
    logout,
    linkAnonymousWithEmail,
    linkAnonymousWithGoogle,
    linkAnonymousWithApple
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
