import { IHighlightRepository, HighlightRecord } from '../repositories/IHighlightRepository';
import { IHighlightService } from './IHighlightService';

/**
 * Note: `create`'s validation intentionally throws plain `Error`s (not
 * typed AppError subclasses), matching the original implementation's
 * behavior of surfacing missing pageId/listingId as generic 500s rather
 * than 400s. Preserving behavior, not correcting it, per this pass's scope.
 */
export class HighlightServiceImpl implements IHighlightService {
  constructor(private readonly highlightRepo: IHighlightRepository) {}

  async getAll(): Promise<HighlightRecord[]> {
    return this.highlightRepo.findAll();
  }

  async getByPage(pageId: string): Promise<HighlightRecord[]> {
    return this.highlightRepo.findByPage(pageId);
  }

  async create(data: any): Promise<HighlightRecord> {
    if (!data.pageId) throw new Error('Page ID is required for annotation');
    if (!data.listingId) throw new Error('Listing ID is required for annotation');

    return this.highlightRepo.create({
      listingId: data.listingId,
      pageId: data.pageId,
      userId: data.userId || 'anonymous',
      text: data.text || '',
      color: data.color || 'yellow',
      annotationType: data.annotationType || 'highlight',
      style: data.style || 'solid',
      startOffset: data.startOffset || 0,
      endOffset: data.endOffset || 0,
      selectedRange: data.selectedRange || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
