import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostFacade } from '../../application/post/post.facade';
import { AuthFacade } from '../../application/auth/auth.facade';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { CreatorFacade } from '../../application/creator/creator.facade';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, SidebarComponent, TranslatePipe],
  template: `
    <app-header></app-header>
    
    <main class="max-w-container-max mx-auto pt-24 px-margin-desktop flex gap-gutter bg-surface min-h-screen text-on-surface">
      <!-- Left Sidebar navigation -->
      <app-sidebar></app-sidebar>
    
      <!-- Center Content: Social Feed -->
      <section class="flex-1 lg:ml-64 max-w-2xl mx-auto space-y-6">
        <!-- Post Creation Box -->
        <div class="bg-surface-container-lowest rounded-[24px] p-6 feed-card-shadow border border-outline-variant/30 relative">
          <div class="flex gap-4">
            <div class="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-secondary-container">
              <img class="w-full h-full object-cover" alt="My Profile Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw"/>
            </div>
            <div class="flex-1">
              <textarea
                [(ngModel)]="newPostText"
                class="w-full bg-surface-container-low border-none rounded-2xl p-4 text-body-md placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none outline-none"
                placeholder="Share your culinary discovery...">
              </textarea>
    
              <!-- Previews inside the creation box -->
              <div class="mt-3 space-y-2">
                <!-- Selected location tag -->
                @if (selectedLocation) {
                  <div class="inline-flex items-center gap-1 bg-secondary-fixed text-on-secondary-fixed-variant px-3 py-1 rounded-full text-xs font-semibold">
                    <span class="material-symbols-outlined text-[14px]">location_on</span>
                    <span>{{ selectedLocation }}</span>
                    <button (click)="removeLocation()" class="material-symbols-outlined text-[14px] hover:text-red-500 cursor-pointer ml-1">close</button>
                  </div>
                }
    
                <!-- Selected ingredients tags -->
                @if (selectedIngredients.length > 0) {
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    @for (ing of selectedIngredients; track ing) {
                      <span class="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1 rounded-full text-xs font-semibold">
                        <span class="material-symbols-outlined text-[14px]">eco</span>
                        <span>{{ ing }}</span>
                        <button (click)="removeIngredient(ing)" class="material-symbols-outlined text-[14px] hover:text-red-500 cursor-pointer ml-1">close</button>
                      </span>
                    }
                  </div>
                }
    
                <!-- Photo preview -->
                @if (selectedImage) {
                  <div class="relative rounded-2xl overflow-hidden aspect-video border border-outline-variant/30 mt-2 max-h-48 w-fit group">
                    <img [src]="selectedImage" class="h-full object-cover rounded-2xl"/>
                    <button (click)="removePhoto()" class="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition-colors cursor-pointer">
                      <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                }
    
                <!-- Video preview placeholder -->
                @if (selectedVideo) {
                  <div class="relative rounded-2xl overflow-hidden aspect-video bg-black/10 flex items-center justify-center border border-outline-variant/30 mt-2 max-h-48 w-80 group">
                    <span class="material-symbols-outlined text-4xl text-outline">movie</span>
                    <span class="absolute bottom-2 left-3 text-xs text-on-surface-variant font-semibold">Video adjuntado</span>
                    <button (click)="removeVideo()" class="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition-colors cursor-pointer">
                      <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
    
          <div class="flex flex-wrap justify-between items-center mt-4 pt-4 border-t border-surface-container">
            <div class="flex gap-2">
              <button (click)="triggerUpload('image')" class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer">
                <span class="material-symbols-outlined text-primary">add_a_photo</span>
                <span class="text-label-sm">Photo</span>
              </button>
              <button (click)="triggerUpload('video')" class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer">
                <span class="material-symbols-outlined text-secondary">movie</span>
                <span class="text-label-sm">Video</span>
              </button>
    
              <!-- Ingredients popover trigger -->
              <div class="relative inline-block">
                <button (click)="toggleIngredientsDropdown()" class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer">
                  <span class="material-symbols-outlined text-tertiary">eco</span>
                  <span class="text-label-sm">Ingredients</span>
                </button>
    
                @if (showIngredientsDropdown) {
                  <div class="absolute bg-white border border-outline-variant/30 rounded-2xl shadow-xl p-4 z-20 mt-2 w-64 animate-fade-in left-0 top-full">
                    <p class="font-label-sm text-outline text-[10px] uppercase font-bold tracking-wider mb-2">Ingredientes orgánicos</p>
                    <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                      @for (ing of availableIngredients; track ing) {
                        <button
                          (click)="toggleIngredient(ing)"
                          [ngClass]="selectedIngredients.includes(ing) ? 'bg-tertiary text-white' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'"
                          class="px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                          type="button">
                          {{ ing }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
    
              <!-- Tag (Location) popover trigger -->
              <div class="relative inline-block">
                <button (click)="toggleLocationDropdown()" class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer">
                  <span class="material-symbols-outlined text-outline">location_on</span>
                  <span class="text-label-sm">Tag</span>
                </button>
    
                @if (showLocationDropdown) {
                  <div class="absolute bg-white border border-outline-variant/30 rounded-2xl shadow-xl p-4 z-20 mt-2 w-48 animate-fade-in left-0 top-full">
                    <p class="font-label-sm text-outline text-[10px] uppercase font-bold tracking-wider mb-2">Ubicación</p>
                    <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
                      @for (loc of availableLocations; track loc) {
                        <button
                          (click)="selectLocation(loc)"
                          [ngClass]="selectedLocation === loc ? 'text-primary font-bold bg-primary-fixed' : 'text-on-surface-variant hover:bg-surface-container-low'"
                          class="px-3 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer w-full"
                          type="button">
                          {{ loc }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
    
            <button
              (click)="publishPost()"
              [disabled]="!newPostText.trim() && !selectedImage && !selectedVideo"
              class="bg-primary text-on-primary disabled:opacity-50 px-6 py-2 rounded-full font-bold transition-transform active:scale-95 shadow-md cursor-pointer">
              {{ 'feed.postButton' | translate }}
            </button>
          </div>
        </div>
    
        <!-- Posts Stream -->
        @if (postFacade.posts$ | async; as posts) {
          <div class="space-y-8 pb-10">
            @for (post of posts; track trackByPostId($index, post)) {
              <article
                class="bg-surface-container-lowest rounded-[24px] overflow-hidden feed-card-shadow border border-outline-variant/20 transition-all hover:translate-y-[-2px]">
                <!-- Post Header -->
                <div class="p-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div [routerLink]="post.creatorId === currentUserId ? '/perfil' : null" class="w-10 h-10 rounded-full overflow-hidden border border-secondary-fixed cursor-pointer">
                      <img class="w-full h-full object-cover" [alt]="post.creatorName" [src]="post.creatorAvatar"/>
                    </div>
                    <div>
                      <h3 [routerLink]="post.creatorId === currentUserId ? '/perfil' : null" class="font-bold text-on-surface-variant text-body-md leading-tight cursor-pointer hover:text-primary transition-colors">
                        {{ post.creatorName }}
                      </h3>
                      <div class="flex items-center gap-1 text-secondary">
                        <span class="material-symbols-outlined text-[14px]">location_on</span>
                        <span class="text-label-sm">{{ post.creatorLocation }}</span>
                      </div>
                    </div>
                  </div>
                  <button class="material-symbols-outlined text-outline hover:text-primary">more_horiz</button>
                </div>
                <!-- Post Media -->
                @if (post.imageUrl) {
                  <div class="relative group">
                    <img class="w-full aspect-square object-cover" [alt]="post.content" [src]="post.imageUrl"/>
                    @if (post.locationLabel || post.hasRecipe) {
                      <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        @if (post.locationLabel) {
                          <span class="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-label-sm text-on-surface font-bold">
                            {{ post.locationLabel }}
                          </span>
                        }
                        @if (post.hasRecipe) {
                          <span class="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-label-sm text-on-surface font-bold">
                            RECETA
                          </span>
                        }
                      </div>
                    }
                  </div>
                }
                <!-- Video Player Mock -->
                @if (post.videoUrl && !post.imageUrl) {
                  <div class="relative aspect-video group">
                    <img class="w-full h-full object-cover" alt="Video cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1XtEkkwyYPDDganzlpxgC1yvWYXck3ft8IYlpYBHSleee-nrPrhL_EJ3S46Qa2FzRJ5CQ44qCn8qSDAJe_2-qGGnRObdOK-YEEK_i7aOTM14bwtoY_KHdbgU39pMHTa4Xg4dD_sn31eD2jDXRBo7KaWIUkCZIBngFp4-dg0alJUdtqjHfPX0_Wros9p5IJcNDFJCYjmJuqNLToAGEvy-dULlpChnKSp4bje8fKRB-AAokcJEYs7mDHw"/>
                    <div class="absolute inset-0 flex items-center justify-center bg-black/10">
                      <button class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center text-white border border-white/40 hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-4xl">play_arrow</span>
                      </button>
                    </div>
                  </div>
                }
                <!-- Post Details -->
                <div class="p-6">
                  <div class="flex justify-between items-center mb-4">
                    <div class="flex gap-6">
                      <button (click)="likePost(post.id)" class="flex items-center gap-1.5 group">
                        <span class="material-symbols-outlined transition-colors" [ngClass]="post.isLiked ? 'text-red-500 fill-1' : 'text-outline group-hover:text-red-500'">favorite</span>
                        <span class="text-label-sm text-outline group-hover:text-on-surface" [class.text-red-500]="post.isLiked">{{ post.likesCount }}</span>
                      </button>
                      <button (click)="toggleComments(post.id)" class="flex items-center gap-1.5 group">
                        <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chat_bubble</span>
                        <span class="text-label-sm text-outline group-hover:text-on-surface">{{ post.commentsCount }}</span>
                      </button>
                      <button (click)="sharePost(post)" class="flex items-center gap-1.5 group">
                        <span class="material-symbols-outlined text-outline group-hover:text-tertiary transition-colors">share</span>
                      </button>
                    </div>
                    <button (click)="bookmarkPost(post.id)" class="material-symbols-outlined transition-colors" [ngClass]="postFacade.isPostSaved(post.id) ? 'text-secondary fill-1' : 'text-outline hover:text-secondary-container'">bookmark</button>
                  </div>
                  <!-- Content Description -->
                  <p class="text-body-md text-on-surface-variant mb-2">
                    <span class="font-bold mr-1">{{ post.creatorName }}</span>
                    {{ post.content }}
                  </p>
                  <!-- Ingredients under content if any -->
                  @if (post.ingredients && post.ingredients.length > 0) {
                    <div class="flex flex-wrap gap-1.5 mb-4">
                      @for (ing of post.ingredients; track ing) {
                        <span class="inline-flex items-center gap-1 bg-tertiary/10 text-tertiary px-2.5 py-0.5 rounded-full text-xs font-bold">
                          <span class="material-symbols-outlined text-[10px]">eco</span>
                          <span>{{ ing }}</span>
                        </span>
                      }
                    </div>
                  }
                  <!-- Tags if any -->
                  @if (post.creatorId === 'don-ricardo') {
                    <div class="flex gap-2 flex-wrap mb-4">
                      <span class="text-primary font-bold text-label-sm">#PeruvianRoots</span>
                      <span class="text-primary font-bold text-label-sm">#SacredValley</span>
                      <span class="text-primary font-bold text-label-sm">#CookingArt</span>
                    </div>
                  }
                  <!-- Timestamp -->
                  <p class="text-label-sm text-outline-variant">2 hours ago</p>
                  <!-- Comments Section -->
                  @if (showCommentsId === post.id) {
                    <div class="mt-6 pt-6 border-t border-surface-container">
                      <div class="space-y-4 mb-4">
                        @for (comment of post.comments; track comment) {
                          <div class="flex gap-3 text-body-md">
                            <div class="w-8 h-8 rounded-full overflow-hidden shrink-0">
                              <img class="w-full h-full object-cover" [alt]="comment.userName" [src]="comment.userAvatar"/>
                            </div>
                            <div class="bg-surface-container-low p-3 rounded-2xl flex-1">
                              <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-on-surface-variant text-sm">{{ comment.userName }}</span>
                                <span class="text-[10px] text-outline">{{ comment.timestamp }}</span>
                              </div>
                              <p class="text-on-surface-variant text-sm">{{ comment.content }}</p>
                            </div>
                          </div>
                        }
                      </div>
                      <!-- Write comment -->
                      <div class="flex gap-2 items-center">
                        <input
                          [(ngModel)]="commentInputs[post.id]"
                          (keyup.enter)="addComment(post.id)"
                          class="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-2 text-sm placeholder:text-outline-variant outline-none focus:ring-1 focus:ring-primary/40"
                          placeholder="{{ 'feed.placeholderComment' | translate }}"
                          type="text"/>
                        <button
                          (click)="addComment(post.id)"
                          class="text-primary hover:text-primary-fixed-dim material-symbols-outlined p-2 cursor-pointer">
                          send
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        }
      </section>
    
      <!-- Right: Trending & Top Foodies Widgets -->
      <aside class="w-80 hidden xl:flex flex-col gap-6 h-fit sticky top-24">
        <!-- Trending Producers Widget -->
        <div class="bg-surface-container-low rounded-[24px] p-6 border border-outline-variant/30">
          <h2 class="font-headline-md text-headline-md text-on-surface-variant mb-6 font-bold">Trending Producers</h2>
          @if (creatorFacade.allUsers$ | async; as users) {
            <div class="flex flex-col gap-4">
              @for (user of users.slice(0, 2); track user.id) {
                <div class="flex items-center gap-3">
                  <img class="w-12 h-12 rounded-xl object-cover" [src]="user.avatarUrl" [alt]="user.name"/>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-body-md truncate">{{ user.name }}</h4>
                    <p class="text-label-sm text-outline truncate">{{ user.location }}</p>
                  </div>
                  <button class="text-primary font-bold text-label-sm hover:underline">Follow</button>
                </div>
              }
            </div>
          }
          <button routerLink="/mapa" class="w-full mt-6 py-2.5 text-primary font-bold border-2 border-primary rounded-xl hover:bg-primary-fixed transition-colors cursor-pointer">
            See Sourcing Map
          </button>
        </div>
    
        <!-- Top Foodies Spotlights -->
        <div class="bg-white rounded-[24px] p-6 shadow-sm border border-surface-container">
          <h3 class="font-bold text-lg mb-4 text-on-surface-variant">Top Foodies</h3>
          @if (creatorFacade.allUsers$ | async; as users) {
            <div class="flex flex-col gap-4">
              @for (user of users.slice(2, 4); track user.id) {
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <img class="w-10 h-10 rounded-full object-cover" [src]="user.avatarUrl" [alt]="user.name"/>
                    <div class="min-w-0">
                      <div class="font-bold text-sm truncate">{{ user.name }}</div>
                      <div class="text-xs text-outline">{{ user.followersCount }} followers</div>
                    </div>
                  </div>
                  <button class="text-primary font-bold text-label-sm">Follow</button>
                </div>
              }
            </div>
          }
        </div>
      </aside>
    </main>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FeedComponent implements OnInit {
  newPostText = '';
  showCommentsId: string | null = null;
  commentInputs: { [postId: string]: string } = {};

  // Adjuntar multimedia a la publicación
  selectedImage: string | undefined = undefined;
  selectedVideo: string | undefined = undefined;
  selectedLocation: string | undefined = undefined;
  selectedIngredients: string[] = [];

  // Control de dropdowns/popovers
  showIngredientsDropdown = false;
  showLocationDropdown = false;

  // Listas de mocks
  availableIngredients = ['Ají Amarillo', 'Limón Norteño', 'Cebolla Roja', 'Cilantro Fresco', 'Papas Nativas', 'Choclo Orgánico', 'Trucha Andina'];
  availableLocations = ['Miraflores, Lima', 'Valle Sagrado, Cusco', 'Arequipa, Perú', 'Iquitos, Amazonas', 'Barranco, Lima'];

  currentUserId = 'chef-gaston';

  constructor(
    public postFacade: PostFacade,
    private authFacade: AuthFacade,
    public creatorFacade: CreatorFacade
  ) {}

  ngOnInit(): void {
    this.postFacade.loadFeed();
    this.creatorFacade.loadAllUsers();
    this.authFacade.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
      }
    });
  }

  bookmarkPost(postId: string): void {
    const saveId = this.postFacade.getSaveId(postId);
    if (saveId) {
      this.postFacade.unsavePost(saveId);
    } else {
      this.postFacade.savePost(postId);
    }
  }

  publishPost(): void {
    if (!this.newPostText.trim() && !this.selectedImage && !this.selectedVideo) return;

    this.postFacade.createPost(
      this.newPostText.trim(),
      this.selectedImage,
      this.selectedVideo,
      this.selectedLocation,
      this.selectedIngredients
    );

    // Resetear formulario de creación
    this.newPostText = '';
    this.selectedImage = undefined;
    this.selectedVideo = undefined;
    this.selectedLocation = undefined;
    this.selectedIngredients = [];
    this.showIngredientsDropdown = false;
    this.showLocationDropdown = false;
  }

  likePost(postId: string): void {
    this.postFacade.toggleLike(postId);
  }

  sharePost(post: any): void {
    const postUrl = `${window.location.origin}/feed#post-${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.recipeTitle || 'GourmetConnect Post',
        text: post.content,
        url: postUrl
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('¡Enlace del post copiado al portapapeles!');
      });
    }
  }

  toggleComments(postId: string): void {
    if (this.showCommentsId === postId) {
      this.showCommentsId = null;
    } else {
      this.showCommentsId = postId;
      if (!this.commentInputs[postId]) {
        this.commentInputs[postId] = '';
      }
      this.postFacade.loadComments(postId);
    }
  }

  addComment(postId: string): void {
    const text = this.commentInputs[postId];
    if (!text || !text.trim()) return;

    this.postFacade.addComment(postId, text.trim());
    this.commentInputs[postId] = '';
  }

  trackByPostId(index: number, post: any): string {
    return post.id;
  }

  triggerUpload(type: string): void {
    if (type === 'image') {
      const url = prompt('Ingresa la URL de la foto de comida:', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuNwmkiZADQqKMuxxKhWNVwtDf_xgpcNDTBZW6hlE1wAwNhq9WoT-mKqxSMSUC8m-BIWp1atSnfWInCbTz_9PMaiwijQnzhuSzW_MAxBmEn1yG6BFjTwAStI3pfMtsudT8rlrAEvPuQSujbQmWTMqFjEUlRcef4CCPKyFIIKKQgHwcojV6aW0CcvNmF4vbSUyvDWfkwf_PYvsqfeNQBvQsGIAnFOU792F-Jv8XPBxE7kVeyXFQW5FNHA');
      if (url !== null) {
        this.selectedImage = url.trim();
        this.selectedVideo = undefined;
      }
    } else if (type === 'video') {
      const url = prompt('Ingresa la URL del video de cocina:', 'https://sample-video.mp4');
      if (url !== null) {
        this.selectedVideo = url.trim();
        this.selectedImage = undefined;
      }
    }
  }

  toggleIngredientsDropdown(): void {
    this.showIngredientsDropdown = !this.showIngredientsDropdown;
    this.showLocationDropdown = false;
  }

  toggleLocationDropdown(): void {
    this.showLocationDropdown = !this.showLocationDropdown;
    this.showIngredientsDropdown = false;
  }

  toggleIngredient(ing: string): void {
    if (this.selectedIngredients.includes(ing)) {
      this.selectedIngredients = this.selectedIngredients.filter(i => i !== ing);
    } else {
      this.selectedIngredients.push(ing);
    }
  }

  selectLocation(loc: string): void {
    this.selectedLocation = loc;
    this.showLocationDropdown = false;
  }

  removeIngredient(ing: string): void {
    this.selectedIngredients = this.selectedIngredients.filter(i => i !== ing);
  }

  removeLocation(): void {
    this.selectedLocation = undefined;
  }

  removePhoto(): void {
    this.selectedImage = undefined;
  }

  removeVideo(): void {
    this.selectedVideo = undefined;
  }
}
