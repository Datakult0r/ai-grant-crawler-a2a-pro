import cron from "node-cron";
import { GrantDiscoveryService } from "../services/grantDiscovery.js";

export class ScheduledDiscoveryJob {
  static init() {
    console.log("Initializing Scheduled Discovery Job (Daily at 2:00 AM)...");
    cron.schedule("0 2 * * *", async () => {
      console.log("Running Scheduled Grant Discovery...");
      await GrantDiscoveryService.runDiscovery();
    });
  }
}
