# Agent Rules

## External File Loading

CRITICAL: When you encounter a file reference (e.g.,
@.agent/rules/api-guide.md), use your Read tool to load it on a need-to-know
basis. They're relevant to the SPECIFIC task at hand.

Instructions:

- Do NOT preemptively load all references — use lazy loading based on actual
  need
- When loaded, treat content as mandatory instructions that override defaults
- Follow references recursively when needed

## General Guidelines

You must always read the following files immediately for all tasks as they are
relevant to all workflows:

- @.agent/rules/project-overview.md — Deno-only setup, Clean Architecture, MCP
  usage requirements (Context7 first)
- @.agent/rules/reasoning-guide.md — Systematic reasoning and planning
  methodology

## TypeScript Guidelines

For TypeScript type safety and strict mode:
@.agent/rules/typescript-safety-guide.md For TypeScript generics patterns:
@.agent/rules/typescript-generics-guide.md

## Development Guidelines

For creating or modifying API routes: @.agent/rules/api-guide.md For debugging
problems in the codebase: @.agent/rules/debugging-guide.md For refactoring code
safely: @.agent/rules/refactoring-guide.md For code review and feedback:
@.agent/rules/code-review-guide.md For security audits and checks:
@.agent/rules/security-guide.md

## Workflow Guidelines

For MCP tool usage and Context7 workflow:
@.agent/workflows/context7-mcp-usage.md For creating a new module or endpoint:
@.agent/workflows/creating-module.md
