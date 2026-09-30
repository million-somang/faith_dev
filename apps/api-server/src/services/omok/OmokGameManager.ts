import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { getDB } from '../../db/adapter.js';
import { calculateTier } from '../../routes/omok.routes.js';

const BOARD_SIZE = 15;

interface Point {
    r: number;
    c: number;
}

interface WinningLine {
    start: Point;
    end: Point;
    points: Point[];
}

export interface PlayerSocket {
    ws: WebSocket;
    userId: number;
    name: string;
    rating: number;
    tier: string;
    roomId: string | null;
    stone?: 'BLACK' | 'WHITE';
}

export interface Room {
    id: string;
    title: string;
    host: PlayerSocket;
    guest: PlayerSocket | null;
    isPrivate: boolean;
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    board: (string | null)[][];
    currentTurn: 'BLACK' | 'WHITE';
    turnTimer: number;
    timerInterval: NodeJS.Timeout | null;
}

export class OmokGameManager {
    private wss: WebSocketServer | null = null;
    private clients: Set<PlayerSocket> = new Set();
    private rooms: Map<string, Room> = new Map();
    private matchingQueue: PlayerSocket[] = [];

    public init(server: Server) {
        this.wss = new WebSocketServer({ server, path: '/ws/omok' });

        this.wss.on('connection', (ws: WebSocket) => {
            const player: PlayerSocket = {
                ws,
                userId: 0,
                name: '게스트_' + Math.floor(1000 + Math.random() * 9000),
                rating: 1200,
                tier: '골드 II',
                roomId: null,
            };

            this.clients.add(player);

            // 초기 로비 방 목록 전송
            this.sendLobbyState(player);

            ws.on('message', (message: string) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleMessage(player, data);
                } catch (e) {
                    console.error('[Omok WS Parse Error]', e);
                }
            });

            ws.on('close', () => {
                this.handleDisconnect(player);
            });

            ws.on('error', (err) => {
                console.error('[Omok WS Client Error]', err);
                this.handleDisconnect(player);
            });
        });

        console.log('♟️ [Omok WebSocket Server] /ws/omok initialized successfully.');
    }

    private send(player: PlayerSocket, data: any) {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(data));
        }
    }

    private handleMessage(player: PlayerSocket, msg: any) {
        switch (msg.type) {
            case 'AUTH':
                if (msg.profile) {
                    player.userId = msg.profile.id || 0;
                    player.name = msg.profile.name || player.name;
                    player.rating = msg.profile.rating || 1200;
                    player.tier = msg.profile.tier || '골드 II';
                }
                this.send(player, { type: 'AUTH_SUCCESS', profile: { name: player.name, rating: player.rating, tier: player.tier } });
                this.sendLobbyState(player);
                break;

            case 'GET_LOBBY':
                this.sendLobbyState(player);
                break;

            case 'QUICK_MATCH':
                this.handleQuickMatch(player);
                break;

            case 'CANCEL_MATCH':
                this.matchingQueue = this.matchingQueue.filter(p => p !== player);
                this.send(player, { type: 'MATCH_CANCELLED' });
                break;

            case 'CREATE_ROOM':
                this.handleCreateRoom(player, msg.title, !!msg.isPrivate);
                break;

            case 'JOIN_ROOM':
                this.handleJoinRoom(player, msg.roomId);
                break;

            case 'LEAVE_ROOM':
                this.handleLeaveRoom(player);
                break;

            case 'MOVE':
                this.handleMove(player, msg.r, msg.c);
                break;

            case 'SURRENDER':
                this.handleSurrender(player);
                break;

            case 'CHAT':
                this.handleChat(player, msg.text);
                break;
        }
    }

    // 1. 로비 방 목록 브로드캐스트
    private getLobbyRoomList() {
        const list: any[] = [];
        this.rooms.forEach((room) => {
            if (room.status === 'WAITING') {
                list.push({
                    id: room.id,
                    title: room.title,
                    hostName: room.host.name,
                    hostRating: room.host.rating,
                    playerCount: 1,
                    isPrivate: room.isPrivate
                });
            }
        });
        return list;
    }

    private sendLobbyState(player?: PlayerSocket) {
        const roomList = this.getLobbyRoomList();
        const payload = {
            type: 'LOBBY_STATE',
            rooms: roomList,
            onlineCount: this.clients.size
        };

        if (player) {
            this.send(player, payload);
        } else {
            this.clients.forEach(p => {
                if (!p.roomId) {
                    this.send(p, payload);
                }
            });
        }
    }

    // 2. 빠른 1:1 매칭
    private handleQuickMatch(player: PlayerSocket) {
        if (player.roomId) return;
        if (!this.matchingQueue.includes(player)) {
            this.matchingQueue.push(player);
        }

        // 매칭 큐에 2명 이상 모이면 즉시 대국 성사
        if (this.matchingQueue.length >= 2) {
            const p1 = this.matchingQueue.shift()!;
            const p2 = this.matchingQueue.shift()!;

            const roomId = String(Math.floor(1000 + Math.random() * 9000));
            const newRoom: Room = {
                id: roomId,
                title: '실시간 1:1 빠른 매칭 대국',
                host: p1,
                guest: p2,
                isPrivate: false,
                status: 'PLAYING',
                board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)),
                currentTurn: 'BLACK',
                turnTimer: 30,
                timerInterval: null
            };

            this.rooms.set(roomId, newRoom);
            p1.roomId = roomId;
            p2.roomId = roomId;

            // 랜덤 흑/백 배정 (50% 확률)
            const p1IsBlack = Math.random() < 0.5;
            p1.stone = p1IsBlack ? 'BLACK' : 'WHITE';
            p2.stone = p1IsBlack ? 'WHITE' : 'BLACK';

            this.startGame(newRoom);
            this.sendLobbyState();
        }
    }

    // 3. 방 만들기
    private handleCreateRoom(player: PlayerSocket, title?: string, isPrivate: boolean = false) {
        if (player.roomId) return;

        // 기존 큐에서 제거
        this.matchingQueue = this.matchingQueue.filter(p => p !== player);

        const roomId = String(Math.floor(1000 + Math.random() * 9000));
        const newRoom: Room = {
            id: roomId,
            title: title || `${player.name}님의 대국실`,
            host: player,
            guest: null,
            isPrivate,
            status: 'WAITING',
            board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)),
            currentTurn: 'BLACK',
            turnTimer: 30,
            timerInterval: null
        };

        this.rooms.set(roomId, newRoom);
        player.roomId = roomId;

        this.send(player, {
            type: 'ROOM_CREATED',
            room: {
                id: newRoom.id,
                title: newRoom.title,
                hostName: player.name,
                hostRating: player.rating,
                isPrivate: newRoom.isPrivate
            }
        });

        this.sendLobbyState();
    }

    // 4. 방 입장
    private handleJoinRoom(player: PlayerSocket, roomId: string) {
        if (player.roomId) return;
        const room = this.rooms.get(roomId);
        if (!room) {
            this.send(player, { type: 'ERROR', message: '대국실이 존재하지 않습니다.' });
            return;
        }

        if (room.status !== 'WAITING' || room.guest) {
            this.send(player, { type: 'ERROR', message: '이미 게임이 진행 중이거나 정원이 찬 방입니다.' });
            return;
        }

        this.matchingQueue = this.matchingQueue.filter(p => p !== player);

        room.guest = player;
        room.status = 'PLAYING';
        player.roomId = room.id;

        // 호스트는 흑돌(선공), 게스트는 백돌(후공)
        room.host.stone = 'BLACK';
        room.guest.stone = 'WHITE';

        this.startGame(room);
        this.sendLobbyState();
    }

    // 5. 게임 시작
    private startGame(room: Room) {
        const hostPayload = {
            type: 'GAME_START',
            roomId: room.id,
            myStone: room.host.stone,
            currentTurn: 'BLACK',
            opponent: {
                name: room.guest!.name,
                rating: room.guest!.rating,
                tier: room.guest!.tier
            }
        };

        const guestPayload = {
            type: 'GAME_START',
            roomId: room.id,
            myStone: room.guest!.stone,
            currentTurn: 'BLACK',
            opponent: {
                name: room.host.name,
                rating: room.host.rating,
                tier: room.host.tier
            }
        };

        this.send(room.host, hostPayload);
        this.send(room.guest!, guestPayload);

        this.startTurnTimer(room);
    }

    // 턴 타이머 관리
    private startTurnTimer(room: Room) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        room.turnTimer = 30;

        room.timerInterval = setInterval(() => {
            room.turnTimer -= 1;

            const timerPayload = { type: 'TIMER_TICK', seconds: room.turnTimer };
            this.send(room.host, timerPayload);
            if (room.guest) this.send(room.guest, timerPayload);

            if (room.turnTimer <= 0) {
                // 시간 초과 패배 처리
                clearInterval(room.timerInterval!);
                room.timerInterval = null;

                const timeoutPlayer = room.currentTurn === room.host.stone ? room.host : room.guest!;
                const winnerPlayer = timeoutPlayer === room.host ? room.guest! : room.host;

                this.endGame(room, winnerPlayer, 'TIMEOUT');
            }
        }, 1000);
    }

    // 6. 착수 처리
    private handleMove(player: PlayerSocket, r: number, c: number) {
        if (!player.roomId) return;
        const room = this.rooms.get(player.roomId);
        if (!room || room.status !== 'PLAYING') return;

        // 턴 검증
        if (room.currentTurn !== player.stone) return;

        // 유효 좌표 검증
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return;
        if (room.board[r][c] !== null) return;

        // 착수 적용
        room.board[r][c] = player.stone;

        // 승리 판정
        const win = this.checkWin(room.board);
        if (win) {
            const movePayload = {
                type: 'MOVE_MADE',
                r,
                c,
                stone: player.stone,
                nextTurn: player.stone
            };
            this.send(room.host, movePayload);
            if (room.guest) this.send(room.guest, movePayload);

            this.endGame(room, player, 'FIVE_IN_A_ROW', win);
            return;
        }

        // 턴 교대
        room.currentTurn = room.currentTurn === 'BLACK' ? 'WHITE' : 'BLACK';
        this.startTurnTimer(room);

        const movePayload = {
            type: 'MOVE_MADE',
            r,
            c,
            stone: player.stone,
            nextTurn: room.currentTurn
        };
        this.send(room.host, movePayload);
        if (room.guest) this.send(room.guest, movePayload);
    }

    // 7. 기권 선언
    private handleSurrender(player: PlayerSocket) {
        if (!player.roomId) return;
        const room = this.rooms.get(player.roomId);
        if (!room || room.status !== 'PLAYING') return;

        const winner = player === room.host ? room.guest! : room.host;
        this.endGame(room, winner, 'SURRENDER');
    }

    // 8. 게임 종료 처리
    private async endGame(room: Room, winner: PlayerSocket, reason: 'FIVE_IN_A_ROW' | 'TIMEOUT' | 'SURRENDER' | 'DISCONNECT', winningLine?: WinningLine) {
        if (room.timerInterval) {
            clearInterval(room.timerInterval);
            room.timerInterval = null;
        }
        room.status = 'FINISHED';

        const loser = winner === room.host ? room.guest : room.host;

        // DB 전적 및 레이팅 갱신 (승자 +20 LP, 패자 -15 LP)
        if (winner && loser) {
            await this.recordGameResult(winner.userId, loser.userId);
            winner.rating += 20;
            loser.rating = Math.max(800, loser.rating - 15);
            winner.tier = calculateTier(winner.rating);
            loser.tier = calculateTier(loser.rating);
        }

        const payload = {
            type: 'GAME_OVER',
            winnerStone: winner.stone,
            winnerName: winner.name,
            reason,
            winningLine: winningLine || null,
            ratingDelta: 20
        };

        this.send(room.host, payload);
        if (room.guest) this.send(room.guest, payload);

        // 방 정리 대기 후 제거
        setTimeout(() => {
            this.rooms.delete(room.id);
            if (room.host) room.host.roomId = null;
            if (room.guest) room.guest.roomId = null;
            this.sendLobbyState();
        }, 5000);
    }

    private async recordGameResult(winnerUserId: number, loserUserId: number) {
        try {
            const db = await getDB(null as any);
            if (winnerUserId > 0) {
                const wStats = await db.prepare('SELECT * FROM omok_user_stats WHERE user_id = ?').bind(winnerUserId).first();
                const wRating = Math.max(800, (wStats?.rating || 1200) + 20);
                const wWins = (wStats?.wins || 0) + 1;
                const wTier = calculateTier(wRating);
                await db.prepare(`
                    INSERT INTO omok_user_stats (user_id, rating, wins, losses, tier, updated_at)
                    VALUES (?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id) DO UPDATE SET rating = excluded.rating, wins = excluded.wins, tier = excluded.tier, updated_at = CURRENT_TIMESTAMP
                `).bind(winnerUserId, wRating, wWins, wTier).run();
            }

            if (loserUserId > 0) {
                const lStats = await db.prepare('SELECT * FROM omok_user_stats WHERE user_id = ?').bind(loserUserId).first();
                const lRating = Math.max(800, (lStats?.rating || 1200) - 15);
                const lLosses = (lStats?.losses || 0) + 1;
                const lTier = calculateTier(lRating);
                await db.prepare(`
                    INSERT INTO omok_user_stats (user_id, rating, wins, losses, tier, updated_at)
                    VALUES (?, ?, 0, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id) DO UPDATE SET rating = excluded.rating, losses = excluded.losses, tier = excluded.tier, updated_at = CURRENT_TIMESTAMP
                `).bind(loserUserId, lRating, lLosses, lTier).run();
            }
        } catch (e) {
            console.error('[Omok Game Result Record Error]', e);
        }
    }

    // 9. 채팅
    private handleChat(player: PlayerSocket, text: string) {
        if (!player.roomId) return;
        const room = this.rooms.get(player.roomId);
        if (!room) return;

        const opponent = player === room.host ? room.guest : room.host;
        if (opponent) {
            this.send(opponent, {
                type: 'CHAT_MESSAGE',
                sender: player.name,
                text
            });
        }
    }

    // 10. 방 나가기
    private handleLeaveRoom(player: PlayerSocket) {
        if (!player.roomId) return;
        const room = this.rooms.get(player.roomId);
        if (!room) return;

        if (room.status === 'PLAYING') {
            const winner = player === room.host ? room.guest! : room.host;
            this.endGame(room, winner, 'SURRENDER');
        } else {
            this.rooms.delete(room.id);
            player.roomId = null;
            this.sendLobbyState();
        }
    }

    // 11. 연결 끊김
    private handleDisconnect(player: PlayerSocket) {
        this.clients.delete(player);
        this.matchingQueue = this.matchingQueue.filter(p => p !== player);

        if (player.roomId) {
            const room = this.rooms.get(player.roomId);
            if (room) {
                if (room.status === 'PLAYING') {
                    const opponent = player === room.host ? room.guest : room.host;
                    if (opponent) {
                        this.endGame(room, opponent, 'DISCONNECT');
                    }
                }
                this.rooms.delete(room.id);
            }
        }

        this.sendLobbyState();
    }

    // 12. 5목 승리 판정
    private checkWin(b: (string | null)[][]): WinningLine | null {
        const DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [-1, 1]];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const stone = b[r][c];
                if (!stone) continue;
                for (const [dr, dc] of DIRS) {
                    let count = 1;
                    const points: Point[] = [{ r, c }];
                    for (let step = 1; step < 5; step++) {
                        const nr = r + dr * step;
                        const nc = c + dc * step;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === stone) {
                            count++;
                            points.push({ r: nr, c: nc });
                        } else break;
                    }
                    if (count >= 5) {
                        return { start: points[0], end: points[points.length - 1], points };
                    }
                }
            }
        }
        return null;
    }
}

export const omokGameManager = new OmokGameManager();
