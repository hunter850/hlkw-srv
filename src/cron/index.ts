import updateTalentCron from "./updateTalentCron";

function triggerAllCronJobs() {
    updateTalentCron();
}

export default triggerAllCronJobs;