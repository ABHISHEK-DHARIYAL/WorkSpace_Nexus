
const { db, collection, query, where, getDocs } = require("../config/db");

type Request = import("express").Request;
type Response = import("express").Response;
const { sendSuccess, sendError } = require("../utils/response");

const SearchController = {
  async search(req: Request, res: Response) {
    try {
      const { query: searchQuery, listingId } = req.query;
      if (!searchQuery) return sendError(res, "Search query is required", 400);

      const pagesRef = collection(db, "pages");
      let q: any = pagesRef;

      if (listingId) {
        q = query(pagesRef, where("listingId", "==", listingId));
      }

      const snapshot = await getDocs(q);
      const searchTerm = (searchQuery as string).toLowerCase();

      const results = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((page: any) => 
          (page.title || "").toLowerCase().includes(searchTerm) || 
          (page.content || "").toLowerCase().includes(searchTerm)
        );

      sendSuccess(res, results);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
};


module.exports = {
  SearchController
};
