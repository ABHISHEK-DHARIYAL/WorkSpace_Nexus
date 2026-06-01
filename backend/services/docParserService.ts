import mammoth from "mammoth";
import { PageService } from "./pageService";
import { ListingService } from "./listingService";
import { DocumentNexusDocumentService } from "./documentNexusDocumentService";
import { DocPageService } from "./docPageService";
import { DocIndexService } from "./docIndexService";
import { JSDOM } from "jsdom";
import * as PDFParseModule from "pdf-parse";

// Defensive check for PDFParse constructor
const getPDFParse = () => {
  if (PDFParseModule.PDFParse) return PDFParseModule.PDFParse;
  // @ts-ignore
  if (PDFParseModule.default?.PDFParse) return PDFParseModule.default.PDFParse;
  // @ts-ignore
  if (typeof PDFParseModule.default === 'function') return PDFParseModule.default;
  // @ts-ignore
  if (typeof PDFParseModule === 'function') return PDFParseModule;
  return null;
};

export interface ParsedDoc {
  title: string;
  pages: Array<{
    title: string;
    content: string;
    pageNumber: number;
  }>;
  index: Array<{
    title: string;
    pageNumber: number;
    level: number;
    anchorId: string;
  }>;
}

export class DocParserService {
  /**
   * Main entry point for document parsing
   */
  static async parse(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    ownerEmail: string,
    options?: { workspaceId?: string; addedToNexus?: boolean }
  ): Promise<any> {
    if (mimetype === "application/pdf") {
      return this.parsePdf(buffer, originalName, ownerEmail, options);
    } else {
      return this.parseDocx(buffer, originalName, ownerEmail, options);
    }
  }

