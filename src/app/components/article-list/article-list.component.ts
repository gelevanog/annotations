import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';
import { Article } from '../../models/article.model';

@Component({
  selector: 'app-article-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.css'
})
export class ArticleListComponent {
  articles = signal<Article[]>([]);

  constructor(
    private storageService: StorageService,
    private router: Router
  ) {
    this.storageService.articles$.subscribe(articles => {
      this.articles.set(articles);
    });
  }

  createNewArticle(): void {
    const article = this.storageService.createArticle('Без названия', '');
    this.router.navigate(['/article', article.id]);
  }

  viewArticle(id: string): void {
    this.router.navigate(['/article', id]);
  }

  deleteArticle(event: Event, id: string): void {
    event.stopPropagation();
    if (confirm('Вы уверены, что хотите удалить эту статью?')) {
      this.storageService.deleteArticle(id);
    }
  }
}
