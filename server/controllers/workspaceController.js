const fsPromises = require('fs/promises');
const { spawn } = require('child_process');
const { listFiles, readFile, ensureSessionRoot } = require('../services/mcpFileService');

const listWorkspaceFiles = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id.toString();
    const data = await listFiles({ userId, sessionId });
    res.json({ sessionId, files: data.files });
  } catch (error) {
    next(error);
  }
};

const readWorkspaceFile = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { path: filePath } = req.query;
    const userId = req.user._id.toString();
    if (!filePath) {
      res.status(400);
      throw new Error('Query param "path" is required');
    }
    const data = await readFile({ userId, sessionId, filePath, agent: 'system' });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const downloadWorkspaceZip = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id.toString();
    const root = await ensureSessionRoot({ userId, sessionId });
    await fsPromises.access(root);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="workspace-${sessionId}.zip"`
    );

    const zip = spawn('zip', ['-r', '-', '.'], { cwd: root });
    zip.on('error', (err) => next(err));
    zip.stderr.on('data', () => {
      // zip writes progress to stderr; ignore unless exit code fails
    });
    zip.stdout.pipe(res);
    zip.on('close', (code) => {
      if (code !== 0) {
        next(new Error('Zip process failed'));
      }
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404);
      next(new Error('Workspace not found'));
      return;
    }
    next(error);
  }
};

module.exports = {
  listWorkspaceFiles,
  readWorkspaceFile,
  downloadWorkspaceZip,
};
