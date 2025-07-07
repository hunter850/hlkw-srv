import cron from "node-cron";

import updateTalents from "../services/updateTalents";

function updateTalentCron() {
    cron.schedule("0 0 * * *", () => {
        updateTalents();
    });
}

export default updateTalentCron;
