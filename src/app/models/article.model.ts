export interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Annotation {
  id: string;
  articleId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  note: string;
  color: string;
  createdAt: Date;
}

export interface AnnotationRange {
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
}
