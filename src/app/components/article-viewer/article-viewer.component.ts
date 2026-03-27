import { Component, OnInit, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';
import { Article, Annotation } from '../../models/article.model';

@Component({
  selector: 'app-article-viewer',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './article-viewer.component.html',
  styleUrl: './article-viewer.component.css'
})
export class ArticleViewerComponent implements OnInit, AfterViewInit {
  @ViewChild('contentElement', { static: false }) contentElement!: ElementRef<HTMLDivElement>;
  
  article = signal<Article | null>(null);
  annotations = signal<Annotation[]>([]);
  editTitle = signal('');
  
  showAnnotationForm = signal(false);
  annotationNote = signal('');
  annotationColor = signal('#ffeb3b');
  selectedRange: Range | null = null;
  selectedText = signal('');
  
  editingAnnotationId = signal<string | null>(null);
  editAnnotationNote = signal('');
  editAnnotationColor = signal('#ffeb3b');
  
  tooltip = signal<{ visible: boolean; x: number; y: number; note: string; color: string }>({
    visible: false,
    x: 0,
    y: 0,
    note: '',
    color: ''
  });

  availableColors = [
    { value: '#ffeb3b', name: 'Желтый' },
    { value: '#4caf50', name: 'Зеленый' },
    { value: '#2196f3', name: 'Синий' },
    { value: '#ff9800', name: 'Оранжевый' },
    { value: '#e91e63', name: 'Розовый' },
    { value: '#9c27b0', name: 'Фиолетовый' }
  ];

  renderedContent = computed(() => {
    const article = this.article();
    if (!article) return '';
    
    const annotations = this.annotations();
    if (annotations.length === 0) {
      return article.content;
    }

    const segments: Array<{
      start: number;
      end: number;
      annotations: Annotation[];
    }> = [];

    const breakpoints = new Set<number>();
    breakpoints.add(0);
    breakpoints.add(article.content.length);

    for (const annotation of annotations) {
      breakpoints.add(annotation.startOffset);
      breakpoints.add(annotation.endOffset);
    }

    const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);

    for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
      const start = sortedBreakpoints[i];
      const end = sortedBreakpoints[i + 1];
      
      const segmentAnnotations = annotations.filter(
        ann => ann.startOffset <= start && ann.endOffset >= end
      );

      segments.push({
        start,
        end,
        annotations: segmentAnnotations
      });
    }

    let result = '';
    for (const segment of segments) {
      const text = article.content.substring(segment.start, segment.end);
      
      if (segment.annotations.length === 0) {
        result += this.escapeHtml(text);
      } else {
        const colors = segment.annotations.map(a => a.color);
        const notes = segment.annotations.map(a => this.escapeHtml(a.note)).join(' | ');
        const ids = segment.annotations.map(a => a.id).join(',');
        
        const underlineStyle = colors.length === 1
          ? `text-decoration: underline; text-decoration-color: ${colors[0]}; text-decoration-thickness: 2px;`
          : `background: linear-gradient(to right, ${colors.join(', ')}); background-size: 100% 2px; background-repeat: no-repeat; background-position: 0 100%; padding-bottom: 2px;`;
        
        result += `<span class="annotation" data-annotation-id="${ids}" data-note="${notes}" data-color="${colors[0]}" style="${underlineStyle} cursor: pointer;">${this.escapeHtml(text)}</span>`;
      }
    }

    return result;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadArticle(id);
    }
  }

  ngAfterViewInit(): void {
    this.setupEventListeners();
    this.renderContent();
  }

  private setupEventListeners(): void {
    if (this.contentElement) {
      const element = this.contentElement.nativeElement;
      
      element.addEventListener('mouseup', () => this.handleTextSelection());
      element.addEventListener('mouseover', (e) => this.handleMouseOver(e));
      element.addEventListener('mouseout', () => this.hideTooltip());
      element.addEventListener('input', () => this.handleContentChange());
    }
  }

  private loadArticle(id: string): void {
    const article = this.storageService.getArticleById(id);
    if (article) {
      this.article.set(article);
      this.editTitle.set(article.title);
      this.loadAnnotations(id);
      setTimeout(() => this.renderContent(), 0);
    } else {
      this.router.navigate(['/']);
    }
  }

  private loadAnnotations(articleId: string): void {
    const annotations = this.storageService.getAnnotationsByArticleId(articleId);
    this.annotations.set(annotations);
  }

  saveArticle(): void {
    const article = this.article();
    if (!article) return;

    const title = this.editTitle().trim();
    const content = this.getPlainTextContent();
    
    if (title && content) {
      this.storageService.updateArticle(article.id, title, content);
      this.loadArticle(article.id);
    }
  }

  private handleContentChange(): void {
    const article = this.article();
    if (!article) return;

    const content = this.getPlainTextContent();
    const title = this.editTitle() || 'Без названия';
    
    const currentArticle = this.storageService.getArticleById(article.id);
    if (currentArticle && currentArticle.content !== content) {
      this.storageService.updateArticle(article.id, title, content);
      this.article.set({ ...article, content, title });
    }
  }

  private getPlainTextContent(): string {
    if (!this.contentElement) return '';
    return this.contentElement.nativeElement.innerText || '';
  }

  private renderContent(): void {
    if (!this.contentElement) return;
    const element = this.contentElement.nativeElement;
    const content = this.renderedContent();
    
    if (content) {
      element.innerHTML = content;
    } else {
      element.innerHTML = '';
    }
  }

  private handleTextSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (selectedText.length === 0) {
      this.showAnnotationForm.set(false);
      return;
    }

    const article = this.article();
    if (!article) return;

    const startOffset = this.getTextOffset(range.startContainer, range.startOffset);
    const endOffset = this.getTextOffset(range.endContainer, range.endOffset);

    if (startOffset !== -1 && endOffset !== -1 && startOffset < endOffset) {
      this.selectedRange = range;
      this.selectedText.set(selectedText);
      this.showAnnotationForm.set(true);
      this.annotationNote.set('');
      this.annotationColor.set('#ffeb3b');
    }
  }

  private getTextOffset(node: Node, offset: number): number {
    const article = this.article();
    if (!article) return -1;

    const contentElement = this.contentElement.nativeElement;
    const walker = document.createTreeWalker(
      contentElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentOffset = 0;
    let currentNode: Node | null;

    while ((currentNode = walker.nextNode())) {
      if (currentNode === node) {
        return currentOffset + offset;
      }
      currentOffset += currentNode.textContent?.length || 0;
    }

    return -1;
  }

  createAnnotation(): void {
    const article = this.article();
    if (!article || !this.selectedRange) return;

    const note = this.annotationNote().trim();
    if (!note) return;

    const startOffset = this.getTextOffset(this.selectedRange.startContainer, this.selectedRange.startOffset);
    const endOffset = this.getTextOffset(this.selectedRange.endContainer, this.selectedRange.endOffset);

    if (startOffset !== -1 && endOffset !== -1 && startOffset < endOffset) {
      const content = this.getPlainTextContent();
      this.storageService.updateArticle(article.id, this.editTitle() || 'Без названия', content);
      
      this.storageService.createAnnotation(
        article.id,
        startOffset,
        endOffset,
        this.selectedText(),
        note,
        this.annotationColor()
      );
      
      this.showAnnotationForm.set(false);
      this.selectedRange = null;
      window.getSelection()?.removeAllRanges();
      
      this.loadArticle(article.id);
    }
  }

  cancelAnnotation(): void {
    this.showAnnotationForm.set(false);
    this.selectedRange = null;
    window.getSelection()?.removeAllRanges();
  }

  private handleMouseOver(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('annotation')) {
      const note = target.getAttribute('data-note') || '';
      const color = target.getAttribute('data-color') || '#ffeb3b';
      
      this.tooltip.set({
        visible: true,
        x: event.pageX,
        y: event.pageY - 40,
        note: note,
        color: color
      });
    }
  }

  private hideTooltip(): void {
    this.tooltip.set({
      visible: false,
      x: 0,
      y: 0,
      note: '',
      color: ''
    });
  }

  startEditAnnotation(annotation: Annotation): void {
    this.editingAnnotationId.set(annotation.id);
    this.editAnnotationNote.set(annotation.note);
    this.editAnnotationColor.set(annotation.color);
  }

  cancelEditAnnotation(): void {
    this.editingAnnotationId.set(null);
    this.editAnnotationNote.set('');
    this.editAnnotationColor.set('#ffeb3b');
  }

  updateAnnotation(): void {
    const annotationId = this.editingAnnotationId();
    if (!annotationId) return;

    const note = this.editAnnotationNote().trim();
    if (!note) return;

    this.storageService.updateAnnotation(
      annotationId,
      note,
      this.editAnnotationColor()
    );

    this.editingAnnotationId.set(null);
    const article = this.article();
    if (article) {
      this.loadArticle(article.id);
    }
  }

  deleteAnnotation(annotationId: string): void {
    if (confirm('Удалить эту аннотацию?')) {
      this.storageService.deleteAnnotation(annotationId);
      const article = this.article();
      if (article) {
        this.loadArticle(article.id);
      }
    }
  }

  updateTitle(): void {
    const article = this.article();
    if (!article) return;
    
    const title = this.editTitle().trim() || 'Без названия';
    const content = this.getPlainTextContent();
    this.storageService.updateArticle(article.id, title, content);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
