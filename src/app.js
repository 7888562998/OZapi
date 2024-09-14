 import { createServer} from "https";
import fs from "fs"
import { app } from "./index.js";


const port = process.env.PORT || 3050;




const httpsServer = createServer(
  {
    key: fs.readFileSync(
      "/home/aldebaranapi/ssl/keys/b4077_3c035_18700b6d02053eb8dda14a57c2bef694.key",
    ),
    cert: fs.readFileSync(
      "/home/aldebaranapi/ssl/certs/cpanel_aldebaran_api_thesuitchstaging_com_b4077_3c035_1721265382_3464ef9cce178329681483f9a029fc5d.crt",
    ),
    ca: fs.readFileSync("/home/aldebaranapi/ssl/certs/ca.crt"),
  },
  app,
);

httpsServer.listen(port, async () => {
  console.log("Server listening on port " + port);
});
                   
