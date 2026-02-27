// __tests__/posts.test.js
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Must mock cloudinary before app loads (it's required at module level in server.js)
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({ secure_url: 'https://fake.cloudinary.com/img.jpg' }),
            destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
        },
    },
}));

jest.mock('../script.js', () => ({
    post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
    follow: {
        findMany: jest.fn(),
    },
    like: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
    },
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const mockPrisma = require('../script.js');
const cloudinary = require('cloudinary').v2;

const makeToken = (payload = { id: 1, username: 'testuser' }) =>
    jwt.sign(payload, 'test-secret');

const mockPost = {
    id: 1,
    content: 'Hello world',
    image: null,
    createdAt: new Date().toISOString(),
    authorId: 1,
    author: { id: 1, username: 'testuser', profile: { name: 'Test User', profilePic: null } },
    _count: { likes: 0, comments: 0 },
};

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── Auth protection ──────────────────────────────────────────────────────────

describe('Posts routes - auth protection', () => {
    it('returns 401 on GET /api/posts without token', async () => {
        const res = await request(app).get('/api/posts');
        expect(res.status).toBe(401);
    });

    it('returns 401 on POST /api/posts without token', async () => {
        const res = await request(app).post('/api/posts');
        expect(res.status).toBe(401);
    });
});

// ─── GET /api/posts ───────────────────────────────────────────────────────────

describe('GET /api/posts', () => {
    it('returns 200 with paginated posts object', async () => {
        mockPrisma.follow.findMany.mockResolvedValue([{ followingId: 2 }]);
        mockPrisma.post.findMany.mockResolvedValue([mockPost]);

        const res = await request(app)
            .get('/api/posts')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.posts)).toBe(true);
        expect(res.body.posts[0].content).toBe('Hello world');
        expect(res.body.hasMore).toBe(false);
    });
});

// ─── POST /api/posts ──────────────────────────────────────────────────────────

describe('POST /api/posts', () => {
    it('returns 200 with created post when no file attached', async () => {
        mockPrisma.post.create.mockResolvedValue(mockPost);

        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${makeToken()}`)
            .field('content', 'Hello world');

        expect(res.status).toBe(200);
        expect(res.body.content).toBe('Hello world');
        expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
    });
});

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────

describe('GET /api/posts/:id', () => {
    it('returns 200 with post data', async () => {
        const postWithComments = { ...mockPost, comments: [], _count: { likes: 3 } };
        mockPrisma.post.findUnique.mockResolvedValue(postWithComments);

        const res = await request(app)
            .get('/api/posts/1')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
        expect(res.body._count.likes).toBe(3);
    });

    it('returns 400 when post is not found', async () => {
        mockPrisma.post.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get('/api/posts/999')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(400);
    });
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────

describe('DELETE /api/posts/:id', () => {
    it('returns 200 when the user is the post author', async () => {
        mockPrisma.post.findUnique.mockResolvedValue({ ...mockPost, authorId: 1, image: null });
        mockPrisma.post.delete.mockResolvedValue({});

        const res = await request(app)
            .delete('/api/posts/1')
            .set('Authorization', `Bearer ${makeToken({ id: 1, username: 'testuser' })}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
    });

    it('returns 403 when the user is not the post author', async () => {
        mockPrisma.post.findUnique.mockResolvedValue({ ...mockPost, authorId: 99, image: null });

        const res = await request(app)
            .delete('/api/posts/1')
            .set('Authorization', `Bearer ${makeToken({ id: 1, username: 'testuser' })}`);

        expect(res.status).toBe(403);
    });
});

// ─── POST /api/posts/:id/like ─────────────────────────────────────────────────

describe('POST /api/posts/:id/like', () => {
    it('returns 200 with like record', async () => {
        const likeRecord = { id: 1, userId: 1, postId: 1 };
        mockPrisma.like.upsert.mockResolvedValue(likeRecord);

        const res = await request(app)
            .post('/api/posts/1/like')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ userId: 1, postId: 1 });
    });
});

// ─── POST /api/posts/:id/unlike ───────────────────────────────────────────────

describe('POST /api/posts/:id/unlike', () => {
    it('returns 200 with success:true', async () => {
        mockPrisma.like.delete.mockResolvedValue({});

        const res = await request(app)
            .post('/api/posts/1/unlike')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
    });
});

// ─── GET /api/posts/:id/liked ─────────────────────────────────────────────────

describe('GET /api/posts/:id/liked', () => {
    it('returns 200 with null when post is not liked', async () => {
        mockPrisma.like.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get('/api/posts/1/liked')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeNull();
    });

    it('returns 200 with like object when post is liked', async () => {
        mockPrisma.like.findUnique.mockResolvedValue({ id: 1, userId: 1, postId: 1 });

        const res = await request(app)
            .get('/api/posts/1/liked')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ userId: 1, postId: 1 });
    });
});
