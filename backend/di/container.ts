import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { ListingRepository } from '../repositories/ListingRepository';
import { PageRepository } from '../repositories/PageRepository';
import { WorkspaceServiceImpl } from '../services/workspaceService';
import { IWorkspaceService } from '../services/IWorkspaceService';
import { ListingServiceImpl } from '../services/listingService';
import { IListingService } from '../services/IListingService';
import { PageServiceImpl } from '../services/pageService';
import { IPageService } from '../services/IPageService';
import { HighlightRepository } from '../repositories/HighlightRepository';
import { HighlightServiceImpl } from '../services/highlightService';
import { IHighlightService } from '../services/IHighlightService';

/**
 * Manual dependency-injection composition root. No DI framework is used
 * (InversifyJS/tsyringe etc. would be unnecessary complexity for this app's
 * size) — this file is simply the single place where concrete
 * implementations are chosen and wired into their interfaces. Controllers
 * and other consumers import the already-wired singletons below and only
 * ever see the interface types, never the concrete classes directly.
 */
const workspaceRepository = new WorkspaceRepository();
// One Firestore-backed repository instance, shared by both services since it
// implements both the narrow IListingRepository and the full
// IListingProjectRepository (Interface Segregation without duplicating
// Firestore query code).
const listingRepository = new ListingRepository();

export const listingService: IListingService = new ListingServiceImpl(
  listingRepository,
  workspaceRepository
);

export const workspaceService: IWorkspaceService = new WorkspaceServiceImpl(
  workspaceRepository,
  listingRepository,
  listingService
);

const pageRepository = new PageRepository();

export const pageService: IPageService = new PageServiceImpl(pageRepository);

const highlightRepository = new HighlightRepository();

export const highlightService: IHighlightService = new HighlightServiceImpl(highlightRepository);
