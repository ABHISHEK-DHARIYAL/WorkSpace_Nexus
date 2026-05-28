import mammoth from "mammoth";
import { PageService } from "./pageService";
import { ListingService } from "./listingService";
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
  static async parse(buffer: Buffer, originalName: string, mimetype: string, ownerEmail: string): Promise<any> {
    if (mimetype === "application/pdf") {
      return this.parsePdf(buffer, originalName, ownerEmail);
    } else {
      return this.parseDocx(buffer, originalName, ownerEmail);
    }
  }

  /**
   * Parses a PDF buffer and returns structured data
   */
  static async parsePdf(buffer: Buffer, originalName: string, ownerEmail: string): Promise<any> {
    const PDFParseClass = getPDFParse();
    if (!PDFParseClass) {
      throw new Error("PDF parser not properly initialized. This may be an environment issue.");
    }

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

      const index = pages.map((p: any, idx: number) => ({
        title: p.title,
        pageNumber: p.pageNumber,
        level: 1,
        anchorId: `page-${idx}`
      }));

      // Create the Listing
      const listingTitle = originalName.replace(/\.[^/.]+$/, "");
      const listing = await ListingService.create({
        title: listingTitle,
        description: `Imported from ${originalName} (PDF)`
      }, ownerEmail);

      // Create the Pages
      const createdPages = [];
      for (const page of pages) {
        const createdPage = await PageService.create({
          listingId: listing.id,
          title: page.title,
          content: page.content,
          pageNumber: page.pageNumber
        });
        createdPages.push(createdPage);
      }

      // Update Listing with index and pages
      await ListingService.update(listing.id, {
        pages: createdPages.map(p => p.id),
        index: index.map((item: any) => ({
          ...item,
          pageId: createdPages.find(p => p.pageNumber === item.pageNumber)?.id
        }))
      });

      return {
        listing,
        pages: createdPages
      };
    } catch (parseError: any) {
      console.error("PDF Parsing Internal Error:", parseError);
      throw new Error(`Failed to parse PDF: ${parseError.message}`);
    }
  }

  /**
   * Parses a DOCX buffer and returns structured data
   */
  static async parseDocx(buffer: Buffer, originalName: string, ownerEmail: string): Promise<any> {
    // Generate HTML from DOCX
    const { value: html } = await mammoth.convertToHtml({ buffer });
    
    // Extract structure without JSDOM
    // We parse top-level HTML tags using regex
    const elementRegex = /<(h1|h2|h3|h4|h5|p|table|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
    
    interface ChildElement {
      tagName: string;
      outerHTML: string;
      textContent: string;
    }
    
    const children: ChildElement[] = [];
    let match;
    while ((match = elementRegex.exec(html)) !== null) {
      const tagName = match[1].toLowerCase();
      const outerHTML = match[0];
      const textContent = match[2].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
      
      children.push({
        tagName,
        outerHTML,
        textContent
      });
    }

    // Fallback if no structured tags found
    if (children.length === 0 && html.trim() !== "") {
      children.push({
        tagName: "p",
        outerHTML: html,
        textContent: html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
      });
    }
    
    const pages: any[] = [];
    let currentPage: any = {
      title: "Introduction",
      content: "",
      pageNumber: 1
    };
    
    const index: any[] = [];
    let pageCounter = 1;
    
    children.forEach((child, idx) => {
      const tagName = child.tagName;
      
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
        index.push({
          title: child.textContent || "Untitled",
          pageNumber: pageCounter,
          level: tagName === 'h1' ? 1 : 2,
          anchorId
        });
      }
      
      // Append to current page content
      if (tagName === 'table') {
        let tableHtml = child.outerHTML;
        if (!tableHtml.includes("class=")) {
          tableHtml = tableHtml.replace("<table", '<table class="min-w-full border-collapse"');
        }
        currentPage.content += `<div class="table-responsive my-6 overflow-x-auto">${tableHtml}</div>`;
      } else {
        currentPage.content += child.outerHTML;
      }
    });
    
    // Push the last page
    if (currentPage.content.trim() !== "" || pages.length === 0) {
      pages.push(currentPage);
    }
    
    // Create the Listing
    const listingTitle = originalName.replace(/\.[^/.]+$/, "");
    const listing = await ListingService.create({
      title: listingTitle,
      description: `Imported from ${originalName}`
    }, ownerEmail);
    
    // Create the Pages
    const createdPages = [];
    for (const page of pages) {
      const createdPage = await PageService.create({
        listingId: listing.id,
        title: page.title,
        content: page.content,
        pageNumber: page.pageNumber
      });
      createdPages.push(createdPage);
    }
    
    // Update Listing with index and pages
    await ListingService.update(listing.id, {
      pages: createdPages.map(p => p.id),
      index: index.map(item => ({
        ...item,
        pageId: createdPages.find(p => p.pageNumber === item.pageNumber)?.id
      }))
    });
    
    return {
      listing,
      pages: createdPages
    };
  }
}
