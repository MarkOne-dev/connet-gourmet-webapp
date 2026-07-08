import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PostRepository } from '../../domain/post/post.repository';
import { Post, Comment } from '../../domain/post/models/post.model';
import { API_CONFIG } from '../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class PostHttpRepository implements PostRepository {
  private apiUrl = `${API_CONFIG.baseUrl}/api/posts`;

  constructor(private http: HttpClient) {}

  private mapPostFromApi(apiPost: any): Post {
    const media = apiPost.content?.media || [];
    const imageMedia = media.find((m: any) => m.type === 'image');
    const videoMedia = media.find((m: any) => m.type === 'video');

    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';

    let creatorName = apiPost.creatorName || 'Chef Gourmet';
    let creatorAvatar = apiPost.creatorAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw';

    if (apiPost.creatorId === 'chef-gaston' || apiPost.creatorId === currentUserId) {
      creatorName = storedUser ? JSON.parse(storedUser).name : (apiPost.creatorName || 'Chef Gastón');
      creatorAvatar = storedUser ? JSON.parse(storedUser).avatarUrl : (apiPost.creatorAvatar || creatorAvatar);
    } else if (apiPost.creatorId === 'lucia-mendoza' || apiPost.creatorId === 'sofia_sabe_rico') {
      creatorName = apiPost.creatorName || 'Sofía Mendoza';
      creatorAvatar = apiPost.creatorAvatar || 'https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=687&auto=format&fit=crop';
    } else if (apiPost.creatorId === 'don-ricardo' || apiPost.creatorId === 'cafe_chanchamayo_oficial') {
      creatorName = apiPost.creatorName || 'Finca La Esperanza';
      creatorAvatar = apiPost.creatorAvatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQICwc4phTMLNULoRz3k_s8OMS4JXu6AVs8w&s';
    }

    const likedKey = `liked_${currentUserId}_${apiPost.id}`;
    const isLiked = localStorage.getItem(likedKey) === 'true';

    let contentText = '';
    if (apiPost.content) {
      if (typeof apiPost.content === 'string') {
        contentText = apiPost.content;
      } else if (apiPost.content.text) {
        contentText = apiPost.content.text;
      }
    }

    return {
      id: apiPost.id,
      creatorId: apiPost.creatorId,
      creatorName: creatorName,
      creatorAvatar: creatorAvatar,
      creatorLocation: apiPost.creatorLocation || apiPost.locationLabel || 'Lima, Peru',
      content: contentText,
      imageUrl: apiPost.imageUrl || imageMedia?.url || '',
      videoUrl: apiPost.videoUrl || videoMedia?.url || '',
      likesCount: apiPost.likesCount !== undefined ? apiPost.likesCount : (apiPost.engagement?.likesCount || 0),
      commentsCount: apiPost.commentsCount !== undefined ? apiPost.commentsCount : (apiPost.engagement?.commentsCount || 0),
      isLiked: isLiked,
      locationLabel: apiPost.locationLabel,
      hasRecipe: apiPost.hasRecipe || false,
      recipeTitle: apiPost.recipeTitle,
      comments: (apiPost.comments || []).map((c: any) => ({
        id: c.id || `comment-${Date.now()}-${Math.random()}`,
        postId: apiPost.id,
        userName: c.userName || 'Usuario',
        userAvatar: c.userAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw',
        content: c.content || c.text || '',
        timestamp: c.timestamp || (c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now')
      })),
      ingredients: apiPost.ingredients || apiPost.content?.tags || []
    };
  }

  getFeed(): Observable<Post[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(posts => {
        if (!posts) return [];
        return posts.map(p => this.mapPostFromApi(p));
      })
    );
  }

  getPostById(id: string): Observable<Post> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(p => this.mapPostFromApi(p))
    );
  }

  createPost(content: string, imageUrl?: string, videoUrl?: string, location?: string, ingredients?: string[]): Observable<Post> {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const hasIngredients = ingredients && ingredients.length > 0;

    const postPayload: any = {
      creatorId: currentUserId,
      creatorName: parsedUser ? parsedUser.name : 'Chef Gastón',
      creatorAvatar: parsedUser ? parsedUser.avatarUrl : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw',
      creatorLocation: location || 'Lima, Perú',
      type: 'recipe',
      content: content,
      location: null,
      hasRecipe: hasIngredients,
      locationLabel: location || 'Miraflores, Lima'
    };

    if (imageUrl && imageUrl.trim()) {
      postPayload.imageUrl = imageUrl.trim();
    }
    if (hasIngredients) {
      postPayload.recipeTitle = 'Receta de ' + content.slice(0, 30);
      postPayload.ingredients = ingredients;
    }

    console.log('Sending post payload:', JSON.stringify(postPayload, null, 2));

    return this.http.post<any>(this.apiUrl, postPayload).pipe(
      map(res => this.mapPostFromApi(res))
    );
  }

  toggleLike(postId: string): Observable<boolean> {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';
    const likedKey = `liked_${currentUserId}_${postId}`;

    return this.http.get<boolean>(`${API_CONFIG.baseUrl}/api/likes/post/${postId}/user/${currentUserId}/check`).pipe(
      switchMap(isLiked => {
        if (isLiked) {
          return this.http.delete(`${API_CONFIG.baseUrl}/api/likes/post/${postId}/user/${currentUserId}`).pipe(
            map(() => {
              localStorage.setItem(likedKey, 'false');
              return false;
            })
          );
        } else {
          return this.http.post(`${API_CONFIG.baseUrl}/api/likes`, {
            postId: postId,
            userId: currentUserId
          }).pipe(
            map(() => {
              localStorage.setItem(likedKey, 'true');
              return true;
            })
          );
        }
      }),
      catchError(() => {
        const wasLiked = localStorage.getItem(likedKey) === 'true';
        const isLikedNow = !wasLiked;
        localStorage.setItem(likedKey, isLikedNow ? 'true' : 'false');
        return of(isLikedNow);
      })
    );
  }

  getComments(postId: string): Observable<Comment[]> {
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/api/comments/post/${postId}`).pipe(
      map(comments => comments.map(c => ({
        id: c.id,
        postId: c.postId,
        userName: c.userName || 'Usuario',
        userAvatar: c.userAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw',
        content: c.content || '',
        timestamp: c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hace un momento'
      }))),
      catchError(() => of([]))
    );
  }

  addComment(postId: string, content: string): Observable<Comment> {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserName = storedUser ? JSON.parse(storedUser).name : 'Chef Gastón';
    const currentUserAvatar = storedUser ? JSON.parse(storedUser).avatarUrl : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw';
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';

    const newCommentPayload = {
      postId: postId,
      userId: currentUserId,
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      content: content
    };

    return this.http.post<any>(`${API_CONFIG.baseUrl}/api/comments`, newCommentPayload).pipe(
      map(res => ({
        id: res.id,
        postId: res.postId,
        userName: res.userName || currentUserName,
        userAvatar: res.userAvatar || currentUserAvatar,
        content: res.content,
        timestamp: res.timestamp ? new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hace un momento'
      }))
    );
  }

  savePost(postId: string): Observable<any> {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';
    return this.http.post<any>(`${API_CONFIG.baseUrl}/api/saved-items`, {
      userId: currentUserId,
      postId: postId,
      collectionName: 'Favoritos'
    });
  }

  unsavePost(saveId: string): Observable<void> {
    return this.http.delete<void>(`${API_CONFIG.baseUrl}/api/saved-items/${saveId}`);
  }

  getSavedPosts(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/api/saved-items/user/${userId}`);
  }

  getPostsByUser(creatorId: string): Observable<Post[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${creatorId}`).pipe(
      map(posts => {
        if (!posts) return [];
        return posts.map(p => this.mapPostFromApi(p));
      })
    );
  }

  updatePost(id: string, data: Partial<Post>): Observable<Post> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      map(res => this.mapPostFromApi(res))
    );
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
