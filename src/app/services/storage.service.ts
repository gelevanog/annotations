import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Article, Annotation } from '../models/article.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ARTICLES_KEY = 'articles';
  private readonly ANNOTATIONS_KEY = 'annotations';

  private articlesSubject = new BehaviorSubject<Article[]>(this.loadArticles());
  private annotationsSubject = new BehaviorSubject<Annotation[]>(this.loadAnnotations());

  articles$: Observable<Article[]> = this.articlesSubject.asObservable();
  annotations$: Observable<Annotation[]> = this.annotationsSubject.asObservable();

  private loadArticles(): Article[] {
    const data = localStorage.getItem(this.ARTICLES_KEY);
    if (!data) return [];
    const articles = JSON.parse(data);
    return articles.map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt)
    }));
  }

  private loadAnnotations(): Annotation[] {
    const data = localStorage.getItem(this.ANNOTATIONS_KEY);
    if (!data) return [];
    const annotations = JSON.parse(data);
    return annotations.map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt)
    }));
  }

  private saveArticles(articles: Article[]): void {
    localStorage.setItem(this.ARTICLES_KEY, JSON.stringify(articles));
    this.articlesSubject.next(articles);
  }

  private saveAnnotations(annotations: Annotation[]): void {
    localStorage.setItem(this.ANNOTATIONS_KEY, JSON.stringify(annotations));
    this.annotationsSubject.next(annotations);
  }

  getArticles(): Article[] {
    return this.articlesSubject.value;
  }

  getArticleById(id: string): Article | undefined {
    return this.articlesSubject.value.find(a => a.id === id);
  }

  createArticle(title: string, content: string): Article {
    const article: Article = {
      id: this.generateId(),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const articles = [...this.articlesSubject.value, article];
    this.saveArticles(articles);
    return article;
  }

  updateArticle(id: string, title: string, content: string): void {
    const articles = this.articlesSubject.value.map(a =>
      a.id === id ? { ...a, title, content, updatedAt: new Date() } : a
    );
    this.saveArticles(articles);
  }

  deleteArticle(id: string): void {
    const articles = this.articlesSubject.value.filter(a => a.id !== id);
    this.saveArticles(articles);
    
    const annotations = this.annotationsSubject.value.filter(a => a.articleId !== id);
    this.saveAnnotations(annotations);
  }

  getAnnotationsByArticleId(articleId: string): Annotation[] {
    return this.annotationsSubject.value.filter(a => a.articleId === articleId);
  }

  createAnnotation(
    articleId: string,
    startOffset: number,
    endOffset: number,
    text: string,
    note: string,
    color: string
  ): Annotation {
    const annotation: Annotation = {
      id: this.generateId(),
      articleId,
      startOffset,
      endOffset,
      text,
      note,
      color,
      createdAt: new Date()
    };
    const annotations = [...this.annotationsSubject.value, annotation];
    this.saveAnnotations(annotations);
    return annotation;
  }

  updateAnnotation(id: string, note: string, color: string): void {
    const annotations = this.annotationsSubject.value.map(a =>
      a.id === id ? { ...a, note, color } : a
    );
    this.saveAnnotations(annotations);
  }

  deleteAnnotation(id: string): void {
    const annotations = this.annotationsSubject.value.filter(a => a.id !== id);
    this.saveAnnotations(annotations);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
