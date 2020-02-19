// Syncs purchases in our database with Apple's systems, so we always have up-to-date subscription statusses in our app

// 1. Get al user-subscription's which have the status "active"
// 2. Validate their receipt with Apple
// 3. Update that subscription
