# Backlog Management

## Structure

```
tasks/
├── README.md           # This file - explains backlog system
├── todo/              # Active/pending tasks (detailed descriptions)
├── done/              # Completed tasks (moved from todo/)
```

## How It Works

1. **BACKLOG.md** - Main index with task titles organized by priority
2. **tasks/todo/** - Full task descriptions (problem, solutions, details)
3. **tasks/done/** - Completed tasks (for reference/history)

## Creating a Task

1. Create detailed file in `tasks/todo/task-name.md`
2. Add title + link to `BACKLOG.md` under appropriate priority
3. Keep BACKLOG.md concise (just titles/links)

## Completing a Task

1. Move file from `tasks/todo/` → `tasks/done/`
2. Update link in `BACKLOG.md` to point to done folder
3. Add ✅ completion marker in BACKLOG.md

## Priority Levels

- **🔴 HIGH** - Blocking issues, critical features
- **🟡 MEDIUM** - Important improvements, non-blocking bugs  
- **🟢 LOW** - Nice-to-haves, optimizations, future enhancements

## Guidelines

- Keep task files **focused and concise**
- Use clear titles that describe the problem/goal
- Include context, solutions, and implementation notes
- Move completed tasks promptly to keep todo/ clean