  /**
   * Parses a PDF buffer and returns structured data
   */
  static async parsePdf(
    buffer: Buffer,
    originalName: string,
    ownerEmail: string,
    options?: { workspaceId?: string; addedToNexus?: boolean }
  ): Promise<any> {
    const PDFParseClass = getPDFParse();
    if (!PDFParseClass) {
      console.error("[PDF PERSISTENCE ERROR] PDF parser class/function not initialized.");
      throw new Error("PDF parser not properly initialized. This may be an environment issue.");
    }

    console.log(`[PDF PERSISTENCE INFO] Starting PDF parse for: ${originalName} (size: ${buffer.length} bytes)`);

    try {
      // Check if it's the class-based one or the function-based one
      let pages = [];
      
      if (PDFParseClass.prototype && PDFParseClass.prototype.getText) {
        // @ts-ignore
        const parser = new PDFParseClass({ data: buffer });
        const textResult = await parser.getText();
        
        pages = textResult.pages.map((p: any) => ({
          title: p.num === 1 ? "Introduction" : `Page ${p.num}`,
          content: p.text.split('\n').map((line: string) => `<p>${line}</p>`).join(''),
          pageNumber: p.num
        }));
      } else {
        // Traditional function-based pdf-parse
        // @ts-ignore
        const data = await PDFParseClass(buffer);
        const text = data.text;
        const chunks = text.match(/[\s\S]{1,2500}/g) || [text];
        pages = chunks.map((chunk: string, idx: number) => ({
          title: idx === 0 ? "Introduction" : `Page ${idx + 1}`,
          content: chunk.split('\n').map((p: string) => `<p>${p}</p>`).join(''),
          pageNumber: idx + 1
        }));
      }

      console.log(`[PDF PERSISTENCE INFO] PDF successfully text-chunked into ${pages.length} logical divisions.`);

      const index = pages.map((p: any, idx: number) => ({
        title: p.title,
        pageNumber: p.pageNumber,
        level: 1,
        anchorId: `page-${idx}`
      }));

      const listingTitle = originalName.replace(/\.[^/.]+$/, "");
      const isNexus = options?.addedToNexus === true;
      const workspaceId = options?.workspaceId || "main";

      console.log(`[PDF PERSISTENCE INFO] Mode: ${isNexus ? 'Document Nexus' : 'Workspace Hub'}, workspaceId: ${workspaceId}`);

      if (isNexus) {
        // Document Nexus branch
        console.log(`[PDF PERSISTENCE INFO] Creating documentNexusDocuments record with title: "${listingTitle}" under workspace ID: "${workspaceId}"`);
        const listing = await DocumentNexusDocumentService.create({
          title: listingTitle,
          description: `Imported from ${originalName} (PDF)`,
          workspaceId: workspaceId
        }, ownerEmail);

        if (!listing || !listing.id) {
          throw new Error("[PDF PERSISTENCE ERROR] Failed to create documentNexusDocuments record: generated documentID/projectId is null.");
        }

        const projectId = listing.id;
        console.log(`[PDF PERSISTENCE INFO] Created documentNexusDocuments (projectId/documentId: "${projectId}") successfully.`);

        // Create the Pages under doc_pages
        const createdPages = [];
        for (const page of pages) {
          console.log(`[PDF PERSISTENCE INFO] Saving page ${page.pageNumber}/${pages.length} to "doc_pages" for projectId: "${projectId}"`);
          const createdPage = await DocPageService.create({
            projectId: projectId,
            title: page.title,
            content: page.content,
            pageNumber: page.pageNumber
          });

          if (!createdPage || !createdPage.id) {
            throw new Error(`[PDF PERSISTENCE ERROR] Failed to create "doc_pages" page record: generated pageId is missing for page ${page.pageNumber}.`);
          }

          createdPages.push(createdPage);
        }

        // Create the index entries in doc_indices
        const createdIndices = [];
        for (let idx = 0; idx < index.length; idx++) {
          const item = index[idx];
          const matchedPage = createdPages.find(p => p.pageNumber === item.pageNumber);
          if (matchedPage) {
            console.log(`[PDF PERSISTENCE INFO] Registering outline index element "${item.title}" referencing pageId "${matchedPage.id}" in "doc_indices" for projectId "${projectId}"`);
            const docIdx = await DocIndexService.create({
              title: item.title,
              linkedPage: matchedPage.id,
              linkedSectionId: item.anchorId,
              position: idx + 1,
              projectId: projectId
            });
            createdIndices.push(docIdx);
          }
        }

        // Update the Document with mapping arrays
        console.log(`[PDF PERSISTENCE INFO] Finalizing documentNexusDocuments references with ${createdPages.length} pages.`);
        const updatedDocResult = await DocumentNexusDocumentService.update(projectId, {
          pages: createdPages.map(p => p.id),
          index: index.map((item: any) => ({
            ...item,
            pageId: createdPages.find(p => p.pageNumber === item.pageNumber)?.id
          }))
        });

        console.log(`[PDF PERSISTENCE SUCCESS] PDF processed and persisted successfully in Document Nexus.`);

        return {
          listing: updatedDocResult,
          pages: createdPages
        };

      } else {
        // Workspace Hub branch
        console.log(`[PDF PERSISTENCE INFO] Creating workspaceHubProjects record with title: "${listingTitle}" under workspace ID: "${workspaceId}"`);
        const listing = await ListingService.create({
          title: listingTitle,
          description: `Imported from ${originalName} (PDF)`,
          workspaceId: workspaceId
        }, ownerEmail);

        if (!listing || !listing.id) {
          throw new Error("[PDF PERSISTENCE ERROR] Failed to create workspaceHubProjects record: listing.id is null.");
        }

        const projectId = listing.id;
        console.log(`[PDF PERSISTENCE INFO] Created workspaceHubProjects (projectId: "${projectId}") successfully.`);

        const createdPages = [];
        for (const page of pages) {
          console.log(`[PDF PERSISTENCE INFO] Saving page ${page.pageNumber}/${pages.length} to "pages" for listingId: "${projectId}"`);
          const createdPage = await PageService.create({
            listingId: projectId,
            title: page.title,
            content: page.content,
            pageNumber: page.pageNumber
          });

          if (!createdPage || !createdPage.id) {
            throw new Error(`[PDF PERSISTENCE ERROR] Failed to create "pages" page record: pageId is missing for page ${page.pageNumber}.`);
          }

          createdPages.push(createdPage);
        }

        console.log(`[PDF PERSISTENCE INFO] Finalizing workspaceHubProjects references with ${createdPages.length} pages.`);
        const updatedListing = await ListingService.update(projectId, {
          pages: createdPages.map(p => p.id),
          index: index.map((item: any) => ({
            ...item,
            pageId: createdPages.find(p => p.pageNumber === item.pageNumber)?.id
          }))
        });

        console.log(`[PDF PERSISTENCE SUCCESS] PDF processed and persisted successfully in Workspace Hub.`);

        return {
          listing: updatedListing,
          pages: createdPages
        };
      }
    } catch (parseError: any) {
      console.error("[PDF PERSISTENCE ERROR] PDF Parsing/Persistence failed:", parseError);
      throw new Error(`Failed to parse PDF: ${parseError.message}`);
    }
  }

