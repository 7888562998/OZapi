import { createServer} from "http";
import fs from "fs"
import { app } from "../index.js";

const port = process.env.PORT || 3050;

const httpsServer = createServer(
  app,
);

httpsServer.listen(3000, async () => {
  console.log("Server listening on port " + 3000);
});
                   
