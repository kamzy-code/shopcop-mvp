import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { UserService } from '@services/userService.js';
import { prisma } from '@config/prisma.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.resetAllMocks();
});

const baseUser = {
  id: 'user-1',
  email: 'ada@test.com',
  name: 'Ada Lovelace',
  avatar_url: null,
  role: 'VENDOR',
  is_active: true,
  email_verified: true,
  last_login_at: null,
  created_at: new Date(),
};

// ============================================
// getUserById
// ============================================

describe('UserService.getUserById', () => {
  it('returns a sanitised user when found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);

    const result = await UserService.getUserById('user-1');

    expect(result.id).toBe('user-1');
    expect(result.email).toBe('ada@test.com');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    );
  });

  it('throws 404 when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(UserService.getUserById('missing-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ============================================
// getUserByEmail
// ============================================

describe('UserService.getUserByEmail', () => {
  it('returns a sanitised user when found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);

    const result = await UserService.getUserByEmail('ada@test.com');

    expect(result.email).toBe('ada@test.com');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'ada@test.com' } })
    );
  });

  it('throws 404 when email does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(UserService.getUserByEmail('noone@test.com')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ============================================
// updateUserInfo
// ============================================

describe('UserService.updateUserInfo', () => {
  it('updates and returns the user', async () => {
    const updated = { ...baseUser, name: 'Grace Hopper' };
    mockPrisma.user.update.mockResolvedValue(updated);

    const result = await UserService.updateUserInfo('user-1', { name: 'Grace Hopper' });

    expect(result.name).toBe('Grace Hopper');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ name: 'Grace Hopper' }),
      })
    );
  });
});

// ============================================
// getAllUsers
// ============================================

describe('UserService.getAllUsers', () => {
  it('returns an array of users', async () => {
    mockPrisma.user.findMany.mockResolvedValue([baseUser, { ...baseUser, id: 'user-2' }]);

    const result = await UserService.getAllUsers();

    expect(result).toHaveLength(2);
    expect(mockPrisma.user.findMany).toHaveBeenCalledOnce();
  });

  it('returns an empty array when no users exist', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await UserService.getAllUsers();

    expect(result).toHaveLength(0);
  });
});
