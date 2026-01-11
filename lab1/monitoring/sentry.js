require('dotenv').config();
const Sentry = require("@sentry/node");

function initSentry() {
    if (!process.env.SENTRY_DSN) {
        console.log("Sentry: brak DSN, monitoring wylaczony");
        return;
    }
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: 1.0,
        sendDefaultPii: true,
    });
    
    console.log("Sentry: monitoring wlaczony");
}

module.exports = { Sentry, initSentry };