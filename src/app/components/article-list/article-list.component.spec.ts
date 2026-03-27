import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { ArticleListComponent } from './article-list.component';
import { StorageService } from '../../services/storage.service';
import { BehaviorSubject, of } from 'rxjs';
import { provideLocationMocks } from '@angular/common/testing';

describe('ArticleListComponent', () => {
  let component: ArticleListComponent;
  let fixture: ComponentFixture<ArticleListComponent>;
  let storageService: any;
  let router: any;

  beforeEach(async () => {
    const articlesSubject = new BehaviorSubject<any[]>([]);
    
    storageService = {
      createArticle: vi.fn(),
      deleteArticle: vi.fn(),
      articles$: articlesSubject.asObservable()
    };

    router = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ArticleListComponent],
      providers: [
        provideLocationMocks(),
        { provide: StorageService, useValue: storageService },
        { provide: Router, useValue: router },
        { 
          provide: ActivatedRoute, 
          useValue: {
            snapshot: { paramMap: { get: () => null } },
            params: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArticleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('должен создаваться', () => {
    expect(component).toBeTruthy();
  });

  it('должен создавать новую статью и переходить к ней', () => {
    const mockArticle = {
      id: '123',
      title: 'Без названия',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    storageService.createArticle.mockReturnValue(mockArticle);

    component.createNewArticle();

    expect(storageService.createArticle).toHaveBeenCalledWith('Без названия', '');
    expect(router.navigate).toHaveBeenCalledWith(['/article', '123']);
  });

  it('должен переходить к просмотру статьи', () => {
    component.viewArticle('test-id');

    expect(router.navigate).toHaveBeenCalledWith(['/article', 'test-id']);
  });

  it('должен удалять статью после подтверждения', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const event = new Event('click');
    vi.spyOn(event, 'stopPropagation');

    component.deleteArticle(event, 'test-id');

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(storageService.deleteArticle).toHaveBeenCalledWith('test-id');
  });

  it('не должен удалять статью при отмене', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const event = new Event('click');

    component.deleteArticle(event, 'test-id');

    expect(storageService.deleteArticle).not.toHaveBeenCalled();
  });

  it('должен отображать пустое состояние когда нет статей', () => {
    component.articles.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const emptyState = compiled.querySelector('.empty-state');
    
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Статей пока нет');
  });

  it('должен отображать список статей', () => {
    const mockArticles = [
      {
        id: '1',
        title: 'Статья 1',
        content: 'Содержимое 1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Статья 2',
        content: 'Содержимое 2',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    component.articles.set(mockArticles);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const articleCards = compiled.querySelectorAll('.article-card');
    
    expect(articleCards.length).toBe(2);
  });
});
