import { Hono } from 'hono';
import { requireAuth, type SessionUser } from '../middleware/auth.js';
import { TodoController } from '../controllers/todo.controller.js';

type Variables = {
  user: SessionUser | null;
};

export const todoRoutes = new Hono<{ Variables: Variables }>();

todoRoutes.use('/api/todos', requireAuth);
todoRoutes.use('/api/todos/*', requireAuth);

todoRoutes.get('/api/todos', TodoController.list);
todoRoutes.post('/api/todos', TodoController.create);
todoRoutes.post('/api/todos/restore-all', TodoController.restoreAll);
todoRoutes.post('/api/todos/soft-delete-completed', TodoController.softDeleteCompleted);
todoRoutes.post('/api/todos/import', TodoController.importItems);
todoRoutes.put('/api/todos/:id', TodoController.update);
todoRoutes.post('/api/todos/:id/toggle', TodoController.toggle);
todoRoutes.post('/api/todos/:id/soft-delete', TodoController.softDelete);
todoRoutes.post('/api/todos/:id/restore', TodoController.restore);
