import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync-pool-data-every-minute",
  { minutes: 1 },
  api.functions.syncPoolData,
);

export default crons;
