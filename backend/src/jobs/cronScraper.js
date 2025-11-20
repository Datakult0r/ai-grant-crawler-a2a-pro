import cron from 'node-cron';
import { supabase } from '../config/database.js';

export const startCronJobs = () => {
    console.log('🕰️ Cron jobs initialized');

    // Check for deadlines every day at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Checking for upcoming deadlines...');
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const { data: grants } = await supabase
            .from('grants')
            .select('*')
            .lt('deadline', threeDaysFromNow.toISOString())
            .gt('deadline', new Date().toISOString());

        if (grants && grants.length > 0) {
            console.log(`⚠️ ${grants.length} grants closing soon!`);
            // TODO: Send email/notification
        }
    });
};
