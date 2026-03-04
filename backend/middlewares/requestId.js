import crypto from "crypto";

export const requestIdMiddleware = (req, res, next) => {
    req.requestId = crypto.randomUUID();
    // Optional: Add it to the response header for client-side tracing
    res.setHeader("X-Request-Id", req.requestId);
    next();
};
