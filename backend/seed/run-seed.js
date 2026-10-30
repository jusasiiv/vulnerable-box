'use strict';
// Force a reseed from seed.sql. Not normally needed (db.js auto-seeds on an
// empty database), but handy for manual resets without wiping the volume.
const db = require('../db');
db.seed();
console.log('reseed complete');
