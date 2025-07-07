import updateTalents from "../services/updateTalents";
import cron from "node-cron";

function updateTalentCron() {
    cron.schedule("0 0 * * *", () => {
        updateTalents();
    });
}

export default updateTalentCron;