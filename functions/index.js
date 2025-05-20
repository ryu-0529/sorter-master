const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// ランキングデータ管理の定数
const RANKING_RETENTION = {
  CURRENT: { 
    KEEP_TOP: 200,      // 現在期間で保持する上位ランキング数
    CONTEXT_RANGE: 10   // ユーザー前後のコンテキスト範囲
  },
  PREVIOUS: { 
    KEEP_TOP: 100       // 前期間で保持する上位ランキング数 
  },
  OLDER: {
    KEEP_TOP: 50        // さらに古い期間で保持する上位ランキング数
  },
  ARCHIVE: {
    KEEP_TOP: 10        // アーカイブ期間で保持する上位ランキング数
  }
};

/**
 * 古いルームデータを自動削除する定期的なCloud Function
 * これは「デジタル忘却」のプロセスを体現し、データの存在意義が
 * 時間の経過とともに変質することを認識した設計です。
 */
exports.cleanupOldRooms = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  // 現在時刻から24時間前のタイムスタンプを計算
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
  
  try {
    console.log('古いルームデータのクリーンアップを開始します...');
    
    // アクティブでないルーム、または最終更新が閾値を超えたルームを検索
    const oldRoomsQuery = admin.database().ref('game_sessions')
      .orderByChild('lastActiveTime')
      .endAt(cutoffTime);
    
    const snapshot = await oldRoomsQuery.once('value');
    
    let deleteCount = 0;
    const deletePromises = [];
    
    snapshot.forEach((childSnapshot) => {
      const roomData = childSnapshot.val();
      const roomId = childSnapshot.key;
      
      // ゲームが終了しているか、長時間放置されているか確認
      if (!roomData.isActive || (roomData.startTime && roomData.startTime < cutoffTime)) {
        console.log(`古いルームを削除: ${roomId}`);
        deletePromises.push(childSnapshot.ref.remove());
        deleteCount++;
      }
    });
    
    // カスタムルームデータも同様に処理
    const oldCustomRoomsQuery = admin.database().ref('custom_rooms')
      .orderByChild('created')
      .endAt(cutoffTime);
    
    const customRoomsSnapshot = await oldCustomRoomsQuery.once('value');
    
    customRoomsSnapshot.forEach((childSnapshot) => {
      const roomData = childSnapshot.val();
      const roomId = childSnapshot.key;
      
      if (roomData.status !== 'active') {
        console.log(`古いカスタムルームを削除: ${roomId}`);
        deletePromises.push(childSnapshot.ref.remove());
        deleteCount++;
      }
    });
    
    // マッチメイキングデータも同様に処理
    const oldMatchmakingQuery = admin.database().ref('matchmaking')
      .orderByChild('created')
      .endAt(cutoffTime);
    
    const matchmakingSnapshot = await oldMatchmakingQuery.once('value');
    
    matchmakingSnapshot.forEach((childSnapshot) => {
      const roomId = childSnapshot.key;
      console.log(`古いマッチメイキングデータを削除: ${roomId}`);
      deletePromises.push(childSnapshot.ref.remove());
      deleteCount++;
    });
    
    // すべての削除処理を並行実行
    await Promise.all(deletePromises);
    
    console.log(`${deleteCount}件の古いルームデータを削除しました`);
    return null;
  } catch (error) {
    console.error('ルームデータのクリーンアップ中にエラーが発生しました:', error);
    return null;
  }
});

/**
 * ゲーム統計データを抽出してから元データを削除するCloud Function
 * これは「データの記憶変換」の過程であり、存在の形態を変えながらも
 * その本質的な意味を保存するという哲学的アプローチです。
 */
