const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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
