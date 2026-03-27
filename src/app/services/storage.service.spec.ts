import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { Article, Annotation } from '../models/article.model';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Articles', () => {
    it('должен создаваться', () => {
      expect(service).toBeTruthy();
    });

    it('должен создавать статью', () => {
      const article = service.createArticle('Тестовая статья', 'Тестовое содержимое');
      
      expect(article).toBeDefined();
      expect(article.title).toBe('Тестовая статья');
      expect(article.content).toBe('Тестовое содержимое');
      expect(article.id).toBeDefined();
      expect(article.createdAt).toBeInstanceOf(Date);
      expect(article.updatedAt).toBeInstanceOf(Date);
    });

    it('должен получать все статьи', () => {
      service.createArticle('Статья 1', 'Содержимое 1');
      service.createArticle('Статья 2', 'Содержимое 2');
      
      const articles = service.getArticles();
      expect(articles.length).toBe(2);
    });

    it('должен получать статью по ID', () => {
      const created = service.createArticle('Тест', 'Содержимое');
      const found = service.getArticleById(created.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Тест');
    });

    it('должен обновлять статью', () => {
      const article = service.createArticle('Старый заголовок', 'Старое содержимое');
      
      service.updateArticle(article.id, 'Новый заголовок', 'Новое содержимое');
      
      const updated = service.getArticleById(article.id);
      expect(updated?.title).toBe('Новый заголовок');
      expect(updated?.content).toBe('Новое содержимое');
    });

    it('должен удалять статью', () => {
      const article = service.createArticle('Тест', 'Содержимое');
      
      service.deleteArticle(article.id);
      
      const found = service.getArticleById(article.id);
      expect(found).toBeUndefined();
    });

    it('должен удалять аннотации при удалении статьи', () => {
      const article = service.createArticle('Тест', 'Содержимое');
      service.createAnnotation(article.id, 0, 4, 'Тест', 'Примечание', '#ffeb3b');
      
      service.deleteArticle(article.id);
      
      const annotations = service.getAnnotationsByArticleId(article.id);
      expect(annotations.length).toBe(0);
    });

    it('должен сохранять статьи в localStorage', () => {
      service.createArticle('Тест', 'Содержимое');
      
      const stored = localStorage.getItem('articles');
      expect(stored).toBeDefined();
      
      const articles = JSON.parse(stored!);
      expect(articles.length).toBe(1);
    });
  });

  describe('Annotations', () => {
    let article: Article;

    beforeEach(() => {
      article = service.createArticle('Тестовая статья', 'Тестовое содержимое для аннотаций');
    });

    it('должен создавать аннотацию', () => {
      const annotation = service.createAnnotation(
        article.id,
        0,
        8,
        'Тестовая',
        'Примечание к тексту',
        '#ffeb3b'
      );
      
      expect(annotation).toBeDefined();
      expect(annotation.articleId).toBe(article.id);
      expect(annotation.startOffset).toBe(0);
      expect(annotation.endOffset).toBe(8);
      expect(annotation.text).toBe('Тестовая');
      expect(annotation.note).toBe('Примечание к тексту');
      expect(annotation.color).toBe('#ffeb3b');
      expect(annotation.id).toBeDefined();
      expect(annotation.createdAt).toBeInstanceOf(Date);
    });

    it('должен получать аннотации по ID статьи', () => {
      service.createAnnotation(article.id, 0, 8, 'Тестовая', 'Примечание 1', '#ffeb3b');
      service.createAnnotation(article.id, 9, 15, 'статья', 'Примечание 2', '#4caf50');
      
      const annotations = service.getAnnotationsByArticleId(article.id);
      expect(annotations.length).toBe(2);
    });

    it('должен обновлять аннотацию', () => {
      const annotation = service.createAnnotation(
        article.id,
        0,
        8,
        'Тестовая',
        'Старое примечание',
        '#ffeb3b'
      );
      
      service.updateAnnotation(annotation.id, 'Новое примечание', '#4caf50');
      
      const annotations = service.getAnnotationsByArticleId(article.id);
      const updated = annotations.find(a => a.id === annotation.id);
      
      expect(updated?.note).toBe('Новое примечание');
      expect(updated?.color).toBe('#4caf50');
    });

    it('должен удалять аннотацию', () => {
      const annotation = service.createAnnotation(
        article.id,
        0,
        8,
        'Тестовая',
        'Примечание',
        '#ffeb3b'
      );
      
      service.deleteAnnotation(annotation.id);
      
      const annotations = service.getAnnotationsByArticleId(article.id);
      expect(annotations.length).toBe(0);
    });

    it('должен сохранять аннотации в localStorage', () => {
      service.createAnnotation(article.id, 0, 8, 'Тестовая', 'Примечание', '#ffeb3b');
      
      const stored = localStorage.getItem('annotations');
      expect(stored).toBeDefined();
      
      const annotations = JSON.parse(stored!);
      expect(annotations.length).toBe(1);
    });

    it('должен поддерживать пересекающиеся аннотации', () => {
      service.createAnnotation(article.id, 0, 10, 'Тестовая с', 'Первая', '#ffeb3b');
      service.createAnnotation(article.id, 5, 15, 'вая статья', 'Вторая', '#4caf50');
      
      const annotations = service.getAnnotationsByArticleId(article.id);
      expect(annotations.length).toBe(2);
    });
  });

  describe('Observable Streams', () => {
    it('должен эмитить изменения статей', () => {
      return new Promise<void>((resolve) => {
        service.articles$.subscribe(articles => {
          if (articles.length === 1) {
            expect(articles[0].title).toBe('Тест');
            resolve();
          }
        });
        
        service.createArticle('Тест', 'Содержимое');
      });
    });

    it('должен эмитить изменения аннотаций', () => {
      return new Promise<void>((resolve) => {
        const article = service.createArticle('Тест', 'Содержимое');
        
        service.annotations$.subscribe(annotations => {
          if (annotations.length === 1) {
            expect(annotations[0].note).toBe('Примечание');
            resolve();
          }
        });
        
        service.createAnnotation(article.id, 0, 4, 'Тест', 'Примечание', '#ffeb3b');
      });
    });
  });
});
