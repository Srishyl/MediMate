/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // TODO: Replace with your Gmail address
        user: 'srishylmayurisakshi@gmail.com',
        // TODO: Replace with your Gmail app password (not your regular Gmail password)
        pass: 'zbzt hhpg yvux ycgd'
    }
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Function to track pill usage
exports.trackPillUsage = functions.pubsub.schedule('every 1 minutes').onRun(async(context) => {
    try {
        console.log('Starting pill tracking check...');
        const db = admin.firestore();
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        console.log(`Current time: ${currentHour}:${currentMinute}`);

        // Get all active schedules
        const schedulesSnapshot = await db.collection('schedules')
            .where('active', '==', true)
            .get();

        console.log(`Found ${schedulesSnapshot.size} active schedules`);

        for (const scheduleDoc of schedulesSnapshot.docs) {
            const schedule = scheduleDoc.data();
            console.log(`Checking schedule for ${schedule.pillName} at ${schedule.timeHour}:${schedule.timeMinute}`);

            // Check if it's time for this schedule
            if (schedule.timeHour === currentHour && schedule.timeMinute === currentMinute) {
                console.log(`It's time for ${schedule.pillName}`);

                try {
                    // Check if pill was already taken today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const historySnapshot = await db.collection('history')
                        .where('scheduleId', '==', scheduleDoc.id)
                        .where('takenAt', '>=', today)
                        .get();

                    if (historySnapshot.empty) {
                        console.log(`No history found for today, recording pill for ${schedule.pillName}`);

                        // Check remaining pills
                        const remainingPills = schedule.remainingPills || 0;
                        const isLowOnPills = remainingPills <= 7; // Alert when 7 or fewer pills remain

                        // Check expiry date
                        const expiryDate = new Date(schedule.expiryDate);
                        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = daysUntilExpiry <= 30; // Alert when 30 or fewer days until expiry

                        // Record the pill in history
                        await db.collection('history').add({
                            scheduleId: scheduleDoc.id,
                            userId: schedule.userId,
                            takenAt: admin.firestore.FieldValue.serverTimestamp(),
                            wasReminded: false,
                            status: 'pending'
                        });

                        // Update remaining pills count
                        if (remainingPills > 0) {
                            await scheduleDoc.ref.update({
                                remainingPills: remainingPills - 1
                            });
                        }

                        // Update reminder flags
                        if (isLowOnPills && !schedule.refillReminderSent) {
                            await scheduleDoc.ref.update({
                                refillReminderSent: true
                            });
                        }

                        if (isExpiringSoon && !schedule.expiryReminderSent) {
                            await scheduleDoc.ref.update({
                                expiryReminderSent: true
                            });
                        }

                        console.log('Pill recorded in history');
                    } else {
                        console.log(`Pill already taken today for ${schedule.pillName}`);
                    }
                } catch (error) {
                    console.error(`Error processing schedule ${scheduleDoc.id}:`, error);
                    continue; // Continue with next schedule even if this one fails
                }
            } else {
                console.log(`Not time yet for ${schedule.pillName}`);
            }
        }

        console.log('Pill tracking check completed');
        return null;
    } catch (error) {
        console.error('Error in pill tracking function:', error);
        throw error;
    }
});

