import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MessageRepository } from '../../domain/message/message.repository';
import { Chat, Message } from '../../domain/message/models/message.model';
import { API_CONFIG } from '../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class MessageHttpRepository implements MessageRepository {
  private apiUrl = `${API_CONFIG.baseUrl}/api/chats`;
  private userCache = new Map<string, any>();

  constructor(private http: HttpClient) {}

  private mapMessageFromApi(apiMsg: any, currentUserId: string): Message {
    return {
      id: apiMsg.id,
      senderId: apiMsg.senderId,
      senderName: apiMsg.senderId === currentUserId ? 'Yo' : 'Participante',
      content: apiMsg.text || '',
      timestamp: apiMsg.timestamp ? new Date(apiMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      isSender: apiMsg.senderId === currentUserId
    };
  }

  private getParticipantInfo(participantId: string): Observable<{ name: string, avatar: string }> {
    if (this.userCache.has(participantId)) {
      return of(this.userCache.get(participantId));
    }

    return this.http.get<any>(`${API_CONFIG.baseUrl}/api/users/${participantId}`).pipe(
      map(user => {
        const info = {
          name: user.name || user.fullName || user.profile?.fullName || user.username || 'Chef Creador',
          avatar: user.avatarUrl || user.profile?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw'
        };
        this.userCache.set(participantId, info);
        return info;
      }),
      catchError(() => {
        return of({
          name: 'Chef Gourmet',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw'
        });
      })
    );
  }

  getChats(userId: string): Observable<Chat[]> {
    const currentUserId = userId;

    return this.http.get<any[]>(`${this.apiUrl}/user/${currentUserId}`).pipe(
      switchMap(apiChats => {
        if (!apiChats || apiChats.length === 0) {
          return of([]);
        }

        const chatObservables = apiChats.map(c => {
          const participantId = c.participants?.find((p: string) => p !== currentUserId) || 'sistema';
          return this.getParticipantInfo(participantId).pipe(
            map(info => ({
              id: c.id,
              participantId: participantId,
              participantName: info.name,
              participantAvatar: info.avatar,
              participantLocation: 'Lima, Peru',
              lastMessageContent: c.lastMessageContent || 'Mensaje de chat',
              lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
              unreadCount: 0,
              isActive: c.isActive || false
            }))
          );
        });

        return forkJoin(chatObservables);
      })
    );
  }

  getMessages(chatId: string): Observable<Message[]> {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';

    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/api/messages/chat/${chatId}`).pipe(
      map(apiMsgs => {
        if (!apiMsgs || apiMsgs.length === 0) {
          return [];
        }
        return apiMsgs.map(m => this.mapMessageFromApi(m, currentUserId));
      }),
      catchError(() => of([]))
    );
  }

  sendMessage(chatId: string, content: string): Observable<Message> {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';

    const postPayload = {
      chatId: chatId,
      senderId: currentUserId,
      content: content
    };

    return this.http.post<any>(`${API_CONFIG.baseUrl}/api/messages`, postPayload).pipe(
      map(res => ({
        id: res.id || `msg-${Date.now()}`,
        senderId: currentUserId,
        senderName: 'Yo',
        content: content,
        timestamp: res.timestamp ? new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSender: true
      }))
    );
  }

  createChat(participantIds: string[], isGroup: boolean): Observable<Chat> {
    const payload = {
      participants: participantIds,
      group: isGroup
    };
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(chat => ({
        id: chat.id,
        participantId: chat.participants[1] || 'sistema', // Simplified
        participantName: 'Nuevo Chat',
        participantAvatar: '',
        participantLocation: '',
        lastMessageContent: 'Chat iniciado',
        lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString() : 'Just now',
        unreadCount: 0,
        isActive: true
      }))
    );
  }

  getChatById(id: string): Observable<Chat> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(chat => ({
        id: chat.id,
        participantId: chat.participants?.[1] || 'sistema',
        participantName: 'Chat',
        participantAvatar: '',
        participantLocation: '',
        lastMessageContent: '',
        lastMessageTime: chat.lastMessageTime || '',
        unreadCount: 0,
        isActive: true
      }))
    );
  }

  updateChat(id: string, chat: Partial<Chat>): Observable<Chat> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, chat).pipe(
      map(c => c)
    );
  }

  deleteChat(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
