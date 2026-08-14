export interface HighlightRecord {
  id: string;
  listingId: string;
  pageId: string;
  userId: string;
  text: string;
  color: string;
  annotationType: string;
  style: string;
  startOffset: number;
  endOffset: number;
  selectedRange: any;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface IHighlightRepository {
  findAll(): Promise<HighlightRecord[]>;
  findByPage(pageId: string): Promise<HighlightRecord[]>;
  create(data: Omit<HighlightRecord, 'id'>): Promise<HighlightRecord>;
}