// Function to send email reminder
exports.sendPillReminder = functions.pubsub.schedule('every 1 minutes').onRun(async(context) => {
            try {
                console.log('Starting pill reminder check...');
                const db = admin.firestore();
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();

                console.log(`Current time: ${currentHour}:${currentMinute}`);

                // Get all active schedules
                const schedulesSnapshot = await db.collection('schedules')
                    .where('active', '==', true)
                    .get();

                console.log(`Found ${schedulesSnapshot.size} active schedules`);

                for (const scheduleDoc of schedulesSnapshot.docs) {
                    const schedule = scheduleDoc.data();
                    console.log(`Checking schedule for ${schedule.pillName} at ${schedule.timeHour}:${schedule.timeMinute}`);

                    // Check if it's time for this schedule
                    if (schedule.timeHour === currentHour && schedule.timeMinute === currentMinute) {
                        console.log(`It's time for ${schedule.pillName}`);

                        try {
                            // Get user data from Firestore
                            const userDoc = await db.collection('users').doc(schedule.userId).get();

                            if (!userDoc.exists) {
                                console.error(`No user found with ID: ${schedule.userId}`);
                                continue;
                            }

                            const userData = userDoc.data();
                            console.log('User data:', userData);

                            // Check if user has an email
                            if (!userData || !userData.email) {
                                console.error(`No email found for user: ${schedule.userId}`);
                                continue;
                            }

                            const userEmail = userData.email;
                            console.log(`Found user email: ${userEmail}`);

                            // Check if pill was already taken today
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const historySnapshot = await db.collection('history')
                                .where('scheduleId', '==', scheduleDoc.id)
                                .where('takenAt', '>=', today)
                                .get();

                            if (historySnapshot.empty) {
                                console.log(`No history found for today, sending reminder for ${schedule.pillName}`);

                                // Check remaining pills
                                const remainingPills = schedule.remainingPills || 0;
                                const isLowOnPills = remainingPills <= 7; // Alert when 7 or fewer pills remain

                                // Check expiry date
                                const expiryDate = new Date(schedule.expiryDate);
                                const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                                const isExpiringSoon = daysUntilExpiry <= 30; // Alert when 30 or fewer days until expiry

                                // Send email reminder
                                const mailOptions = {
                                        from: 'srishylmayurisakshi@gmail.com',
                                        to: userEmail,
                                        subject: 'MediMate: Time to Take Your Medication',
                                        html: `
              <h2>Time to Take Your Medication</h2>
              <p>Hello ${userData.name || 'User'},</p>
              <p>It's time to take your medication:</p>
              <ul>
                <li><strong>Medication:</strong> ${schedule.pillName}</li>
                <li><strong>Dosage:</strong> ${schedule.dosage}</li>
                <li><strong>Time:</strong> ${schedule.time}</li>
                <li><strong>Remaining Pills:</strong> ${remainingPills}</li>
                <li><strong>Expiry Date:</strong> ${schedule.expiryDate}</li>
              </ul>
              ${isLowOnPills ? `<p style="color: red;">⚠️ You are running low on pills! Please refill your prescription.</p>` : ''}
              ${isExpiringSoon ? `<p style="color: red;">⚠️ Your medication will expire in ${daysUntilExpiry} days!</p>` : ''}
              <p>Please take your medication as prescribed.</p>
              <p>Best regards,<br>MediMate Team</p>
            `
                        };

                        try {
                            console.log(`Attempting to send email to ${userEmail}`);
                            const info = await transporter.sendMail(mailOptions);
                            console.log(`Email sent successfully: ${info.messageId}`);

                            // Record the reminder in history
                            await db.collection('history').add({
                                scheduleId: scheduleDoc.id,
                                userId: schedule.userId,
                                takenAt: admin.firestore.FieldValue.serverTimestamp(),
                                wasReminded: true,
                                status: 'pending'
                            });

                            // Update remaining pills count
                            if (remainingPills > 0) {
                                await scheduleDoc.ref.update({
                                    remainingPills: remainingPills - 1
                                });
                            }

                            // Send refill reminder if needed
                            if (isLowOnPills && !schedule.refillReminderSent) {
                                await sendRefillReminder(userEmail, userData.name, schedule);
                                await scheduleDoc.ref.update({
                                    refillReminderSent: true
                                });
                            }

                            // Send expiry reminder if needed
                            if (isExpiringSoon && !schedule.expiryReminderSent) {
                                await sendExpiryReminder(userEmail, userData.name, schedule, daysUntilExpiry);
                                await scheduleDoc.ref.update({
                                    expiryReminderSent: true
                                });
                            }

                            console.log('Reminder recorded in history');
                        } catch (error) {
                            console.error('Error sending email:', error);
                            throw error;
                        }
                    } else {
                        console.log(`Pill already taken today for ${schedule.pillName}`);
                    }
                } catch (error) {
                    console.error(`Error processing schedule ${scheduleDoc.id}:`, error);
                    continue; // Continue with next schedule even if this one fails
                }
            } else {
                console.log(`Not time yet for ${schedule.pillName}`);
            }
        }

        console.log('Pill reminder check completed');
        return null;
    } catch (error) {
        console.error('Error in pill reminder function:', error);
        throw error;
    }
});

// Function to send refill reminder
async function sendRefillReminder(userEmail, userName, schedule) {
    const mailOptions = {
        from: 'srishylmayurisakshi@gmail.com',
        to: userEmail,
        subject: 'MediMate: Low on Medication',
        html: `
      <h2>Low on Medication</h2>
      <p>Hello ${userName || 'User'},</p>
      <p>You are running low on your medication:</p>
      <ul>
        <li><strong>Medication:</strong> ${schedule.pillName}</li>
        <li><strong>Remaining Pills:</strong> ${schedule.remainingPills}</li>
      </ul>
      <p>Please refill your prescription soon to avoid running out.</p>
      <p>Best regards,<br>MediMate Team</p>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Refill reminder sent to ${userEmail}`);
    } catch (error) {
        console.error('Error sending refill reminder:', error);
    }
}

// Function to send expiry reminder
async function sendExpiryReminder(userEmail, userName, schedule, daysUntilExpiry) {
    const mailOptions = {
        from: 'srishylmayurisakshi@gmail.com',
        to: userEmail,
        subject: 'MediMate: Medication Expiring Soon',
        html: `
      <h2>Medication Expiring Soon</h2>
      <p>Hello ${userName || 'User'},</p>
      <p>Your medication will expire soon:</p>
      <ul>
        <li><strong>Medication:</strong> ${schedule.pillName}</li>
        <li><strong>Expiry Date:</strong> ${schedule.expiryDate}</li>
        <li><strong>Days Until Expiry:</strong> ${daysUntilExpiry}</li>
      </ul>
      <p>Please check your medication and replace if necessary.</p>
      <p>Best regards,<br>MediMate Team</p>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Expiry reminder sent to ${userEmail}`);
    } catch (error) {
        console.error('Error sending expiry reminder:', error);
    }
}