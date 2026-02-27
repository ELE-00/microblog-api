// __tests__/comments-likes.test.js
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

jest.mock('../script.js', () => ({
    post: {
        findUnique: jest.fn(),
    },
    comment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
    like: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
    },
    follow: {
        findMany: jest.fn(),
    },
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const mockPrisma = require('../script.js');

const makeToken = (payload = { id: 1, username: 'testuser' }) =>
    jwt.sign(payload, 'test-secret');

const mockComment = {
    id: 10,
    content: 'Great post!',
    image: null,
    createdAt: new Date().toISOString(),
    userId: 1,
    postId: 5,
    user: { id: 1, username: 'testuser', profile: { name: 'Test User', profilePic: null } },
};

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── POST /api/posts/:id/comments ────────────────────────────────────────────

describe('POST /api/posts/:id/comments', () => {
    it('returns 200 with the new comment', async () => {
        mockPrisma.comment.create.mockResolvedValue(mockComment);

        const res = await request(app)
            .post('/api/posts/5/comments')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ content: 'Great post!' });

        expect(res.status).toBe(200);
        expect(res.body.content).toBe('Great post!');
        expect(res.body.userId).toBe(1);
        expect(res.body.postId).toBe(5);
    });

    it('returns 401 without token', async () => {
        const res = await request(app).post('/api/posts/5/comments').send({ content: 'hi' });
        expect(res.status).toBe(401);
    });
});

// ─── GET /api/posts/:id/comments ─────────────────────────────────────────────

describe('GET /api/posts/:id/comments', () => {
    it('returns 200 with array of comments', async () => {
        mockPrisma.comment.findMany.mockResolvedValue([mockComment]);

        const res = await request(app)
            .get('/api/posts/5/comments')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].content).toBe('Great post!');
    });

    it('returns 200 with empty array when no comments', async () => {
        mockPrisma.comment.findMany.mockResolvedValue([]);

        const res = await request(app)
            .get('/api/posts/5/comments')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

// ─── DELETE /api/posts/comments/:id ──────────────────────────────────────────

describe('DELETE /api/posts/comments/:id', () => {
    it('returns 200 when the user owns the comment', async () => {
        mockPrisma.comment.findUnique.mockResolvedValue({ ...mockComment, userId: 1 });
        mockPrisma.comment.delete.mockResolvedValue({});

        const res = await request(app)
            .delete('/api/posts/comments/10')
            .set('Authorization', `Bearer ${makeToken({ id: 1, username: 'testuser' })}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
    });

    it('returns 403 when the user does not own the comment', async () => {
        mockPrisma.comment.findUnique.mockResolvedValue({ ...mockComment, userId: 99 });

        const res = await request(app)
            .delete('/api/posts/comments/10')
            .set('Authorization', `Bearer ${makeToken({ id: 1, username: 'testuser' })}`);

        expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
        const res = await request(app).delete('/api/posts/comments/10');
        expect(res.status).toBe(401);
    });
});
