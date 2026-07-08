import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CreatorRepository } from '../../domain/creator/creator.repository';
import { Creator, Producer } from '../../domain/creator/models/creator.model';
import { API_CONFIG } from '../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class CreatorHttpRepository implements CreatorRepository {
  private apiUrl = `${API_CONFIG.baseUrl}/api/users`;

  constructor(private http: HttpClient) {}

  private mapCreatorFromApi(apiUser: any, isFollowing = false): Creator {
    const name = apiUser.name || apiUser.fullName || apiUser.profile?.fullName || apiUser.username || 'Chef Creador';
    const avatarUrl = apiUser.avatarUrl || apiUser.profile?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw';
    const coverUrl = apiUser.coverUrl || apiUser.profile?.coverUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSC0Xt4PiAJSWcEkaqCd3qABeSj-U2TyIrxB3YuRThVx1wLLUXO8C9887wSeotLg6g1PFJ3fNgojMzi3IvMSpHk4oqDe39fxcjx2zqB2ChRznwAWWQezqn_dIubuzYV_JjYcmwiW5ZDJAW6Pu5FinFkfeIxTtCeau_Sgeu1kGMsydMTCN2v0K4MGnUDUO1bnBT9V2zy4C7e8y7OvQlGLpYY0-WpjrIlBmmtbatZAkOuL5HENpJDaD-yA';
    
    let location = 'Lima, Peru';
    const coords = apiUser.location?.coordinates || apiUser.profile?.location?.coordinates;
    if (coords && coords.length >= 2) {
      location = `${coords[1]}, ${coords[0]}`;
    } else if (apiUser.creatorLocation) {
      location = apiUser.creatorLocation;
    } else if (apiUser.profile?.locationLabel || apiUser.locationLabel) {
      location = apiUser.profile?.locationLabel || apiUser.locationLabel;
    }

    const bio = apiUser.bio || apiUser.profile?.bio || 'Lover of traditional flavors and sustainable ingredients';
    const followersCount = apiUser.followersCount !== undefined ? apiUser.followersCount : (apiUser.stats?.followersCount || apiUser.stats?.followers_count || 0);
    const recipesCount = apiUser.recipesCount !== undefined ? apiUser.recipesCount : (apiUser.postsCount !== undefined ? apiUser.postsCount : (apiUser.stats?.postsCount || apiUser.stats?.posts_count || 0));

    return {
      id: apiUser.id,
      name,
      avatarUrl,
      coverUrl,
      location,
      bio,
      followersCount,
      recipesCount,
      producersCount: apiUser.producersCount || 0,
      isFollowing: isFollowing
    };
  }

  getCreatorById(id: string): Observable<Creator> {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';

    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      switchMap(user => {
        return this.http.get<any[]>(`${API_CONFIG.baseUrl}/api/follows/following/${currentUserId}`).pipe(
          map(followingList => {
            const relationship = followingList.find(r => r.followedId === id);
            return this.mapCreatorFromApi(user, !!relationship);
          }),
          catchError(() => of(this.mapCreatorFromApi(user, false)))
        );
      }),
      catchError(() => {
        return of({
          id,
          name: id === 'chef-gaston' ? 'Chef Gastón' : 'Chef Gourmet',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw',
          coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSC0Xt4PiAJSWcEkaqCd3qABeSj-U2TyIrxB3YuRThVx1wLLUXO8C9887wSeotLg6g1PFJ3fNgojMzi3IvMSpHk4oqDe39fxcjx2zqB2ChRznwAWWQezqn_dIubuzYV_JjYcmwiW5ZDJAW6Pu5FinFkfeIxTtCeau_Sgeu1kGMsydMTCN2v0K4MGnUDUO1bnBT9V2zy4C7e8y7OvQlGLpYY0-WpjrIlBmmtbatZAkOuL5HENpJDaD-yA',
          location: 'Lima, Perú',
          bio: 'Chef apasionado por la gastronomía y productos sustentables.',
          followersCount: 15,
          recipesCount: 5,
          producersCount: 3,
          isFollowing: false
        });
      })
    );
  }

  getProducers(creatorId: string): Observable<Producer[]> {
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/api/follows/following/${creatorId}`).pipe(
      switchMap(followingList => {
        if (!followingList || followingList.length === 0) {
          return of([]);
        }
        
        const detailObservables = followingList.map(relationship => 
          this.http.get<any>(`${this.apiUrl}/${relationship.followedId}`).pipe(
            catchError(() => of(null))
          )
        );

        return forkJoin(detailObservables).pipe(
          map(users => {
            const activeUsers = users.filter(u => u !== null);
            // Mostrar creadores o productores seguidos como proveedores de la despensa
            return activeUsers.map((u, index) => ({
              id: u.id,
              name: u.name || u.username || 'Productor',
              type: u.role === 'producer' ? 'Productor Local' : 'Chef Aliado',
              avatarUrl: u.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw',
              percentageUsed: [45, 30, 20, 15, 10][index % 5] || 10
            }));
          })
        );
      }),
      catchError(() => of([]))
    );
  }

  toggleFollow(creatorId: string): Observable<boolean> {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';

    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/api/follows/following/${currentUserId}`).pipe(
      switchMap(followingList => {
        const relationship = followingList.find(r => r.followedId === creatorId);
        
        if (relationship) {
          return this.http.delete(`${API_CONFIG.baseUrl}/api/follows/${relationship.id}`).pipe(
            map(() => false)
          );
        } else {
          return this.http.post(`${API_CONFIG.baseUrl}/api/follows`, {
            followerId: currentUserId,
            followedId: creatorId
          }).pipe(
            map(() => true)
          );
        }
      }),
      catchError(() => {
        return this.http.post(`${API_CONFIG.baseUrl}/api/follows`, {
          followerId: currentUserId,
          followedId: creatorId
        }).pipe(
          map(() => true),
          catchError(() => of(false))
        );
      })
    );
  }

  getNearbyUsers(lat: number, lng: number, radius: number): Observable<Creator[]> {
    return this.http.get<any[]>(`${this.apiUrl}/nearby?lng=${lng}&lat=${lat}&radius=${radius}`).pipe(
      map(users => users.map(u => this.mapCreatorFromApi(u))),
      catchError(() => of([]))
    );
  }

  getFollowers(userId: string): Observable<Creator[]> {
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/api/follows/followers/${userId}`).pipe(
      switchMap(followers => {
        if (!followers || followers.length === 0) return of([]);
        const obs = followers.map(f => this.http.get<any>(`${this.apiUrl}/${f.followerId}`).pipe(
          catchError(() => of(null))
        ));
        return forkJoin(obs).pipe(
          map(users => users.filter(u => u !== null).map(u => this.mapCreatorFromApi(u)))
        );
      }),
      catchError(() => of([]))
    );
  }

  getFollowing(userId: string): Observable<Creator[]> {
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/api/follows/following/${userId}`).pipe(
      switchMap(followings => {
        if (!followings || followings.length === 0) return of([]);
        const obs = followings.map(f => this.http.get<any>(`${this.apiUrl}/${f.followedId}`).pipe(
          catchError(() => of(null))
        ));
        return forkJoin(obs).pipe(
          map(users => users.filter(u => u !== null).map(u => this.mapCreatorFromApi(u)))
        );
      }),
      catchError(() => of([]))
    );
  }

  getUsers(): Observable<Creator[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(users => users.map(u => this.mapCreatorFromApi(u))),
      catchError(() => of([]))
    );
  }
}
