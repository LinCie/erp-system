---
trigger: always_on
---

## Troubleshooting & Best Practices

### When to Use Context7 vs. Sequential Thinking

**Use Context7 when:**

- Working with external libraries (Hono, Kysely, Zod, etc.)
- Need specific API usage examples
- Writing new code that involves library-specific patterns
- Unsure about the correct API methods or parameters

**Use Sequential Thinking when:**

- Designing complex architectural solutions
- Debugging multi-layer issues
- Planning database schema changes
- Refactoring across multiple modules
- Performance optimization tasks
- When the problem scope isn't immediately clear

### Common Pitfalls

1. **Skipping Context7**: Leads to incorrect API usage and broken code
2. **Mixing layers**: Causes tight coupling and makes testing difficult
3. **Direct DB access in services**: Bypasses repository abstraction
4. **Forgetting to export types**: Makes code unusable by other modules
5. **Missing OpenAPI decorators**: Results in incomplete API documentation
6. **Not using transactions**: Causes data consistency issues
7. **Ignoring error handling**: Makes debugging difficult

### Debugging Workflow

1. **Use Sequential Thinking** to break down the problem
2. **Check Context7** for library-specific patterns
3. **Verify layer separation** - ensure each layer's responsibilities are
   respected
4. **Review similar implementations** in existing modules
5. **Check database types** - ensure they match your queries
6. **Test endpoints** using Swagger UI at `/swagger`
7. **Monitor logs** for detailed error information

### Performance Considerations

- Use Redis caching for frequently accessed data
- Implement proper indexing on database columns
- Use pagination for list endpoints
- Lazy load related data when appropriate
- Monitor query performance in development

### Security Best Practices

- Always validate input with Zod schemas
- Use Bearer authentication for protected routes
- Hash passwords with bcryptjs
- Never expose sensitive data in responses
- Use environment variables for configuration
- Implement proper CORS if needed
- Log security events appropriately
