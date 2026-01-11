import { getDatabase } from '../database/db.js';
import bcrypt from 'bcryptjs';

class User {
    /**
     * Create a new user with hashed password
     */
    static async create(userData) {
        const prisma = getDatabase();
        const { email, password, full_name, role } = userData;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName: full_name,
                role: role || 'USER'
            }
        });

        return this._sanitize(user);
    }

    /**
     * Find user by email (returns wrapper with password for internal auth checks)
     * Note: This returns the RAW prisma object including password. 
     * Be careful not to return this directly to API response without sanitizing.
     */
    static async findByEmailWithPassword(email) {
        const prisma = getDatabase();
        return prisma.user.findUnique({
            where: { email }
        });
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const prisma = getDatabase();
        const user = await prisma.user.findUnique({
            where: { id }
        });
        return this._sanitize(user);
    }

    /**
     * Compare password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Remove sensitive fields
     */
    static _sanitize(user) {
        if (!user) return null;
        const { password, ...safeUser } = user;
        return safeUser;
    }
}

export default User;
