// __tests__/auth.test.js
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Mock prisma BEFORE requiring the app (jest.mock is hoisted, but env vars are not)
jest.mock('../script.js', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    profile: {
        create: jest.fn(),
    },
    $transaction: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../server');
const mockPrisma = require('../script.js');

const authenticateToken = require('../middleware/authenticateToken');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── authenticateToken middleware (unit tests) ───────────────────────────────

describe('authenticateToken middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
    });

    it('calls next() and sets req.user when token is valid', () => {
        const token = jwt.sign({ id: 1, username: 'testuser' }, 'test-secret');
        req.headers['authorization'] = `Bearer ${token}`;
        authenticateToken(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toMatchObject({ id: 1, username: 'testuser' });
    });

    it('returns 401 when no Authorization header', () => {
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when token is invalid', () => {
        req.headers['authorization'] = 'Bearer notavalidtoken';
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when token is signed with wrong secret', () => {
        const token = jwt.sign({ id: 1 }, 'wrong-secret');
        req.headers['authorization'] = `Bearer ${token}`;
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
    it('returns 201 when valid data and user does not exist', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.$transaction.mockImplementation(cb => cb(mockPrisma));
        mockPrisma.user.create.mockResolvedValue({ id: 1, username: 'newuser' });
        mockPrisma.profile.create.mockResolvedValue({});

        const res = await request(app).post('/api/auth/signup').send({
            username: 'newuser',
            password: 'Password1!',
            passwordConfirm: 'Password1!',
        });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ message: 'User created' });
    });

    it('returns 400 when passwords do not match', async () => {
        const res = await request(app).post('/api/auth/signup').send({
            username: 'newuser',
            password: 'Password1!',
            passwordConfirm: 'Different1!',
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when username already exists', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 1, username: 'existing' });
        mockPrisma.$transaction.mockImplementation(cb => cb(mockPrisma));

        const res = await request(app).post('/api/auth/signup').send({
            username: 'existing',
            password: 'Password1!',
            passwordConfirm: 'Password1!',
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when username is too short (validator)', async () => {
        const res = await request(app).post('/api/auth/signup').send({
            username: 'ab',
            password: 'Password1!',
            passwordConfirm: 'Password1!',
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/3/); // "must be 3–20 characters"
    });

    it('returns 400 when password is too short (validator)', async () => {
        const res = await request(app).post('/api/auth/signup').send({
            username: 'validuser',
            password: 'abc',
            passwordConfirm: 'abc',
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/8/); // "at least 8 characters"
    });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    it('returns 200 with token when credentials are valid', async () => {
        const hashed = await bcrypt.hash('password123', 1);
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            username: 'testuser',
            password: hashed,
        });

        const res = await request(app).post('/api/auth/login').send({
            username: 'testuser',
            password: 'password123',
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.message).toBe('Logged in');
    });

    it('returns 400 when user does not exist', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const res = await request(app).post('/api/auth/login').send({
            username: 'nobody',
            password: 'password123',
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid credentials' });
    });

    it('returns 400 when password is wrong', async () => {
        const hashed = await bcrypt.hash('correctpassword', 1);
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            username: 'testuser',
            password: hashed,
        });

        const res = await request(app).post('/api/auth/login').send({
            username: 'testuser',
            password: 'wrongpassword',
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid credentials' });
    });

    it('returns 400 when required fields are missing (validator)', async () => {
        const res = await request(app).post('/api/auth/login').send({
            username: '',
            password: '',
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});
