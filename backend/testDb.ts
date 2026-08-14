import { testFirestoreConnection } from "./config/firebase";
import { listingService } from "./di/container";


async function main() {
  console.log("Starting test-get-by-id diagnostic...");
  await testFirestoreConnection();
  
  const id = "81jk4vr16mplr4rah";
  console.log(`Querying listingService.getById("${id}"):`);
  try {
    const listing = await listingService.getById(id);
    if (listing) {
      console.log("SUCCESS! Listing found:", listing);
    } else {
      console.log("FAILED! Listing is null!");
    }
  } catch (err: any) {
    console.error("ERROR while querying:", err);
  }
}

main();