  /**
   * Parses a DOCX buffer and returns structured data
   */
  static async parseDocx(
    buffer: Buffer,
    originalName: string,
    ownerEmail: string,
    options?: { workspaceId?: string; addedToNexus?: boolean }
  ): Promise<any> {
    console.log(`[DOCX PERSISTENCE INFO] Starting DOCX parse for: ${originalName} (size: ${buffer.length} bytes)`);
    try {
      // Generate HTML from DOCX
      const { value: html } = await mammoth.convertToHtml({ buffer });
      
      // Create a DOM to manipulate the HTML
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const pages: any[] = [];
      let currentPage: any = {
        title: "Introduction",
        content: "",
        pageNumber: 1
      };
      
      const index: any[] = [];
      let pageCounter = 1;
      
      const body = document.body;
      const children = Array.from(body.children);
      
      children.forEach((child, idx) => {
        const tagName = child.tagName.toLowerCase();
        
        // Handle headings for index and page breaks
        if (tagName === 'h1' || tagName === 'h2') {
          // If the current page has content, push it and start a new one
          if (currentPage.content.trim() !== "" || pages.length === 0) {
            if (pages.length > 0 || currentPage.content.trim() !== "") {
              pages.push({ ...currentPage });
              pageCounter++;
              currentPage = {
                title: child.textContent || `Section ${pageCounter}`,
                content: "",
                pageNumber: pageCounter
              };
            } else {
              currentPage.title = child.textContent || "Introduction";
            }
          } else {
            currentPage.title = child.textContent || "Introduction";
          }
          
          // Add to index
          const anchorId = `heading-${idx}`;
          child.id = anchorId;
          index.push({
            title: child.textContent || "Untitled",
            pageNumber: pageCounter,
            level: tagName === 'h1' ? 1 : 2,
            anchorId
          });
        }
        
        // Append to current page content
        if (tagName === 'table') {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-responsive my-6 overflow-x-auto';
          const clonedTable = child.cloneNode(true) as HTMLElement;
          clonedTable.classList.add('min-w-full', 'border-collapse');
          wrapper.appendChild(clonedTable);
          currentPage.content += wrapper.outerHTML;
        } else {
          currentPage.content += child.outerHTML;
        }
      });
      
      // Push the last page
      if (currentPage.content.trim() !== "" || pages.length === 0) {
        pages.push(currentPage);
      }
      
      console.log(`[DOCX PERSISTENCE INFO] DOCX parsed into ${pages.length} structural page segments.`);

      const listingTitle = originalName.replace(/\.[^/.]+$/, "");
      const isNexus = options?.addedToNexus === true;
      const workspaceId = options?.workspaceId || "main";

      console.log(`[DOCX PERSISTENCE INFO] Mode: ${isNexus ? 'Document Nexus' : 'Workspace Hub'}, workspaceId: ${workspaceId}`);

      if (isNexus) {
        // Document Nexus branch
        console.log(`[DOCX PERSISTENCE INFO] Creating documentNexusDocuments record with title: "${listingTitle}" under workspace ID: "${workspaceId}"`);
        const listing = await DocumentNexusDocumentService.create({
          title: listingTitle,
          description: `Imported from ${originalName}`,
          workspaceId: workspaceId
        }, ownerEmail);

        if (!listing || !listing.id) {
          throw new Error("[DOCX PERSISTENCE ERROR] Failed to create documentNexusDocuments record: generated documentID/projectId is null.");
        }

        const projectId = listing.id;
        console.log(`[DOCX PERSISTENCE INFO] Created documentNexusDocuments (projectId/documentId: "${projectId}") successfully.`);

        // Create the Pages under doc_pages
        const createdPages = [];
        for (const page of pages) {
          console.log(`[DOCX PERSISTENCE INFO] Saving page ${page.pageNumber}/${pages.length} to "doc_pages" for projectId: "${projectId}"`);
          const createdPage = await DocPageService.create({
            projectId: projectId,
            title: page.title,
            content: page.content,
            pageNumber: page.pageNumber
          });

          if (!createdPage || !createdPage.id) {
            throw new Error(`[DOCX PERSISTENCE ERROR] Failed to create "doc_pages" page record: generated pageId is missing for page ${page.pageNumber}.`);
          }

          createdPages.push(createdPage);
        }

        // Create index entries in doc_indices
        const createdIndices = [];
        for (let idx = 0; idx < index.length; idx++) {
          const item = index[idx];
          const matchedPage = createdPages.find(p => p.pageNumber === item.pageNumber);
          if (matchedPage) {
            console.log(`[DOCX PERSISTENCE INFO] Registering outline index element "${item.title}" referencing pageId "${matchedPage.id}" in "doc_indices" for projectId "${projectId}"`);
            const docIdx = await DocIndexService.create({
              title: item.title,
              linkedPage: matchedPage.id,
              linkedSectionId: item.anchorId,
              position: idx + 1,
              projectId: projectId
            });
            createdIndices.push(docIdx);
          }
        }

        // Update the Document with mapping arrays
        console.log(`[DOCX PERSISTENCE INFO] Finalizing documentNexusDocuments references with ${createdPages.length} pages.`);
        const updatedDocResult = await DocumentNexusDocumentService.update(projectId, {
          pages: createdPages.map(p => p.id),
          index: index.map((item: any) => ({
            ...item,
            pageId: createdPages.find(p => p.pageNumber === item.pageNumber)?.id
          }))
        });

        console.log(`[DOCX PERSISTENCE SUCCESS] DOCX processed and persisted successfully in Document Nexus.`);

        return {
          listing: updatedDocResult,
          pages: createdPages
        };

      } else {
        // Workspace Hub branch
        console.log(`[DOCX PERSISTENCE INFO] Creating workspaceHubProjects record with title: "${listingTitle}" under workspace ID: "${workspaceId}"`);
        const listing = await ListingService.create({
          title: listingTitle,
          description: `Imported from ${originalName}`,
          workspaceId: workspaceId
        }, ownerEmail);

        if (!listing || !listing.id) {
          throw new Error("[DOCX PERSISTENCE ERROR] Failed to create workspaceHubProjects record: listing.id is null.");
        }

        const projectId = listing.id;
        console.log(`[DOCX PERSISTENCE INFO] Created workspaceHubProjects (projectId: "${projectId}") successfully.`);

        const createdPages = [];
        for (const page of pages) {
          console.log(`[DOCX PERSISTENCE INFO] Saving page ${page.pageNumber}/${pages.length} to "pages" for listingId: "${projectId}"`);
          const createdPage = await PageService.create({
            listingId: projectId,
            title: page.title,
            content: page.content,
            pageNumber: page.pageNumber
          });

          if (!createdPage || !createdPage.id) {
            throw new Error(`[DOCX PERSISTENCE ERROR] Failed to create "pages" page record: pageId is missing for page ${page.pageNumber}.`);
          }

          createdPages.push(createdPage);
        }

        console.log(`[DOCX PERSISTENCE INFO] Finalizing workspaceHubProjects references with ${createdPages.length} pages.`);
        const updatedListing = await ListingService.update(projectId, {
          pages: createdPages.map(p => p.id),
          index: index.map(item => ({
            ...item,
            pageId: createdPages.find(p => p.pageNumber === item.pageNumber)?.id
          }))
        });

        console.log(`[DOCX PERSISTENCE SUCCESS] DOCX processed and persisted successfully in Workspace Hub.`);

        return {
          listing: updatedListing,
          pages: createdPages
        };
      }
    } catch (parseError: any) {
      console.error("[DOCX PERSISTENCE ERROR] DOCX Parsing/Persistence failed:", parseError);
      throw new Error(`Failed to parse DOCX: ${parseError.message}`);
    }
  }
}
