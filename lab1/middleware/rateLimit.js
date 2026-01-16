const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

/**
 * Globalny limiter – 100 requestów na 15 minut
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // maksymalnie 100 requestów
  message: {
    error: 'Zbyt wiele requestów. Spróbuj ponownie za 15 minut.',
  },
  standardHeaders: true, // Zwraca info o limicie w headerach
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
});

/**
 * Limiter dla auth – 5 prób na minutę (ochrona przed brute-force)
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 10, // maksymalnie 10 prób
  message: {
    error: 'Zbyt wiele prób logowania. Poczekaj minutę.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    const email = req.body.email;
    const ipKey = ipKeyGenerator(req.ip);
    return `${ipKey}:${email}`;
  },
});

const healthLimiter = rateLimit({
    windowMs: 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Zbyt wiele requestow. Sprobuj ponownie za chwile.",
    },
});

module.exports = { globalLimiter, authLimiter, healthLimiter };