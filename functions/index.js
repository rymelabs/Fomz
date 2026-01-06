import { setGlobalOptions } from "firebase-functions";

import * as payments from "./payment";

const { setGlobalOptions } = require("firebase-functions");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });

export { payments };
