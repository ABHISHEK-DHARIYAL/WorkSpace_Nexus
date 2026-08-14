import { HighlightRecord } from '../repositories/IHighlightRepository';

export interface IHighlightService {
  getAll(): Promise<HighlightRecord[]>;
  getByPage(pageId: string): Promise<HighlightRecord[]>;
  create(data: any): Promise<HighlightRecord>;
}
