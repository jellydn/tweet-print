# TweetPrint Justfile
# Run `just` to see all available commands

# Default command - show available recipes
default: list

# List all available recipes
list:
    just --list

# Install dependencies
install:
    bun install

# ============================================================================
# Development
# ============================================================================

# Start development server with hot reload
dev:
    bun run dev

# Start production server (without watch)
start:
    bun run src/index.ts

# ============================================================================
# Quality Checks
# ============================================================================

# Run TypeScript type checking
typecheck:
    bun run typecheck

# Run linter and formatter
lint:
    bun run lint

# Run all quality checks (typecheck + lint)
check: typecheck lint

# ============================================================================
# Testing
# ============================================================================

# Run unit tests
test *args:
    bun test src {{args}}

# Run E2E tests
test-e2e:
    bun run test:e2e

# Run E2E tests with UI
test-e2e-ui:
    bun run test:e2e:ui

# Debug E2E tests
test-e2e-debug:
    bun run test:e2e:debug

# Show E2E test report
test-e2e-report:
    bun run test:e2e:report

# Run all tests (unit + E2E)
test-all: test test-e2e

# ============================================================================
# Docker
# ============================================================================

# Build Docker image
docker-build *args:
    docker build {{args}} -t tweet-print .

# Run Docker container
docker-run:
    docker run -p 3000:3000 tweet-print

# Build and run Docker container
docker: docker-build docker-run

# ============================================================================
# Ralph AI Agent
# ============================================================================

# Run Ralph AI agent (default: 10 iterations, amp CLI)
ralph iterations="10" cli="amp" model="" share="false":
    ./scripts/ralph/ralph.sh {{iterations}} {{cli}} {{model}} {{share}}

# Run Ralph with opencode (default: big-pickle model)
ralph-opencode iterations="10" model="opencode/big-pickle" share="false":
    ./scripts/ralph/ralph.sh {{iterations}} opencode {{model}} {{share}}

# Run Ralph with opencode and share session
ralph-share iterations="10" model="opencode/big-pickle":
    ./scripts/ralph/ralph.sh {{iterations}} opencode {{model}} true

# ============================================================================
# Utility
# ============================================================================

# Clean generated files
clean:
    rm -rf test-results
    rm -rf node_modules

# Clean and reinstall dependencies
reinstall: clean install
