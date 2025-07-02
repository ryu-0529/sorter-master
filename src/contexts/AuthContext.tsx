import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, firestore } from '../services/firebase';
import { User } from '../types';
import { Capacitor } from '@capacitor/core';

// グローバルにプラグインをキャッシュ
let cachedFirebaseAuthentication: any = null;
let pluginLoadPromise: Promise<any> | null = null;

// Capacitor Firebase Authenticationプラグインを早期にロード
const preloadFirebaseAuthentication = () => {
  if (Capacitor.isNativePlatform() && !pluginLoadPromise) {
    console.log('preloadFirebaseAuthentication: プラグインの早期ロード開始');
    
    pluginLoadPromise = import('@capacitor-firebase/authentication')
      .then((module) => {
        console.log('preloadFirebaseAuthentication: プラグインロード成功');
        cachedFirebaseAuthentication = module.FirebaseAuthentication;
        return cachedFirebaseAuthentication;
      })
      .catch((error) => {
        console.error('preloadFirebaseAuthentication: プラグインロード失敗:', error);
        cachedFirebaseAuthentication = null;
        pluginLoadPromise = null;
        return null;
      });
    
    return pluginLoadPromise;
  }
  return Promise.resolve(null);
};

// Dynamic import for Capacitor Firebase Authentication with improved error handling
const getFirebaseAuthentication = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('getFirebaseAuthentication: 動的インポート開始');
      
      // キャッシュされたプラグインがある場合はそれを使用
      if (cachedFirebaseAuthentication) {
        console.log('getFirebaseAuthentication: キャッシュされたプラグインを使用');
        return cachedFirebaseAuthentication;
      }
      
      // 進行中のロードがある場合はそれを待つ
      if (pluginLoadPromise) {
        console.log('getFirebaseAuthentication: 進行中のロードを待機');
        return await pluginLoadPromise;
      }
      
      // タイムアウト付きで動的インポートを実行
      const importPromise = import('@capacitor-firebase/authentication');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('プラグインインポートがタイムアウトしました'));
        }, 20000); // 20秒のタイムアウト（延長）
      });
      
      const module = await Promise.race([importPromise, timeoutPromise]) as any;
      console.log('getFirebaseAuthentication: インポート成功:', !!module.FirebaseAuthentication);
      
      const plugin = module.FirebaseAuthentication;
      if (!plugin) {
        throw new Error('FirebaseAuthenticationプラグインが見つかりません');
      }
      
      // プラグインが正しく利用可能かテスト
      console.log('getFirebaseAuthentication: プラグインメソッド確認:', {
        hasSignInWithGoogle: typeof plugin.signInWithGoogle === 'function',
        hasSignInWithApple: typeof plugin.signInWithApple === 'function',
        hasSignOut: typeof plugin.signOut === 'function'
      });
      
      // キャッシュに保存
      cachedFirebaseAuthentication = plugin;
      return plugin;
    } catch (error: any) {
      console.error('getFirebaseAuthentication: インポートエラー:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new Error(`Firebase Authentication プラグインの読み込みに失敗: ${error.message}`);
    }
  }
  return null;
};

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

  // アプリ起動時にプラグインをプリロード
  useEffect(() => {
    console.log('AuthProvider: プラグインのプリロード開始');
    preloadFirebaseAuthentication()
      .then(() => {
        console.log('AuthProvider: プラグインプリロード完了または不要');
      })
      .catch((error) => {
        console.warn('AuthProvider: プラグインプリロードエラー（無視）:', error);
      });
  }, []);

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
      const auth = getFirebaseAuth();
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
      const auth = getFirebaseAuth();
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
      const auth = getFirebaseAuth();
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

  // Googleでのログイン（環境別認証方式）
  const loginWithGoogle = async () => {
    try {
      setError(null);
      console.log('=== Google Sign-in: 開始 ===');
      console.log('Google Sign-in: Capacitor.isNativePlatform():', Capacitor.isNativePlatform());
      console.log('Google Sign-in: Capacitor.getPlatform():', Capacitor.getPlatform());
      
      // Firebase設定の事前確認
      const auth = getFirebaseAuth();
      console.log('Google Sign-in: Firebase設定確認:', {
        hasAuth: !!auth,
        apiKey: !!auth.app.options.apiKey ? '設定済み' : '未設定',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        appId: !!auth.app.options.appId ? '設定済み' : '未設定'
      });
      
      if (Capacitor.isNativePlatform()) {
        // ネイティブ環境では@capacitor-firebase/authenticationプラグインを使用
        console.log('Google Sign-in: ネイティブ環境で@capacitor-firebase/authenticationプラグインを使用');
        console.log('Google Sign-in: プラグイン取得開始');
        
        let FirebaseAuthentication;
        try {
          // より長いタイムアウトでプラグイン取得を試行
          const pluginTimeout = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('プラグイン取得がタイムアウトしました（25秒）'));
            }, 25000); // 25秒に延長
          });
          
          FirebaseAuthentication = await Promise.race([
            getFirebaseAuthentication(),
            pluginTimeout
          ]);
          
          console.log('Google Sign-in: getFirebaseAuthentication結果:', !!FirebaseAuthentication);
          
        } catch (pluginError: any) {
          console.error('Google Sign-in: プラグイン取得エラー詳細:', {
            message: pluginError.message,
            stack: pluginError.stack,
            name: pluginError.name
          });
          
          // プラグインが完全に失敗した場合、Webビューにフォールバック
          console.warn('Google Sign-in: プラグインが利用できないため、Webビューモードにフォールバックします');
          
          try {
            // WebビューでのGoogle Sign-Inを試行（最適化版）
            const auth = getFirebaseAuth();
            
            // 簡素なGoogleAuthProviderを作成
            const provider = new GoogleAuthProvider();
            
            // 必要最小限の設定のみを追加
            provider.addScope('email');
            provider.addScope('profile');
            
            console.log('Google Sign-in: フォールバック - 最適化されたWebビューでsignInWithPopup開始');
            console.log('Google Sign-in: 設定確認:', {
              authInstanceExists: !!auth,
              providerType: provider.providerId,
              appOptions: {
                apiKey: !!auth.app.options.apiKey,
                authDomain: auth.app.options.authDomain,
                projectId: auth.app.options.projectId
              }
            });
            
            const fallbackTimeout = new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error('フォールバック認証がタイムアウトしました'));
              }, 30000);
            });
            
            const fallbackResult = await Promise.race([
              signInWithPopup(auth, provider),
              fallbackTimeout
            ]) as any;
            
            console.log('Google Sign-in: フォールバック認証成功');
            
            const user = await createUserObject(fallbackResult.user);
            if (user) {
              await saveUserToFirestore(user);
              setCurrentUser(user);
              setLoading(false);
              console.log('Google Sign-in: フォールバック完了');
              return; // 成功したので処理終了
            }
          } catch (fallbackError: any) {
            console.error('Google Sign-in: フォールバックエラー詳細:', {
              code: fallbackError.code,
              message: fallbackError.message,
              stack: fallbackError.stack
            });
            
            // Firebase設定情報をログ出力
            console.log('Google Sign-in: Firebase設定確認:', {
              apiKey: !!auth.app.options.apiKey,
              authDomain: auth.app.options.authDomain,
              projectId: auth.app.options.projectId
            });
          }
          
          // プラグインもフォールバックも失敗した場合
          throw new Error(`Google認証が利用できません。アプリを再起動してからもう一度お試しください。`);
        }
        
        if (!FirebaseAuthentication) {
          console.error('Google Sign-in: Firebase Authentication プラグインがnull - Webビューにフォールバック');
          
          // nullの場合もWebビューにフォールバック
          try {
            // null用の最適化されたWebビュー認証
            const auth = getFirebaseAuth();
            
            // 簡素なGoogleAuthProviderを作成
            const provider = new GoogleAuthProvider();
            
            // 必要最小限の設定のみを追加
            provider.addScope('email');
            provider.addScope('profile');
            
            console.log('Google Sign-in: nullフォールバック - 最適化されたWebビューでsignInWithPopup開始');
            console.log('Google Sign-in: 設定確認:', {
              authInstanceExists: !!auth,
              providerType: provider.providerId,
              appOptions: {
                apiKey: !!auth.app.options.apiKey,
                authDomain: auth.app.options.authDomain,
                projectId: auth.app.options.projectId
              }
            });
            
            const nullFallbackTimeout = new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error('nullフォールバック認証がタイムアウトしました'));
              }, 30000);
            });
            
            const nullFallbackResult = await Promise.race([
              signInWithPopup(auth, provider),
              nullFallbackTimeout
            ]) as any;
            
            console.log('Google Sign-in: nullフォールバック認証成功');
            
            const user = await createUserObject(nullFallbackResult.user);
            if (user) {
              await saveUserToFirestore(user);
              setCurrentUser(user);
              setLoading(false);
              console.log('Google Sign-in: nullフォールバック完了');
              return; // 成功したので処理終了
            }
          } catch (nullFallbackError: any) {
            console.error('Google Sign-in: nullフォールバックエラー詳細:', {
              code: nullFallbackError.code,
              message: nullFallbackError.message,
              stack: nullFallbackError.stack
            });
            
            // Firebase設定情報をログ出力
            const auth = getFirebaseAuth();
            console.log('Google Sign-in: Firebase設定確認:', {
              apiKey: !!auth.app.options.apiKey,
              authDomain: auth.app.options.authDomain,
              projectId: auth.app.options.projectId
            });
          }
          
          throw new Error('Firebase Authentication プラグインの初期化に失敗しました');
        }
        
        console.log('Google Sign-in: プラグイン取得成功、利用可能メソッド確認中...');
        
        // プラグインの状態とメソッドを確認
        try {
          console.log('Google Sign-in: プラグインメソッド確認:', {
            hasSignInWithGoogle: typeof FirebaseAuthentication.signInWithGoogle === 'function',
            hasGetCurrentUser: typeof FirebaseAuthentication.getCurrentUser === 'function',
            hasSignOut: typeof FirebaseAuthentication.signOut === 'function'
          });
          
          // 現在の認証状態を確認（オプション）
          console.log('Google Sign-in: 現在の認証状態確認中...');
          const currentUserCheck = await FirebaseAuthentication.getCurrentUser();
          console.log('Google Sign-in: 現在のユーザー状態:', currentUserCheck ? 'ユーザー存在' : 'ユーザーなし');
        } catch (checkError: any) {
          console.log('Google Sign-in: 事前確認エラー（これは正常な場合がある）:', checkError.message);
        }
        
        console.log('Google Sign-in: Google認証開始...');
        
        try {
          // Google Sign-In実行（より短いタイムアウト）
          const signInTimeout = new Promise((_, reject) => {
            setTimeout(() => {
              console.log('Google Sign-in: Google認証タイムアウト（20秒）');
              reject(new Error('Google認証がタイムアウトしました'));
            }, 20000); // 20秒のタイムアウト
          });
          
          console.log('Google Sign-in: signInWithGoogle()呼び出し実行...');
          const result = await Promise.race([
            FirebaseAuthentication.signInWithGoogle(),
            signInTimeout
          ]) as any;
          
          console.log('Google Sign-in: ネイティブ認証成功', {
            hasResult: !!result,
            hasUser: !!result?.user,
            userId: result?.user?.uid || 'なし'
          });
          
          // Firebase Authの状態確認（重要）
          console.log('Google Sign-in: Firebase Auth状態確認...');
          const auth = getFirebaseAuth();
          
          // 認証結果を複数回チェック
          let currentUser = auth.currentUser;
          let retryCount = 0;
          const maxRetries = 5;
          
          while (!currentUser && retryCount < maxRetries) {
            console.log(`Google Sign-in: currentUser確認 (試行 ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
            currentUser = auth.currentUser;
            retryCount++;
          }
          
          if (currentUser) {
            console.log('Google Sign-in: Firebase Auth currentUser確認済み', {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName
            });
            
            const user = await createUserObject(currentUser);
            if (user) {
              console.log('Google Sign-in: ユーザーオブジェクト作成成功');
              await saveUserToFirestore(user);
              console.log('Google Sign-in: Firestore保存成功');
              
              // 状態を明示的に更新
              setCurrentUser(user);
              setLoading(false);
              console.log('Google Sign-in: 認証完了');
            } else {
              throw new Error('ユーザーオブジェクトの作成に失敗しました');
            }
          } else {
            throw new Error('Firebase Authenticationでユーザーが確認できませんでした');
          }
          
        } catch (signInError: any) {
          console.error('Google Sign-in: 認証エラー詳細:', {
            message: signInError.message,
            code: signInError.code,
            stack: signInError.stack,
            name: signInError.name
          });
          
          // エラーコードに基づいてメッセージを設定
          let errorMessage = 'Google認証中にエラーが発生しました';
          if (signInError.message.includes('タイムアウト')) {
            errorMessage = 'Google認証がタイムアウトしました。もう一度お試しください。';
          } else if (signInError.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Google認証がキャンセルされました';
          } else if (signInError.code === 'auth/network-request-failed') {
            errorMessage = 'ネットワークエラーが発生しました。接続を確認してください';
          }
          
          throw new Error(errorMessage);
        }
        
      } else {
        // Web環境ではFirebase SDKを使用（最適化版）
        console.log('Google Sign-in: Web環境でFirebase SDKを使用');
        
        const auth = getFirebaseAuth();
        
        // 簡素なGoogleAuthProviderを作成
        const provider = new GoogleAuthProvider();
        
        // 必要最小限の設定のみを追加
        provider.addScope('email');
        provider.addScope('profile');
        
        console.log('Google Sign-in: signInWithPopup開始');
        console.log('Google Sign-in: 設定確認:', {
          authInstanceExists: !!auth,
          providerType: provider.providerId,
          appOptions: {
            apiKey: !!auth.app.options.apiKey,
            authDomain: auth.app.options.authDomain,
            projectId: auth.app.options.projectId
          }
        });
        
        // Web環境でもタイムアウトを設定
        const webTimeout = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Web版Google認証がタイムアウトしました'));
          }, 30000); // 30秒のタイムアウト
        });
        
        const result = await Promise.race([
          signInWithPopup(auth, provider),
          webTimeout
        ]) as any;
        
        console.log('Google Sign-in: Firebase認証成功', {
          uid: result.user.uid,
          email: result.user.email
        });
        
        const user = await createUserObject(result.user);
        if (user) {
          console.log('Google Sign-in: ユーザー情報作成成功');
          await saveUserToFirestore(user);
          console.log('Google Sign-in: Firestore保存成功');
        }
      }
    } catch (err: any) {
      console.error("=== Google Sign-in: 最終エラー情報 ===");
      console.error('Google Sign-in: エラー詳細:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      // Firebase設定の再確認
      try {
        const auth = getFirebaseAuth();
        console.error('Google Sign-in: エラー時Firebase設定:', {
          authDomain: auth.app.options.authDomain,
          projectId: auth.app.options.projectId,
          apiKeyExists: !!auth.app.options.apiKey,
          appIdExists: !!auth.app.options.appId
        });
      } catch (configError) {
        console.error('Google Sign-in: Firebase設定確認エラー:', configError);
      }
      
      // より具体的なエラーメッセージを設定
      let userFriendlyMessage = 'Googleログインに失敗しました';
      
      if (err.code === 'auth/argument-error') {
        userFriendlyMessage = 'Google認証の設定に問題があります。アプリの再インストールをお試しください。';
      } else if (err.message.includes('プラグインの読み込みに失敗') || 
          err.message.includes('タイムアウト') ||
          err.message.includes('利用できません')) {
        userFriendlyMessage = 'Google認証サービスに接続できません。アプリを再起動してからもう一度お試しください。';
      } else if (err.code === 'auth/popup-closed-by-user') {
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

  // Appleでのログイン（@capacitor-firebase/authenticationを使用）
  const loginWithApple = async () => {
    try {
      setError(null);
      console.log('Apple Sign-in: 開始');
      
      if (Capacitor.isNativePlatform()) {
        // ネイティブ環境では@capacitor-firebase/authenticationを使用
        console.log('Apple Sign-in: ネイティブ @capacitor-firebase/authentication プラグインを使用');
        
        const FirebaseAuthentication = await getFirebaseAuthentication();
        if (!FirebaseAuthentication) {
          throw new Error('Firebase Authentication プラグインの初期化に失敗しました');
        }
        
        const result = await FirebaseAuthentication.signInWithApple();
        console.log('Apple Sign-in: ネイティブ認証成功', result.user?.uid);
        
        // FirebaseAuthenticationプラグインではユーザーは既にFirebase Authに登録されている
        // onAuthStateChangedが呼ばれるのでそこで処理される
        
      } else {
        // Web環境では従来のFirebase SDKを使用
        console.log('Apple Sign-in: Web環境でFirebase SDKを使用');
        
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        provider.setCustomParameters({
          locale: 'ja'
        });
        
        const { signInWithPopup } = await import('firebase/auth');
        const auth = getFirebaseAuth();
        const result = await signInWithPopup(auth, provider);
        console.log('Apple Sign-in: Firebase認証成功', result.user.uid);
        
        const user = await createUserObject(result.user);
        if (user) {
          console.log('Apple Sign-in: ユーザー情報作成成功', user);
          await saveUserToFirestore(user);
          console.log('Apple Sign-in: Firestore保存成功');
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
      }
      
      setError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      setError(null);
      console.log('=== ログアウト処理開始 ===');
      console.log('Logout: Capacitor.isNativePlatform():', Capacitor.isNativePlatform());
      console.log('Logout: Capacitor.getPlatform():', Capacitor.getPlatform());
      
      const auth = getFirebaseAuth();
      console.log('Logout: 現在のユーザー:', auth.currentUser?.uid || 'なし');
      console.log('Logout: 現在のユーザー詳細:', auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        isAnonymous: auth.currentUser.isAnonymous,
        displayName: auth.currentUser.displayName
      } : 'ユーザーなし');
      
      // ログアウト前の状態を記録
      const wasAuthenticated = !!auth.currentUser;
      const wasAnonymous = auth.currentUser?.isAnonymous || false;
      
      if (Capacitor.isNativePlatform()) {
        // ネイティブ環境では両方のSDKでログアウト処理を実行
        console.log('Logout: ネイティブ環境での処理開始');
        
        let pluginLogoutSuccess = false;
        let sdkLogoutSuccess = false;
        
        // 1. Capacitor Firebase Authenticationプラグインでログアウト
        try {
          console.log('Logout: プラグインログアウト開始...');
          const FirebaseAuthentication = await getFirebaseAuthentication();
          if (FirebaseAuthentication) {
            await FirebaseAuthentication.signOut();
            pluginLogoutSuccess = true;
            console.log('Logout: ✅ プラグインログアウト成功');
          } else {
            console.warn('Logout: ⚠️ FirebaseAuthenticationプラグインが利用できません');
          }
        } catch (pluginError: any) {
          console.error('Logout: ❌ プラグインログアウトエラー:', {
            error: pluginError,
            message: pluginError?.message || 'Unknown error',
            code: pluginError?.code || 'Unknown code',
            stack: pluginError?.stack
          });
        }
        
        // 2. Firebase SDKでもログアウトを実行（確実にするため）
        try {
          console.log('Logout: Firebase SDKログアウト開始...');
          await signOut(auth);
          sdkLogoutSuccess = true;
          console.log('Logout: ✅ Firebase SDKログアウト成功');
        } catch (sdkError: any) {
          console.error('Logout: ❌ Firebase SDKログアウトエラー:', {
            error: sdkError,
            message: sdkError?.message || 'Unknown error',
            code: sdkError?.code || 'Unknown code',
            stack: sdkError?.stack
          });
        }
        
        console.log('Logout: ネイティブ環境処理結果:', {
          pluginLogoutSuccess,
          sdkLogoutSuccess,
          anySuccess: pluginLogoutSuccess || sdkLogoutSuccess
        });
        
      } else {
        // Web環境ではFirebase SDKを使用
        console.log('Logout: Web環境でのFirebase SDKログアウト開始...');
        await signOut(auth);
        console.log('Logout: ✅ Web環境ログアウト成功');
      }
      
      // ログアウト後の状態確認
      console.log('Logout: ログアウト後の認証状態確認...');
      console.log('Logout: auth.currentUser:', auth.currentUser?.uid || 'なし');
      
      // 強制的に認証状態をリセット
      console.log('Logout: 認証状態を強制リセット...');
      setCurrentUser(null);
      setLoading(false);
      
      // 成功メッセージ
      console.log('=== ✅ ログアウト処理完了 ===');
      console.log('Logout: 処理前の状態:', { wasAuthenticated, wasAnonymous });
      console.log('Logout: 処理後の状態:', { currentUser: null, loading: false });
      
    } catch (err: any) {
      console.error("=== ❌ ログアウトエラー ===");
      console.error("Logout: エラー詳細:", {
        error: err,
        message: err?.message || 'Unknown error',
        code: err?.code || 'Unknown code',
        name: err?.name || 'Unknown name',
        stack: err?.stack
      });
      
      // エラーメッセージを設定
      const errorMessage = err?.message || 'ログアウト処理中にエラーが発生しました';
      setError(errorMessage);
      
      // エラーが発生しても強制的に認証状態をクリア（重要！）
      console.log('Logout: エラー発生のため強制的に認証状態をクリア');
      setCurrentUser(null);
      setLoading(false);
      
      // エラーを再スローして呼び出し元で処理できるようにする
      throw new Error(errorMessage);
    }
  };

  // 匿名アカウントをメールアカウントにリンク
  const linkAnonymousWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const auth = getFirebaseAuth();
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
      const auth = getFirebaseAuth();
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        if (Capacitor.isNativePlatform()) {
          // ネイティブ環境では@capacitor-firebase/authenticationを使用
          const FirebaseAuthentication = await getFirebaseAuthentication();
          if (FirebaseAuthentication) {
            await FirebaseAuthentication.linkWithGoogle();
          } else {
            throw new Error('Firebase Authentication プラグインの初期化に失敗しました');
          }
        } else {
          // Web環境ではFirebase SDKを使用
          const provider = new GoogleAuthProvider();
          const { linkWithPopup } = await import('firebase/auth');
          await linkWithPopup(auth.currentUser, provider);
        }
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
      const auth = getFirebaseAuth();
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        if (Capacitor.isNativePlatform()) {
          // ネイティブ環境では@capacitor-firebase/authenticationを使用
          const FirebaseAuthentication = await getFirebaseAuthentication();
          if (FirebaseAuthentication) {
            await FirebaseAuthentication.linkWithApple();
          } else {
            throw new Error('Firebase Authentication プラグインの初期化に失敗しました');
          }
        } else {
          // Web環境ではFirebase SDKを使用
          const provider = new OAuthProvider('apple.com');
          provider.addScope('email');
          provider.addScope('name');
          const { linkWithPopup } = await import('firebase/auth');
          await linkWithPopup(auth.currentUser, provider);
        }
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("Appleリンクエラー:", err);
    }
  };

  // 認証状態の監視
  useEffect(() => {
    console.log('=== AuthContext: 認証状態の監視を開始 ===');
    const auth = getFirebaseAuth();
    
    // タイムアウトを設定（5秒後にローディング解除）
    const timeout = setTimeout(() => {
      console.log('AuthContext: 認証タイムアウト - ローディング解除');
      if (loading) {
        setLoading(false);
      }
    }, 5000);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('=== AuthContext: 認証状態変更検出 ===');
      console.log('AuthContext: 変更詳細:', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid || 'なし',
        isAnonymous: firebaseUser?.isAnonymous || false,
        email: firebaseUser?.email || 'なし',
        displayName: firebaseUser?.displayName || 'なし',
        timestamp: new Date().toISOString()
      });
      
      try {
        if (firebaseUser) {
          console.log('AuthContext: ユーザー情報の処理開始...');
          const user = await createUserObject(firebaseUser);
          if (user) {
            console.log('AuthContext: ✅ ユーザー情報作成成功:', {
              uid: user.uid,
              displayName: user.displayName,
              isAnonymous: user.isAnonymous,
              email: user.email
            });
            await saveUserToFirestore(user);
            console.log('AuthContext: ✅ Firestore保存完了');
          } else {
            console.warn('AuthContext: ⚠️ ユーザー情報の作成に失敗');
          }
          
          setCurrentUser(user);
          setLoading(false);
          clearTimeout(timeout);
          
        } else {
          // ユーザーがnull = ログアウト状態
          console.log('AuthContext: 🔓 ログアウト状態を検出');
          console.log('AuthContext: 認証状態をクリア中...');
          
          setCurrentUser(null);
          setLoading(false);
          setError(null); // エラーもクリア
          clearTimeout(timeout);
          
          console.log('AuthContext: ✅ ログアウト状態の設定完了');
        }
        
      } catch (error: any) {
        console.error('=== AuthContext: ❌ ユーザー処理エラー ===');
        console.error('AuthContext: エラー詳細:', {
          error,
          message: error?.message || 'Unknown error',
          code: error?.code || 'Unknown code',
          stack: error?.stack
        });
        
        // エラー時も安全な状態に設定
        setCurrentUser(null);
        setLoading(false);
        setError('認証処理中にエラーが発生しました');
        clearTimeout(timeout);
      }
    }, (error: any) => {
      console.error('=== AuthContext: ❌ 認証リスナーエラー ===');
      console.error('AuthContext: リスナーエラー詳細:', {
        error,
        message: error?.message || 'Unknown error',
        code: error?.code || 'Unknown code',
        stack: error?.stack
      });
      
      // リスナーエラー時も安全な状態に設定
      setCurrentUser(null);
      setLoading(false);
      setError('認証リスナーでエラーが発生しました');
      clearTimeout(timeout);
    });

    console.log('AuthContext: 認証状態監視のセットアップ完了');

    return () => {
      console.log('=== AuthContext: 認証状態監視をクリーンアップ ===');
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
