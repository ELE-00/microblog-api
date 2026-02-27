// __tests__/follow.test.js
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

jest.mock('../script.js', () => ({
    follow: {
        upsert: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
    },
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const mockPrisma = require('../script.js');

const makeToken = (payload = { id: 1, username: 'testuser' }) =>
    jwt.sign(payload, 'test-secret');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── Auth protection ──────────────────────────────────────────────────────────

describe('Follow routes - auth protection', () => {
    it('returns 401 on POST /api/follow/:id/follow without token', async () => {
        const res = await request(app).post('/api/follow/2/follow');
        expect(res.status).toBe(401);
    });
});

// ─── POST /api/follow/:id/follow ─────────────────────────────────────────────

describe('POST /api/follow/:id/follow', () => {
    it('returns 200 with the follow record', async () => {
        const followRecord = { followerId: 1, followingId: 2, createdAt: new Date().toISOString() };
        mockPrisma.follow.upsert.mockResolvedValue(followRecord);

        const res = await request(app)
            .post('/api/follow/2/follow')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ followerId: 1, followingId: 2 });
    });
});

// ─── POST /api/follow/:id/unfollow ───────────────────────────────────────────

describe('POST /api/follow/:id/unfollow', () => {
    it('returns 200 with success:true', async () => {
        mockPrisma.follow.delete.mockResolvedValue({});

        const res = await request(app)
            .post('/api/follow/2/unfollow')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
    });
});

// ─── POST /api/follow/:id/removefollower ─────────────────────────────────────

describe('POST /api/follow/:id/removefollower', () => {
    it('returns 200 with success:true', async () => {
        mockPrisma.follow.delete.mockResolvedValue({});

        const res = await request(app)
            .post('/api/follow/3/removefollower')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
    });
});

// ─── GET /api/follow/followers/:id ───────────────────────────────────────────

describe('GET /api/follow/followers/:id', () => {
    it('returns 200 with array of followers', async () => {
        const followers = [
            { follower: { id: 3, username: 'alice', profile: { name: 'Alice', profilePic: null } } },
        ];
        mockPrisma.follow.findMany.mockResolvedValue(followers);

        const res = await request(app)
            .get('/api/follow/followers/1')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].follower.username).toBe('alice');
    });
});

// ─── GET /api/follow/following/:id ───────────────────────────────────────────

describe('GET /api/follow/following/:id', () => {
    it('returns 200 with array of following', async () => {
        const following = [
            { following: { id: 4, username: 'bob', profile: { name: 'Bob', profilePic: null } } },
        ];
        mockPrisma.follow.findMany.mockResolvedValue(following);

        const res = await request(app)
            .get('/api/follow/following/1')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].following.username).toBe('bob');
    });
});
