const fs = require('fs/promises');
const path = require('path');
const WorkspaceFile = require('../models/WorkspaceFile');

const WORKSPACE_ROOT = path.join(process.cwd(), 'workspace');

const ensureSessionRoot = async ({ userId, sessionId }) => {
  const dir = path.join(WORKSPACE_ROOT, String(userId), String(sessionId));
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

const assertSafePath = (root, relativePath) => {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(root, normalized);
  if (!fullPath.startsWith(root)) {
    throw new Error('Invalid path. Access denied.');
  }
  return { normalized, fullPath };
};

const upsertWorkspaceRecord = async ({ userId, sessionId, filePath, size, agent, action }) => {
  await WorkspaceFile.findOneAndUpdate(
    { userId, sessionId, path: filePath },
    {
      $set: { size, agent },
      $push: { auditLogs: { action, agent, at: new Date() } },
    },
    { upsert: true, new: true }
  );
};

const createFile = async ({ userId, sessionId, filePath, content = '', agent = 'system' }) => {
  const root = await ensureSessionRoot({ userId, sessionId });
  const { normalized, fullPath } = assertSafePath(root, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf8');
  await upsertWorkspaceRecord({
    userId,
    sessionId,
    filePath: normalized,
    size: Buffer.byteLength(content),
    agent,
    action: 'create',
  });
  return { path: normalized };
};

const writeFile = async ({ userId, sessionId, filePath, content = '', agent = 'system' }) => {
  const root = await ensureSessionRoot({ userId, sessionId });
  const { normalized, fullPath } = assertSafePath(root, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf8');
  await upsertWorkspaceRecord({
    userId,
    sessionId,
    filePath: normalized,
    size: Buffer.byteLength(content),
    agent,
    action: 'write',
  });
  return { path: normalized };
};

const readFile = async ({ userId, sessionId, filePath, agent = 'system' }) => {
  const root = await ensureSessionRoot({ userId, sessionId });
  const { normalized, fullPath } = assertSafePath(root, filePath);
  const content = await fs.readFile(fullPath, 'utf8');
  await upsertWorkspaceRecord({
    userId,
    sessionId,
    filePath: normalized,
    size: Buffer.byteLength(content),
    agent,
    action: 'read',
  });
  return { path: normalized, content };
};

const listFiles = async ({ userId, sessionId }) => {
  const root = await ensureSessionRoot({ userId, sessionId });
  const files = await WorkspaceFile.find({ userId, sessionId })
    .sort({ updatedAt: -1 })
    .select('path size agent updatedAt')
    .lean();
  return { root, files };
};

module.exports = {
  WORKSPACE_ROOT,
  ensureSessionRoot,
  createFile,
  writeFile,
  readFile,
  listFiles,
};
