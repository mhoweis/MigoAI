// Re-export the singleton Prisma instance from database/prisma
// This ensures all parts of the app use the same Prisma client instance
// preventing duplicate connections and shutdown handler conflicts
import prisma, { connectDB } from '../database/prisma';

export { connectDB };
export default prisma;
