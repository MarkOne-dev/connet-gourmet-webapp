import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PostHttpRepository } from '../../infrastructure/persistence/post-http.repository';
import { Post, Comment } from '../../domain/post/models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostFacade {
  private postsSubject = new BehaviorSubject<Post[]>([]);
  private savedPostsSubject = new BehaviorSubject<any[]>([]);
  private userPostsSubject = new BehaviorSubject<Post[]>([]);
  private selectedPostSubject = new BehaviorSubject<Post | null>(null);

  posts$: Observable<Post[]> = this.postsSubject.asObservable();
  savedPosts$: Observable<any[]> = this.savedPostsSubject.asObservable();
  userPosts$: Observable<Post[]> = this.userPostsSubject.asObservable();
  selectedPost$: Observable<Post | null> = this.selectedPostSubject.asObservable();

  constructor(private postRepository: PostHttpRepository) {}

  loadFeed(): void {
    this.postRepository.getFeed().subscribe(posts => {
      this.postsSubject.next(posts);
    });
  }

  loadPostsByUser(creatorId: string): void {
    this.postRepository.getPostsByUser(creatorId).subscribe(posts => {
      this.userPostsSubject.next(posts);
    });
  }

  loadPostById(id: string): void {
    this.postRepository.getPostById(id).subscribe(post => {
      this.selectedPostSubject.next(post);
    });
  }

  loadComments(postId: string): void {
    this.postRepository.getComments(postId).subscribe({
      next: (comments) => {
        const currentPosts = this.postsSubject.value.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: comments
            };
          }
          return post;
        });
        this.postsSubject.next(currentPosts);
      },
      error: (err) => {
        console.error('Error loading comments:', err);
      }
    });
  }

  isPostSaved(postId: string): boolean {
    return this.savedPostsSubject.value.some(s => s.postId === postId);
  }

  getSaveId(postId: string): string | null {
    const found = this.savedPostsSubject.value.find(s => s.postId === postId);
    return found ? found.id : null;
  }

  createPost(content: string, imageUrl?: string, videoUrl?: string, location?: string, ingredients?: string[]): void {
    this.postRepository.createPost(content, imageUrl, videoUrl, location, ingredients).subscribe({
      next: (newPost) => {
        const currentPosts = this.postsSubject.value;
        this.postsSubject.next([newPost, ...currentPosts]);
      },
      error: (err) => {
        console.error('Error creating post:', err);
        alert('Error al publicar: ' + (err.error?.message || err.error || err.message || JSON.stringify(err)));
      }
    });
  }

  toggleLike(postId: string): void {
    this.postRepository.toggleLike(postId).subscribe(isLiked => {
      const currentPosts = this.postsSubject.value.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: isLiked,
            likesCount: post.likesCount + (isLiked ? 1 : -1)
          };
        }
        return post;
      });
      this.postsSubject.next(currentPosts);
    });
  }

  addComment(postId: string, content: string): void {
    this.postRepository.addComment(postId, content).subscribe(newComment => {
      const currentPosts = this.postsSubject.value.map(post => {
        if (post.id === postId) {
          const updatedComments = post.comments ? [...post.comments, newComment] : [newComment];
          return {
            ...post,
            comments: updatedComments,
            commentsCount: post.commentsCount + 1
          };
        }
        return post;
      });
      this.postsSubject.next(currentPosts);
    });
  }

  loadSavedPosts(): void {
    const storedUser = localStorage.getItem('gc_user');
    const currentUserId = storedUser ? JSON.parse(storedUser).id : 'chef-gaston';
    this.postRepository.getSavedPosts(currentUserId).subscribe(savedList => {
      this.savedPostsSubject.next(savedList);
    });
  }

  savePost(postId: string): void {
    this.postRepository.savePost(postId).subscribe(newSave => {
      const currentSaved = this.savedPostsSubject.value;
      this.savedPostsSubject.next([...currentSaved, newSave]);
      alert('¡Publicación guardada exitosamente!');
    });
  }

  unsavePost(saveId: string): void {
    this.postRepository.unsavePost(saveId).subscribe(() => {
      const currentSaved = this.savedPostsSubject.value.filter(s => s.id !== saveId);
      this.savedPostsSubject.next(currentSaved);
      alert('Publicación eliminada de guardados.');
    });
  }

  updatePost(id: string, data: Partial<Post>): void {
    this.postRepository.updatePost(id, data).subscribe(updatedPost => {
      // Update main feed posts list
      const feedPosts = this.postsSubject.value.map(p => p.id === id ? updatedPost : p);
      this.postsSubject.next(feedPosts);

      // Update user posts list
      const userPosts = this.userPostsSubject.value.map(p => p.id === id ? updatedPost : p);
      this.userPostsSubject.next(userPosts);

      // Update selected post if it matches
      const selected = this.selectedPostSubject.value;
      if (selected && selected.id === id) {
        this.selectedPostSubject.next(updatedPost);
      }
    });
  }

  deletePost(id: string): void {
    this.postRepository.deletePost(id).subscribe(() => {
      // Remove from feed posts
      const feedPosts = this.postsSubject.value.filter(p => p.id !== id);
      this.postsSubject.next(feedPosts);

      // Remove from user posts
      const userPosts = this.userPostsSubject.value.filter(p => p.id !== id);
      this.userPostsSubject.next(userPosts);

      // Reset selected post if it matches
      const selected = this.selectedPostSubject.value;
      if (selected && selected.id === id) {
        this.selectedPostSubject.next(null);
      }
    });
  }
}