exports.archiveAndCleanGameData = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
  
  try {
    console.log('ゲームデータのアーカイブと削除を開始します...');
    
    const oldGamesQuery = admin.database().ref('game_sessions')
      .orderByChild('lastActiveTime')
      .endAt(cutoffTime);
    
    const snapshot = await oldGamesQuery.once('value');
    
    const archivePromises = [];
    const deletePromises = [];
    
    snapshot.forEach((childSnapshot) => {
      const roomData = childSnapshot.val();
      const roomId = childSnapshot.key;
      
      if (!roomData.isActive || (roomData.startTime && roomData.startTime < cutoffTime)) {
        // 分析に有用なデータを抽出
        const analyticsData = {
          roomId,
          playerCount: Object.keys(roomData.players || {}).length,
          maxPlayers: roomData.maxPlayers || 4,
          gameCompleted: !roomData.isActive,
          duration: roomData.endTime ? (roomData.endTime - roomData.startTime) / 1000 : null,
          createdAt: roomData.startTime,
          archivedAt: Date.now()
        };
        
        console.log(`ゲームデータをアーカイブ: ${roomId}`);
        
        // 抽出したデータを分析用コレクションに保存
        archivePromises.push(
          admin.firestore().collection('game_analytics').doc(roomId).set(analyticsData)
        );
        
        // 元のデータを削除
        deletePromises.push(childSnapshot.ref.remove());
        
        // 関連するカスタムルームデータも削除
        deletePromises.push(
          admin.database().ref(`custom_rooms/${roomId}`).remove()
        );
        
        // 関連するマッチメイキングデータも削除
        deletePromises.push(
          admin.database().ref(`matchmaking/${roomId}`).remove()
        );
      }
    });
    
    // すべての操作を実行
    await Promise.all([...archivePromises, ...deletePromises]);
    
    console.log(`${archivePromises.length}件のゲームデータをアーカイブし、元データを削除しました`);
    return null;
  } catch (error) {
    console.error('データのアーカイブ処理中にエラーが発生しました:', error);
    return null;
  }
});

/**
 * ランキングデータの最適化とクリーンアップを行うCloud Function
 * 「限られた記憶の中での意味」を探求するプロセスであり、
 * ランキングという競争的価値の中にある、人間の認知と存在感の均衡を取る試みです。
 */
