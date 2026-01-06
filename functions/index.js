import { setGlobalOptions } from "firebase-functions/v2";

import * as payments from "./payment/index.js";

setGlobalOptions({ maxInstances: 10 });

export { payments };