exports.optimizeRankings = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    console.log('ランキングデータの最適化を開始します...');
    
    // 期間区分の定義 (現在からの経過日数)
    const periods = {
      current: { days: 0, type: 'current', maxRank: RANKING_RETENTION.CURRENT.KEEP_TOP },
      previous: { days: 7, type: 'previous', maxRank: RANKING_RETENTION.PREVIOUS.KEEP_TOP },
      older: { days: 30, type: 'older', maxRank: RANKING_RETENTION.OLDER.KEEP_TOP },
      archive: { days: 90, type: 'archive', maxRank: RANKING_RETENTION.ARCHIVE.KEEP_TOP }
    };
    
    // 各期間のタイムスタンプを計算
    const now = admin.firestore.Timestamp.now();
    const periodTimestamps = {};
    
    Object.keys(periods).forEach(key => {
      const daysInMillis = periods[key].days * 24 * 60 * 60 * 1000;
      const date = new Date(now.toMillis() - daysInMillis);
      periodTimestamps[key] = admin.firestore.Timestamp.fromDate(date);
    });
    
    // ランキングデータの処理
    console.log('ランキングデータの集計を開始します...');
    
    // ランキングタイプ（daily, weekly, monthly, all_time）ごとに処理
    const rankingTypes = ['daily', 'weekly', 'monthly', 'all_time'];
    
    for (const rankingType of rankingTypes) {
      console.log(`${rankingType}ランキングの処理を開始...`);
      
      // ランキングデータの集計と処理
      const rankingsRef = admin.firestore().collection('rankings');
      
      // 1. 現在期間のランキングデータを取得（上位N位まで）
      const currentRankingsSnapshot = await rankingsRef
        .where('type', '==', rankingType)
        .where('timestamp', '>=', periodTimestamps.current)
        .orderBy('timestamp', 'desc')
        .orderBy('score', 'desc')
        .limit(1000) // 安全マージンを取って多めに取得
        .get();
      
      console.log(`${rankingType}の現在期間データ: ${currentRankingsSnapshot.size}件`);
      
      // 現在期間のランキングを処理
      const currentRankings = [];
      currentRankingsSnapshot.forEach(doc => {
        currentRankings.push({
          id: doc.id,
          data: doc.data(),
          ref: doc.ref
        });
      });
      
      // スコア順にソート
      currentRankings.sort((a, b) => b.data.score - a.data.score);
      
      // 上位N位のユーザーIDを保持（コンテキスト範囲計算用）
      const topPlayerIds = currentRankings
        .slice(0, RANKING_RETENTION.CURRENT.KEEP_TOP)
        .map(r => r.data.userId);
      
      // 削除対象のドキュメントを収集（保持範囲外）
      const deletePromises = [];
      let deletedCount = 0;
      
      // 現在期間のクリーンアップ
      for (let i = 0; i < currentRankings.length; i++) {
        const ranking = currentRankings[i];
        const rank = i + 1; // 1から始まるランク
        const userId = ranking.data.userId;
        
        // ランクを更新
        ranking.data.rank = rank;
        
        // 判定: このランキングエントリを保持するか削除するか
        let shouldKeep = false;
        
        // 条件1: 上位N位に入っている
        if (rank <= RANKING_RETENTION.CURRENT.KEEP_TOP) {
          shouldKeep = true;
        } 
        // 条件2: 上位N位ユーザーの前後X位に入っている
        else if (topPlayerIds.includes(userId)) {
          shouldKeep = true;
        }
        // 条件3: 上位プレイヤーの前後のコンテキスト範囲内
        else {
          for (const topPlayerId of topPlayerIds) {
            // トッププレイヤーのランキングインデックスを探す
            const topPlayerIndex = currentRankings.findIndex(r => r.data.userId === topPlayerId);
            if (topPlayerIndex !== -1) {
              const contextLower = Math.max(0, topPlayerIndex - RANKING_RETENTION.CURRENT.CONTEXT_RANGE);
              const contextUpper = Math.min(currentRankings.length - 1, topPlayerIndex + RANKING_RETENTION.CURRENT.CONTEXT_RANGE);
              
              if (i >= contextLower && i <= contextUpper) {
                shouldKeep = true;
                break;
              }
            }
          }
        }
        
        if (shouldKeep) {
          // ランク情報を更新
          await ranking.ref.update({ 
            rank,
            retentionLevel: 'current',
            lastUpdated: now
          });
        } else {
          // 統計データに集約してから削除
          const statsRef = admin.firestore().collection('ranking_statistics').doc(`${rankingType}_${now.toDate().toISOString().slice(0, 10)}`);
          
          // 統計データを更新（ドキュメントが存在しない場合は作成）
          await statsRef.set({
            rankingType,
            date: now,
            totalEntries: admin.firestore.FieldValue.increment(1),
            averageScore: admin.firestore.FieldValue.increment(ranking.data.score),
            deletedEntries: admin.firestore.FieldValue.increment(1)
          }, { merge: true });
          
          // 削除処理をキュー
          deletePromises.push(ranking.ref.delete());
          deletedCount++;
        }
      }
      
      // 前期間のランキングデータを処理
      for (const [periodKey, period] of Object.entries(periods)) {
        if (periodKey === 'current') continue; // 現在期間は既に処理済み
        
        console.log(`${rankingType}の${periodKey}期間データを処理中...`);
        
        const periodRankingsSnapshot = await rankingsRef
          .where('type', '==', rankingType)
          .where('timestamp', '<', periodTimestamps[periodKey])
          .where('timestamp', '>=', periodTimestamps[Object.keys(periods)[Object.keys(periods).indexOf(periodKey) + 1] || 'end'])
          .orderBy('timestamp', 'desc')
          .orderBy('score', 'desc')
          .get();
        
        console.log(`${periodKey}期間のデータ: ${periodRankingsSnapshot.size}件`);
        
        const periodRankings = [];
        periodRankingsSnapshot.forEach(doc => {
          periodRankings.push({
            id: doc.id,
            data: doc.data(),
            ref: doc.ref
          });
        });
        
        // スコア順にソート
        periodRankings.sort((a, b) => b.data.score - a.data.score);
        
        // 上位N位だけ保持し、残りを削除
        for (let i = 0; i < periodRankings.length; i++) {
          const ranking = periodRankings[i];
          const rank = i + 1;
          
          if (rank <= period.maxRank) {
            // ランク情報を更新
            await ranking.ref.update({ 
              rank,
              retentionLevel: period.type,
              lastUpdated: now
            });
          } else {
            // 統計データに集約してから削除
            const statsRef = admin.firestore().collection('ranking_statistics').doc(`${rankingType}_${period.type}_${now.toDate().toISOString().slice(0, 10)}`);
            
            // 統計データを更新
            await statsRef.set({
              rankingType,
              periodType: period.type,
              date: now,
              totalEntries: admin.firestore.FieldValue.increment(1),
              averageScore: admin.firestore.FieldValue.increment(ranking.data.score),
              deletedEntries: admin.firestore.FieldValue.increment(1)
            }, { merge: true });
            
            // 削除処理をキュー
            deletePromises.push(ranking.ref.delete());
            deletedCount++;
          }
        }
      }
      
      // 削除処理を実行
      await Promise.all(deletePromises);
      console.log(`${rankingType}ランキングの最適化完了: ${deletedCount}件のエントリを削除しました`);
    }
    
    console.log('すべてのランキングデータ最適化が完了しました。');
    return null;
  } catch (error) {
    console.error('ランキングデータの最適化中にエラーが発生しました:', error);
    return null;
  }
});
